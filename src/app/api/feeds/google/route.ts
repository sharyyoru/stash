import { NextResponse } from "next/server";
import { sanityClient } from "../../../../sanity/client";
import { groq } from "next-sanity";

// Query to get all products for the feed
const allProductsForFeedQuery = groq`*[_type == "product"]{
  _id,
  title,
  "slug": slug.current,
  price,
  currency,
  shortDescription,
  "category": category->title,
  "categorySlug": category->slug.current,
  badges,
  "imageUrl": images[0].asset->url,
  "additionalImages": images[1..3].asset->url,
  isSubscription,
  subscriptionPrice,
  "isSubscriptionCategory": category->isSubscriptionCategory,
  shippingWeight
}`;

// Query to get Secret Stash subscription tiers
const secretStashTiersQuery = groq`*[_type == "secretStashPage"][0]{
  pricingTiers[]{
    id,
    name,
    price,
    billingPeriod,
    stripePriceId,
    savings,
    isPopular
  },
  currency,
  "gallery": gallery[0..2].asset->url
}`;

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  shortDescription?: string;
  category?: string;
  categorySlug?: string;
  badges?: string[];
  imageUrl?: string;
  additionalImages?: string[];
  isSubscription?: boolean;
  subscriptionPrice?: number;
  isSubscriptionCategory?: boolean;
  shippingWeight?: number;
};

