"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";

import {
  filterMentionableUsers,
  getActiveMentionQuery,
  insertMentionPlain,
  type MentionableUser,
} from "@/features/boards/utils/commentMentions";

interface CommentMentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  mentionableUsers: MentionableUser[];
  placeholder: string;
  rows?: number;
  onSubmit?: () => void;
}

export function CommentMentionTextarea({
  value,
  onChange,
  mentionableUsers,
  placeholder,
  rows = 3,
  onSubmit,
}: CommentMentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const suggestions = useMemo(() => {
    if (mentionStart === null) return [];
    return filterMentionableUsers(mentionableUsers, mentionQuery);
  }, [mentionStart, mentionQuery, mentionableUsers]);

  function syncMentionState(nextValue: string, cursor: number) {
    const active = getActiveMentionQuery(nextValue, cursor);
    if (!active) {
      setMentionStart(null);
      setMentionQuery("");
      setHighlightIndex(0);
      return;
    }
    setMentionStart(active.start);
    setMentionQuery(active.query);
    setHighlightIndex(0);
  }

  function closeMentionMenu() {
    setMentionStart(null);
    setMentionQuery("");
    setHighlightIndex(0);
  }

  function applyMention(user: MentionableUser) {
    if (mentionStart === null || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? value.length;
    const nextValue = insertMentionPlain(value, mentionStart, cursor, user.full_name);
    const nextCursor = mentionStart + user.full_name.length + 2;
    onChange(nextValue);
    closeMentionMenu();
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleChange(nextValue: string) {
    onChange(nextValue);
    const cursor = textareaRef.current?.selectionStart ?? nextValue.length;
    syncMentionState(nextValue, cursor);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length > 0 && mentionStart !== null) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applyMention(suggestions[highlightIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeMentionMenu();
        return;
      }
    }

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit?.();
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className="input-field min-h-18 w-full resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus:ring-0"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={() => {
          const cursor = textareaRef.current?.selectionStart ?? value.length;
          syncMentionState(value, cursor);
        }}
        onBlur={() => {
          window.setTimeout(closeMentionMenu, 120);
        }}
      />

      {suggestions.length > 0 && mentionStart !== null && (
        <ul className="absolute top-full left-0 z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((user, index) => (
            <li key={user.id}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm font-medium ${
                  index === highlightIndex ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applyMention(user);
                }}
              >
                {user.full_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
