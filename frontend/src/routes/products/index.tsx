import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});

type FarmProduct = {
  id: number;
  price: number;
  stock: number;
  farm?: { id: number; name: string };
  product: {
    id: number;
    name: string;
    category: string;
    description?: string;
    rating?: number;
    images?: { url: string }[];
    reviews?: { rating: number }[];
  };
};

function ProductsPage() {
  const { t } = useTranslation();
  const { addToCart } = useCart();

  const {
    data: farmProducts = [],
    isLoading,
    isError,
  } = useQuery<FarmProduct[]>({
    queryKey: ["farmProducts"],
    queryFn: async () => apiFetch("/public-farm-products"),
  });

  const handleAddToCart = (fp: FarmProduct) => {
    addToCart({
      productId: fp.product.id,
      productName: fp.product.name,
      sellerName: fp.farm?.name || "unknown",
      unitPrice: fp.price,
      quantity: 1,
    });

    toast.success(t("productsPage.addedToCart", { name: fp.product.name }));
  };

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
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t("productsPage.title")}</h2>

      {farmProducts.length === 0 ? (
        <p className="text-gray-500">{t("productsPage.noProducts")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {farmProducts.map((fp) => (
            <ProductCard
              key={fp.id}
              product={fp}
              onAddToCart={() => handleAddToCart(fp)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
