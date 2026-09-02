export type PaymentProvider = "authorize" | "paypal" | "stripe";
export type PaymentLinkStatus = "pending" | "partial" | "paid" | "expired" | "cancelled";

export const DEFAULT_PAYMENT_AMOUNT = 3000;

export interface PaymentProviderStatus {
  provider: PaymentProvider;
  configured: boolean;
  label: string;
}

export interface PaymentConfig {
  payments_enabled: boolean;
  default_provider: PaymentProvider;
  stub_mode: boolean;
  payment_test?: boolean;
  providers: PaymentProviderStatus[];
  webhook_base_url?: string | null;
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
  amount_paid?: string;
  remaining_amount?: string;
  allow_partial?: boolean;
  currency: string;
  provider: PaymentProvider;
  status: PaymentLinkStatus;
  description: string | null;
  payment_url: string;
  external_checkout_url: string | null;
  paid_at: string | null;
  remainder_due_on?: string | null;
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
  send_email?: boolean;
  allow_partial?: boolean;
  remainder_due_on?: string;
}

export interface PaymentLinkCreateResult {
  link: PaymentLink;
  message: string;
  email_sent: boolean;
}

export interface PublicPaymentLink {
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  amount: string;
  amount_paid?: string;
  remaining_amount?: string;
  allow_partial?: boolean;
  currency: string;
  provider: PaymentProvider;
  status: PaymentLinkStatus;
  description: string | null;
  stub_mode: boolean;
  payment_test?: boolean;
  can_pay: boolean;
  checkout_url?: string | null;
  /** Token Accept Hosted (Authorize): se envía por POST, no en la URL. */
  hosted_payment_token?: string | null;
  provider_label?: string | null;
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
  amount: DEFAULT_PAYMENT_AMOUNT,
  currency: "USD",
  provider: "authorize",
  description: "",
  send_email: true,
  allow_partial: false,
  remainder_due_on: undefined,
};
