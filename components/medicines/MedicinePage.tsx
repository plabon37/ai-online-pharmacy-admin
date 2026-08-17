"use client";

import { useMemo, useState } from "react";

import MedicineForm, {
  type Medicine,
  type MedicineCategory,
  type MedicineFormState,
} from "@/components/medicines/MedicineForm";

import MedicinePreview from "@/components/medicines/MedicinePreview";
import MedicineList from "@/components/medicines/MedicineList";
import MedicineStockSummary from "@/components/medicines/MedicineStockSummary";

const emptyForm: MedicineFormState = {
  name: "",
  genericName: "",
  category: "",
  description: "",
  price: "",
  stock: "",
  image: "",
};

type MedicinePageProps = {
  initialCategories: MedicineCategory[];
  initialMedicines: Medicine[];
};

export default function MedicinePage({
  initialCategories,
  initialMedicines,
}: MedicinePageProps) {
  const [medicines, setMedicines] =
    useState<Medicine[]>(initialMedicines);

  const [editingMedicine, setEditingMedicine] =
    useState<Medicine | null>(null);

  const [form, setForm] =
    useState<MedicineFormState>(emptyForm);

  const [previewImage, setPreviewImage] =
    useState("");

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  /* ==========================================================
     FILTER MEDICINES
  ========================================================== */

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return medicines;
    }

    return medicines.filter((medicine) => {
      const medicineName =
        medicine.name?.toLowerCase() || "";

      const genericName =
        medicine.genericName?.toLowerCase() || "";

      const categoryName =
        typeof medicine.category === "string"
          ? ""
          : medicine.category?.name?.toLowerCase() ||
            "";

      const categorySlug =
        typeof medicine.category === "string"
          ? ""
          : medicine.category?.slug?.toLowerCase() ||
            "";

      const description =
        medicine.description?.toLowerCase() || "";

      return (
        medicineName.includes(query) ||
        genericName.includes(query) ||
        categoryName.includes(query) ||
        categorySlug.includes(query) ||
        description.includes(query)
      );
    });
  }, [medicines, search]);

  /* ==========================================================
     CREATE / UPDATE SUCCESS
  ========================================================== */

  const handleSuccess = (
    medicine: Medicine,
    mode: "create" | "update"
  ) => {
    if (mode === "create") {
      setMedicines((current) => [
        medicine,
        ...current,
      ]);
    } else {
      setMedicines((current) =>
        current.map((item) =>
          item._id === medicine._id
            ? medicine
            : item
        )
      );
    }

    setEditingMedicine(null);
    setForm(emptyForm);
    setPreviewImage("");
    setError("");
  };

  /* ==========================================================
     EDIT MEDICINE
  ========================================================== */

  const handleEdit = (medicine: Medicine) => {
    const categoryId =
      typeof medicine.category === "string"
        ? medicine.category
        : medicine.category?._id || "";

    setEditingMedicine(medicine);

    setForm({
      name: medicine.name || "",
      genericName: medicine.genericName || "",
      category: categoryId,
      description: medicine.description || "",
      price: String(medicine.price ?? ""),
      stock: String(medicine.stock ?? ""),
      image: medicine.image || "",
    });

    setPreviewImage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ==========================================================
     CANCEL EDIT
  ========================================================== */

  const handleCancelEdit = () => {
    setEditingMedicine(null);
    setForm(emptyForm);
    setPreviewImage("");
    setError("");
  };

  /* ==========================================================
     DELETE MEDICINE
  ========================================================== */

  const handleDelete = async (
    medicine: Medicine
  ) => {
    const confirmed = window.confirm(
      `Delete "${medicine.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(medicine._id);
      setError("");

      const response = await fetch(
        `/api/medicines/${medicine._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to delete medicine"
        );
      }

      setMedicines((current) =>
        current.filter(
          (item) => item._id !== medicine._id
        )
      );

      if (
        editingMedicine?._id === medicine._id
      ) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error(
        "Delete medicine error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete medicine"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-100/60 sm:rounded-3xl sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl sm:h-56 sm:w-56" />

        <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-white/10 blur-3xl sm:h-44 sm:w-44" />

        <div className="pointer-events-none absolute right-1/4 top-1/2 h-24 w-24 rounded-full border border-white/10 sm:h-32 sm:w-32" />

        <div className="relative z-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100 sm:text-xs">
            Pharmacy Management
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Medicines
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-6 text-emerald-50 sm:text-sm lg:text-base">
            Create, update and manage all medicines in
            the pharmacy inventory.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
              {medicines.length}{" "}
              {medicines.length === 1
                ? "medicine"
                : "medicines"}
            </span>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:text-xs">
              {initialCategories.length}{" "}
              {initialCategories.length === 1
                ? "category"
                : "categories"}
            </span>
          </div>
        </div>
      </section>

      {/* ======================================================
          SEARCH
      ======================================================= */}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Medicine Search
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              Find a medicine
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Search by medicine name, generic name,
              category or description.
            </p>
          </div>

          <div className="relative w-full lg:max-w-xl">
            <SearchIcon />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search Napa, Paracetamol, Pain Relief..."
              autoComplete="off"
              spellCheck={false}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-xs text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 sm:h-12 sm:text-sm"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear medicine search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 active:scale-95"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>

        {search.trim() && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredMedicines.length}
              </span>{" "}
              result
              {filteredMedicines.length === 1
                ? ""
                : "s"}{" "}
              for{" "}
              <span className="font-semibold text-emerald-600">
                &quot;{search.trim()}&quot;
              </span>
            </p>
          </div>
        )}
      </section>

      {/* ======================================================
          STOCK SUMMARY
      ======================================================= */}

      <MedicineStockSummary
        medicines={medicines}
      />

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 shrink-0 font-bold text-red-500">
              !
            </span>

            <p className="break-words text-sm leading-5 text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="w-fit shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================
          FORM + LIVE PREVIEW
      ======================================================= */}

      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        <MedicineForm
          editingMedicine={editingMedicine}
          categories={initialCategories}
          form={form}
          setForm={setForm}
          onPreviewImageChange={setPreviewImage}
          onSuccess={handleSuccess}
          onCancelEdit={handleCancelEdit}
        />

        <div className="xl:sticky xl:top-[104px]">
          <MedicinePreview
            name={form.name}
            genericName={form.genericName}
            category={form.category}
            categories={initialCategories}
            description={form.description}
            price={form.price}
            stock={form.stock}
            image={form.image}
            previewImage={previewImage}
            isEditing={Boolean(editingMedicine)}
          />
        </div>
      </div>

      {/* ======================================================
          ALL MEDICINES
      ======================================================= */}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:text-xs">
              Inventory
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              All Medicines
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Manage your pharmacy medicine inventory.
            </p>
          </div>

          <div className="flex w-fit shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-semibold text-slate-600">
              {filteredMedicines.length}{" "}
              {filteredMedicines.length === 1
                ? "medicine"
                : "medicines"}
            </span>
          </div>
        </div>

        <MedicineList
          medicines={filteredMedicines}
          loading={false}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {deletingId && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-400">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />
            Removing medicine...
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   SEARCH ICON
============================================================ */

function SearchIcon() {
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

/* ============================================================
   CLOSE ICON
============================================================ */

function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}