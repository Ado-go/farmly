export type RegistrationRole = "CUSTOMER" | "FARMER";

export interface RegistrationFormValues {
  name: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  password: string;
  role: RegistrationRole;
}
