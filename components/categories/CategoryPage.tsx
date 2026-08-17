"use client";

import { useMemo, useState } from "react";

import CategoryForm, {
  type Category,
  type CategoryFormState,
} from "@/components/categories/CategoryForm";

import CategoryList from "@/components/categories/CategoryList";
import CategoryPreview from "@/components/categories/CategoryPreview";

export type CategoryPageInitialCategory = Category;

type CategoryPageProps = {
  initialCategories: CategoryPageInitialCategory[];
};

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  image: "",
};

export default function CategoryPage({
  initialCategories,
}: CategoryPageProps) {
  const [categories, setCategories] = useState<Category[]>(
    initialCategories
  );

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] =
    useState<CategoryFormState>(emptyForm);

  const [previewImage, setPreviewImage] =
    useState("");

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query) ||
        category.description
          .toLowerCase()
          .includes(query)
      );
    });
  }, [categories, search]);

  const handleSuccess = (
    category: Category,
    mode: "create" | "update"
  ) => {
    if (mode === "create") {
      setCategories((current) => [
        category,
        ...current,
      ]);
    } else {
      setCategories((current) =>
        current.map((item) =>
          item._id === category._id
            ? category
            : item
        )
      );
    }

    setEditingCategory(null);
    setForm(emptyForm);
    setPreviewImage("");
    setError("");
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);

    setForm({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
    });

    setPreviewImage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setPreviewImage("");
    setError("");
  };

  const handleDelete = async (
    category: Category
  ) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category._id);
      setError("");

      const response = await fetch(
        `/api/categories/${category._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to delete category"
        );
      }

      setCategories((current) =>
        current.filter(
          (item) => item._id !== category._id
        )
      );

      if (
        editingCategory?._id === category._id
      ) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error(
        "Delete category error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete category"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl sm:h-56 sm:w-56" />

        <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/10 blur-3xl sm:h-44 sm:w-44" />

        <div className="relative z-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100 sm:text-xs">
            Pharmacy Management
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Medicine Categories
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-6 text-emerald-50 sm:text-sm lg:text-base">
            Create and manage the categories used to
            organize medicines throughout the pharmacy.
          </p>
        </div>
      </section>

      {/* =====================================================
          GLOBAL CATEGORY SEARCH — TOP
      ====================================================== */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Category Search
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Find a category
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Search by category name, slug or description.
            </p>
          </div>

          <div className="relative w-full lg:max-w-xl">
            <SearchSmallIcon />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search antibiotics, painkillers, supplements..."
              autoComplete="off"
              className="
                h-11
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                pl-10
                pr-4
                text-xs
                text-slate-800
                outline-none
                transition-all
                duration-200
                placeholder:text-slate-400
                hover:border-slate-300
                focus:border-emerald-500
                focus:bg-white
                focus:ring-4
                focus:ring-emerald-500/10
                sm:h-12
                sm:text-sm
              "
            />
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setError("")}
            className="w-fit rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================
          FORM + PREVIEW
      ====================================================== */}
      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <CategoryForm
          editingCategory={editingCategory}
          form={form}
          setForm={setForm}
          onPreviewImageChange={setPreviewImage}
          onSuccess={handleSuccess}
          onCancelEdit={handleCancelEdit}
        />

        <div className="xl:sticky xl:top-[104px]">
          <CategoryPreview
            name={form.name}
            description={form.description}
            image={form.image}
            previewImage={previewImage}
            isActive={true}
            isEditing={Boolean(editingCategory)}
          />
        </div>
      </div>

      {/* =====================================================
          ALL CATEGORIES
      ====================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Categories
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              All Categories
            </h2>
          </div>

          <p className="text-xs text-slate-400">
            {filteredCategories.length}{" "}
            {filteredCategories.length === 1
              ? "category"
              : "categories"}
          </p>
        </div>

        <CategoryList
          categories={filteredCategories}
          loading={false}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {deletingId && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
            Removing category...
          </div>
        )}
      </section>
    </div>
  );
}

function SearchSmallIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M16 16L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}