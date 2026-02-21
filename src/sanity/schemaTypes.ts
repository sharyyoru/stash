import { defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Name", type: "string" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } }),
    defineField({ name: "price", title: "Price", type: "number" }),
    defineField({
      name: "shippingWeight",
      title: "Shipping weight (kg)",
      type: "number",
      description:
        "Used for Jeebly shipments. Example: 0.15 for 150g. If not set, the category default is used.",
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      initialValue: "AED",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "badges",
      title: "Badges",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "variants",
      title: "Variants",
      type: "array",
      of: [
        {
          type: "object",
          name: "variant",
          title: "Variant",
          fields: [
            {
              name: "name",
              title: "Variant name",
              type: "string",
            },
            {
              name: "price",
              title: "Price (override)",
              type: "number",
            },
            {
              name: "images",
              title: "Variant images",
              type: "array",
              of: [{ type: "image", options: { hotspot: true } }],
            },
          ],
        },
      ],
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "longDescription",
      title: "Long description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "character",
      title: "Character pick",
      type: "reference",
      to: [{ type: "character" }],
    }),
    defineField({
      name: "isSubscription",
      title: "Subscription Product",
      type: "boolean",
      description: "Enable this for products that require monthly subscription payments",
      initialValue: false,
    }),
    defineField({
      name: "subscriptionPrice",
      title: "Monthly Subscription Price",
      type: "number",
      description: "Monthly price for subscription products. If not set, uses the regular price.",
      hidden: ({ parent }) => !parent?.isSubscription,
    }),
  ],
});

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } }),
    defineField({ name: "description", title: "Description", type: "text" }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number" }),
    defineField({
      name: "tone",
      title: "Tone (Tailwind gradient classes)",
      type: "string",
    }),
    defineField({
      name: "defaultShippingWeight",
      title: "Default shipping weight (kg)",
      type: "number",
      description:
        "Fallback weight per product in this category if the product's shipping weight is not set.",
    }),
    defineField({
      name: "isSubscriptionCategory",
      title: "Subscription Category",
      type: "boolean",
      description: "All products in this category will be treated as subscription products",
      initialValue: false,
    }),
  ],
});

export const characterType = defineType({
  name: "character",
  title: "Character",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Name", type: "string" }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } }),
    defineField({ name: "tagline", title: "Tagline", type: "string" }),
    defineField({
      name: "cardImage",
      title: "Card illustration",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "moodColor",
      title: "Mood gradient (Tailwind classes)",
      type: "string",
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
});

export const blogPostType = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
    }),
    defineField({
      name: "excerpt",
      title: "Short excerpt",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
});

export const contactPageType = defineType({
  name: "contactPage",
  title: "Contact Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      initialValue: "Contact Us",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
    }),
    defineField({
      name: "subheading",
      title: "Subheading",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "email",
      title: "Contact Email",
      type: "string",
    }),
    defineField({
      name: "whatsapp",
      title: "WhatsApp Number",
      type: "string",
      description: "Include country code, e.g., +971501234567",
    }),
    defineField({
      name: "instagram",
      title: "Instagram Handle",
      type: "string",
      description: "e.g., @stashcollections",
    }),
    defineField({
      name: "content",
      title: "Additional Content",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Contact Page" };
    },
  },
});

export const shippingPageType = defineType({
  name: "shippingPage",
  title: "Shipping & Returns Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      initialValue: "Shipping & Returns",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Shipping & Returns Page" };
    },
  },
});

export const privacyPageType = defineType({
  name: "privacyPage",
  title: "Privacy Policy Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      initialValue: "Privacy Policy",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
    }),
    defineField({
      name: "lastUpdated",
      title: "Last Updated",
      type: "date",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Privacy Policy Page" };
    },
  },
});

