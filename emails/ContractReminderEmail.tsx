import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout, defaultEmailSupportFooter } from "./components/EmailLayout";
import { emailTheme as t } from "./theme";

export interface ContractReminderEmailProps {
  firstName: string;
  contractSubject: string;
  logoUrl: string;
}

export function ContractReminderEmail({
  firstName,
  contractSubject,
  logoUrl,
}: ContractReminderEmailProps) {
  return (
    <EmailLayout
      preview={`${firstName}, recordá firmar tu contrato en Epoint`}
      logoUrl={logoUrl}
      footerNote={defaultEmailSupportFooter("{{SUPPORT_URL}}")}
    >
      <Heading style={headingStyle}>Recordatorio de firma</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Text style={paragraphStyle}>
        Te enviamos un contrato y todavía no lo firmaste. Para continuar con tu proceso en Epoint
        necesitamos que completes la firma.
      </Text>

      <Section style={boxStyle}>
        <Text style={labelStyle}>Contrato pendiente</Text>
        <Text style={valueStyle}>{contractSubject}</Text>
      </Section>

      <Text style={paragraphStyle}>
        Revisá tu bandeja de entrada (también spam): DocuSign te envió o reenvió un correo con el
        botón para firmar el documento.
      </Text>
      <Text style={noteStyle}>
        Si no encontrás el email de firma, respondé este correo y te lo reenviamos.
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

const boxStyle: React.CSSProperties = {
  backgroundColor: t.cream400,
  border: `1px solid ${t.cream600}`,
  borderRadius: "12px",
  margin: "24px 0",
  padding: "20px 24px",
  textAlign: "center" as const,
};

const labelStyle: React.CSSProperties = {
  color: t.brandDark,
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const valueStyle: React.CSSProperties = {
  color: t.textPrimary,
  fontSize: "18px",
  fontWeight: 700,
  lineHeight: "1.3",
  margin: 0,
};

const noteStyle: React.CSSProperties = {
  color: t.textMuted,
  fontSize: "13px",
  lineHeight: "1.5",
  margin: 0,
};

export default ContractReminderEmail;
