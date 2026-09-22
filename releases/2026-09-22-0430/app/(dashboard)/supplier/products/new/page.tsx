"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { HOTEL_CATEGORIES } from "@/lib/marketplace/categories";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    category: "fb",
    subcategory: "",
    unitPrice: "",
    currency: "EGP",
    stockQuantity: "0",
    minOrderQty: "1",
    unitOfMeasure: "piece",
    leadTimeDays: "1",
    shelfLifeDays: "",
    temperatureReq: "",
    // supplierId is derived from auth session server-side
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to upload images");
      }

      const newUrls = json.data.urls as string[];
      setImageUrls((prev) => [...prev, ...newUrls]);

      // Create previews
      for (const file of Array.from(files).slice(0, 5)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unitPrice: parseFloat(form.unitPrice),
          stockQuantity: parseInt(form.stockQuantity, 10),
          minOrderQty: parseInt(form.minOrderQty, 10),
          leadTimeDays: parseInt(form.leadTimeDays, 10),
          shelfLifeDays: form.shelfLifeDays ? parseInt(form.shelfLifeDays, 10) : undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to create product");
      }

      setSuccess(true);
      setTimeout(() => router.push("/supplier/products"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </motion.div>
        <h2 className="text-xl font-bold text-white">Product Created!</h2>
        <p className="text-sm text-foreground-muted">Redirecting to your product catalog...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto space-y-6"
      initial="hidden"
      animate="animate"
      variants={{ hidden: {}, animate: { transition: { staggerChildren: 0.08 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center gap-4">
        <Link
          href="/supplier/products"
          className="p-2 rounded-lg border border-border-subtle text-foreground-muted hover:text-foreground-secondary hover:border-border-subtle transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Add New Product</h1>
          <p className="text-xs text-foreground-muted">List a new product on the marketplace</p>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={fadeInUp} className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      <motion.form variants={fadeInUp} onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground-secondary flex items-center gap-2">
            <Package className="w-4 h-4 text-foreground-muted" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">SKU *</label>
              <input
                required
                value={form.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="e.g., POUL-001"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
              />
            </div>
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Product Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Whole Chicken (Halal, 1.2kg)"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe your product..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Category *</label>
              <select
                required
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white focus:outline-none focus:border-border-subtle appearance-none"
              >
                {HOTEL_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-surface-2">
                    {cat.label} ({cat.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Subcategory</label>
              <input
                value={form.subcategory}
                onChange={(e) => handleChange("subcategory", e.target.value)}
                placeholder="e.g., poultry"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
              />
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground-secondary flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-foreground-muted" />
            Product Images
          </h2>

          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages || imageUrls.length >= 5}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border-visible bg-surface-1 text-foreground-tertiary hover:text-foreground-secondary hover:border-border-subtle transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImages ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadingImages ? "Uploading..." : "Upload Images"}
            </button>
            <span className="text-[11px] text-foreground-muted">
              {imageUrls.length}/5 images • JPEG, PNG, WebP • Max 5MB each
            </span>
          </div>

          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-border-subtle">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Inventory */}
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground-secondary flex items-center gap-2">
            <Plus className="w-4 h-4 text-foreground-muted" />
            Pricing & Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Unit Price (EGP) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => handleChange("unitPrice", e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
              />
            </div>
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Stock Quantity *</label>
              <input
                required
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => handleChange("stockQuantity", e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
              />
            </div>
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Min Order Qty *</label>
              <input
                required
                type="number"
                min="1"
                value={form.minOrderQty}
                onChange={(e) => handleChange("minOrderQty", e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Unit of Measure *</label>
              <select
                required
                value={form.unitOfMeasure}
                onChange={(e) => handleChange("unitOfMeasure", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white focus:outline-none focus:border-border-subtle appearance-none"
              >
                <option value="piece" className="bg-surface-2">Piece</option>
                <option value="kg" className="bg-surface-2">Kilogram (kg)</option>
                <option value="liter" className="bg-surface-2">Liter</option>
                <option value="set" className="bg-surface-2">Set</option>
                <option value="box" className="bg-surface-2">Box</option>
                <option value="carton" className="bg-surface-2">Carton</option>
                <option value="pack" className="bg-surface-2">Pack</option>
                <option value="roll" className="bg-surface-2">Roll</option>
                <option value="meter" className="bg-surface-2">Meter</option>
                <option value="dozen" className="bg-surface-2">Dozen</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Lead Time (days) *</label>
              <input
                required
                type="number"
                min="1"
                value={form.leadTimeDays}
                onChange={(e) => handleChange("leadTimeDays", e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
              />
            </div>
            <div>
              <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Shelf Life (days)</label>
              <input
                type="number"
                min="1"
                value={form.shelfLifeDays}
                onChange={(e) => handleChange("shelfLifeDays", e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white placeholder:text-foreground-muted focus:outline-none focus:border-border-subtle"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1.5 block">Temperature Requirement</label>
            <select
              value={form.temperatureReq}
              onChange={(e) => handleChange("temperatureReq", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-border-subtle text-sm text-white focus:outline-none focus:border-border-subtle appearance-none"
            >
              <option value="" className="bg-surface-2">Ambient (no special storage)</option>
              <option value="Chilled 2-5°C" className="bg-surface-2">Chilled 2-5°C</option>
              <option value="Frozen -18°C" className="bg-surface-2">Frozen -18°C</option>
              <option value="Frozen -25°C" className="bg-surface-2">Frozen -25°C</option>
              <option value="Dry Storage" className="bg-surface-2">Dry Storage</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/supplier/products"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground-tertiary hover:text-white border border-border-subtle hover:border-border-visible transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent-base hover:bg-red-900 disabled:opacity-50 text-sm font-medium text-white transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
