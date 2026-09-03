"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { FieldLabel } from "@/components/ui/FieldHelp";
import { useAuth } from "@/features/auth/AuthContext";
import { api } from "@/lib/api";

export interface ResolvedAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
}

interface Suggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  /** Algunos proveedores resuelven la dirección en la misma llamada; si no, vienen vacíos. */
  street: string;
  city: string;
  state: string;
  zip_code: string;
}

interface AutocompleteResponse {
  suggestions: Suggestion[];
}

interface AddressAutocompleteProps {
  id?: string;
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  /** Se dispara al elegir una sugerencia real; completa city/state/zip. */
  onSelect: (address: ResolvedAddress) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AddressAutocomplete({
  id,
  label,
  help,
  value,
  onChange,
  onSelect,
  placeholder,
  required,
  error,
}: AddressAutocompleteProps) {
  const { token } = useAuth();
  const generatedId = useId();
  const inputId = id ?? `portal-addr-${generatedId}`;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const sessionToken = useRef<string>(newSessionToken());
  // Evita relanzar la búsqueda inmediatamente después de seleccionar una sugerencia.
  const justSelected = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useMemo(() => `addr-suggestions-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (!token) return;
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          session_token: sessionToken.current,
        });
        const data = await api.get<AutocompleteResponse>(
          `/portal/addresses/autocomplete?${params.toString()}`,
          token,
        );
        if (cancelled) return;
        setSuggestions(data.suggestions);
        setOpen(data.suggestions.length > 0);
        setHighlight(-1);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [value, token]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSelect(suggestion: Suggestion) {
    justSelected.current = true;
    setOpen(false);
    setSuggestions([]);
    if (suggestion.street && suggestion.city && suggestion.state && suggestion.zip_code) {
      onSelect({
        street: suggestion.street,
        city: suggestion.city,
        state: suggestion.state,
        zip_code: suggestion.zip_code,
      });
      return;
    }
    if (!token) {
      onChange(suggestion.main_text || suggestion.description);
      return;
    }
    try {
      const params = new URLSearchParams({
        place_id: suggestion.place_id,
        session_token: sessionToken.current,
      });
      const details = await api.get<ResolvedAddress>(
        `/portal/addresses/details?${params.toString()}`,
        token,
      );
      onSelect({
        street: details.street || suggestion.main_text || suggestion.description,
        city: details.city,
        state: details.state,
        zip_code: details.zip_code,
      });
    } catch {
      onChange(suggestion.main_text || suggestion.description);
    } finally {
      // Una sesión de Google termina al pedir el detalle: renovamos el token.
      sessionToken.current = newSessionToken();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      void handleSelect(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative z-40">
      <FieldLabel htmlFor={inputId} help={help}>
        {label}
      </FieldLabel>
      {/*
        Chrome ignora autocomplete="off" en campos de dirección y muestra su
        propio dropdown encima del nuestro. Usamos un valor no estándar + un
        name/id sin "street"/"address" para que no lo trate como autofill.
      */}
      <input
        id={inputId}
        name={inputId}
        className={`input-field ${error ? "border-red-300 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="one-time-code"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.place_id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                void handleSelect(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === highlight ? "bg-slate-100" : ""}`}
            >
              <span className="font-medium text-slate-800">{s.main_text}</span>
              {s.secondary_text && (
                <span className="block text-xs text-slate-500">{s.secondary_text}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
