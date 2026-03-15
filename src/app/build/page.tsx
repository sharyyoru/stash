"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type MOC = {
  id: string;
  slug: string;
  title: string;
  description: string;
  design_features: string[];
  image_url: string;
  status: string;
  created_at: string;
};

export default function BuildPage() {
  const [mocs, setMocs] = useState<MOC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMocs() {
      try {
        const res = await fetch("/api/build");
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setMocs(data.mocs || []);
        }
      } catch (err) {
        setError("Failed to load MOCs");
      } finally {
        setLoading(false);
      }
    }
    
    fetchMocs();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm">
              <span className="text-lg">🧱</span>
              <span>LEGO MOC Gallery</span>
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 md:text-5xl">
              Build
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Explore custom LEGO MOC designs with step-by-step instructions, 
              parts lists, and downloadable PDF guides.
            </p>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-6 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : mocs.length === 0 ? (
          <div className="rounded-lg bg-amber-50 p-12 text-center">
            <div className="mb-4 text-5xl">🧱</div>
            <h3 className="text-xl font-semibold text-neutral-800">No MOCs Yet</h3>
            <p className="mt-2 text-neutral-600">
              Check back soon for custom LEGO MOC designs!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {mocs.map((moc) => (
              <Link
                key={moc.id}
                href={`/build/${moc.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-100">
                  {moc.image_url ? (
                    <Image
                      src={moc.image_url}
                      alt={moc.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                      🧱
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-amber-600">
                    {moc.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                    {moc.description}
                  </p>
                  {moc.design_features && moc.design_features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {moc.design_features.slice(0, 3).map((feature, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center text-sm font-medium text-amber-600">
                    View Instructions
                    <svg
                      className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
