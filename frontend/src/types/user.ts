export const Role = {
  FARMER: "FARMER",
  CUSTOMER: "CUSTOMER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
export type User = { id: number; email: string; role: Role } | null;
