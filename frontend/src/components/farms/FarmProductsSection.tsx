import { ProductCard } from "@/components/ProductCard";
import { PaginationControls } from "@/components/PaginationControls";
import {
  PRODUCT_CATEGORIES,
  getCategoryLabel,
} from "@/lib/productCategories";
import type { FarmProduct } from "@/types/farm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

type FarmProductsSectionProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  category?: string;
  onCategoryChange: (value?: string) => void;
  paginatedProducts: FarmProduct[];
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  activeCategoryLabel: string;
  farmName: string;
};

export function FarmProductsSection({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  paginatedProducts,
  filteredCount,
  currentPage,
  totalPages,
  onPageChange,
  activeCategoryLabel,
  farmName,
}: FarmProductsSectionProps) {
  const { t } = useTranslation();

  const hasProducts = filteredCount > 0;

  return (
    <Card className="space-y-5 border-primary/15 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">{t("farmsPage.products")}</h3>
          <p className="text-sm text-gray-500">
            {t("farmsPage.activeCategory", { category: activeCategoryLabel })}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("productsPage.searchPlaceholder")}
              className="pl-10"
            />
          </div>

          <Select
            value={category ?? "all"}
            onValueChange={(value) =>
              onCategoryChange(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder={t("farmsPage.filterByCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("farmsPage.allCategories")}</SelectItem>
              {PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {getCategoryLabel(cat, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasProducts ? (
        <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-6 text-center text-gray-500">
          {t("farmsPage.noProducts")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {paginatedProducts.map((fp) => (
              <ProductCard
                key={fp.id}
                product={fp}
                sellerNameOverride={farmName}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              prevLabel={t("pagination.previous")}
              nextLabel={t("pagination.next")}
              className="pt-2"
            />
          ) : null}
        </>
      )}
    </Card>
  );
}
