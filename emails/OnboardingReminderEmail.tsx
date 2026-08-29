import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/EmailLayout";
import { emailTheme as t } from "./theme";

export interface OnboardingReminderEmailProps {
  firstName: string;
  pendingItemsHtml: string;
  portalLoginUrl: string;
  logoUrl: string;
}

export function OnboardingReminderEmail({
  firstName,
  pendingItemsHtml,
  portalLoginUrl,
  logoUrl,
}: OnboardingReminderEmailProps) {
  return (
    <EmailLayout
      preview={`${firstName}, tienes pendientes en tu onboarding de Epoint`}
      logoUrl={logoUrl}
    >
      <Heading style={headingStyle}>Completa tu onboarding</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Text style={paragraphStyle}>
        Te recordamos amablemente que aún tienes pendiente completar tu onboarding en la plataforma.
        Ingresa al portal y completa lo siguiente:
      </Text>

      <Section style={listBoxStyle}>
        <div dangerouslySetInnerHTML={{ __html: pendingItemsHtml }} />
      </Section>

      <Section style={ctaSectionStyle}>
        <Button href={portalLoginUrl} style={buttonStyle}>
          Ir al portal del cliente
        </Button>
      </Section>

      <Text style={noteStyle}>
        Si ya subiste algún documento, puede estar en revisión. Si fue rechazado, vuelve a subirlo
        desde la sección de documentos.
      </Text>
    </EmailLayout>
  );
}

const headingStyle: React.CSSProperties = {
  color: t.textPrimary,
  fontSize: "22px",
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

const listBoxStyle: React.CSSProperties = {
  backgroundColor: t.cream400,
  border: `1px solid ${t.cream600}`,
  borderLeft: `4px solid ${t.brand}`,
  borderRadius: "12px",
  margin: "20px 0",
  padding: "16px 20px",
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
  margin: 0,
};

export default OnboardingReminderEmail;
