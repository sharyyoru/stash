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
];
