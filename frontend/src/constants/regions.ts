export type RegionOption = { value: string; label: string };

export const REGION_OPTIONS: RegionOption[] = [
  { value: "Bratislavský kraj", label: "Bratislavský kraj" },
  { value: "Trnavský kraj", label: "Trnavský kraj" },
  { value: "Trenčiansky kraj", label: "Trenčiansky kraj" },
  { value: "Nitriansky kraj", label: "Nitriansky kraj" },
  { value: "Žilinský kraj", label: "Žilinský kraj" },
  { value: "Banskobystrický kraj", label: "Banskobystrický kraj" },
  { value: "Prešovský kraj", label: "Prešovský kraj" },
  { value: "Košický kraj", label: "Košický kraj" },
];

export const REGION_OPTIONS_WITH_ALL: RegionOption[] = [
  { value: "all", label: "All regions" },
  ...REGION_OPTIONS,
];

export const normalizeRegion = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*kraj$/, "")
    .trim();
