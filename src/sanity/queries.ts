import { groq } from "next-sanity";

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0]{
  announcementBar {
    enabled,
    text,
    link,
    mobileText
  },
  socialLinks {
    instagram,
    facebook,
    tiktok
  },
  deliveryCharge,
  footerTagline
}`;

export const contactPageQuery = groq`*[_type == "contactPage"][0]{
  title,
  heading,
  subheading,
  email,
  whatsapp,
  instagram,
  content
}`;

export const shippingPageQuery = groq`*[_type == "shippingPage"][0]{
  title,
  heading,
  content
}`;

export const privacyPageQuery = groq`*[_type == "privacyPage"][0]{
  title,
  heading,
  lastUpdated,
  content
}`;

export const termsPageQuery = groq`*[_type == "termsPage"][0]{
  title,
  heading,
  lastUpdated,
  content
}`;

export const homepageQuery = groq`*[_type == "homepage"][0]{
  title,
  heroHeading,
  heroSubheading,
  heroShops[]{
    _key,
    id,
    name,
    title,
    description,
    href,
    "imageUrl": image.asset->url,
    "videoUrl": video.asset->url
  },
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
  "categorySlug": category->slug.current,
  badges,
  images[]{
    "url": asset->url
  },
  variants[]{
    _key,
    name,
    price,
    images[]{
      "url": asset->url
    }
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
  "categorySlug": category->slug.current,
  badges,
  "imageUrl": images[0].asset->url,
  isSubscription,
  subscriptionPrice,
  "isSubscriptionCategory": category->isSubscriptionCategory
}`;

export const categoryBySlugQuery = groq`*[_type == "category" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  description,
  "heroImageUrl": heroImage.asset->url,
  isSubscriptionCategory
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

export const stickerBadgeProductsQuery = groq`*[_type == "product" && "Sticker" in badges] | order(_createdAt desc){
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

export const lifestyleBadgeProductsQuery = groq`*[_type == "product" && "Lifestyle" in badges] | order(_createdAt desc){
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

export const recommendedProductsByCategoryQuery = groq`*[_type == "product" && category->slug.current == $categorySlug && slug.current != $currentSlug] | order(random())[0...10]{
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

export const allBlogPostsQuery = groq`*[_type == "blogPost"] | order(coalesce(publishedAt, _createdAt) desc){
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  "coverImageUrl": coverImage.asset->url
}`;

export const blogPostBySlugQuery = groq`*[_type == "blogPost" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  content,
  "coverImageUrl": coverImage.asset->url
}`;
