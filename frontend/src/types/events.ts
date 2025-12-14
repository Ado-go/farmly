export type EventProduct = {
  id: number;
  price: number;
  stock: number;
  stallName?: string | null;
  product: {
    id: number;
    name: string;
    category: string;
    description: string;
    basePrice?: number | null;
    images?: { url: string }[];
  };
  user: { id: number; name: string };
};

export type EventAttendee = {
  id: number;
  name: string;
  profileImageUrl?: string | null;
  stallName?: string | null;
};

export type Event = {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  city: string;
  street?: string;
  region: string;
  organizer: { id: number; name: string };
  participants?: EventAttendee[];
  eventProducts?: EventProduct[];
  images?: { url: string; optimizedUrl?: string }[];
};

export type EventDetail = Event & {
  street: string;
  eventProducts?: EventProduct[];
};
