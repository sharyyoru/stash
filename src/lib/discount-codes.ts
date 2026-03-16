import { supabaseAdmin } from "./supabase-admin";

export type DiscountType = "percentage" | "fixed";
export type AppliesTo = "all" | "products" | "subscriptions";

export type DiscountCode = {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  appliesTo: AppliesTo;
  createdAt: string;
  updatedAt: string;
};

export type DiscountCodeUsage = {
  id: string;
  discountCodeId: string;
  orderId: string;
  userEmail: string | null;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  createdAt: string;
  // Joined fields
  code?: string;
  description?: string;
};

export type DiscountValidationResult = {
  valid: boolean;
  error?: string;
  discount?: {
    code: string;
    type: DiscountType;
    value: number;
    calculatedDiscount: number;
    finalAmount: number;
  };
};

function mapRowToDiscountCode(row: any): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderAmount: Number(row.min_order_amount || 0),
    maxDiscountAmount: row.max_discount_amount ? Number(row.max_discount_amount) : null,
    usageLimit: row.usage_limit,
    usageCount: row.usage_count || 0,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    appliesTo: row.applies_to || "all",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToUsage(row: any): DiscountCodeUsage {
  return {
    id: row.id,
    discountCodeId: row.discount_code_id,
    orderId: row.order_id,
    userEmail: row.user_email,
    discountAmount: Number(row.discount_amount),
    originalAmount: Number(row.original_amount),
    finalAmount: Number(row.final_amount),
    createdAt: row.created_at,
    code: row.discount_codes?.code,
    description: row.discount_codes?.description,
  };
}

export async function validateDiscountCode(
  code: string,
  orderAmount: number,
  appliesTo: AppliesTo = "all"
): Promise<DiscountValidationResult> {
  const normalizedCode = code.trim().toUpperCase();

  const { data, error } = await supabaseAdmin
    .from("discount_codes")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: "Invalid discount code" };
  }

  const discountCode = mapRowToDiscountCode(data);

  // Check if code is active
  if (!discountCode.isActive) {
    return { valid: false, error: "This discount code is no longer active" };
  }

  // Check date validity
  const now = new Date();
  if (discountCode.startsAt && new Date(discountCode.startsAt) > now) {
    return { valid: false, error: "This discount code is not yet active" };
  }
  if (discountCode.expiresAt && new Date(discountCode.expiresAt) < now) {
    return { valid: false, error: "This discount code has expired" };
  }

  // Check usage limit
  if (discountCode.usageLimit !== null && discountCode.usageCount >= discountCode.usageLimit) {
    return { valid: false, error: "This discount code has reached its usage limit" };
  }

  // Check minimum order amount
  if (orderAmount < discountCode.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order amount of AED ${discountCode.minOrderAmount.toFixed(2)} required`,
    };
  }

  // Check applies_to compatibility
  if (discountCode.appliesTo !== "all" && discountCode.appliesTo !== appliesTo) {
    return {
      valid: false,
      error: `This code only applies to ${discountCode.appliesTo}`,
    };
  }

  // Calculate discount
  let calculatedDiscount: number;
  if (discountCode.discountType === "percentage") {
    calculatedDiscount = (orderAmount * discountCode.discountValue) / 100;
    // Apply max discount cap if set
    if (discountCode.maxDiscountAmount !== null) {
      calculatedDiscount = Math.min(calculatedDiscount, discountCode.maxDiscountAmount);
    }
  } else {
    calculatedDiscount = Math.min(discountCode.discountValue, orderAmount);
  }

  // Round to 2 decimal places
  calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;
  const finalAmount = Math.round((orderAmount - calculatedDiscount) * 100) / 100;

  return {
    valid: true,
    discount: {
      code: discountCode.code,
      type: discountCode.discountType,
      value: discountCode.discountValue,
      calculatedDiscount,
      finalAmount,
    },
  };
}

export async function applyDiscountCode(
  code: string,
  orderId: string,
  userEmail: string | null,
  originalAmount: number,
  discountAmount: number,
  finalAmount: number
): Promise<boolean> {
  const normalizedCode = code.trim().toUpperCase();

  // Get the discount code
  const { data: discountCodeData, error: codeError } = await supabaseAdmin
    .from("discount_codes")
    .select("id")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (codeError || !discountCodeData) {
    console.error("Failed to find discount code:", codeError);
    return false;
  }

  // Record the usage
  const { error: usageError } = await supabaseAdmin
    .from("discount_code_usage")
    .insert({
      discount_code_id: discountCodeData.id,
      order_id: orderId,
      user_email: userEmail,
      discount_amount: discountAmount,
      original_amount: originalAmount,
      final_amount: finalAmount,
    });

  if (usageError) {
    console.error("Failed to record discount usage:", usageError);
    return false;
  }

  // Increment usage count
  const { error: updateError } = await supabaseAdmin.rpc("increment_discount_usage", {
    code_id: discountCodeData.id,
  });

  // If RPC doesn't exist, fall back to manual increment
  if (updateError) {
    const { error: manualUpdateError } = await supabaseAdmin
      .from("discount_codes")
      .update({ usage_count: supabaseAdmin.rpc("increment", { x: 1 }) })
      .eq("id", discountCodeData.id);
    
    // If that also fails, just do a select and update
    if (manualUpdateError) {
      const { data: currentData } = await supabaseAdmin
        .from("discount_codes")
        .select("usage_count")
        .eq("id", discountCodeData.id)
        .single();
      
      if (currentData) {
        await supabaseAdmin
          .from("discount_codes")
          .update({ usage_count: (currentData.usage_count || 0) + 1 })
          .eq("id", discountCodeData.id);
      }
    }
  }

  return true;
}

export async function listDiscountCodes(): Promise<DiscountCode[]> {
  const { data, error } = await supabaseAdmin
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapRowToDiscountCode);
}

export async function getDiscountCode(id: string): Promise<DiscountCode | null> {
  const { data, error } = await supabaseAdmin
    .from("discount_codes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToDiscountCode(data);
}

export async function createDiscountCode(
  input: Omit<DiscountCode, "id" | "usageCount" | "createdAt" | "updatedAt">
): Promise<DiscountCode | null> {
  const { data, error } = await supabaseAdmin
    .from("discount_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      description: input.description,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order_amount: input.minOrderAmount,
      max_discount_amount: input.maxDiscountAmount,
      usage_limit: input.usageLimit,
      starts_at: input.startsAt,
      expires_at: input.expiresAt,
      is_active: input.isActive,
      applies_to: input.appliesTo,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create discount code:", error);
    return null;
  }

  return mapRowToDiscountCode(data);
}

export async function updateDiscountCode(
  id: string,
  updates: Partial<Omit<DiscountCode, "id" | "createdAt">>
): Promise<DiscountCode | null> {
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if (updates.code !== undefined) updateData.code = updates.code.trim().toUpperCase();
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.discountType !== undefined) updateData.discount_type = updates.discountType;
  if (updates.discountValue !== undefined) updateData.discount_value = updates.discountValue;
  if (updates.minOrderAmount !== undefined) updateData.min_order_amount = updates.minOrderAmount;
  if (updates.maxDiscountAmount !== undefined) updateData.max_discount_amount = updates.maxDiscountAmount;
  if (updates.usageLimit !== undefined) updateData.usage_limit = updates.usageLimit;
  if (updates.usageCount !== undefined) updateData.usage_count = updates.usageCount;
  if (updates.startsAt !== undefined) updateData.starts_at = updates.startsAt;
  if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.appliesTo !== undefined) updateData.applies_to = updates.appliesTo;

  const { data, error } = await supabaseAdmin
    .from("discount_codes")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update discount code:", error);
    return null;
  }

  return mapRowToDiscountCode(data);
}

export async function deleteDiscountCode(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("discount_codes")
    .delete()
    .eq("id", id);

  return !error;
}

export async function getDiscountCodeUsage(
  filters?: {
    codeId?: string;
    startDate?: string;
    endDate?: string;
    userEmail?: string;
    search?: string;
  }
): Promise<DiscountCodeUsage[]> {
  let query = supabaseAdmin
    .from("discount_code_usage")
    .select("*, discount_codes(code, description)")
    .order("created_at", { ascending: false });

  if (filters?.codeId) {
    query = query.eq("discount_code_id", filters.codeId);
  }

  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  if (filters?.userEmail) {
    query = query.ilike("user_email", `%${filters.userEmail}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(mapRowToUsage);
}

