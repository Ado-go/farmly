import { useTranslation } from "react-i18next";
import { CalendarRange, Search, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RegionOption = { value: string; label: string };

type EventsHeaderProps = {
  ongoingCount: number;
  upcomingCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRegion: string;
  onRegionChange: (value: string) => void;
  regions: RegionOption[];
};

export function EventsHeader({
  ongoingCount,
  upcomingCount,
  searchTerm,
  onSearchChange,
  selectedRegion,
  onRegionChange,
  regions,
}: EventsHeaderProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
            <CalendarRange className="h-4 w-4" />
            {t("eventsPage.title")}
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold">{t("eventsPage.title")}</h1>
          </div>
          <p className="max-w-2xl text-sm text-gray-600">
            {t("eventsPage.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs font-medium text-gray-700 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>
              {t("eventsPage.ongoing")}: {ongoingCount}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <span>
            {t("eventsPage.upcoming")}: {upcomingCount}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1.5fr_1fr]">
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("eventsPage.searchPlaceholder")}
            className="w-full pr-10"
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex gap-2 sm:justify-end">
          <Select
            value={selectedRegion}
            onValueChange={(value) => onRegionChange(value)}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder={t("eventsPage.regionPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {regions.map((regionOption) => (
                <SelectItem
                  key={regionOption.value}
                  value={regionOption.value}
                >
                  {regionOption.value === "all"
                    ? t("eventsPage.regionAll")
                    : regionOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
