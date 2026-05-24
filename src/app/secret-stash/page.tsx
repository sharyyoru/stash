import { getServerSession } from "next-auth";
import { sanityClient } from "../../sanity/client";
import { secretStashPageQuery, recapItemsQuery } from "../../sanity/queries";
import { authOptions } from "../api/auth/[...nextauth]/route";
import SecretStashClient from "./secret-stash-client";

type SecretStashPageData = {
  title?: string;
  subtitle?: string;
  heading?: string;
  tagline?: any[];
  gallery?: { url: string }[];
  benefits?: { _key: string; title: string; description: string }[];
  content?: any[];
  shippingNote?: any[];
  currency?: string;
  pricingTiers?: {
    _key: string;
    id: string;
    name: string;
    price: number;
    billingPeriod: "month" | "quarter" | "half-year" | "year";
    stripePriceId: string;
    savings?: string;
    isPopular?: boolean;
  }[];
  volumes?: {
    _key: string;
    id: string;
    order?: number;
    title: string;
    description?: string;
    month?: string;
    imageUrl?: string;
    isDefault?: boolean;
    isCurrent?: boolean;
  }[];
  allEditions?: {
    _key: string;
    id: string;
    order?: number;
    title: string;
    description?: string;
    month?: string;
    imageUrl?: string;
    isDefault?: boolean;
    isAvailable?: boolean;
    isCurrent?: boolean;
  }[];
  cancellationPolicy?: string;
};

export type RecapItem = {
  _id: string;
  title: string;
  slug: string;
  month: string;
  shortDescription: string;
  coverImageUrl: string;
  price: number;
  currency: string;
  isAvailable: boolean;
};

export default async function SecretStashPage() {
  const [pageData, recapItems, session] = await Promise.all([
    sanityClient.fetch(secretStashPageQuery).catch(() => null) as Promise<SecretStashPageData | null>,
    sanityClient.fetch(recapItemsQuery).catch(() => []) as Promise<RecapItem[]>,
    getServerSession(authOptions),
  ]);

  const isSignedIn = Boolean(session?.user);
  const userEmail = session?.user?.email || undefined;
  const userName = session?.user?.name || undefined;

  return (
    <SecretStashClient
      pageData={pageData}
      recapItems={recapItems}
      isSignedIn={isSignedIn}
      userEmail={userEmail}
      userName={userName}
    />
  );
}
