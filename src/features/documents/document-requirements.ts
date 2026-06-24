import { translateStatus, type Locale } from "@/i18n";
import type { DocumentBrief } from "@/types/api";

export type DocumentTypeValue =
  | "SSN_CARD"
  | "DRIVERS_LICENSE_FRONT"
  | "DRIVERS_LICENSE_BACK"
  | "UTILITY_BILL"
  | "BANK_STATEMENT"
  | "PASSPORT"
  | "GREEN_CARD"
  | "WORK_PERMIT";

export interface DocumentSlotDef {
  type: DocumentTypeValue;
}

export interface DocumentGroupDef {
  id: string;
  titleKey: string;
  slots: DocumentSlotDef[];
}

export interface DocumentSectionDef {
  id: string;
  titleKey: string;
  descriptionKey: string;
  primary: DocumentGroupDef;
  alternatives?: DocumentGroupDef[];
}

export const DOCUMENT_SECTIONS: DocumentSectionDef[] = [
  {
    id: "ssn",
    titleKey: "portalDocs.sections.ssn.title",
    descriptionKey: "portalDocs.sections.ssn.description",
    primary: {
      id: "ssn",
      titleKey: "portalDocs.sections.ssn.title",
      slots: [{ type: "SSN_CARD" }],
    },
  },
  {
    id: "identity",
    titleKey: "portalDocs.sections.identity.title",
    descriptionKey: "portalDocs.sections.identity.description",
    primary: {
      id: "drivers_license",
      titleKey: "portalDocs.sections.identity.license",
      slots: [{ type: "DRIVERS_LICENSE_FRONT" }, { type: "DRIVERS_LICENSE_BACK" }],
    },
    alternatives: [
      { id: "passport", titleKey: "documentTypes.PASSPORT", slots: [{ type: "PASSPORT" }] },
      { id: "green_card", titleKey: "documentTypes.GREEN_CARD", slots: [{ type: "GREEN_CARD" }] },
      { id: "work_permit", titleKey: "documentTypes.WORK_PERMIT", slots: [{ type: "WORK_PERMIT" }] },
    ],
  },
  {
    id: "address",
    titleKey: "portalDocs.sections.address.title",
    descriptionKey: "portalDocs.sections.address.description",
    primary: {
      id: "utility_bill",
      titleKey: "documentTypes.UTILITY_BILL",
      slots: [{ type: "UTILITY_BILL" }],
    },
    alternatives: [
      { id: "bank_statement", titleKey: "documentTypes.BANK_STATEMENT", slots: [{ type: "BANK_STATEMENT" }] },
    ],
  },
];

export function collectAllUploadTypes(): DocumentTypeValue[] {
  const types = new Set<DocumentTypeValue>();
  for (const section of DOCUMENT_SECTIONS) {
    for (const slot of section.primary.slots) types.add(slot.type);
    for (const alt of section.alternatives ?? []) {
      for (const slot of alt.slots) types.add(slot.type);
    }
  }
  return [...types];
}

export function getSectionGroups(section: DocumentSectionDef): DocumentGroupDef[] {
  return [section.primary, ...(section.alternatives ?? [])];
}

export function inferActiveGroupId(
  section: DocumentSectionDef,
  documents: DocumentBrief[] | undefined,
): string {
  const uploaded = new Set((documents ?? []).map((d) => d.type));
  const groups = getSectionGroups(section);
  const withUploads = groups.filter((group) =>
    group.slots.some((slot) => uploaded.has(slot.type)),
  );

  if (withUploads.length === 1) return withUploads[0].id;
  if (withUploads.length > 1) {
    const complete = withUploads.find((group) =>
      group.slots.every((slot) => uploaded.has(slot.type)),
    );
    if (complete) return complete.id;
    return withUploads[0].id;
  }
  return section.primary.id;
}

export function groupLabel(
  group: DocumentGroupDef,
  locale: Locale,
  t: (key: string) => string,
): string {
  if (group.titleKey.startsWith("documentTypes.")) {
    return translateStatus(locale, "documentTypes", group.titleKey.replace("documentTypes.", ""));
  }
  return t(group.titleKey);
}
