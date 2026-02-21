import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { sanityClient } from "../../../../sanity/client";
import { recapItemBySlugQuery } from "../../../../sanity/queries";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import RecapItemClient from "./recap-item-client";

type RecapItemData = {
  _id: string;
  title: string;
  slug: string;
  month: string;
  shortDescription: string;
  coverImageUrl: string;
  gallery?: { url: string }[];
  contents?: { _key: string; name: string; description: string }[];
  longDescription?: any[];
  price: number;
  currency: string;
  isAvailable: boolean;
  publishedAt: string;
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function RecapItemPage({ params }: Props) {
  const { slug } = await params;
  
  const [recapItem, session] = await Promise.all([
    sanityClient.fetch(recapItemBySlugQuery, { slug }).catch(() => null) as Promise<RecapItemData | null>,
    getServerSession(authOptions),
  ]);

  if (!recapItem) {
    notFound();
  }

  const isSignedIn = Boolean(session?.user);
  const userEmail = session?.user?.email || undefined;
  const userName = session?.user?.name || undefined;

  return (
    <RecapItemClient
      recapItem={recapItem}
      isSignedIn={isSignedIn}
      userEmail={userEmail}
      userName={userName}
    />
  );
}
