import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/EmailLayout";
import { emailTheme as t } from "./theme";

export interface PasswordResetEmailProps {
  firstName: string;
  resetUrl: string;
  expireMinutes: string | number;
  logoUrl: string;
}

export function PasswordResetEmail({
  firstName,
  resetUrl,
  expireMinutes,
  logoUrl,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview={`Restablecé tu contraseña de Epoint, ${firstName}`} logoUrl={logoUrl}>
      <Heading style={headingStyle}>Restablecé tu contraseña</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Text style={paragraphStyle}>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en Epoint. Hacé clic en
        el botón para elegir una nueva contraseña.
      </Text>

      <Section style={ctaSectionStyle}>
        <Button href={resetUrl} style={buttonStyle}>
          Restablecer contraseña
        </Button>
      </Section>

      <Text style={noteStyle}>
        Este enlace es válido por {expireMinutes} minutos. Si no solicitaste este cambio, ignorá
        este correo — tu contraseña actual seguirá siendo la misma.
      </Text>

      <Text style={linkFallbackStyle}>
        Si el botón no funciona, copiá y pegá este enlace en tu navegador:
        <br />
        <a href={resetUrl} style={linkStyle}>
          {resetUrl}
        </a>
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
  margin: "0 0 16px",
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
};

export default PasswordResetEmail;