export async function getDiscountCodeStats(
  filters?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  totalUsage: number;
  totalDiscountAmount: number;
  totalOrderValue: number;
  averageDiscount: number;
  codeBreakdown: Array<{
    code: string;
    usageCount: number;
    totalDiscount: number;
  }>;
}> {
  let query = supabaseAdmin
    .from("discount_code_usage")
    .select("*, discount_codes(code)");

  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return {
      totalUsage: 0,
      totalDiscountAmount: 0,
      totalOrderValue: 0,
      averageDiscount: 0,
      codeBreakdown: [],
    };
  }

  const totalUsage = data.length;
  const totalDiscountAmount = data.reduce((sum, row) => sum + Number(row.discount_amount), 0);
  const totalOrderValue = data.reduce((sum, row) => sum + Number(row.original_amount), 0);
  const averageDiscount = totalDiscountAmount / totalUsage;

  // Group by code
  const codeMap = new Map<string, { usageCount: number; totalDiscount: number }>();
  for (const row of data) {
    const code = row.discount_codes?.code || "Unknown";
    const existing = codeMap.get(code) || { usageCount: 0, totalDiscount: 0 };
    existing.usageCount++;
    existing.totalDiscount += Number(row.discount_amount);
    codeMap.set(code, existing);
  }

  const codeBreakdown = Array.from(codeMap.entries())
    .map(([code, stats]) => ({
      code,
      usageCount: stats.usageCount,
      totalDiscount: stats.totalDiscount,
    }))
    .sort((a, b) => b.usageCount - a.usageCount);

  return {
    totalUsage,
    totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
    totalOrderValue: Math.round(totalOrderValue * 100) / 100,
    averageDiscount: Math.round(averageDiscount * 100) / 100,
    codeBreakdown,
  };
}
