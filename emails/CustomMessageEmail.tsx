import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./components/EmailLayout";
import { BRAND_NAME, emailTheme as t } from "./theme";

export interface CustomMessageEmailProps {
  subject: string;
  firstName: string;
  messageHtml: string;
  senderName: string;
  logoUrl: string;
}

export function CustomMessageEmail({
  subject,
  firstName,
  messageHtml,
  senderName,
  logoUrl,
}: CustomMessageEmailProps) {
  return (
    <EmailLayout preview={subject} logoUrl={logoUrl}>
      <Heading style={headingStyle}>{subject}</Heading>
      <Text style={paragraphStyle}>Hola {firstName},</Text>
      <Section style={messageBoxStyle}>
        <div dangerouslySetInnerHTML={{ __html: messageHtml }} style={messageInnerStyle} />
      </Section>
      <Text style={signatureStyle}>
        {senderName}
        <br />
        <span style={signatureBrandStyle} translate="no">
          {BRAND_NAME}
        </span>
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

const messageBoxStyle: React.CSSProperties = {
  margin: "0 0 24px",
};

const messageInnerStyle: React.CSSProperties = {
  color: t.textSecondary,
  fontSize: "15px",
  lineHeight: "1.6",
};

const signatureStyle: React.CSSProperties = {
  borderTop: `1px solid ${t.cream600}`,
  color: "#555555",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "24px 0 0",
  paddingTop: "16px",
};

const signatureBrandStyle: React.CSSProperties = {
  color: "#8a8378",
  fontSize: "13px",
};

export default CustomMessageEmail;
