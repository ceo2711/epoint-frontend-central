export type { Merchant } from "@/types/api";

export type MerchantFormData = {
  code: string;
  name: string;
  description: string;
};

export const EMPTY_MERCHANT_FORM: MerchantFormData = {
  code: "",
  name: "",
  description: "",
};
