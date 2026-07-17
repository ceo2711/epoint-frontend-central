/**
 * Genera HTML estático con placeholders {{KEY}} para el backend Python.
 * Ejecutar: npm run emails:build
 */
import { render } from "@react-email/render";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { OnboardingReminderEmail } from "../emails/OnboardingReminderEmail";
import { OnboardingReminderEmailEn } from "../emails/OnboardingReminderEmailEn";
import { PasswordResetEmail } from "../emails/PasswordResetEmail";
import { PaymentLinkEmail } from "../emails/PaymentLinkEmail";
import { ClientConversionWelcomeEmail } from "../emails/ClientConversionWelcomeEmail";
import { WelcomeEmail } from "../emails/WelcomeEmail";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../../backend/app/services/email/templates/html");

const PLACEHOLDER_LOGO = "{{LOGO_URL}}";
const SAMPLE_LIST_HTML =
  '<p style="margin:0 0 8px;font-size:14px;color:#333;line-height:1.5;">• __ITEM__</p>';

const templates: Array<{ name: string; html: string }> = [];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  templates.push({
    name: "welcome",
    html: await render(
      WelcomeEmail({
        firstName: "{{FIRST_NAME}}",
        email: "{{EMAIL}}",
        tempPassword: "{{TEMP_PASSWORD}}",
        portalLoginUrl: "{{PORTAL_LOGIN_URL}}",
        logoUrl: PLACEHOLDER_LOGO,
      }),
    ),
  });

  const reminderEs = await render(
    OnboardingReminderEmail({
      firstName: "{{FIRST_NAME}}",
      pendingItemsHtml: SAMPLE_LIST_HTML,
      portalLoginUrl: "{{PORTAL_LOGIN_URL}}",
      logoUrl: PLACEHOLDER_LOGO,
    }),
  );
  templates.push({
    name: "onboarding_reminder",
    html: reminderEs.replace(SAMPLE_LIST_HTML, "{{PENDING_ITEMS_HTML}}"),
  });

  const reminderEn = await render(
    OnboardingReminderEmailEn({
      firstName: "{{FIRST_NAME}}",
      pendingItemsHtml: SAMPLE_LIST_HTML,
      portalLoginUrl: "{{PORTAL_LOGIN_URL}}",
      logoUrl: PLACEHOLDER_LOGO,
    }),
  );
  templates.push({
    name: "onboarding_reminder_en",
    html: reminderEn.replace(SAMPLE_LIST_HTML, "{{PENDING_ITEMS_HTML}}"),
  });

  templates.push({
    name: "password_reset",
    html: await render(
      PasswordResetEmail({
        firstName: "{{FIRST_NAME}}",
        resetUrl: "{{RESET_URL}}",
        expireMinutes: "{{EXPIRE_MINUTES}}",
        logoUrl: PLACEHOLDER_LOGO,
      }),
    ),
  });

  templates.push({
    name: "payment_link",
    html: await render(
      PaymentLinkEmail({
        firstName: "{{FIRST_NAME}}",
        amountFormatted: "{{AMOUNT_FORMATTED}}",
        paymentUrl: "{{PAYMENT_URL}}",
        providerLabel: "{{PROVIDER_LABEL}}",
        logoUrl: PLACEHOLDER_LOGO,
      }),
    ),
  });

  templates.push({
    name: "client_conversion_welcome",
    html: await render(
      ClientConversionWelcomeEmail({
        firstName: "{{FIRST_NAME}}",
        amountFormatted: "{{AMOUNT_FORMATTED}}",
        logoUrl: PLACEHOLDER_LOGO,
      }),
    ),
  });

  for (const { name, html } of templates) {
    const filePath = path.join(OUT_DIR, `${name}.html`);
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`✓ ${filePath}`);
  }

  console.log(`\n${templates.length} plantillas generadas en backend.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
