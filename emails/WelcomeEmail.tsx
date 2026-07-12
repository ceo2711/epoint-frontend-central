import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/EmailLayout";
import { emailTheme as t } from "./theme";

export interface WelcomeEmailProps {
  firstName: string;
  email: string;
  tempPassword: string;
  portalLoginUrl: string;
  logoUrl: string;
}

export function WelcomeEmail({
  firstName,
  email,
  tempPassword,
  portalLoginUrl,
  logoUrl,
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview={`¡Bienvenido/a a ePoint, ${firstName}! Tu cuenta fue aprobada.`}
      logoUrl={logoUrl}
    >
      <Heading style={headingStyle}>¡Bienvenido/a a ePoint!</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Text style={paragraphStyle}>{"{{MERCHANT_LINE}}"}</Text>
      <Text style={paragraphStyle}>
        Tu solicitud fue aprobada. Ya podés ingresar al portal del cliente para completar tus datos
        personales y subir la documentación requerida.
      </Text>

      <Section style={credentialsBoxStyle}>
        <Text style={credentialsTitleStyle}>Credenciales de acceso</Text>
        <Text style={credentialRowStyle}>
          <strong>Portal:</strong>{" "}
          <a href={portalLoginUrl} style={linkStyle}>
            {portalLoginUrl}
          </a>
        </Text>
        <Text style={credentialRowStyle}>
          <strong>Usuario (email):</strong> {email}
        </Text>
        <Text style={credentialRowStyle}>
          <strong>Contraseña temporal:</strong>{" "}
          <span style={passwordStyle}>{tempPassword}</span>
        </Text>
      </Section>

      <Section style={ctaSectionStyle}>
        <Button href={portalLoginUrl} style={buttonStyle}>
          Ingresar al portal
        </Button>
      </Section>

      <Text style={noteStyle}>
        En tu primer ingreso deberás cambiar la contraseña temporal.
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

const credentialsBoxStyle: React.CSSProperties = {
  backgroundColor: t.cream400,
  border: `1px solid ${t.cream600}`,
  borderRadius: "12px",
  margin: "24px 0",
  padding: "20px 24px",
};

const credentialsTitleStyle: React.CSSProperties = {
  color: t.brandDark,
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
};

const credentialRowStyle: React.CSSProperties = {
  color: t.textSecondary,
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const passwordStyle: React.CSSProperties = {
  backgroundColor: t.brandMuted,
  borderRadius: "6px",
  color: t.brandDark,
  fontFamily: "monospace",
  fontSize: "14px",
  fontWeight: 600,
  padding: "2px 8px",
};

const linkStyle: React.CSSProperties = {
  color: t.brand,
  textDecoration: "underline",
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

export default WelcomeEmail;
