"use client";

import { ChangeEvent, useRef, useState } from "react";

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  onPreviewChange?: (preview: string) => void;
  folderLabel?: string;
  disabled?: boolean;
};

type UploadResponse = {
  success?: boolean;
  data?: {
    url?: string;
    publicId?: string;
  } | null;
  message?: string;
};

export default function ImageUploader({
  value,
  onChange,
  onPreviewChange,
  folderLabel = "Upload Image",
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const displayImage = preview || value;

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!allowedTypes.has(file.type)) {
      setError(
        "Please select a JPG, PNG or WebP image."
      );

      event.target.value = "";
      return;
    }

    if (file.size <= 0) {
      setError("Selected image is empty.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5MB or less.");
      event.target.value = "";
      return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);

    setPreview(localUrl);
    onPreviewChange?.(localUrl);

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const contentType =
        response.headers.get("content-type") || "";

      let result: UploadResponse;

      if (contentType.includes("application/json")) {
        result =
          (await response.json()) as UploadResponse;
      } else {
        const text = await response.text();

        throw new Error(
          text ||
            `Upload request failed with status ${response.status}`
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Image upload failed"
        );
      }

      const uploadedUrl = result.data?.url;

      if (!uploadedUrl) {
        throw new Error(
          "Cloudinary did not return an image URL"
        );
      }

      onChange(uploadedUrl);
      setError("");
    } catch (error) {
      console.error("Image upload error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Image upload failed"
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview("");
    onPreviewChange?.("");
    onChange("");
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="
          group
          relative
          flex
          min-h-[200px]
          w-full
          items-center
          justify-center
          overflow-hidden
          rounded-2xl
          border-2
          border-dashed
          border-slate-200
          bg-slate-50
          p-2
          transition-all
          duration-200
          hover:border-emerald-300
          hover:bg-emerald-50/30
          disabled:cursor-not-allowed
          disabled:opacity-60
          sm:min-h-[240px]
        "
      >
        {displayImage ? (
          <div className="relative flex min-h-[196px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:min-h-[236px]">
            {/* IMPORTANT: object-contain = no crop */}
            <img
              src={displayImage}
              alt="Selected image preview"
              className="
                block
                max-h-[196px]
                max-w-full
                object-contain
                sm:max-h-[236px]
              "
            />

            {/* Bottom controls */}
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-slate-700 shadow-md backdrop-blur-sm">
                {uploading
                  ? "Uploading..."
                  : "Image selected"}
              </span>

              <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-md">
                {uploading
                  ? "Please wait"
                  : "Change image"}
              </span>
            </div>

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-[2px]">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xl">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
                  Uploading to Cloudinary...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <UploadIcon />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              {folderLabel}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              JPG, PNG or WebP · Maximum 5MB
            </p>

            <p className="mt-2 text-[10px] text-slate-400">
              Any image ratio is supported. Nothing will be cropped.
            </p>
          </div>
        )}
      </button>

      {displayImage && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="text-xs font-semibold text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
        >
          Remove image
        </button>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
        >
          <p className="break-words text-xs font-medium leading-5 text-red-600">
            {error}
          </p>
        </div>
      )}

      {value && !uploading && !error && (
        <p className="truncate text-[10px] font-medium text-emerald-600">
          ✓ Cloudinary image uploaded successfully.
        </p>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 16V4M12 4L7.5 8.5M12 4L16.5 8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 14V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}