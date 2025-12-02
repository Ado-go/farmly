export type PickupLocation = {
  id: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

export const pickupLocations: PickupLocation[] = [
  {
    id: "banska-bystrica",
    name: "Banská Bystrica - Stará tržnica",
    street: "Horná 54",
    city: "Banská Bystrica",
    postalCode: "97401",
    country: "Slovensko",
  },
  {
    id: "bratislava",
    name: "Bratislava - Staré Mesto",
    street: "Obchodná 1",
    city: "Bratislava",
    postalCode: "81106",
    country: "Slovensko",
  },
  {
    id: "kosice",
    name: "Košice - Centrum",
    street: "Hlavná 20",
    city: "Košice",
    postalCode: "04001",
    country: "Slovensko",
  },
];
