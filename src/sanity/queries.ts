import { groq } from "next-sanity";

export const homepageQuery = groq`*[_type == "homepage"][0]{
  title,
  newIn[]->{
    _id,
    title,
    "slug": slug.current,
    price,
    currency,
    shortDescription,
    "category": category->title,
    badges,
    "imageUrl": images[0].asset->url
  },
  bestSellers[]->{
    _id,
    title,
    "slug": slug.current,
    price,
    currency,
    shortDescription,
    "category": category->title,
    badges,
    "imageUrl": images[0].asset->url
  }
}`;

export const productBySlugQuery = groq`*[_type == "product" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  price,
  currency,
  shortDescription,
  longDescription,
  "category": category->title,
  badges,
  images[]{
    "url": asset->url
  },
  character->{
    _id,
    title,
    "slug": slug.current,
    tagline,
    cardImage
  }
}`;

export const productsByCategoryQuery = groq`*[_type == "product" && category->slug.current == $slug]{
  _id,
  title,
  "slug": slug.current,
  price,
  currency,
  shortDescription,
  "category": category->title,
  badges,
  "imageUrl": images[0].asset->url
}`;

export const categoryBySlugQuery = groq`*[_type == "category" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  description,
  "heroImageUrl": heroImage.asset->url
}`;

export const characterBySlugQuery = (slug: string) => groq`*[_type == "character" && slug.current == "${slug}"][0]{
  _id,
  title,
  "slug": slug.current,
  tagline,
  bio,
  "cardImageUrl": cardImage.asset->url,
  moodColor
}`;

export const allCategoriesForHomeQuery = groq`*[_type == "category"] | order(sortOrder asc){
  _id,
  title,
  "slug": slug.current,
  description,
  "heroImageUrl": heroImage.asset->url,
  sortOrder,
  tone
}`;

export const allCharactersForStripQuery = groq`*[_type == "character"] | order(title asc){
  _id,
  title,
  "slug": slug.current,
  tagline,
  "cardImageUrl": cardImage.asset->url,
  moodColor
}`;

export const productsByCharacterQuery = (slug: string) => groq`*[_type == "product" && character->slug.current == "${slug}"]{
  _id,
  title,
  "slug": slug.current,
  price,
  currency,
  shortDescription,
  "category": category->title,
  badges,
  "imageUrl": images[0].asset->url
}`;

export const allProductsQuery = groq`*[_type == "product"] | order(_createdAt desc){
  _id,
  title,
  "slug": slug.current,
  price,
  currency,
  shortDescription,
  "category": category->title,
  badges,
  "characterName": character->title,
  "characterSlug": character->slug.current,
  "imageUrl": images[0].asset->url
}`;

export const latestProductsQuery = groq`*[_type == "product"] | order(_createdAt desc)[0...16]{
  _id,
  title,
  "slug": slug.current,
  price,
  currency,
  shortDescription,
  "category": category->title,
  badges,
  "characterName": character->title,
  "characterSlug": character->slug.current,
  "imageUrl": images[0].asset->url
}`;

export const bestSellerProductsQuery = groq`*[_type == "product" && ("Best-Seller" in badges || "Bestseller" in badges || "Best Seller" in badges)] | order(_createdAt desc)[0...16]{
  _id,
  title,
  "slug": slug.current,
  price,
  currency,
  shortDescription,
  "category": category->title,
  badges,
  "characterName": character->title,
  "characterSlug": character->slug.current,
  "imageUrl": images[0].asset->url
}`;

export const searchProductsQuery = groq`*[_type == "product" && (
  title match $term ||
  $term in badges[] ||
  category->title match $term
)] | order(_createdAt desc)[0...8]{
  _id,
  title,
  "slug": slug.current,
  price,
  currency,
  shortDescription,
  "category": category->title,
  badges,
  "imageUrl": images[0].asset->url
}`;
