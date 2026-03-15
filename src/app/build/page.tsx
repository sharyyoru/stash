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
  images: string[];
  cover_image: string;
  parts_list: any[];
  instructions: any[];
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

  // Get display image for a MOC (cover_image, first image, or placeholder)
  const getDisplayImage = (moc: MOC): string | null => {
    if (moc.cover_image) return moc.cover_image;
    if (moc.images && moc.images.length > 0) return moc.images[0];
    return null;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section - Enhanced with better mobile responsiveness */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100">
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-orange-200/30 blur-3xl" />
        
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16 md:py-20">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm backdrop-blur-sm">
              <span className="text-lg">🧱</span>
              <span>LEGO MOC Gallery</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Build
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 sm:text-lg">
              Explore custom LEGO MOC designs with step-by-step instructions, 
              parts lists, and downloadable PDF guides.
            </p>
            
            {/* Quick stats */}
            {mocs.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 backdrop-blur-sm">
                  <span className="font-bold text-amber-600">{mocs.length}</span>
                  <span className="text-neutral-600">MOCs Available</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Section - Enhanced grid and cards */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            <p className="mt-4 text-neutral-500">Loading MOCs...</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl bg-red-50 p-8 text-center">
            <div className="mb-4 text-4xl">😕</div>
            <p className="font-medium text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        ) : mocs.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-12 text-center shadow-sm">
            <div className="mb-4 text-6xl">🧱</div>
            <h3 className="text-xl font-semibold text-neutral-800">No MOCs Yet</h3>
            <p className="mt-2 text-neutral-600">
              Check back soon for custom LEGO MOC designs!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {mocs.map((moc) => {
              const displayImage = getDisplayImage(moc);
              const partsCount = moc.parts_list?.length || 0;
              const stepsCount = moc.instructions?.length || 0;
              
              return (
                <Link
                  key={moc.id}
                  href={`/build/${moc.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                    {displayImage ? (
                      <Image
                        src={displayImage}
                        alt={moc.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-7xl opacity-50">🧱</span>
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    {/* Quick view button on hover */}
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 transition-all duration-300 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                      <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-lg">
                        View Details
                        <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                    
                    {/* Image count badge */}
                    {moc.images && moc.images.length > 1 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {moc.images.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg font-semibold text-neutral-900 transition-colors group-hover:text-amber-600 line-clamp-1">
                      {moc.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                      {moc.description}
                    </p>
                    
                    {/* Stats row */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
                      {partsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {partsCount} parts
                        </span>
                      )}
                      {stepsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {stepsCount} steps
                        </span>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {moc.design_features && moc.design_features.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {moc.design_features.slice(0, 2).map((feature, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                          >
                            {feature}
                          </span>
                        ))}
                        {moc.design_features.length > 2 && (
                          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                            +{moc.design_features.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
