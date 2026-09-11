import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/EmailLayout";
import { BRAND_NAME, emailTheme as t } from "./theme";

export interface StaffWelcomeEmailProps {
  firstName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
  roleLine: string;
  logoUrl: string;
}

export function StaffWelcomeEmail({
  firstName,
  email,
  tempPassword,
  loginUrl,
  roleLine,
  logoUrl,
}: StaffWelcomeEmailProps) {
  return (
    <EmailLayout
      preview={`Tu cuenta de empleado en Epoint está lista, ${firstName}`}
      logoUrl={logoUrl}
    >
      <Heading style={headingStyle}>Tu cuenta de Epoint está lista</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Text style={paragraphStyle}>
        Creamos tu usuario de empleado. Ya puedes ingresar a la plataforma con las credenciales de
        abajo.
      </Text>
      <Text style={paragraphStyle}>{roleLine}</Text>

      <Section style={unifiedBoxStyle}>
        <Text style={credentialsTitleStyle}>Credenciales de acceso</Text>
        <Text style={credentialRowStyle}>
          <strong>Plataforma:</strong>{" "}
          <a href={loginUrl} style={linkStyle}>
            {loginUrl}
          </a>
        </Text>
        <Text style={credentialRowStyle}>
          <strong>Usuario (email):</strong> {email}
        </Text>
        <Text style={credentialRowLastStyle}>
          <strong>Contraseña temporal:</strong>{" "}
          <span style={passwordStyle}>{tempPassword}</span>
        </Text>

        <Section style={ctaSectionStyle}>
          <Button href={loginUrl} style={buttonStyle}>
            Ingresar
          </Button>
        </Section>

        <Text style={noteStyle}>En tu primer ingreso debes cambiar la contraseña temporal.</Text>
      </Section>

      <Text style={closingStyle}>
        Saludos,
        <br />
        Equipo <span translate="no">{BRAND_NAME}</span>
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

const unifiedBoxStyle: React.CSSProperties = {
  backgroundColor: t.cream400,
  border: `1px solid ${t.cream600}`,
  borderRadius: "12px",
  margin: "8px 0 24px",
  padding: "24px 20px",
  textAlign: "center" as const,
};

const credentialsTitleStyle: React.CSSProperties = {
  color: t.brandDark,
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  margin: "0 0 12px",
  textAlign: "left" as const,
  textTransform: "uppercase" as const,
};

const credentialRowStyle: React.CSSProperties = {
  color: t.textSecondary,
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
  textAlign: "left" as const,
};

const credentialRowLastStyle: React.CSSProperties = {
  ...credentialRowStyle,
  margin: "0 0 20px",
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
  margin: "0 0 12px",
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
  margin: "0 0 4px",
  textAlign: "center" as const,
};

const closingStyle: React.CSSProperties = {
  color: t.textSecondary,
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "8px 0 0",
};

export default StaffWelcomeEmail;