export const termsPageType = defineType({
  name: "termsPage",
  title: "Terms & Conditions Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      initialValue: "Terms & Conditions",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
    }),
    defineField({
      name: "lastUpdated",
      title: "Last Updated",
      type: "date",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Terms & Conditions Page" };
    },
  },
});

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Settings Name",
      type: "string",
      initialValue: "Site Settings",
    }),
    // Announcement Bar
    defineField({
      name: "announcementBar",
      title: "Announcement Bar",
      type: "object",
      fields: [
        {
          name: "enabled",
          title: "Show announcement bar",
          type: "boolean",
          initialValue: true,
        },
        {
          name: "text",
          title: "Announcement text",
          type: "string",
          description: "Main announcement message displayed in the yellow bar",
        },
        {
          name: "link",
          title: "Link (optional)",
          type: "string",
          description: "URL to link the announcement to (leave empty for no link)",
        },
        {
          name: "mobileText",
          title: "Mobile text (optional)",
          type: "string",
          description: "Shorter text for mobile screens. If empty, shows 'Stash · Stationery & Stickers'",
        },
      ],
    }),
    // Social Links
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        {
          name: "instagram",
          title: "Instagram URL",
          type: "string",
        },
        {
          name: "facebook",
          title: "Facebook URL",
          type: "string",
        },
        {
          name: "tiktok",
          title: "TikTok URL",
          type: "string",
        },
      ],
    }),
    // Delivery Charge
    defineField({
      name: "deliveryCharge",
      title: "Delivery Charge (AED)",
      type: "number",
      description: "Standard delivery charge for all orders across UAE (e.g., 25 for AED 25)",
      initialValue: 25,
    }),
    // Footer bottom text
    defineField({
      name: "footerTagline",
      title: "Footer Tagline",
      type: "string",
      description: "Small text at the bottom of the footer (e.g., 'Made for people who hoard nice paper.')",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});

export const homepageType = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "heroHeading",
      title: "Hero heading",
      type: "string",
    }),
    defineField({
      name: "heroSubheading",
      title: "Hero subheading",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "heroShops",
      title: "Hero shop cards",
      type: "array",
      of: [
        {
          type: "object",
          name: "heroShop",
          title: "Hero shop",
          fields: [
            { name: "id", title: "ID (for anchors/tracking)", type: "string" },
            { name: "name", title: "Label", type: "string" },
            { name: "title", title: "Title", type: "string" },
            {
              name: "description",
              title: "Description",
              type: "text",
              rows: 2,
            },
            {
              name: "href",
              title: "Link href or URL",
              type: "string",
            },
            {
              name: "image",
              title: "Image (PNG, JPG, GIF etc.)",
              type: "image",
              options: { hotspot: true },
            },
            {
              name: "video",
              title: "Hover video (optional)",
              type: "file",
            },
          ],
        },
      ],
    }),
    defineField({
      name: "newIn",
      title: "New in products",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
    }),
    defineField({
      name: "bestSellers",
      title: "Best sellers",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
    }),
  ],
});

