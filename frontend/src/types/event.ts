import type { MediaImage } from "./farm";

export type EventParticipant = {
  id: number;
  name: string;
  email?: string | null;
  profileImageUrl?: string | null;
  stallName?: string | null;
};

export type Event = {
  id: number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  city: string;
  street: string;
  region: string;
  postalCode: string;
  country: string;
  organizer: EventParticipant;
  participants: EventParticipant[];
  images?: MediaImage[];
};
