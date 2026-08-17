import { connectToDB } from "@/lib/connectToDB";

import Category from "@/lib/models/Category";
import Medicine from "@/lib/models/Medicine";

import MedicinePage from "@/components/medicines/MedicinePage";

import type {
  Medicine as MedicineType,
  MedicineCategory,
} from "@/components/medicines/MedicineForm";

type MedicinePageLoaderProps = {
  selectedMedicineId?: string;
};

export default async function MedicinePageLoader({
  selectedMedicineId,
}: MedicinePageLoaderProps) {
  await connectToDB();

  const [
    categories,
    medicines,
    selectedMedicine,
  ] = await Promise.all([
    Category.find({
      isActive: true,
    })
      .select("name slug image isActive")
      .sort({ name: 1 })
      .lean(),

    Medicine.find({
      isActive: true,
    })
      .populate({
        path: "category",
        select: "name slug image isActive",
      })
      .sort({ createdAt: -1 })
      .lean(),

    selectedMedicineId
      ? Medicine.findOne({
          _id: selectedMedicineId,
          isActive: true,
        })
          .populate({
            path: "category",
            select: "name slug image isActive",
          })
          .lean()
      : null,
  ]);

  /* ==========================================================
     CATEGORIES
  ========================================================== */

  const serializedCategories: MedicineCategory[] =
    categories.map((category) => ({
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      image: category.image || "",
      isActive: Boolean(category.isActive),
    }));

  /* ==========================================================
     MEDICINES
  ========================================================== */

  const serializedMedicines: MedicineType[] =
    medicines.map((medicine) =>
      serializeMedicine(medicine)
    );

  /* ==========================================================
     SELECTED MEDICINE
  ========================================================== */

  const serializedSelectedMedicine =
    selectedMedicine
      ? serializeMedicine(selectedMedicine)
      : null;

  return (
    <MedicinePage
      initialCategories={
        serializedCategories
      }
      initialMedicines={
        serializedMedicines
      }
      initialEditingMedicine={
        serializedSelectedMedicine
      }
    />
  );
}

/* ============================================================
   SERIALIZER
============================================================ */

function serializeMedicine(
  medicine: any
): MedicineType {
  return {
    _id: medicine._id.toString(),

    name: medicine.name,

    genericName:
      medicine.genericName || "",

    category:
      medicine.category &&
      typeof medicine.category ===
        "object" &&
      "_id" in medicine.category
        ? {
            _id:
              medicine.category._id.toString(),

            name:
              "name" in medicine.category
                ? String(
                    medicine.category.name ||
                      ""
                  )
                : "",

            slug:
              "slug" in medicine.category
                ? String(
                    medicine.category.slug ||
                      ""
                  )
                : "",

            image:
              "image" in medicine.category
                ? String(
                    medicine.category.image ||
                      ""
                  )
                : "",

            isActive:
              "isActive" in medicine.category
                ? Boolean(
                    medicine.category.isActive
                  )
                : true,
          }
        : String(
            medicine.category || ""
          ),

    description:
      medicine.description || "",

    price: Number(medicine.price),

    stock: Number(medicine.stock),

    image: medicine.image || "",

    isActive: Boolean(
      medicine.isActive
    ),

    createdAt:
      medicine.createdAt.toISOString(),

    updatedAt:
      medicine.updatedAt.toISOString(),
  };
}