export const secretStashPageType = defineType({
  name: "secretStashPage",
  title: "Secret Stash Mail Club",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page Title",
      type: "string",
      initialValue: "Secret Stash Mail Club",
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      description: "Small label above the main heading (e.g., 'SUBSCRIPTION')",
    }),
    defineField({
      name: "heading",
      title: "Main Heading",
      type: "string",
      description: "The big title (e.g., 'Mail Club')",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "text",
      rows: 2,
      description: "Short intro text about what subscribers receive",
    }),
    defineField({
      name: "cancellationPolicyText",
      title: "Cancellation Policy Text",
      type: "text",
      rows: 3,
      description: "Displayed cancellation policy (e.g., 'Cancel at least 5 days before your next billing date')",
      initialValue: "You may cancel your subscription at any time, but cancellations must be made at least 5 days before your next billing date. After cancellation, you will continue to receive benefits until the end of your current billing period.",
    }),
    defineField({
      name: "gallery",
      title: "Gallery Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      description: "Images showcasing previous mail packages",
    }),
    defineField({
      name: "benefits",
      title: "Benefits List",
      type: "array",
      of: [
        {
          type: "object",
          name: "benefit",
          title: "Benefit",
          fields: [
            {
              name: "title",
              title: "Title",
              type: "string",
              description: "The highlighted word (e.g., 'fine art print')",
            },
            {
              name: "description",
              title: "Description",
              type: "string",
              description: "Full benefit description",
            },
          ],
        },
      ],
    }),
    defineField({
      name: "content",
      title: "Additional Content",
      type: "array",
      of: [{ type: "block" }],
      description: "Rich text content below the benefits",
    }),
    defineField({
      name: "shippingNote",
      title: "Shipping Note",
      type: "text",
      rows: 2,
      description: "Note about when items are shipped",
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      initialValue: "AED",
    }),
    defineField({
      name: "pricingTiers",
      title: "Pricing Tiers",
      type: "array",
      of: [
        {
          type: "object",
          name: "pricingTier",
          title: "Pricing Tier",
          fields: [
            {
              name: "id",
              title: "ID",
              type: "string",
              description: "Unique identifier (e.g., 'monthly', 'quarterly', 'annual')",
            },
            {
              name: "name",
              title: "Name",
              type: "string",
              description: "Display name (e.g., 'Monthly Membership')",
            },
            {
              name: "price",
              title: "Price",
              type: "number",
              description: "Price per billing period",
            },
            {
              name: "billingPeriod",
              title: "Billing Period",
              type: "string",
              options: {
                list: [
                  { title: "Monthly", value: "month" },
                  { title: "Quarterly (3 months)", value: "quarter" },
                  { title: "Annual (12 months)", value: "year" },
                ],
              },
            },
            {
              name: "stripePriceId",
              title: "Stripe Price ID",
              type: "string",
              description: "The Stripe Price ID for this tier (e.g., price_xxx)",
            },
            {
              name: "savings",
              title: "Savings Text",
              type: "string",
              description: "Optional savings badge (e.g., 'Save 15%')",
            },
            {
              name: "isPopular",
              title: "Mark as Popular",
              type: "boolean",
              initialValue: false,
            },
          ],
        },
      ],
    }),
    defineField({
      name: "cancellationPolicy",
      title: "Cancellation Policy",
      type: "text",
      rows: 3,
    }),
  ],
  preview: {
    prepare() {
      return { title: "Secret Stash Mail Club" };
    },
  },
});

export const recapItemType = defineType({
  name: "recapItem",
  title: "Secret Stash Recap",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Name of this recap item (e.g., 'January 2025 Recap')",
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "month",
      title: "Month",
      type: "string",
      description: "Month this recap represents (e.g., 'January 2025')",
    }),
    defineField({
      name: "shortDescription",
      title: "Short Description",
      type: "text",
      rows: 2,
      description: "Brief description shown in the recap grid",
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
      description: "Main image shown in the recap grid",
    }),
    defineField({
      name: "gallery",
      title: "Gallery Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      description: "Additional images showcasing what was in this recap",
    }),
    defineField({
      name: "contents",
      title: "What's Included",
      type: "array",
      of: [
        {
          type: "object",
          name: "contentItem",
          title: "Item",
          fields: [
            { name: "name", title: "Item Name", type: "string" },
            { name: "description", title: "Description", type: "text", rows: 2 },
          ],
        },
      ],
      description: "List of items that were included in this recap",
    }),
    defineField({
      name: "longDescription",
      title: "Full Description",
      type: "array",
      of: [{ type: "block" }],
      description: "Detailed description for the recap page",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      description: "Price to purchase this recap (if available)",
    }),
    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      initialValue: "AED",
    }),
    defineField({
      name: "isAvailable",
      title: "Available for Purchase",
      type: "boolean",
      initialValue: true,
      description: "Toggle off if this recap is no longer available",
    }),
    defineField({
      name: "publishedAt",
      title: "Published Date",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "title",
      month: "month",
      media: "coverImage",
    },
    prepare({ title, month, media }) {
      return {
        title: title || "Untitled Recap",
        subtitle: month,
        media,
      };
    },
  },
});

export const schemaTypes = [
  productType,
  categoryType,
  characterType,
  blogPostType,
  contactPageType,
  shippingPageType,
  privacyPageType,
  termsPageType,
  siteSettingsType,
  homepageType,
  secretStashPageType,
  recapItemType,
];
