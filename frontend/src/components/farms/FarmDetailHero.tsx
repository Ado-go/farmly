import { Card } from "@/components/ui/card";
import { Leaf, MapPin, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";

type FarmLocation = { primary: string; secondary?: string };

type FarmDetailHeroProps = {
  name: string;
  location: FarmLocation;
  productCount: number;
  farmerName?: string | null;
};

export function FarmDetailHero({
  name,
  location,
  productCount,
  farmerName,
}: FarmDetailHeroProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
            <Sprout className="h-4 w-4" />
            {t("farmsPage.title")}
          </div>
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            <h2 className="text-3xl font-bold">{name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-semibold text-gray-800">{location.primary}</span>
            {location.secondary ? (
              <span className="text-gray-500">• {location.secondary}</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-700">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            {t("farmsPage.products")}: {productCount}
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            {t("farmsPage.farmer")}: {farmerName || t("farmsPage.unknownFarmer")}
          </div>
        </div>
      </div>
    </Card>
  );
}
