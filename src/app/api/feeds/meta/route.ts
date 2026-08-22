import { NextResponse } from "next/server";
import { sanityClient } from "../../../../sanity/client";
import { groq } from "next-sanity";

// Query to get all products for the Meta feed
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
  "additionalImages": images[1..9].asset->url,
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
  "gallery": gallery[].asset->url
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

function getMetaCategory(category?: string): string {
  // Map categories to Meta product categories
  const categoryMap: Record<string, string> = {
    "Stickers": "Home & Garden > Decor > Stickers",
    "Stationery": "Office Supplies",
    "Mugs": "Home & Garden > Kitchen & Dining > Drinkware > Mugs",
    "Notebooks": "Office Supplies > Paper Products",
    "Art Prints": "Home & Garden > Decor > Posters & Prints",
  };
  return categoryMap[category || ""] || "Office Supplies";
}

function generateProductXml(product: Product, baseUrl: string): string {
  const productUrl = `${baseUrl}/products/${product.slug}`;
  const imageUrl = product.imageUrl || "";
  const price = product.price || 0;
  const currency = product.currency || "AED";
  
  if (!imageUrl) return ""; // Meta requires image
  
  let xml = `
    <item>
      <id>${escapeXml(product._id)}</id>
      <title>${escapeXml(product.title)}</title>
      <description>${escapeXml(product.shortDescription || product.title)}</description>
      <availability>in stock</availability>
      <condition>new</condition>
      <price>${formatPrice(price)} ${currency}</price>
      <link>${escapeXml(productUrl)}</link>
      <image_link>${escapeXml(imageUrl)}</image_link>
      <brand>Stash</brand>
      <google_product_category>${escapeXml(getMetaCategory(product.category))}</google_product_category>`;
  
  if (product.category) {
    xml += `
      <product_type>${escapeXml(product.category)}</product_type>`;
  }
  
  // Add additional images (Meta supports up to 10)
  if (product.additionalImages && product.additionalImages.length > 0) {
    const additionalImagesStr = product.additionalImages
      .filter(Boolean)
      .slice(0, 9)
      .join(",");
    if (additionalImagesStr) {
      xml += `
      <additional_image_link>${escapeXml(additionalImagesStr)}</additional_image_link>`;
    }
  }
  
  // Add custom labels for badges
  if (product.badges && product.badges.length > 0) {
    product.badges.slice(0, 4).forEach((badge, index) => {
      xml += `
      <custom_label_${index}>${escapeXml(badge)}</custom_label_${index}>`;
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
  const imageUrl = galleryImages[0] || "";
  
  if (!imageUrl) return ""; // Meta requires image
  
  const itemId = `subscription-${tier.id}`;
  const billingPeriodMap: Record<string, string> = {
    "month": "monthly",
    "quarter": "every 3 months",
    "half-year": "every 6 months",
    "year": "annually",
  };
  const billingText = billingPeriodMap[tier.billingPeriod] || "monthly";
  
  let xml = `
    <item>
      <id>${escapeXml(itemId)}</id>
      <title>${escapeXml(`Secret Stash Mail Club - ${tier.name}`)}</title>
      <description>${escapeXml(`Premium stationery subscription box billed ${billingText}. Includes exclusive art prints, original stories, stickers, and curated surprises delivered to your door. ${tier.savings || ""}`.trim())}</description>
      <availability>in stock</availability>
      <condition>new</condition>
      <price>${formatPrice(tier.price)} ${currency}</price>
      <link>${escapeXml(productUrl)}</link>
      <image_link>${escapeXml(imageUrl)}</image_link>
      <brand>Stash</brand>
      <google_product_category>Arts &amp; Entertainment &gt; Hobbies &amp; Creative Arts</google_product_category>
      <product_type>Subscription Box</product_type>
      <custom_label_0>Subscription</custom_label_0>
      <custom_label_1>${escapeXml(tier.name)}</custom_label_1>`;
  
  if (tier.isPopular) {
    xml += `
      <custom_label_2>Popular Choice</custom_label_2>`;
  }
  
  if (tier.savings) {
    xml += `
      <custom_label_3>${escapeXml(tier.savings)}</custom_label_3>`;
  }
  
  // Add additional gallery images
  if (galleryImages.length > 1) {
    const additionalImagesStr = galleryImages
      .slice(1, 10)
      .filter(Boolean)
      .join(",");
    if (additionalImagesStr) {
      xml += `
      <additional_image_link>${escapeXml(additionalImagesStr)}</additional_image_link>`;
    }
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
    
    // Start XML document (Meta Catalog format)
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Stash - Stationery &amp; Stickers</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Curated stationery, stickers, and subscription boxes from Stash UAE</description>`;
    
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
    console.error("[Meta Feed] Error generating feed:", error);
    return NextResponse.json(
      { error: "Failed to generate product feed" },
      { status: 500 }
    );
  }
}
