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

export const schemaTypes = [productType, categoryType, characterType, homepageType];
