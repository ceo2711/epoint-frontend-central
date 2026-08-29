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

import { BRAND_NAME, desertSkyGradient, emailTheme as t } from "../theme";

interface EmailLayoutProps {
  preview: string;
  logoUrl: string;
  children: React.ReactNode;
  footerNote?: string;
}

export function EmailLayout({ preview, logoUrl, children, footerNote }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head>
        <meta name="google" content="notranslate" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Img src={logoUrl} alt={BRAND_NAME} width="56" height="56" style={logoStyle} />
            <Text style={headerTitleStyle}>
              <span translate="no">{BRAND_NAME}</span>
            </Text>
          </Section>
          <Section style={duneRidgeStyle} />

          <Section style={contentStyle}>{children}</Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            {footerNote ?? "Si tienes alguna consulta, responde a este correo o contacta a tu asesor Epoint."}
          </Text>
          <Text style={footerBrandStyle}>
            © <span translate="no">{BRAND_NAME}</span>
          </Text>
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
  padding: "24px 16px",
};

const containerStyle: React.CSSProperties = {
  backgroundColor: t.white,
  border: `1px solid ${t.border}`,
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(26, 16, 8, 0.12)",
  margin: "0 auto",
  maxWidth: "100%",
  overflow: "hidden",
  width: "100%",
};

const headerStyle: React.CSSProperties = {
  background: desertSkyGradient,
  backgroundColor: t.desertDusk,
  padding: "36px 32px 28px",
  textAlign: "center" as const,
};

const logoStyle: React.CSSProperties = {
  backgroundColor: t.cream400,
  border: `2px solid ${t.sunWarm}`,
  borderRadius: "14px",
  boxShadow: "0 4px 16px rgba(26, 16, 8, 0.35)",
  margin: "0 auto 16px",
};

const headerTitleStyle: React.CSSProperties = {
  color: t.white,
  fontSize: "22px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: "1.2",
  margin: 0,
  textShadow: "0 1px 2px rgba(26, 16, 8, 0.4)",
};

const duneRidgeStyle: React.CSSProperties = {
  background: `linear-gradient(180deg, ${t.desertGlow} 0%, ${t.duneShadow} 55%, ${t.desertNight} 100%)`,
  backgroundColor: t.desertGlow,
  height: "6px",
  lineHeight: "6px",
  margin: 0,
  padding: 0,
};

const contentStyle: React.CSSProperties = {
  padding: "32px 40px",
};

const hrStyle: React.CSSProperties = {
  borderColor: t.cream600,
  margin: "0 40px",
};

const footerStyle: React.CSSProperties = {
  color: t.textMuted,
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "20px 40px 8px",
  textAlign: "center" as const,
};

const footerBrandStyle: React.CSSProperties = {
  color: t.textMuted,
  fontSize: "12px",
  margin: "0 40px 24px",
  textAlign: "center" as const,
};
