"use client";

import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
} from "react";

import ImageUploader from "@/components/shared/ImageUploader";

export type MedicineCategory = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  isActive: boolean;
};

export type Medicine = {
  _id: string;
  name: string;
  genericName: string;
  category: MedicineCategory | string;
  description: string;
  price: number;
  stock: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MedicineFormState = {
  name: string;
  genericName: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  image: string;
};

type MedicineFormProps = {
  editingMedicine: Medicine | null;
  categories: MedicineCategory[];
  form: MedicineFormState;
  setForm: Dispatch<SetStateAction<MedicineFormState>>;
  onPreviewImageChange: (preview: string) => void;
  onSuccess: (
    medicine: Medicine,
    mode: "create" | "update"
  ) => void;
  onCancelEdit: () => void;
};

export default function MedicineForm({
  editingMedicine,
  categories,
  form,
  setForm,
  onPreviewImageChange,
  onSuccess,
  onCancelEdit,
}: MedicineFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const trimmedName = form.name.trim();
  const trimmedGenericName = form.genericName.trim();

  const price = Number(form.price);
  const stock = Number(form.stock);

  const nameError =
    trimmedName.length > 0 &&
    trimmedName.length < 2;

  const priceError =
    form.price !== "" &&
    (!Number.isFinite(price) || price < 0);

  const stockError =
    form.stock !== "" &&
    (!Number.isFinite(stock) ||
      stock < 0 ||
      !Number.isInteger(stock));

  const descriptionError =
    form.description.length > 1000;

  const canSubmit =
    trimmedName.length >= 2 &&
    trimmedName.length <= 150 &&
    Boolean(form.category) &&
    form.price !== "" &&
    Number.isFinite(price) &&
    price >= 0 &&
    form.stock !== "" &&
    Number.isFinite(stock) &&
    stock >= 0 &&
    Number.isInteger(stock) &&
    !descriptionError &&
    !loading;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (trimmedName.length < 2) {
      setError(
        "Medicine name must be at least 2 characters long."
      );
      return;
    }

    if (trimmedName.length > 150) {
      setError(
        "Medicine name cannot exceed 150 characters."
      );
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError("Please enter a valid medicine price.");
      return;
    }

    if (
      form.stock === "" ||
      !Number.isFinite(stock) ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      setError(
        "Stock must be a valid whole number."
      );
      return;
    }

    if (descriptionError) {
      setError(
        "Description cannot exceed 1000 characters."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const isEditing = Boolean(editingMedicine);

      const url = isEditing
        ? `/api/medicines/${editingMedicine?._id}`
        : "/api/medicines";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          genericName: trimmedGenericName,
          category: form.category,
          description: form.description.trim(),
          price,
          stock,
          image: form.image.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Unable to save medicine."
        );
        return;
      }

      onSuccess(
        result.data as Medicine,
        isEditing ? "update" : "create"
      );

      setError("");
    } catch (error) {
      console.error(
        "Medicine form error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (
    field: keyof MedicineFormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
            {editingMedicine
              ? "Edit Medicine"
              : "New Medicine"}
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {editingMedicine
              ? "Update medicine"
              : "Create medicine"}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
            Complete the medicine information and preview
            it before saving.
          </p>
        </div>

        {editingMedicine && (
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

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm leading-5 text-red-600">
            {error}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Medicine Name */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="medicine-name"
              className="text-sm font-semibold text-slate-700"
            >
              Medicine Name
            </label>

            <span className="text-[10px] text-slate-400 sm:text-xs">
              {form.name.length}/150
            </span>
          </div>

          <input
            id="medicine-name"
            type="text"
            value={form.name}
            onChange={(event) =>
              handleFieldChange(
                "name",
                event.target.value
              )
            }
            placeholder="e.g. Napa"
            maxLength={150}
            autoComplete="off"
            disabled={loading}
            className={`
              h-11
              w-full
              rounded-xl
              border
              bg-slate-50
              px-4
              text-sm
              text-slate-800
              outline-none
              transition-all
              focus:bg-white
              focus:ring-4
              disabled:opacity-60
              ${
                nameError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10"
              }
            `}
          />

          {nameError && (
            <p className="mt-1.5 text-xs font-medium text-red-500">
              Medicine name must be at least 2 characters.
            </p>
          )}
        </div>

        {/* Generic Name */}
        <div>
          <label
            htmlFor="medicine-generic-name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Generic Name
          </label>

          <input
            id="medicine-generic-name"
            type="text"
            value={form.genericName}
            onChange={(event) =>
              handleFieldChange(
                "genericName",
                event.target.value
              )
            }
            placeholder="e.g. Paracetamol"
            maxLength={150}
            autoComplete="off"
            disabled={loading}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
          />
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="medicine-category"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Category
          </label>

          <select
            id="medicine-category"
            value={form.category}
            onChange={(event) =>
              handleFieldChange(
                "category",
                event.target.value
              )
            }
            disabled={loading}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
          >
            <option value="">
              Select medicine category
            </option>

            {categories
              .filter((category) => category.isActive)
              .map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}
          </select>

          {!categories.length && (
            <p className="mt-1.5 text-xs text-amber-600">
              Create a category before adding a medicine.
            </p>
          )}
        </div>

        {/* Price + Stock */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Price */}
          <div>
            <label
              htmlFor="medicine-price"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Price
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                ৳
              </span>

              <input
                id="medicine-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  handleFieldChange(
                    "price",
                    event.target.value
                  )
                }
                placeholder="0.00"
                disabled={loading}
                className={`
                  h-11
                  w-full
                  rounded-xl
                  border
                  bg-slate-50
                  pl-9
                  pr-4
                  text-sm
                  text-slate-800
                  outline-none
                  transition-all
                  focus:bg-white
                  focus:ring-4
                  disabled:opacity-60
                  ${
                    priceError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10"
                  }
                `}
              />
            </div>

            {priceError && (
              <p className="mt-1.5 text-xs text-red-500">
                Enter a valid non-negative price.
              </p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label
              htmlFor="medicine-stock"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Stock
            </label>

            <input
              id="medicine-stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(event) =>
                handleFieldChange(
                  "stock",
                  event.target.value
                )
              }
              placeholder="0"
              disabled={loading}
              className={`
                h-11
                w-full
                rounded-xl
                border
                bg-slate-50
                px-4
                text-sm
                text-slate-800
                outline-none
                transition-all
                focus:bg-white
                focus:ring-4
                disabled:opacity-60
                ${
                  stockError
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                    : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/10"
                }
              `}
            />

            {stockError && (
              <p className="mt-1.5 text-xs text-red-500">
                Stock must be a non-negative whole number.
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="medicine-description"
              className="text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <span
              className={`text-[10px] sm:text-xs ${
                descriptionError
                  ? "text-red-500"
                  : "text-slate-400"
              }`}
            >
              {form.description.length}/1000
            </span>
          </div>

          <textarea
            id="medicine-description"
            value={form.description}
            onChange={(event) =>
              handleFieldChange(
                "description",
                event.target.value
              )
            }
            placeholder="Write medicine details, usage information, etc."
            maxLength={1000}
            rows={5}
            disabled={loading}
            className="min-h-[130px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60"
          />
        </div>

        {/* Image */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Medicine Image
          </label>

          <ImageUploader
            key={
              editingMedicine?._id ??
              "new-medicine"
            }
            value={form.image}
            onChange={(url) =>
              setForm((current) => ({
                ...current,
                image: url,
              }))
            }
            onPreviewChange={
              onPreviewImageChange
            }
            folderLabel="Upload Medicine Image"
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />

          <span className="relative flex items-center">
            {loading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : editingMedicine ? (
              "Update Medicine"
            ) : (
              "Create Medicine"
            )}
          </span>
        </button>
      </form>
    </div>
  );
}