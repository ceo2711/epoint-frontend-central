import type { PaymentConfig, PaymentProvider } from "@/features/payments/types";

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  authorize: "Authorize.net",
  paypal: "PayPal",
  stripe: "Stripe",
};

export function getConfiguredProviders(config: PaymentConfig | undefined): PaymentProvider[] {
  if (!config) return ["authorize", "paypal"];
  const active = config.providers
    .filter((provider) => provider.provider !== "stripe")
    .map((provider) => provider.provider);
  return active.length > 0 ? active : ["authorize", "paypal"];
}

export function getDefaultProvider(config: PaymentConfig | undefined): PaymentProvider {
  const configured = getConfiguredProviders(config);
  const preferred = config?.default_provider;
  if (preferred && preferred !== "stripe" && configured.includes(preferred)) {
    return preferred;
  }
  const ready = config?.providers.find((provider) => provider.configured && provider.provider !== "stripe");
  return ready?.provider ?? configured[0] ?? "authorize";
}

export function getProviderLabel(provider: PaymentProvider): string {
  return PAYMENT_PROVIDER_LABELS[provider] ?? provider;
}
