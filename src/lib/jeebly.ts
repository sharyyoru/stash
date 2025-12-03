/**
 * Jeebly Delivery API Integration
 * Based on SSP APIs for Client Postman collection
 */

export type DeliveryType = "Same Day" | "Next Day";
export type LoadType = "Document" | "Non-document";
export type ConsignmentType = "FORWARD" | "REVERSE";
export type PaymentType = "prepaid" | "cod";
export type AddressType = "Normal" | "PO Box";

export type ShipmentStatus =
  | "pickup_scheduled"
  | "pickup_completed"
  | "inscan_at_hub"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "cancelled";

export type TrackingEvent = {
  status: string;
  desc: string;
  hub_name: string;
  event_date_time: string;
  cod_amount: string;
  shipper_phone: string;
  recipient_phone: string | null;
  rider_code: string;
  rider_name: string;
  pod_image: string | null;
  signature_image: string | null;
  failure_reason: string | null;
};

export type TrackingInfo = {
  reference_no: string;
  customer_reference_number: string;
  last_status: ShipmentStatus;
  pickup_date: string;
  booking_date: string;
  booking_time: string;
  events: TrackingEvent[];
};

export type CreateShipmentParams = {
  deliveryType: DeliveryType;
  loadType?: LoadType;
  consignmentType?: ConsignmentType;
  description: string;
  weight: number;
  paymentType: PaymentType;
  codAmount?: number;
  numPieces: number;
  customerReferenceNumber?: string;
  pickupDate: string; // Format: YYYY-MM-DD
  
  // Destination (customer) address
  destinationName: string;
  destinationMobile: string;
  destinationMobileCountryCode?: string;
  destinationAlternatePhone?: string;
  destinationHouseNo: string;
  destinationBuildingName: string;
  destinationArea: string;
  destinationLandmark?: string;
  destinationCity: string;
  destinationAddressType?: AddressType;
};

export type CreateShipmentResponse = {
  success: string;
  message: string;
  "AWB No"?: string;
};

export type TrackShipmentResponse = {
  success: string;
  Tracking?: TrackingInfo;
  message?: string;
};

export type GenerateLabelResponse = {
  success: string;
  label_url?: string;
  message?: string;
};

function getApiCredentials() {
  const apiKey = process.env.JEEBLY_API_KEY;
  const clientKey = process.env.JEEBLY_CLIENT_KEY;
  const apiUrl = process.env.JEEBLY_API_URL || "https://demo.jeebly.com";

  if (!apiKey || !clientKey) {
    throw new Error("JEEBLY_API_KEY and JEEBLY_CLIENT_KEY environment variables are required");
  }

  return { apiKey, clientKey, apiUrl };
}

function getStoreOriginAddress() {
  return {
    name: process.env.STORE_NAME || "Stash Creative",
    mobile: process.env.STORE_MOBILE || "971501234567",
    mobileCountryCode: "+971",
    houseNo: process.env.STORE_ADDRESS_LINE1 || "123",
    buildingName: process.env.STORE_BUILDING || "Business Bay",
    area: process.env.STORE_AREA || "Business Bay",
    // Jeebly REQUIRES a landmark - cannot be empty
    landmark: process.env.STORE_LANDMARK || "Near Circle Mall",
    city: process.env.STORE_CITY || "Dubai",
    addressType: "Normal" as AddressType,
  };
}

/**
 * Create a new shipment with Jeebly
 */
