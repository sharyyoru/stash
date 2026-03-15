"use client";

import { useState, useEffect } from "react";
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

type MOC = {
  id: string;
  slug: string;
  title: string;
  description: string;
  design_features: string[];
  parts_list: Part[];
  instructions: string[];
  image_url: string;
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
  image_url: "",
  status: "draft",
};

const emptyPart: Part = {
  part_id: "",
  name: "",
  color: "",
  source: "",
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
    setCurrentMoc(prev => ({
      ...prev,
      instructions: [...(prev.instructions || []), ""],
    }));
  }

  function updateInstruction(index: number, value: string) {
    setCurrentMoc(prev => {
      const instructions = [...(prev.instructions || [])];
      instructions[index] = value;
      return { ...prev, instructions };
    });
  }

  function removeInstruction(index: number) {
    setCurrentMoc(prev => ({
      ...prev,
      instructions: (prev.instructions || []).filter((_, i) => i !== index),
    }));
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
                              {moc.image_url ? (
                                <Image
                                  src={moc.image_url}
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

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={currentMoc.image_url || ""}
                  onChange={(e) => setCurrentMoc(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="https://example.com/image.jpg"
                />
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
                <div className="space-y-2">
                  {(currentMoc.instructions || []).map((step, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-medium text-amber-800">
                        {idx + 1}
                      </span>
                      <textarea
                        value={step}
                        onChange={(e) => updateInstruction(idx, e.target.value)}
                        rows={2}
                        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="Describe this step..."
                      />
                      <button
                        type="button"
                        onClick={() => removeInstruction(idx)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 self-start"
                      >
                        ×
                      </button>
                    </div>
                  ))}
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
