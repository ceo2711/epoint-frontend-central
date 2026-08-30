import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout, defaultEmailSupportFooter } from "./components/EmailLayout";
import { emailTheme as t } from "./theme";

export interface BoardReminderEmailProps {
  firstName: string;
  pendingItemsHtml: string;
  boardUrl: string;
  logoUrl: string;
}

export function BoardReminderEmail({
  firstName,
  pendingItemsHtml,
  boardUrl,
  logoUrl,
}: BoardReminderEmailProps) {
  return (
    <EmailLayout
      preview={`${firstName}, tenés tareas pendientes en tu tablero de Epoint`}
      logoUrl={logoUrl}
      footerNote={defaultEmailSupportFooter("{{SUPPORT_URL}}")}
    >
      <Heading style={headingStyle}>Tareas pendientes en tu tablero</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Text style={paragraphStyle}>
        Tu tablero en Epoint tiene tareas por completar: reportes, credenciales u otras cards
        abiertas. Entrá y avanzá para no frenar tu proceso.
      </Text>

      <Section style={listBoxStyle}>
        <div dangerouslySetInnerHTML={{ __html: pendingItemsHtml }} />
      </Section>

      <Section style={ctaSectionStyle}>
        <Button href={boardUrl} style={buttonStyle}>
          Ir a mi tablero
        </Button>
      </Section>

      <Text style={noteStyle}>
        Si alguna card está en revisión, el equipo de Epoint la está mirando. Completá las que
        todavía estén pendientes de tu lado.
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

export default BoardReminderEmail;
