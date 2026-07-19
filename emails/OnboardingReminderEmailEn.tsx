import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/EmailLayout";
import { emailTheme as t } from "./theme";

export interface OnboardingReminderEmailEnProps {
  firstName: string;
  pendingItemsHtml: string;
  portalLoginUrl: string;
  logoUrl: string;
}

export function OnboardingReminderEmailEn({
  firstName,
  pendingItemsHtml,
  portalLoginUrl,
  logoUrl,
}: OnboardingReminderEmailEnProps) {
  return (
    <EmailLayout
      preview={`${firstName}, you have pending onboarding items at Epoint`}
      logoUrl={logoUrl}
      footerNote="If you have any questions, reply to this email or contact your Epoint advisor."
    >
      <Heading style={headingStyle}>Complete your onboarding</Heading>
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        This is a friendly reminder that you still have pending items to complete your onboarding.
        Sign in to the portal and complete the following:
      </Text>

      <Section style={listBoxStyle}>
        <div dangerouslySetInnerHTML={{ __html: pendingItemsHtml }} />
      </Section>

      <Section style={ctaSectionStyle}>
        <Button href={portalLoginUrl} style={buttonStyle}>
          Go to client portal
        </Button>
      </Section>

      <Text style={noteStyle}>
        If you already uploaded a document, it may be under review. If it was rejected, please
        upload it again from the documents section.
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

export default OnboardingReminderEmailEn;
