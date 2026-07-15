export type PaymentProvider = "stripe" | "authorize";
export type PaymentLinkStatus = "pending" | "paid" | "expired" | "cancelled";

export interface PaymentProviderStatus {
  provider: PaymentProvider;
  configured: boolean;
  label: string;
}

export interface PaymentConfig {
  payments_enabled: boolean;
  default_provider: PaymentProvider;
  stub_mode: boolean;
  providers: PaymentProviderStatus[];
}

export interface PaymentLink {
  id: number;
  public_token: string;
  created_by_user_id: number;
  client_id: number | null;
  prospect_id?: number | null;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  amount: string;
  currency: string;
  provider: PaymentProvider;
  status: PaymentLinkStatus;
  description: string | null;
  payment_url: string;
  external_checkout_url: string | null;
  paid_at: string | null;
  client_registered_at: string | null;
  created_at: string;
  created_by_name?: string | null;
}

export interface PaymentLinkCreatePayload {
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  description?: string;
  prospect_id?: number;
}

export interface PublicPaymentLink {
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  amount: string;
  currency: string;
  provider: PaymentProvider;
  status: PaymentLinkStatus;
  description: string | null;
  stub_mode: boolean;
  can_pay: boolean;
}

export interface PaymentRegisterClientPayload {
  merchant_id: number;
  source?: string;
}

export const EMPTY_PAYMENT_FORM: PaymentLinkCreatePayload = {
  customer_first_name: "",
  customer_last_name: "",
  customer_email: "",
  customer_phone: "",
  amount: 0,
  currency: "USD",
  provider: "stripe",
  description: "",
};
