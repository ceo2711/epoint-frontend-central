"use client";

import { useEffect, useRef } from "react";
import {
  HiOutlineBold,
  HiOutlineItalic,
  HiOutlineLink,
  HiOutlineListBullet,
  HiOutlineNumberedList,
  HiOutlineUnderline,
} from "react-icons/hi2";

import { useTranslation } from "@/contexts/LanguageContext";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface ToolbarAction {
  command: string;
  icon: React.ReactNode;
  labelKey: string;
  needsUrl?: boolean;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { command: "bold", icon: <HiOutlineBold className="h-4 w-4" />, labelKey: "emailCompose.bold" },
  { command: "italic", icon: <HiOutlineItalic className="h-4 w-4" />, labelKey: "emailCompose.italic" },
  { command: "underline", icon: <HiOutlineUnderline className="h-4 w-4" />, labelKey: "emailCompose.underline" },
  { command: "insertUnorderedList", icon: <HiOutlineListBullet className="h-4 w-4" />, labelKey: "emailCompose.bulletList" },
  { command: "insertOrderedList", icon: <HiOutlineNumberedList className="h-4 w-4" />, labelKey: "emailCompose.numberedList" },
  { command: "createLink", icon: <HiOutlineLink className="h-4 w-4" />, labelKey: "emailCompose.link", needsUrl: true },
];

export function RichTextEditor({ value, onChange, placeholder, minHeight = 160 }: RichTextEditorProps) {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
    // Solo sincroniza en el montaje; después el editor es la fuente de verdad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emitChange() {
    const editor = editorRef.current;
    if (editor) onChange(editor.innerHTML);
  }

  function applyCommand(action: ToolbarAction) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (action.needsUrl) {
      const url = window.prompt(t("emailCompose.linkPrompt"));
      if (!url) return;
      const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      document.execCommand("createLink", false, normalized);
    } else {
      document.execCommand(action.command, false);
    }
    emitChange();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/70 px-2 py-1.5">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            title={t(action.labelKey)}
            aria-label={t(action.labelKey)}
            className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900"
            onMouseDown={(event) => {
              event.preventDefault();
              applyCommand(action);
            }}
          >
            {action.icon}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        className="rich-text-editor px-3 py-2.5 text-sm leading-relaxed text-slate-900 outline-none"
        style={{ minHeight }}
        onInput={emitChange}
        onBlur={emitChange}
        suppressContentEditableWarning
      />
    </div>
  );
}
