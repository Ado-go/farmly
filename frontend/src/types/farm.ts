import type { ProductCategory } from "@/lib/productCategories";

export type MediaImage = {
  url: string;
  publicId?: string;
  optimizedUrl?: string;
};

export type Farmer = {
  id: number;
  name: string;
  profileImageUrl?: string | null;
};

export type ProductReview = {
  id?: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: { id?: number; name?: string | null };
};

export type Product = {
  id: number;
  name: string;
  category?: ProductCategory | string;
  description?: string;
  rating?: number;
  basePrice?: number;
  images?: MediaImage[];
  reviews?: ProductReview[];
};

export type FarmProduct = {
  id: number;
  price: number;
  stock: number;
  product: Product;
  farm?: { id: number; name: string };
  farmId?: number;
};

export type Farm = {
  id: number;
  name: string;
  description?: string;
  city: string;
  street: string;
  region: string;
  postalCode: string;
  country: string;
  images?: MediaImage[];
  farmProducts?: FarmProduct[];
  farmer?: Farmer;
};

export type EventProduct = {
  id: number;
  eventId: number;
  price: number;
  stock: number;
  product: Product;
  user?: Farmer;
};
