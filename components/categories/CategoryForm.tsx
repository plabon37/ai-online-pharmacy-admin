"use client";

import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
} from "react";

import ImageUploader from "@/components/shared/ImageUploader";

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryFormState = {
  name: string;
  description: string;
  image: string;
};

type CategoryFormProps = {
  editingCategory: Category | null;
  form: CategoryFormState;
  setForm: Dispatch<SetStateAction<CategoryFormState>>;
  onPreviewImageChange: (preview: string) => void;
  onSuccess: (
    category: Category,
    mode: "create" | "update"
  ) => void;
  onCancelEdit: () => void;
};

export default function CategoryForm({
  editingCategory,
  form,
  setForm,
  onPreviewImageChange,
  onSuccess,
  onCancelEdit,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const isEditing = Boolean(editingCategory);

      const url = isEditing
        ? `/api/categories/${editingCategory?._id}`
        : "/api/categories";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          description: form.description.trim(),
          image: form.image.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message || "Unable to save category."
        );
        return;
      }

      onSuccess(
        result.data as Category,
        isEditing ? "update" : "create"
      );

      setError("");
    } catch (error) {
      console.error("Category form error:", error);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            {editingCategory
              ? "Edit Category"
              : "New Category"}
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {editingCategory
              ? "Update category"
              : "Create category"}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
            Changes appear instantly in the live preview.
          </p>
        </div>

        {editingCategory && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={loading}
            className="w-fit shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel edit
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="category-name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Category Name
          </label>

          <input
            id="category-name"
            type="text"
            value={form.name}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }));

              setError("");
            }}
            placeholder="e.g. Antibiotics"
            autoComplete="off"
            disabled={loading}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="category-description"
              className="text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <span className="text-[10px] text-slate-400 sm:text-xs">
              {form.description.length}/500
            </span>
          </div>

          <textarea
            id="category-description"
            value={form.description}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }));

              setError("");
            }}
            placeholder="Describe this medicine category..."
            maxLength={500}
            rows={4}
            disabled={loading}
            className="min-h-[110px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Category Image
          </label>

          <ImageUploader
            key={editingCategory?._id ?? "new-category"}
            value={form.image}
            onChange={(url) =>
              setForm((current) => ({
                ...current,
                image: url,
              }))
            }
            onPreviewChange={onPreviewImageChange}
            folderLabel="Upload Category Image"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />

          <span className="relative flex items-center">
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : editingCategory ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </span>
        </button>
      </form>
    </div>
  );
}