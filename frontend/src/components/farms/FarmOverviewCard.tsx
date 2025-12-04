import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

type FarmOverviewCardProps = {
  description?: string;
  location: { primary: string; secondary?: string };
  farmer?: { name?: string | null; profileImageUrl?: string | null };
  productCount: number;
  activeCategoryLabel: string;
};

export function FarmOverviewCard({
  description,
  location,
  farmer,
  productCount,
  activeCategoryLabel,
}: FarmOverviewCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="space-y-4 border-primary/15 bg-white/90 p-5 shadow-sm">
      {description ? (
        <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
      ) : null}

      <div className="flex items-start gap-3 text-sm text-gray-700">
        <MapPin className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="font-semibold text-gray-800">{location.primary}</p>
          {location.secondary ? (
            <p className="text-gray-500">{location.secondary}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-2">
        <ProfileAvatar
          imageUrl={farmer?.profileImageUrl}
          name={farmer?.name ?? undefined}
          size={48}
        />
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {t("farmsPage.farmer")}
          </p>
          <p className="font-semibold text-emerald-700">
            {farmer?.name || t("farmsPage.unknownFarmer")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary">
        <span className="rounded-full bg-primary/10 px-3 py-1">
          {t("farmsPage.products")}: {productCount}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-gray-700 shadow-sm">
          {t("farmsPage.activeCategory", { category: activeCategoryLabel })}
        </span>
      </div>
    </Card>
  );
}
