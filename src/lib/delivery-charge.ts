import { sanityClient } from "../sanity/client";
import { siteSettingsQuery } from "../sanity/queries";

let cachedDeliveryCharge: number | null = null;

/**
 * Get the delivery charge from Sanity site settings
 * Returns 25 as default if not configured
 */
export async function getDeliveryCharge(): Promise<number> {
  if (cachedDeliveryCharge !== null) {
    return cachedDeliveryCharge;
  }

  try {
    const settings = await sanityClient.fetch(siteSettingsQuery);
    const charge = settings?.deliveryCharge ?? 25;
    cachedDeliveryCharge = charge;
    return charge;
  } catch (error) {
    console.error("Failed to fetch delivery charge:", error);
    return 25; // Default fallback
  }
}

/**
 * Clear the cached delivery charge (useful for testing or when settings change)
 */
export function clearDeliveryChargeCache(): void {
  cachedDeliveryCharge = null;
}