export async function createShipment(
  params: CreateShipmentParams
): Promise<CreateShipmentResponse> {
  const { apiKey, clientKey, apiUrl } = getApiCredentials();
  const origin = getStoreOriginAddress();

  // Jeebly expects weight as NUMBER (not string), INTEGER only (no decimals), minimum 1kg
  // Per Jeebly support: "Add 1 kg in that case. It will not accept decimal"
  const rawWeight = params.weight || 1;
  const weightValue = Math.max(1, Math.ceil(rawWeight));
  
  console.log(`[Jeebly] Input weight: ${params.weight}, Calculated: ${weightValue}`);
  
  const body = {
    delivery_type: params.deliveryType,
    load_type: params.loadType || "Non-document",
    consignment_type: params.consignmentType || "FORWARD",
    description: params.description,
    weight: weightValue, // NUMBER not string, integer only
    payment_type: params.paymentType,
    cod_amount: params.paymentType === "cod" ? (params.codAmount || 0) : 0, // NUMBER not string
    num_pieces: params.numPieces,
    customer_reference_number: params.customerReferenceNumber || "",
    pickup_date: params.pickupDate,
    
    // Origin (store) address
    origin_address_name: origin.name,
    origin_address_mob_no_country_code: origin.mobileCountryCode,
    origin_address_mobile_number: origin.mobile,
    origin_address_alt_ph_country_code: "",
    origin_address_alternate_phone: "",
    origin_address_house_no: origin.houseNo,
    origin_address_building_name: origin.buildingName,
    origin_address_area: origin.area,
    origin_address_landmark: origin.landmark,
    origin_address_city: origin.city,
    origin_address_type: origin.addressType,
    
    // Destination (customer) address
    destination_address_name: params.destinationName,
    destination_address_mob_no_country_code: params.destinationMobileCountryCode || "+971",
    destination_address_mobile_number: params.destinationMobile,
    destination_details_alt_ph_country_code: "",
    destination_details_alternate_phone: params.destinationAlternatePhone || "",
    destination_address_house_no: params.destinationHouseNo,
    destination_address_building_name: params.destinationBuildingName,
    destination_address_area: params.destinationArea,
    // Jeebly REQUIRES a landmark - provide default if empty
    destination_address_landmark: params.destinationLandmark || `Near ${params.destinationArea || "Main Road"}`,
    destination_address_city: params.destinationCity,
    destination_address_type: params.destinationAddressType || "Normal",
  };

  console.log("Jeebly request body:", JSON.stringify(body, null, 2));

  const response = await fetch(`${apiUrl}/customer/create_shipment`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "client_key": clientKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  console.log("Jeebly response:", JSON.stringify(data, null, 2));
  
  if (data.success !== "true") {
    const errorMsg = data.message || data.error || JSON.stringify(data);
    throw new Error(`Jeebly API error: ${errorMsg}`);
  }

  return data;
}

/**
 * Track a shipment by AWB number
 */
export async function trackShipment(
  awbNumber: string
): Promise<TrackShipmentResponse> {
  const { apiKey, clientKey, apiUrl } = getApiCredentials();

  const response = await fetch(`${apiUrl}/customer/track_shipment`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "client_key": clientKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_number: awbNumber,
    }),
  });

  const data = await response.json();
  return data;
}

/**
 * Generate a shipping label for an AWB
 */
export async function generateLabel(
  awbNumber: string
): Promise<GenerateLabelResponse> {
  const { apiKey, clientKey, apiUrl } = getApiCredentials();

  const response = await fetch(`${apiUrl}/customer/generate_shipment_label`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "client_key": clientKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_number: awbNumber,
    }),
  });

  const data = await response.json();
  return data;
}

/**
 * Format a tracking status for display
 */
export function formatTrackingStatus(status: ShipmentStatus): string {
  const statusMap: Record<ShipmentStatus, string> = {
    pickup_scheduled: "Pickup Scheduled",
    pickup_completed: "Picked Up",
    inscan_at_hub: "At Warehouse",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    failed: "Delivery Failed",
    cancelled: "Cancelled",
  };
  return statusMap[status] || status;
}

/**
 * Get the next business day in YYYY-MM-DD format
 */
export function getNextBusinessDay(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // If it's Friday (5), add 2 days to skip to Sunday
  // If it's Saturday (6), add 1 day
  // Otherwise just add 1 day
  let daysToAdd = 1;
  if (dayOfWeek === 5) daysToAdd = 2; // Friday -> Sunday
  if (dayOfWeek === 6) daysToAdd = 1; // Saturday -> Sunday
  
  const nextDay = new Date(today);
  nextDay.setDate(today.getDate() + daysToAdd);
  
  return nextDay.toISOString().split("T")[0];
}
