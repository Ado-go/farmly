export const Role = {
  FARMER: "FARMER",
  CUSTOMER: "CUSTOMER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
export type User = {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: Role;
  address: string;
  postalCode: string;
  city: string;
  country: string;
} | null;