type SubscriptionTier = {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  stripePriceId?: string;
  savings?: string;
  isPopular?: boolean;
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatPrice(price: number): string {
  return price.toFixed(2);
}

function getAvailability(product: Product): string {
  // All products are in stock for now
  return "in_stock";
}

function getCondition(): string {
  return "new";
}

function getGoogleCategory(category?: string): string {
  // Map Sanity categories to Google product categories
  const categoryMap: Record<string, string> = {
    "Stickers": "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Craft Kits",
    "Stationery": "Office Supplies > General Office Supplies",
    "Mugs": "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs",
    "Notebooks": "Office Supplies > Paper Products > Notebooks & Notepads",
    "Art Prints": "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Craft Kits",
  };
  return categoryMap[category || ""] || "Office Supplies";
}

function getBillingPeriodMonths(period: string): number {
  const periodMap: Record<string, number> = {
    "month": 1,
    "quarter": 3,
    "half-year": 6,
    "year": 12,
  };
  return periodMap[period] || 1;
}

function generateProductXml(product: Product, baseUrl: string): string {
  const productUrl = `${baseUrl}/products/${product.slug}`;
  const imageUrl = product.imageUrl || `${baseUrl}/placeholder.jpg`;
  const price = product.price || 0;
  const currency = product.currency || "AED";
  
  let xml = `
    <item>
      <g:id>${escapeXml(product._id)}</g:id>
      <g:title>${escapeXml(product.title)}</g:title>
      <g:description>${escapeXml(product.shortDescription || product.title)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>`;
  
  // Add additional images
  if (product.additionalImages) {
    product.additionalImages.forEach((img) => {
      if (img) {
        xml += `
      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`;
      }
    });
  }
  
  xml += `
      <g:availability>${getAvailability(product)}</g:availability>
      <g:price>${formatPrice(price)} ${currency}</g:price>
      <g:condition>${getCondition()}</g:condition>
      <g:brand>Stash</g:brand>
      <g:google_product_category>${escapeXml(getGoogleCategory(product.category))}</g:google_product_category>`;
  
  if (product.category) {
    xml += `
      <g:product_type>${escapeXml(product.category)}</g:product_type>`;
  }
  
  // Add shipping weight if available
  if (product.shippingWeight) {
    xml += `
      <g:shipping_weight>${product.shippingWeight} kg</g:shipping_weight>`;
  }
  
  // Add badges as custom labels
  if (product.badges && product.badges.length > 0) {
    product.badges.slice(0, 5).forEach((badge, index) => {
      xml += `
      <g:custom_label_${index}>${escapeXml(badge)}</g:custom_label_${index}>`;
    });
  }
  
  xml += `
    </item>`;
  
  return xml;
}

function generateSubscriptionXml(
  tier: SubscriptionTier,
  currency: string,
  galleryImages: string[],
  baseUrl: string
): string {
  const productUrl = `${baseUrl}/secret-stash`;
  const imageUrl = galleryImages[0] || `${baseUrl}/placeholder.jpg`;
  const billingMonths = getBillingPeriodMonths(tier.billingPeriod);
  const monthlyPrice = tier.price / billingMonths;
  
  // Unique ID combining subscription and tier
  const itemId = `subscription-${tier.id}`;
  
  let xml = `
    <item>
      <g:id>${escapeXml(itemId)}</g:id>
      <g:title>${escapeXml(`Secret Stash Mail Club - ${tier.name}`)}</g:title>
      <g:description>${escapeXml(`Monthly curated stationery subscription box. ${tier.name} plan - receive exclusive art prints, original stories, and premium stationery surprises delivered to your door.`)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>`;
  
  // Add additional gallery images
  galleryImages.slice(1, 4).forEach((img) => {
    if (img) {
      xml += `
      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`;
    }
  });
  
  xml += `
      <g:availability>in_stock</g:availability>
      <g:price>${formatPrice(tier.price)} ${currency}</g:price>
      <g:condition>new</g:condition>
      <g:brand>Stash</g:brand>
      <g:google_product_category>Arts &amp; Entertainment &gt; Hobbies &amp; Creative Arts &gt; Arts &amp; Crafts Supplies</g:google_product_category>
      <g:product_type>Subscription Box</g:product_type>
      
      <!-- Subscription-specific attributes -->
      <g:subscription_cost>
        <g:period>month</g:period>
        <g:period_length>${billingMonths}</g:period_length>
        <g:amount>${formatPrice(monthlyPrice)} ${currency}</g:amount>
      </g:subscription_cost>
      
      <g:custom_label_0>Subscription</g:custom_label_0>
      <g:custom_label_1>${escapeXml(tier.name)}</g:custom_label_1>`;
  
  if (tier.savings) {
    xml += `
      <g:custom_label_2>${escapeXml(tier.savings)}</g:custom_label_2>`;
  }
  
  if (tier.isPopular) {
    xml += `
      <g:custom_label_3>Popular</g:custom_label_3>`;
  }
  
  xml += `
    </item>`;
  
  return xml;
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    
    // Fetch all products and subscription tiers
    const [products, subscriptionData] = await Promise.all([
      sanityClient.fetch(allProductsForFeedQuery) as Promise<Product[]>,
      sanityClient.fetch(secretStashTiersQuery) as Promise<{
        pricingTiers?: SubscriptionTier[];
        currency?: string;
        gallery?: string[];
      } | null>,
    ]);
    
    // Start XML document
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Stash - Stationery &amp; Stickers</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Curated stationery, stickers, and subscription boxes from Stash</description>`;
    
    // Add regular products (excluding subscription products)
    if (products && products.length > 0) {
      products
        .filter((p) => !p.isSubscription && !p.isSubscriptionCategory)
        .forEach((product) => {
          xml += generateProductXml(product, baseUrl);
        });
    }
    
    // Add subscription tiers
    if (subscriptionData?.pricingTiers && subscriptionData.pricingTiers.length > 0) {
      const currency = subscriptionData.currency || "AED";
      const gallery = subscriptionData.gallery || [];
      
      subscriptionData.pricingTiers.forEach((tier) => {
        xml += generateSubscriptionXml(tier, currency, gallery, baseUrl);
      });
    }
    
    xml += `
  </channel>
</rss>`;
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("[Google Feed] Error generating feed:", error);
    return NextResponse.json(
      { error: "Failed to generate product feed" },
      { status: 500 }
    );
  }
}
