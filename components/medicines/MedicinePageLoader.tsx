import { connectToDB } from "@/lib/connectToDB";
import Category from "@/lib/models/Category";
import Medicine from "@/lib/models/Medicine";

import MedicinePage from "@/components/medicines/MedicinePage";
import type { MedicineCategory } from "@/components/medicines/MedicineForm";
import type { Medicine as MedicineType } from "@/components/medicines/MedicineForm";

export default async function MedicinePageLoader() {
  await connectToDB();

  const [categories, medicines] =
    await Promise.all([
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
    ]);

  const serializedCategories: MedicineCategory[] =
    categories.map((category) => ({
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      image: category.image || "",
      isActive: Boolean(category.isActive),
    }));

  const serializedMedicines: MedicineType[] =
    medicines.map((medicine) => ({
      _id: medicine._id.toString(),
      name: medicine.name,
      genericName: medicine.genericName || "",
      category:
        medicine.category &&
        typeof medicine.category ===
          "object" &&
        "_id" in medicine.category
          ? {
              _id: medicine.category._id.toString(),
              name:
                "name" in medicine.category
                  ? String(medicine.category.name)
                  : "",
              slug:
                "slug" in medicine.category
                  ? String(medicine.category.slug)
                  : "",
              image:
                "image" in medicine.category
                  ? String(
                      medicine.category.image || ""
                    )
                  : "",
              isActive:
                "isActive" in medicine.category
                  ? Boolean(
                      medicine.category.isActive
                    )
                  : true,
            }
          : String(medicine.category || ""),
      description: medicine.description || "",
      price: Number(medicine.price),
      stock: Number(medicine.stock),
      image: medicine.image || "",
      isActive: Boolean(medicine.isActive),
      createdAt:
        medicine.createdAt.toISOString(),
      updatedAt:
        medicine.updatedAt.toISOString(),
    }));

  return (
    <MedicinePage
      initialCategories={serializedCategories}
      initialMedicines={serializedMedicines}
    />
  );
}