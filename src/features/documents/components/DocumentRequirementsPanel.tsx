"use client";

import { useEffect, useRef, useState } from "react";

import { DocumentVerificationTooltip } from "@/features/documents/components/DocumentVerificationTooltip";
import { DocumentThumbnail } from "@/features/documents/components/DocumentThumbnail";
import {
  DOCUMENT_SECTIONS,
  getSectionGroups,
  groupLabel,
  inferActiveGroupId,
  type DocumentSectionDef,
  type DocumentSlotDef,
} from "@/features/documents/document-requirements";
import { VerificationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { translateStatus, type Locale } from "@/i18n";
import type { DocumentBrief } from "@/types/api";

interface DocumentRequirementsPanelProps {
  documents: DocumentBrief[] | undefined;
  locale: Locale;
  uploading: string | null;
  t: (key: string) => string;
  onUpload: (docType: string, file: File) => void;
  variant?: "portal" | "staff";
  onViewDocument?: (doc: DocumentBrief) => void;
  onDownloadDocument?: (doc: DocumentBrief) => void;
  formatDate?: (value: string | null) => string;
}

const IDENTITY_SECTION = DOCUMENT_SECTIONS.find((s) => s.id === "identity")!;
const ADDRESS_SECTION = DOCUMENT_SECTIONS.find((s) => s.id === "address")!;
const SSN_SECTION = DOCUMENT_SECTIONS.find((s) => s.id === "ssn")!;

function DocumentIcon() {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-5 w-5"
      >
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
}

function DocumentUploadRow({
  slot,
  doc,
  locale,
  uploading,
  t,
  variant,
  onUpload,
  onViewDocument,
  onDownloadDocument,
  formatDate,
}: {
  slot: DocumentSlotDef;
  doc: DocumentBrief | undefined;
  locale: Locale;
  uploading: string | null;
  t: (key: string) => string;
  variant: "portal" | "staff";
  onUpload: (docType: string, file: File) => void;
  onViewDocument?: (doc: DocumentBrief) => void;
  onDownloadDocument?: (doc: DocumentBrief) => void;
  formatDate?: (value: string | null) => string;
}) {
  const label = translateStatus(locale, "documentTypes", slot.type);
  const uploadLabel =
    variant === "staff" && doc ? t("clientDetail.replaceDocument") : t("common.upload");

  const cardClass =
    variant === "portal"
      ? "p-4 sm:p-5"
      : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

  const Wrapper = variant === "portal" ? Card : "div";

  return (
    <Wrapper className={cardClass}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {doc ? (
            <DocumentThumbnail doc={doc} viewLabel={t("portalDocs.viewDocument")} />
          ) : (
            <DocumentIcon />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900">{label}</h3>
            {doc ? (
              <div className="mt-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">{doc.original_filename}</span>
                  <VerificationBadge status={doc.verification_status} />
                  <DocumentVerificationTooltip
                    doc={doc}
                    locale={locale}
                    rejectionTitle={t("portalDocs.rejectionTitle")}
                    approvalTitle={t("portalDocs.approvalTitle")}
                    viewLabel={t("portalDocs.viewVerificationDetails")}
                  />
                </div>
                {variant === "staff" && formatDate && (
                  <>
                    <p className="text-xs text-slate-400">{formatDate(doc.uploaded_at)}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewDocument?.(doc)}
                      >
                        {t("portalDocs.viewDocument")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void onDownloadDocument?.(doc)}
                      >
                        {t("clientDetail.downloadDocument")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span className="badge badge-amber mt-1">{t("portalDocs.pendingUpload")}</span>
            )}
          </div>
        </div>
        <label className="block w-full md:w-auto md:justify-self-end">
          <span
            className={`btn btn-primary btn-sm w-full md:inline-flex md:w-auto md:whitespace-nowrap ${
              uploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {uploading === slot.type ? t("common.uploading") : uploadLabel}
          </span>
          <input
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            disabled={!!uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(slot.type, file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </Wrapper>
  );
}

function SelectableDocumentSection({
  section,
  selectedGroupId,
  onSelectGroup,
  documents,
  locale,
  uploading,
  t,
  variant,
  onUpload,
  onViewDocument,
  onDownloadDocument,
  formatDate,
  selectId,
}: {
  section: DocumentSectionDef;
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
  documents: DocumentBrief[] | undefined;
  locale: Locale;
  uploading: string | null;
  t: (key: string) => string;
  variant: "portal" | "staff";
  onUpload: (docType: string, file: File) => void;
  onViewDocument?: (doc: DocumentBrief) => void;
  onDownloadDocument?: (doc: DocumentBrief) => void;
  formatDate?: (value: string | null) => string;
  selectId: string;
}) {
  const groups = getSectionGroups(section);
  const activeGroup = groups.find((group) => group.id === selectedGroupId) ?? section.primary;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{t(section.titleKey)}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(section.descriptionKey)}</p>
      </div>

      <Select
        id={selectId}
        label={t("portalDocs.documentTypeSelect")}
        value={selectedGroupId}
        onChange={(e) => onSelectGroup(e.target.value)}
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {groupLabel(group, locale, t)}
          </option>
        ))}
      </Select>

      <div className="grid gap-3">
        {activeGroup.slots.map((slot) => (
          <DocumentUploadRow
            key={slot.type}
            slot={slot}
            doc={documents?.find((d) => d.type === slot.type)}
            locale={locale}
            uploading={uploading}
            t={t}
            variant={variant}
            onUpload={onUpload}
            onViewDocument={onViewDocument}
            onDownloadDocument={onDownloadDocument}
            formatDate={formatDate}
          />
        ))}
      </div>
    </section>
  );
}

function useDocumentGroupSelection(
  section: DocumentSectionDef,
  documents: DocumentBrief[] | undefined,
) {
  const [groupId, setGroupId] = useState(section.primary.id);
  const initialized = useRef(false);

  useEffect(() => {
    if (!documents || initialized.current) return;
    setGroupId(inferActiveGroupId(section, documents));
    initialized.current = true;
  }, [documents, section]);

  return [groupId, setGroupId] as const;
}

export function DocumentRequirementsPanel({
  documents,
  locale,
  uploading,
  t,
  onUpload,
  variant = "portal",
  onViewDocument,
  onDownloadDocument,
  formatDate,
}: DocumentRequirementsPanelProps) {
  const [identityGroupId, setIdentityGroupId] = useDocumentGroupSelection(IDENTITY_SECTION, documents);
  const [addressGroupId, setAddressGroupId] = useDocumentGroupSelection(ADDRESS_SECTION, documents);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{t(SSN_SECTION.titleKey)}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(SSN_SECTION.descriptionKey)}</p>
        </div>
        <div className="grid gap-3">
          {SSN_SECTION.primary.slots.map((slot) => (
            <DocumentUploadRow
              key={slot.type}
              slot={slot}
              doc={documents?.find((d) => d.type === slot.type)}
              locale={locale}
              uploading={uploading}
              t={t}
              variant={variant}
              onUpload={onUpload}
              onViewDocument={onViewDocument}
              onDownloadDocument={onDownloadDocument}
              formatDate={formatDate}
            />
          ))}
        </div>
      </section>

      <SelectableDocumentSection
        section={IDENTITY_SECTION}
        selectedGroupId={identityGroupId}
        onSelectGroup={setIdentityGroupId}
        documents={documents}
        locale={locale}
        uploading={uploading}
        t={t}
        variant={variant}
        onUpload={onUpload}
        onViewDocument={onViewDocument}
        onDownloadDocument={onDownloadDocument}
        formatDate={formatDate}
        selectId="identity-document-type"
      />

      <SelectableDocumentSection
        section={ADDRESS_SECTION}
        selectedGroupId={addressGroupId}
        onSelectGroup={setAddressGroupId}
        documents={documents}
        locale={locale}
        uploading={uploading}
        t={t}
        variant={variant}
        onUpload={onUpload}
        onViewDocument={onViewDocument}
        onDownloadDocument={onDownloadDocument}
        formatDate={formatDate}
        selectId="address-document-type"
      />
    </div>
  );
}
