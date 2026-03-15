"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Part = {
  part_id: string;
  name: string;
  color: string;
  source: string;
};

type MOC = {
  id: string;
  slug: string;
  title: string;
  description: string;
  design_features: string[];
  parts_list: Part[];
  instructions: string[];
  image_url: string;
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
        moc.instructions.forEach((step, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const stepText = `${idx + 1}. ${step}`;
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

  return (
    <div className="min-h-screen bg-neutral-50">
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

      {/* Hero Section */}
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 shadow-lg">
            {moc.image_url ? (
              <Image
                src={moc.image_url}
                alt={moc.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-9xl">
                🧱
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">
              {moc.title}
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              {moc.description}
            </p>

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

            {/* PDF Export Button */}
            <button
              onClick={generatePDF}
              disabled={generatingPdf}
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-amber-500 px-6 py-3 font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              {generatingPdf ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Instructions PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Parts List Section */}
      {moc.parts_list && moc.parts_list.length > 0 && (
        <div className="border-t border-neutral-200 bg-white py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-bold text-neutral-900">Parts List</h2>
            <p className="mt-2 text-neutral-600">
              All the pieces you need to build this MOC
            </p>
            
            <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full">
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
          </div>
        </div>
      )}

      {/* Instructions Section */}
      {moc.instructions && moc.instructions.length > 0 && (
        <div className="border-t border-neutral-200 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl font-bold text-neutral-900">Assembly Instructions</h2>
            <p className="mt-2 text-neutral-600">
              Follow these steps to build your MOC
            </p>
            
            <div className="mt-8 space-y-6">
              {moc.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-lg font-bold text-white">
                    {idx + 1}
                  </div>
                  <div className="flex-1 rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-neutral-700">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
