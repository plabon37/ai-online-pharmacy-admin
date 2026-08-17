import { connectToDB } from "@/lib/connectToDB";
import Category from "@/lib/models/Category";

import CategoryPage, {
  type CategoryPageInitialCategory,
} from "@/components/categories/CategoryPage";

export default async function CategoryPageLoader() {
  await connectToDB();

  const categories = await Category.find({
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  const serializedCategories: CategoryPageInitialCategory[] =
    categories.map((category) => ({
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      image: category.image ?? "",
      isActive: Boolean(category.isActive),
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    }));

  return (
    <CategoryPage
      initialCategories={serializedCategories}
    />
  );
}