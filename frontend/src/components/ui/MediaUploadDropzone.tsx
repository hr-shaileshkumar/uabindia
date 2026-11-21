"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaUploadDropzoneProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  helperText?: string;
  aspectRatio?: "square" | "video" | "wide";
  maxSizeMB?: number;
  className?: string;
}

const SAMPLE_PRESETS = [
  { label: "Sapphire Tech Logo", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80" },
  { label: "Enterprise Cloud Hub", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&auto=format&fit=crop&q=80" },
  { label: "Sovereign Shield", url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80" },
  { label: "Corporate Apex", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80" },
];

export default function MediaUploadDropzone({
  label = "Upload Image / Logo",
  value = "",
  onChange,
  helperText = "PNG, JPG, SVG or WebP up to 5MB",
  aspectRatio = "wide",
  maxSizeMB = 5,
  className,
}: MediaUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileProcess = (file: File) => {
    setErrorMsg("");
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File exceeds ${maxSizeMB}MB limit`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Only image files (PNG, JPG, SVG, WebP) are supported");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const ratioClass =
    aspectRatio === "square"
      ? "aspect-square max-w-[180px]"
      : aspectRatio === "video"
      ? "aspect-video max-w-sm"
      : "aspect-[21/9] max-w-md";

  return (
    <div className={cn("space-y-2.5", className)}>
      {label && <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>}

      {value ? (
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3">
          <div className={cn("relative mx-auto overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center", ratioClass)}>
            {/* Preview image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Media preview" className="h-full w-full object-contain p-2" />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5 stroke-[3]" /> Active Asset
            </span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all",
            isDragging
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
              : "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mt-3 text-xs font-bold text-slate-800 dark:text-slate-200">
            Drag &amp; drop an image here, or <span className="text-blue-600 underline">browse files</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{helperText}</p>

          {errorMsg && <p className="mt-2 text-xs font-semibold text-red-600">{errorMsg}</p>}
        </div>
      )}

      {/* Preset selector bar */}
      <div className="mt-2 flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <Sparkles className="h-3 w-3 text-blue-500" /> Presets:
        </span>
        {SAMPLE_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.url)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 font-medium hover:border-blue-400 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
