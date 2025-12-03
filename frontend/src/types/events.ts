export type EventProduct = {
  id: number;
  product: {
    id: number;
    name: string;
    category: string;
    description: string;
    basePrice: number;
    images: { url: string }[];
  };
  user: { id: number; name: string };
};

export type Event = {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  city: string;
  region: string;
  organizer: { id: number; name: string };
  eventProducts: EventProduct[];
  images?: { url: string; optimizedUrl?: string }[];
};
