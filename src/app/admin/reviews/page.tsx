"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle2,
  X,
  Search,
  Star,
  Copy,
  Check,
  MessageSquareQuote,
  Globe,
  EyeOff,
} from "lucide-react";
import {
  GoogleReview,
  REVIEW_CATEGORIES,
  getGoogleReviews,
  createGoogleReview,
  updateGoogleReview,
  deleteGoogleReview,
  seedGoogleReviewsIfEmpty,
  formatReviewForCustomer,
  getReviewInitial,
} from "@/lib/googleReviews";

const emptyForm = {
  name: "",
  text: "",
  rating: 5,
  category: "General" as string,
  tags: "",
  timeLabel: "",
  showOnWebsite: false,
  active: true,
  order: 0,
};

export default function GoogleReviewsAdminPage() {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchReviews();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getGoogleReviews();
      if (isMountedRef.current) setReviews(data);
    } catch (error) {
      console.error("Error fetching Google reviews:", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedGoogleReviewsIfEmpty();
      if (count === 0) {
        console.log("Reviews already exist — nothing seeded.");
      }
      await fetchReviews();
    } catch (error) {
      console.error("Error seeding reviews:", error);
    } finally {
      setSeeding(false);
    }
  };

  const handleCopy = async (review: GoogleReview) => {
    const payload = formatReviewForCustomer(review);
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedId(review.id || review.name);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Omit<GoogleReview, "id"> = {
        name: formData.name.trim(),
        text: formData.text.trim(),
        rating: Math.min(5, Math.max(1, formData.rating || 5)),
        category: formData.category || "General",
        tags,
        timeLabel: formData.timeLabel.trim() || undefined,
        showOnWebsite: formData.showOnWebsite,
        active: formData.active,
        order: formData.order || 0,
      };

      if (editingId) {
        await updateGoogleReview(editingId, payload);
      } else {
        await createGoogleReview(payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchReviews();
    } catch (error) {
      console.error("Error saving review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (review: GoogleReview) => {
    setEditingId(review.id || null);
    setFormData({
      name: review.name,
      text: review.text,
      rating: review.rating || 5,
      category: review.category || "General",
      tags: (review.tags || []).join(", "),
      timeLabel: review.timeLabel || "",
      showOnWebsite: review.showOnWebsite ?? false,
      active: review.active !== false,
      order: review.order || 0,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this Google review from the library?")) return;
    try {
      await deleteGoogleReview(id);
      await fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const toggleField = async (
    id: string,
    field: "active" | "showOnWebsite",
    current: boolean
  ) => {
    try {
      await updateGoogleReview(id, { [field]: !current });
      await fetchReviews();
    } catch (error) {
      console.error("Error toggling field:", error);
    }
  };

  const categoriesInUse = Array.from(
    new Set([
      "All",
      ...REVIEW_CATEGORIES,
      ...reviews.map((r) => r.category).filter(Boolean),
    ])
  );

  const filtered = reviews.filter((r) => {
    const matchesCategory =
      selectedCategory === "All" || r.category === selectedCategory;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.text.toLowerCase().includes(q) ||
      (r.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (r.category || "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const countsByCategory = reviews.reduce<Record<string, number>>((acc, r) => {
    const key = r.category || "General";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white italic uppercase tracking-tighter">
            Google Reviews
          </h1>
          <p className="text-white/40 text-sm font-medium">
            Segregate reviews by service — copy a ready message for any customer.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {reviews.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-white/5 border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <MessageSquareQuote size={16} />
              )}
              Load starter reviews
            </button>
          )}
          <button
            onClick={() => {
              setEditingId(null);
              setFormData(emptyForm);
              setIsModalOpen(true);
            }}
            className="bg-brand-orange text-black px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
          >
            <Plus size={18} />
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {/* Category segregation */}
      <div className="flex flex-wrap gap-2">
        {categoriesInUse.map((cat) => {
          const count =
            cat === "All" ? reviews.length : countsByCategory[cat] || 0;
          if (cat !== "All" && count === 0 && !REVIEW_CATEGORIES.includes(cat as any)) {
            return null;
          }
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                isActive
                  ? "bg-brand-orange text-black border-brand-orange"
                  : "bg-white/[0.03] text-white/40 border-white/5 hover:border-white/15 hover:text-white"
              }`}
            >
              {cat}
              <span className={`ml-2 ${isActive ? "text-black/50" : "text-white/20"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-orange transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search by name, text, tag, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition-all"
        />
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-brand-orange" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/20 space-y-3">
            <MessageSquareQuote size={36} className="mx-auto opacity-40" />
            <p className="font-bold uppercase tracking-widest text-xs">
              {reviews.length === 0
                ? "No reviews yet — add one or load starters"
                : "No reviews in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((review) => {
              const copyKey = review.id || review.name;
              const isCopied = copiedId === copyKey;
              return (
                <div
                  key={copyKey}
                  className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold text-sm flex-shrink-0">
                        {getReviewInitial(review.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm truncate">
                          {review.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand-orange">
                            {review.category || "General"}
                          </span>
                          {review.timeLabel && (
                            <>
                              <span className="text-white/15">•</span>
                              <span className="text-[10px] text-white/30 font-bold">
                                {review.timeLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(review)}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      {review.id && (
                        <button
                          onClick={() => handleDelete(review.id!)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-0.5">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill="#F69621"
                        className="text-brand-orange"
                      />
                    ))}
                  </div>

                  <p className="text-white/70 text-sm font-medium leading-relaxed">
                    &ldquo;{review.text}&rdquo;
                  </p>

                  {(review.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(review.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/[0.04] text-white/30 border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {review.id && (
                        <>
                          <button
                            onClick={() =>
                              toggleField(
                                review.id!,
                                "active",
                                review.active !== false
                              )
                            }
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                              review.active !== false
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}
                          >
                            {review.active !== false ? "Active" : "Hidden"}
                          </button>
                          <button
                            onClick={() =>
                              toggleField(
                                review.id!,
                                "showOnWebsite",
                                !!review.showOnWebsite
                              )
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                              review.showOnWebsite
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : "bg-white/[0.03] text-white/25 border-white/5"
                            }`}
                            title="Toggle homepage display"
                          >
                            {review.showOnWebsite ? (
                              <Globe size={10} />
                            ) : (
                              <EyeOff size={10} />
                            )}
                            {review.showOnWebsite ? "On website" : "Library only"}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopy(review)}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isCopied
                          ? "bg-emerald-500 text-black"
                          : "bg-brand-orange text-black hover:bg-white"
                      }`}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      {isCopied ? "Copied!" : "Copy for customer"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-white">
                    {editingId ? "Edit Review" : "Add Review"}
                  </h2>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Paste from Google — pick a category to segregate
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                    Reviewer name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                    placeholder="e.g. Jad Salman"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                    Review text
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.text}
                    onChange={(e) =>
                      setFormData({ ...formData, text: e.target.value })
                    }
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-medium resize-y"
                    placeholder="Paste the full Google review..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                    >
                      {REVIEW_CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#0A0A0A]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                      Rating
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rating: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n} className="bg-[#0A0A0A]">
                          {n} star{n === 1 ? "" : "s"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                      Time label
                    </label>
                    <input
                      type="text"
                      value={formData.timeLabel}
                      onChange={(e) =>
                        setFormData({ ...formData, timeLabel: e.target.value })
                      }
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                      placeholder="e.g. 2 months ago"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                      Sort order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-all font-bold"
                    placeholder="e.g. SUV, odor, team"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="w-4 h-4 accent-brand-orange"
                    />
                    <span className="text-xs font-bold text-white/70">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showOnWebsite}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          showOnWebsite: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-brand-orange"
                    />
                    <span className="text-xs font-bold text-white/70">
                      Show on website
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-white/40 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-orange text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    {isSubmitting
                      ? "Saving..."
                      : editingId
                        ? "Save Changes"
                        : "Add Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
