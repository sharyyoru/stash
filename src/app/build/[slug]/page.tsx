"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Part = {
  part_id: string;
  name: string;
  color: string;
  source: string;
};

type Instruction = {
  step: number;
  text: string;
  image_url?: string;
};

type MOC = {
  id: string;
  slug: string;
  title: string;
  description: string;
  design_features: string[];
  parts_list: Part[];
  instructions: Instruction[];
  images: string[];
  videos: string[];
  cover_image: string;
  status: string;
  created_at: string;
};

export default function MOCDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [moc, setMoc] = useState<MOC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"instructions" | "parts">("instructions");

  useEffect(() => {
    async function fetchMoc() {
      try {
        const res = await fetch(`/api/build?slug=${slug}`);
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setMoc(data.moc);
        }
      } catch (err) {
        setError("Failed to load MOC");
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      fetchMoc();
    }
  }, [slug]);

  // Get all images including cover
  const allImages = moc ? [
    ...(moc.cover_image ? [moc.cover_image] : []),
    ...(moc.images || []).filter(img => img !== moc.cover_image)
  ] : [];

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!lightboxOpen) return;
    if (e.key === "Escape") setLightboxOpen(false);
    if (e.key === "ArrowLeft") setSelectedImage(prev => prev > 0 ? prev - 1 : allImages.length - 1);
    if (e.key === "ArrowRight") setSelectedImage(prev => prev < allImages.length - 1 ? prev + 1 : 0);
  }, [lightboxOpen, allImages.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const generatePDF = async () => {
    if (!moc) return;
    
    setGeneratingPdf(true);
    
    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import("jspdf");
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = 20;
      
      // Title
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(moc.title, pageWidth / 2, yPos, { align: "center" });
      yPos += 15;
      
      // Description
      if (moc.description) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(moc.description, pageWidth - margin * 2);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 6 + 10;
      }
      
      // Design Features
      if (moc.design_features && moc.design_features.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Design Features", margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        moc.design_features.forEach((feature) => {
          doc.text(`• ${feature}`, margin + 5, yPos);
          yPos += 6;
        });
        yPos += 10;
      }
      
      // Parts List
      if (moc.parts_list && moc.parts_list.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Parts List", margin, yPos);
        yPos += 10;
        
        // Table header
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Part ID", margin, yPos);
        doc.text("Name", margin + 25, yPos);
        doc.text("Color", margin + 90, yPos);
        doc.text("Source", margin + 120, yPos);
        yPos += 6;
        
        // Draw line
        doc.setDrawColor(200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;
        
        // Table rows
        doc.setFont("helvetica", "normal");
        moc.parts_list.forEach((part) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(part.part_id || "-", margin, yPos);
          doc.text((part.name || "-").substring(0, 30), margin + 25, yPos);
          doc.text(part.color || "-", margin + 90, yPos);
          doc.text(part.source || "-", margin + 120, yPos);
          yPos += 6;
        });
        yPos += 10;
      }
      
      // Instructions
      if (moc.instructions && moc.instructions.length > 0) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Assembly Instructions", margin, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        moc.instructions.forEach((instruction, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const stepText = `${idx + 1}. ${typeof instruction === 'string' ? instruction : instruction.text}`;
          const stepLines = doc.splitTextToSize(stepText, pageWidth - margin * 2);
          doc.text(stepLines, margin, yPos);
          yPos += stepLines.length * 5 + 5;
        });
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `${moc.title} - Page ${i} of ${pageCount} - Generated from Stash Build`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }
      
      // Save the PDF
      doc.save(`${moc.slug}-instructions.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !moc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="text-6xl">😕</div>
        <h1 className="mt-4 text-2xl font-bold text-neutral-900">MOC Not Found</h1>
        <p className="mt-2 text-neutral-600">{error || "This MOC doesn't exist or has been removed."}</p>
        <Link
          href="/build"
          className="mt-6 rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition hover:bg-amber-600"
        >
          Back to Gallery
        </Link>
      </div>
    );
  }

  const displayImage = allImages[selectedImage] || null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Lightbox */}
      {lightboxOpen && allImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev > 0 ? prev - 1 : allImages.length - 1); }}
                className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev < allImages.length - 1 ? prev + 1 : 0); }}
                className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={allImages[selectedImage]}
              alt={`${moc.title} - Image ${selectedImage + 1}`}
              width={1200}
              height={900}
              className="max-h-[90vh] w-auto object-contain"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {selectedImage + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mx-auto max-w-6xl px-4 py-4">
        <Link
          href="/build"
          className="inline-flex items-center text-sm text-neutral-600 transition hover:text-amber-600"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Gallery
        </Link>
      </div>

      {/* Hero Section - Enhanced with image gallery */}
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:pb-12">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-3">
            {/* Main Image */}
            <div 
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg"
              onClick={() => { if (allImages.length > 0) setLightboxOpen(true); }}
            >
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={moc.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-9xl opacity-50">🧱</span>
                </div>
              )}
              
              {/* Zoom hint */}
              {allImages.length > 0 && (
                <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                  <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Click to zoom
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all sm:h-20 sm:w-20 ${
                      selectedImage === idx 
                        ? "ring-2 ring-amber-500 ring-offset-2" 
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl md:text-4xl">
              {moc.title}
            </h1>
            <p className="mt-4 text-base text-neutral-600 sm:text-lg">
              {moc.description}
            </p>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap gap-4">
              {moc.parts_list && moc.parts_list.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="font-medium text-amber-800">{moc.parts_list.length} Parts</span>
                </div>
              )}
              {moc.instructions && moc.instructions.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-medium text-green-800">{moc.instructions.length} Steps</span>
                </div>
              )}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-blue-800">{allImages.length} Photos</span>
                </div>
              )}
            </div>

            {/* Design Features */}
            {moc.design_features && moc.design_features.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  Design Features
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {moc.design_features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={generatePDF}
                disabled={generatingPdf}
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 font-medium text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 hover:shadow-amber-500/40 disabled:opacity-50"
              >
                {generatingPdf ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      {moc.videos && moc.videos.length > 0 && (
        <div className="border-t border-neutral-200 bg-white py-8 sm:py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Videos</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {moc.videos.map((video, idx) => (
                <div key={idx} className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
                  <video
                    src={video}
                    controls
                    className="h-full w-full object-cover"
                    preload="metadata"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Instructions and Parts */}
      <div className="border-t border-neutral-200">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab("instructions")}
              className={`px-6 py-4 text-sm font-medium transition ${
                activeTab === "instructions"
                  ? "border-b-2 border-amber-500 text-amber-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Instructions ({moc.instructions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("parts")}
              className={`px-6 py-4 text-sm font-medium transition ${
                activeTab === "parts"
                  ? "border-b-2 border-amber-500 text-amber-600"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Parts List ({moc.parts_list?.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4">
          {activeTab === "instructions" ? (
            moc.instructions && moc.instructions.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {moc.instructions.map((instruction, idx) => {
                  const stepText = typeof instruction === 'string' ? instruction : instruction.text;
                  const stepImage = typeof instruction === 'object' ? instruction.image_url : undefined;
                  
                  return (
                    <div key={idx} className="flex gap-3 sm:gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white sm:h-10 sm:w-10 sm:text-base">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
                          <p className="text-neutral-700">{stepText}</p>
                        </div>
                        {stepImage && (
                          <div className="relative aspect-video overflow-hidden rounded-xl">
                            <Image
                              src={stepImage}
                              alt={`Step ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-neutral-100 p-8 text-center">
                <p className="text-neutral-500">No instructions available yet.</p>
              </div>
            )
          ) : (
            moc.parts_list && moc.parts_list.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                {/* Mobile cards */}
                <div className="divide-y divide-neutral-200 sm:hidden">
                  {moc.parts_list.map((part, idx) => (
                    <div key={idx} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">{part.name}</p>
                          <p className="mt-1 text-sm text-neutral-500">ID: {part.part_id}</p>
                        </div>
                        <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                          {part.color}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">Source: {part.source}</p>
                    </div>
                  ))}
                </div>
                
                {/* Desktop table */}
                <table className="hidden w-full sm:table">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Part ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Color</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {moc.parts_list.map((part, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 font-mono text-sm text-neutral-600">{part.part_id}</td>
                        <td className="px-4 py-3 text-sm text-neutral-900">{part.name}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{part.color}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">{part.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl bg-neutral-100 p-8 text-center">
                <p className="text-neutral-500">No parts list available yet.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
