import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { emailTheme as t } from "../theme";

interface EmailLayoutProps {
  preview: string;
  logoUrl: string;
  children: React.ReactNode;
  footerNote?: string;
}

export function EmailLayout({ preview, logoUrl, children, footerNote }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Img src={logoUrl} alt="Epoint" width="48" height="48" style={logoStyle} />
            <Text style={headerTitleStyle}>Epoint Central</Text>
            <Text style={headerSubtitleStyle}>Epoint Corporation</Text>
          </Section>

          <Section style={contentStyle}>{children}</Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            {footerNote ?? "Si tenés alguna consulta, respondé a este correo o contactá a tu asesor Epoint."}
          </Text>
          <Text style={footerBrandStyle}>© Epoint Corporation</Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  backgroundColor: t.cream400,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: "24px 0",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: t.white,
  border: `1px solid ${t.border}`,
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "560px",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${t.brown900} 0%, ${t.brown800} 100%)`,
  padding: "28px 32px",
  textAlign: "center" as const,
};

const logoStyle: React.CSSProperties = {
  borderRadius: "12px",
  margin: "0 auto 12px",
};

const headerTitleStyle: React.CSSProperties = {
  color: t.white,
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: "1.2",
  margin: "0 0 4px",
};

const headerSubtitleStyle: React.CSSProperties = {
  color: t.accentGold,
  fontSize: "13px",
  fontWeight: 500,
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  padding: "32px",
};

const hrStyle: React.CSSProperties = {
  borderColor: t.cream600,
  margin: "0 32px",
};

const footerStyle: React.CSSProperties = {
  color: t.textMuted,
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "20px 32px 8px",
  textAlign: "center" as const,
};

const footerBrandStyle: React.CSSProperties = {
  color: t.textMuted,
  fontSize: "12px",
  margin: "0 32px 24px",
  textAlign: "center" as const,
};
