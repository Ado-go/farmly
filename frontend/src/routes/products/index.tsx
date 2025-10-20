import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const { t } = useTranslation();

  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => apiFetch("/products"),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-40 bg-gray-200 rounded-t-2xl" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 w-1/2 rounded" />
            </div>
          </Card>
        ))}
        <p className="col-span-full text-center text-gray-500 mt-4">
          {t("productsPage.loading")}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500 p-6">{t("productsPage.error")}</p>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">{t("productsPage.title")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products?.map((product: any) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={(id) => console.log("Add to cart:", id)}
          />
        ))}
      </div>
    </div>
  );
}
