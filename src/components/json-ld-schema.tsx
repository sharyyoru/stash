import Script from "next/script";

type ProductSchemaProps = {
  product: {
    id: string;
    name: string;
    description?: string;
    slug: string;
    price: number;
    currency?: string;
    imageUrl?: string;
    category?: string;
    brand?: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
    reviewCount?: number;
    ratingValue?: number;
  };
};

type SubscriptionSchemaProps = {
  subscription: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    billingPeriod: "month" | "quarter" | "half-year" | "year";
    imageUrl?: string;
    benefits?: string[];
  };
};

type OrganizationSchemaProps = {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
};

type BreadcrumbItem = {
  name: string;
  url: string;
};

type BreadcrumbSchemaProps = {
  items: BreadcrumbItem[];
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export function ProductSchema({ product }: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${BASE_URL}/products/${product.slug}#product`,
    name: product.name,
    description: product.description || product.name,
    image: product.imageUrl,
    url: `${BASE_URL}/products/${product.slug}`,
    brand: {
      "@type": "Brand",
      name: product.brand || "Stash",
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/products/${product.slug}`,
      priceCurrency: product.currency || "AED",
      price: product.price,
      availability: `https://schema.org/${product.availability || "InStock"}`,
      seller: {
        "@type": "Organization",
        name: "Stash",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "AE",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
    },
    ...(product.reviewCount && product.ratingValue
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingValue,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <Script
      id={`product-schema-${product.slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SubscriptionSchema({ subscription }: SubscriptionSchemaProps) {
  const billingPeriodMap: Record<string, { duration: string; frequency: string }> = {
    month: { duration: "P1M", frequency: "Monthly" },
    quarter: { duration: "P3M", frequency: "Quarterly" },
    "half-year": { duration: "P6M", frequency: "Semi-Annual" },
    year: { duration: "P1Y", frequency: "Annual" },
  };

  const billing = billingPeriodMap[subscription.billingPeriod] || billingPeriodMap.month;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${BASE_URL}/secret-stash#subscription`,
    name: subscription.name,
    description:
      subscription.description ||
      "Premium monthly stationery subscription box with exclusive art prints, original stories, and curated surprises.",
    image: subscription.imageUrl,
    url: `${BASE_URL}/secret-stash`,
    brand: {
      "@type": "Brand",
      name: "Stash",
    },
    category: "Subscription Box",
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/secret-stash`,
      priceCurrency: subscription.currency || "AED",
      price: subscription.price,
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      seller: {
        "@type": "Organization",
        name: "Stash",
      },
      // Subscription-specific properties
      eligibleDuration: {
        "@type": "QuantitativeValue",
        value: billing.duration,
      },
    },
    // Additional subscription details
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Billing Frequency",
        value: billing.frequency,
      },
      {
        "@type": "PropertyValue",
        name: "Subscription Type",
        value: "Recurring",
      },
      ...(subscription.benefits || []).map((benefit, index) => ({
        "@type": "PropertyValue",
        name: `Benefit ${index + 1}`,
        value: benefit,
      })),
    ],
  };

  return (
    <Script
      id="subscription-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationSchema({ name, url, logo, description, socialLinks }: OrganizationSchemaProps) {
  const sameAs: string[] = [];
  if (socialLinks?.instagram) sameAs.push(socialLinks.instagram);
  if (socialLinks?.facebook) sameAs.push(socialLinks.facebook);
  if (socialLinks?.tiktok) sameAs.push(socialLinks.tiktok);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url || BASE_URL}#organization`,
    name: name || "Stash",
    url: url || BASE_URL,
    logo: logo || `${BASE_URL}/logo.png`,
    description:
      description ||
      "Stash is a curated shop for stationery and stickers. Build a desk setup you actually want to sit at.",
    sameAs,
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Arabic"],
    },
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}#website`,
    name: "Stash",
    url: BASE_URL,
    description: "Stash is a curated shop for stationery and stickers in UAE.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${BASE_URL}#localbusiness`,
    name: "Stash",
    url: BASE_URL,
    description: "Curated stationery, stickers, and subscription boxes in UAE.",
    image: `${BASE_URL}/logo.png`,
    priceRange: "AED 10 - AED 500",
    address: {
      "@type": "PostalAddress",
      addressCountry: "AE",
      addressLocality: "Dubai",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 25.2048,
      longitude: 55.2708,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    paymentAccepted: "Credit Card, Debit Card",
    currenciesAccepted: "AED",
  };

  return (
    <Script
      id="localbusiness-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
