"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

const emptyMoc: Omit<MOC, "id" | "slug" | "created_at" | "updated_at"> = {
  title: "",
  description: "",
  design_features: [],
  parts_list: [],
  instructions: [],
  images: [],
  videos: [],
  cover_image: "",
  status: "draft",
};

const emptyPart: Part = {
  part_id: "",
  name: "",
  color: "",
  source: "",
};

const emptyInstruction: Instruction = {
  step: 1,
  text: "",
  image_url: "",
};

export default function EditBuildPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [mocs, setMocs] = useState<MOC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [editMode, setEditMode] = useState<"list" | "create" | "edit">("list");
  const [currentMoc, setCurrentMoc] = useState<Partial<MOC>>(emptyMoc);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Check admin access
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  const isAdmin = session?.user?.email && adminEmails.includes(session.user.email.toLowerCase());

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }
    
    // We'll check admin status on the server side via API
    fetchMocs();
  }, [session, status, router]);

  async function fetchMocs() {
    try {
      setLoading(true);
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

  async function handleSave() {
    if (!currentMoc.title?.trim()) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    
    try {
      const isEdit = "id" in currentMoc && currentMoc.id;
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch("/api/build", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentMoc),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to save MOC");
      }
      
      setMessage({ type: "success", text: data.message || "MOC saved successfully" });
      await fetchMocs();
      
      setTimeout(() => {
        setEditMode("list");
        setCurrentMoc(emptyMoc);
        setMessage(null);
      }, 1500);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/build?id=${id}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete MOC");
      }
      
      setMessage({ type: "success", text: "MOC deleted successfully" });
      setDeleteConfirm(null);
      await fetchMocs();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  }

  function startEdit(moc: MOC) {
    setCurrentMoc({ ...moc });
    setEditMode("edit");
  }

  function startCreate() {
    setCurrentMoc({ ...emptyMoc });
    setEditMode("create");
  }

  function addDesignFeature() {
    setCurrentMoc(prev => ({
      ...prev,
      design_features: [...(prev.design_features || []), ""],
    }));
  }

  function updateDesignFeature(index: number, value: string) {
    setCurrentMoc(prev => {
      const features = [...(prev.design_features || [])];
      features[index] = value;
      return { ...prev, design_features: features };
    });
  }

  function removeDesignFeature(index: number) {
    setCurrentMoc(prev => ({
      ...prev,
      design_features: (prev.design_features || []).filter((_, i) => i !== index),
    }));
  }

  function addPart() {
    setCurrentMoc(prev => ({
      ...prev,
      parts_list: [...(prev.parts_list || []), { ...emptyPart }],
    }));
  }

  function updatePart(index: number, field: keyof Part, value: string) {
    setCurrentMoc(prev => {
      const parts = [...(prev.parts_list || [])];
      parts[index] = { ...parts[index], [field]: value };
      return { ...prev, parts_list: parts };
    });
  }

  function removePart(index: number) {
    setCurrentMoc(prev => ({
      ...prev,
      parts_list: (prev.parts_list || []).filter((_, i) => i !== index),
    }));
  }

  function addInstruction() {
    const newStep = (currentMoc.instructions?.length || 0) + 1;
    setCurrentMoc(prev => ({
      ...prev,
      instructions: [...(prev.instructions || []), { step: newStep, text: "", image_url: "" }],
    }));
  }

  function updateInstruction(index: number, field: keyof Instruction, value: string | number) {
    setCurrentMoc(prev => {
      const instructions = [...(prev.instructions || [])] as Instruction[];
      instructions[index] = { ...instructions[index], [field]: value };
      return { ...prev, instructions };
    });
  }

  function removeInstruction(index: number) {
    setCurrentMoc(prev => ({
      ...prev,
      instructions: ((prev.instructions || []) as Instruction[]).filter((_, i) => i !== index),
    }));
  }

  // Image upload handler
  async function handleImageUpload(file: File, type: "cover" | "gallery" | "instruction", instructionIndex?: number) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mocSlug", currentMoc.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "temp");
    formData.append("type", "image");

    try {
      const res = await fetch("/api/build/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Upload failed" });
        return;
      }

      if (type === "cover") {
        setCurrentMoc(prev => ({ ...prev, cover_image: data.url }));
      } else if (type === "gallery") {
        setCurrentMoc(prev => ({ ...prev, images: [...(prev.images || []), data.url] }));
      } else if (type === "instruction" && instructionIndex !== undefined) {
        updateInstruction(instructionIndex, "image_url", data.url);
      }
      
      setMessage({ type: "success", text: "Image uploaded successfully" });
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage({ type: "error", text: "Upload failed" });
    }
  }

  // Video upload handler
  async function handleVideoUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mocSlug", currentMoc.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "temp");
    formData.append("type", "video");

    try {
      const res = await fetch("/api/build/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Upload failed" });
        return;
      }

      setCurrentMoc(prev => ({ ...prev, videos: [...(prev.videos || []), data.url] }));
      setMessage({ type: "success", text: "Video uploaded successfully" });
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage({ type: "error", text: "Upload failed" });
    }
  }

  function removeImage(index: number) {
    setCurrentMoc(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  }

  function removeVideo(index: number) {
    setCurrentMoc(prev => ({
      ...prev,
      videos: (prev.videos || []).filter((_, i) => i !== index),
    }));
  }

  function setCoverImage(url: string) {
    setCurrentMoc(prev => ({ ...prev, cover_image: url }));
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-neutral-500 hover:text-neutral-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-neutral-900">🧱 MOC Editor</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/build"
                className="text-sm text-neutral-600 hover:text-amber-600"
              >
                View Public Gallery →
              </Link>
              {editMode === "list" && (
                <button
                  onClick={startCreate}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
                >
                  + New MOC
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-auto max-w-6xl px-4 pt-4`}>
          <div className={`rounded-lg p-4 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {editMode === "list" ? (
          /* List View */
          <div>
            {error ? (
              <div className="rounded-lg bg-red-50 p-6 text-red-600">{error}</div>
            ) : mocs.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">🧱</div>
                <h3 className="text-lg font-semibold text-neutral-800">No MOCs Yet</h3>
                <p className="mt-2 text-neutral-600">Create your first MOC to get started.</p>
                <button
                  onClick={startCreate}
                  className="mt-4 rounded-lg bg-amber-500 px-6 py-2 font-medium text-white transition hover:bg-amber-600"
                >
                  Create MOC
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">MOC</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Parts</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Steps</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {mocs.map((moc) => (
                      <tr key={moc.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                              {(moc.cover_image || moc.images?.[0]) ? (
                                <Image
                                  src={moc.cover_image || moc.images[0]}
                                  alt={moc.title}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-2xl">🧱</div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">{moc.title}</p>
                              <p className="text-sm text-neutral-500">/build/{moc.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            moc.status === "published" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-neutral-100 text-neutral-600"
                          }`}>
                            {moc.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600">
                          {moc.parts_list?.length || 0} parts
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600">
                          {moc.instructions?.length || 0} steps
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(moc)}
                              className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200"
                            >
                              Edit
                            </button>
                            {deleteConfirm === moc.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDelete(moc.id)}
                                  className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-600"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="rounded-lg bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(moc.id)}
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Edit/Create Form */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {editMode === "create" ? "Create New MOC" : "Edit MOC"}
              </h2>
              <button
                onClick={() => {
                  setEditMode("list");
                  setCurrentMoc(emptyMoc);
                }}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                ← Back to List
              </button>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={currentMoc.title || ""}
                    onChange={(e) => setCurrentMoc(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g., Master Lloyd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={currentMoc.status || "draft"}
                    onChange={(e) => setCurrentMoc(prev => ({ ...prev, status: e.target.value as "draft" | "published" }))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={currentMoc.description || ""}
                  onChange={(e) => setCurrentMoc(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Describe your MOC..."
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cover Image
                </label>
                <div className="flex items-start gap-4">
                  {currentMoc.cover_image ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg">
                      <Image src={currentMoc.cover_image} alt="Cover" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setCurrentMoc(prev => ({ ...prev, cover_image: "" }))}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-amber-400 hover:bg-amber-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "cover")}
                      />
                      <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </label>
                  )}
                  <div className="text-sm text-neutral-500">
                    <p>Upload a cover image for this MOC.</p>
                    <p className="mt-1">Recommended: Square image, min 500x500px</p>
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Gallery Images
                </label>
                <div className="flex flex-wrap gap-3">
                  {(currentMoc.images || []).map((img, idx) => (
                    <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-lg">
                      <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {!currentMoc.cover_image && idx === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-amber-500 py-0.5 text-center text-xs text-white">Cover</span>
                      )}
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-amber-400 hover:bg-amber-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "gallery")}
                    />
                    <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                </div>
              </div>

              {/* Videos / Instagram Links */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Videos & Instagram Posts
                </label>
                <div className="space-y-3">
                  {(currentMoc.videos || []).map((video, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {video.includes('instagram.com') ? (
                        <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                          <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                      ) : (
                        <video src={video} className="h-16 w-28 rounded-lg object-cover" />
                      )}
                      <span className="flex-1 truncate text-sm text-neutral-600">
                        {video.includes('instagram.com') ? video : video.split('/').pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVideo(idx)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-sm text-red-600 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  {/* Instagram URL input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Instagram post URL (e.g., https://instagram.com/p/...)"
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const url = input.value.trim();
                          if (url && (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/'))) {
                            setCurrentMoc(prev => ({ ...prev, videos: [...(prev.videos || []), url] }));
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        const url = input.value.trim();
                        if (url && (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/'))) {
                          setCurrentMoc(prev => ({ ...prev, videos: [...(prev.videos || []), url] }));
                          input.value = '';
                        }
                      }}
                      className="rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Add
                    </button>
                  </div>
                  
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 p-4 hover:border-amber-400 hover:bg-amber-50">
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                    />
                    <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-neutral-600">Or upload video file</span>
                  </label>
                </div>
              </div>

              {/* Design Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Design Features
                  </label>
                  <button
                    type="button"
                    onClick={addDesignFeature}
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    + Add Feature
                  </button>
                </div>
                <div className="space-y-2">
                  {(currentMoc.design_features || []).map((feature, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateDesignFeature(idx, e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="e.g., Santoryu Stance"
                      />
                      <button
                        type="button"
                        onClick={() => removeDesignFeature(idx)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parts List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Parts List
                  </label>
                  <button
                    type="button"
                    onClick={addPart}
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    + Add Part
                  </button>
                </div>
                <div className="space-y-2">
                  {(currentMoc.parts_list || []).map((part, idx) => (
                    <div key={idx} className="flex gap-2 flex-wrap md:flex-nowrap">
                      <input
                        type="text"
                        value={part.part_id}
                        onChange={(e) => updatePart(idx, "part_id", e.target.value)}
                        className="w-20 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="ID"
                      />
                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) => updatePart(idx, "name", e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Part Name"
                      />
                      <input
                        type="text"
                        value={part.color}
                        onChange={(e) => updatePart(idx, "color", e.target.value)}
                        className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Color"
                      />
                      <input
                        type="text"
                        value={part.source}
                        onChange={(e) => updatePart(idx, "source", e.target.value)}
                        className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Source"
                      />
                      <button
                        type="button"
                        onClick={() => removePart(idx)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Assembly Instructions
                  </label>
                  <button
                    type="button"
                    onClick={addInstruction}
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    + Add Step
                  </button>
                </div>
                <div className="space-y-4">
                  {(currentMoc.instructions || []).map((instruction, idx) => {
                    const inst = instruction as Instruction;
                    return (
                      <div key={idx} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                            {idx + 1}
                          </span>
                          <div className="flex-1 space-y-3">
                            <textarea
                              value={inst.text || ""}
                              onChange={(e) => updateInstruction(idx, "text", e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="Describe this step..."
                            />
                            <div className="flex items-center gap-3">
                              {inst.image_url ? (
                                <div className="relative h-16 w-24 overflow-hidden rounded-lg">
                                  <Image src={inst.image_url} alt={`Step ${idx + 1}`} fill className="object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => updateInstruction(idx, "image_url", "")}
                                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                                  >
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:border-amber-400 hover:bg-amber-50">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "instruction", idx)}
                                  />
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  Add image
                                </label>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeInstruction(idx)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    setEditMode("list");
                    setCurrentMoc(emptyMoc);
                  }}
                  className="rounded-lg bg-neutral-100 px-6 py-2.5 font-medium text-neutral-700 transition hover:bg-neutral-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-6 py-2.5 font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save MOC"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
