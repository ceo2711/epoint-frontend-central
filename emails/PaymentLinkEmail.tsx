import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout, defaultEmailSupportFooter } from "./components/EmailLayout";
import { emailTheme as t } from "./theme";

export interface PaymentLinkEmailProps {
  firstName: string;
  amountFormatted: string;
  paymentUrl: string;
  providerLabel: string;
  logoUrl: string;
}

export function PaymentLinkEmail({
  firstName,
  amountFormatted,
  paymentUrl,
  providerLabel,
  logoUrl,
}: PaymentLinkEmailProps) {
  return (
    <EmailLayout
      preview={`Completa tu pago de ${amountFormatted} en Epoint, ${firstName}`}
      logoUrl={logoUrl}
      footerNote={defaultEmailSupportFooter("{{SUPPORT_URL}}")}
    >
      <Heading style={headingStyle}>Tu link de pago</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Text style={paragraphStyle}>{"{{MERCHANT_LINE}}"}</Text>
      <Text style={paragraphStyle}>
        Te compartimos el link para completar tu pago de forma segura a través de {providerLabel}.
      </Text>

      <Section style={amountBoxStyle}>
        <Text style={amountLabelStyle}>Monto a pagar</Text>
        <Text style={amountValueStyle}>{amountFormatted}</Text>
        {"{{DESCRIPTION_BLOCK}}"}
      </Section>

      <Section style={ctaSectionStyle}>
        <Button href={paymentUrl} style={buttonStyle}>
          Completar pago
        </Button>
      </Section>

      <Text style={noteStyle}>
        El link es personalizado para vos. Si el botón no funciona, copiá y pegá esta dirección en tu
        navegador:
      </Text>
      <Text style={linkFallbackStyle}>
        <a href={paymentUrl} style={linkStyle}>
          {paymentUrl}
        </a>
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  color: t.textPrimary,
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: "1.3",
  margin: "0 0 16px",
};

const paragraphStyle: React.CSSProperties = {
  color: t.textSecondary,
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const amountBoxStyle: React.CSSProperties = {
  backgroundColor: t.cream400,
  border: `1px solid ${t.cream600}`,
  borderRadius: "12px",
  margin: "24px 0",
  padding: "20px 24px",
  textAlign: "center" as const,
};

const amountLabelStyle: React.CSSProperties = {
  color: t.brandDark,
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const amountValueStyle: React.CSSProperties = {
  color: t.textPrimary,
  fontSize: "28px",
  fontWeight: 700,
  lineHeight: "1.2",
  margin: 0,
};

const ctaSectionStyle: React.CSSProperties = {
  margin: "28px 0 16px",
  textAlign: "center" as const,
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: t.brand,
  borderRadius: "10px",
  color: t.white,
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "14px 28px",
  textDecoration: "none",
};

const noteStyle: React.CSSProperties = {
  color: t.textMuted,
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const linkFallbackStyle: React.CSSProperties = {
  color: t.textMuted,
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
  wordBreak: "break-all" as const,
};

const linkStyle: React.CSSProperties = {
  color: t.brand,
  textDecoration: "underline",
};

export default PaymentLinkEmail;
