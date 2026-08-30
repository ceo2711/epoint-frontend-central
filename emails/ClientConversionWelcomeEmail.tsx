import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout, defaultEmailSupportFooter } from "./components/EmailLayout";
import { BRAND_NAME, emailTheme as t } from "./theme";

export interface ClientConversionWelcomeEmailProps {
  firstName: string;
  amountFormatted: string;
  logoUrl: string;
}

export function ClientConversionWelcomeEmail({
  firstName,
  amountFormatted,
  logoUrl,
}: ClientConversionWelcomeEmailProps) {
  return (
    <EmailLayout
      preview={`¡Bienvenido/a a Epoint, ${firstName}! Tu perfil está en revisión`}
      logoUrl={logoUrl}
      footerNote={defaultEmailSupportFooter("{{SUPPORT_URL}}")}
    >
      <Heading style={headingStyle}>¡Bienvenido/a a Epoint!</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Text style={paragraphStyle}>{"{{MERCHANT_LINE}}"}</Text>
      <Text style={paragraphStyle}>
        Confirmamos que completaste todos los requisitos iniciales y que tu pago se procesó
        exitosamente.
      </Text>

      <Section style={amountBoxStyle}>
        <Text style={amountLabelStyle}>Pago confirmado</Text>
        <Text style={amountValueStyle}>{amountFormatted}</Text>
      </Section>

      <Section style={reviewBoxStyle}>
        <Text style={reviewTitleStyle}>Tu perfil pasa a revisión</Text>
        <Text style={reviewTextStyle}>
          Nuestro equipo de Onboarding revisará tu información. Una vez que tu perfil sea aprobado,
          nos contactaremos con vos por este mismo medio para informarte los próximos pasos.
        </Text>
      </Section>

      <Text style={closingStyle}>
        Gracias por elegirnos.
        <br />
        <span translate="no">{BRAND_NAME}</span>
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

const reviewBoxStyle: React.CSSProperties = {
  border: `1px solid ${t.cream600}`,
  borderRadius: "12px",
  margin: "24px 0",
  padding: "20px 24px",
};

const reviewTitleStyle: React.CSSProperties = {
  color: t.brandDark,
  fontSize: "16px",
  fontWeight: 700,
  margin: "0 0 8px",
};

const reviewTextStyle: React.CSSProperties = {
  color: t.textSecondary,
  fontSize: "14px",
  lineHeight: "1.6",
  margin: 0,
};

const closingStyle: React.CSSProperties = {
  color: t.textSecondary,
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "24px 0 0",
};

export default ClientConversionWelcomeEmail;
