"use client";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { copyToClipboard } from "@/lib/clipboard";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/contexts/LanguageContext";

type Variant = "success" | "error" | "info" | "warning";
type Phase = "form" | "loading" | "result";

interface AlertOptions {
  title: string;
  message: string;
  variant?: Variant;
  copyText?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loadingMessage?: string;
  onConfirmAsync?: () => Promise<AlertOptions>;
}

interface PromptOptions {
  title: string;
  label: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  minLength?: number;
  multiline?: boolean;
}

interface ApproveOptions {
  title: string;
  message: string;
  advisors: { id: number; label: string }[];
  confirmLabel?: string;
  cancelLabel?: string;
  loadingMessage?: string;
  onConfirm: (advisorId: number) => Promise<AlertOptions>;
}

interface RejectOptions {
  title: string;
  message: string;
  reasonLabel: string;
  reasonPlaceholder?: string;
  minLength?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingMessage?: string;
  onConfirm: (reason: string) => Promise<AlertOptions>;
}

type ModalState =
  | { type: "alert"; options: AlertOptions; resolve: () => void }
  | { type: "confirm"; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { type: "prompt"; options: PromptOptions; resolve: (v: string | null) => void }
  | { type: "approve"; options: ApproveOptions; resolve: (v: boolean) => void }
  | { type: "reject"; options: RejectOptions; resolve: (v: boolean) => void };

interface ModalContextValue {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  approveWithAdvisor: (options: ApproveOptions) => Promise<boolean>;
  rejectClient: (options: RejectOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const variantIcon: Record<Variant, string> = {
  success: "text-emerald-600 bg-emerald-50",
  error: "text-red-600 bg-red-50",
  info: "text-brand bg-brand-muted",
  warning: "text-amber-600 bg-amber-50",
};

function ModalShell({
  title,
  children,
  onClose,
  dismissible = true,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  dismissible?: boolean;
}) {
  return (
    <Modal title={title} onClose={onClose} dismissible={dismissible} usePortal={false}>
      {children}
    </Modal>
  );
}

function ModalResultBody({
  options,
  copied,
  setCopied,
  passwordLabel,
  copyLabel,
  copiedLabel,
}: {
  options: AlertOptions;
  copied: boolean;
  setCopied: (v: boolean) => void;
  passwordLabel: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const v = options.variant ?? "info";
  return (
    <div className="flex gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${variantIcon[v]}`}>
        {v === "success" ? "✓" : v === "error" ? "!" : "i"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{options.message}</p>
        {options.copyText && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">{passwordLabel}</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">{options.copyText}</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={async () => {
                const ok = await copyToClipboard(options.copyText!);
                if (ok) setCopied(true);
              }}
            >
              {copied ? copiedLabel : copyLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [advisorId, setAdvisorId] = useState<number | "">("");
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<AlertOptions | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  const finish = useCallback(
    (success: boolean) => {
      if (state.type === "approve" || state.type === "reject" || state.type === "confirm") {
        state.resolve(success);
      }
      onClose();
    },
    [state, onClose],
  );

  const runAsync = useCallback(
    async (fn: () => Promise<AlertOptions>, loading: string) => {
      setLoadingMessage(loading);
      setPhase("loading");
      try {
        const res = await fn();
        setResult(res);
        setPhase("result");
      } catch (err) {
        setResult({
          title: t("common.error"),
          message: getUserFacingErrorMessage(err, t("common.error")),
          variant: "error",
        });
        setPhase("result");
      }
    },
    [t],
  );

  if (phase === "loading") {
    return (
      <ModalShell title={loadingMessage} dismissible={false}>
        <div className="py-8">
          <LoadingSpinner />
        </div>
      </ModalShell>
    );
  }

  if (phase === "result" && result) {
    const success = result.variant === "success" || result.variant === "info";
    return (
      <ModalShell title={result.title} dismissible={false}>
        <ModalResultBody
          options={result}
          copied={copied}
          setCopied={setCopied}
          passwordLabel={t("modal.copyPassword")}
          copyLabel={t("modal.copy")}
          copiedLabel={t("modal.copied")}
        />
        <div className="modal-actions">
          <Button type="button" onClick={() => finish(success)}>
            {t("modal.ok")}
          </Button>
        </div>
      </ModalShell>
    );
  }

  if (state.type === "alert") {
    return (
      <ModalShell title={state.options.title} onClose={onClose}>
        <ModalResultBody
          options={state.options}
          copied={copied}
          setCopied={setCopied}
          passwordLabel={t("modal.copyPassword")}
          copyLabel={t("modal.copy")}
          copiedLabel={t("modal.copied")}
        />
        <div className="modal-actions">
          <Button type="button" onClick={onClose}>
            {t("modal.ok")}
          </Button>
        </div>
      </ModalShell>
    );
  }

  if (state.type === "confirm") {
    const isDanger = state.options.variant === "danger";
    const hasAsync = !!state.options.onConfirmAsync;
    return (
      <ModalShell
        title={state.options.title}
        onClose={() => {
          state.resolve(false);
          onClose();
        }}
      >
        <p className="text-sm leading-relaxed text-slate-600">{state.options.message}</p>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={() => { state.resolve(false); onClose(); }}>
            {state.options.cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "danger" : "primary"}
            onClick={() => {
              if (hasAsync && state.options.onConfirmAsync) {
                runAsync(
                  state.options.onConfirmAsync,
                  state.options.loadingMessage ?? t("modal.processing"),
                );
              } else {
                state.resolve(true);
                onClose();
              }
            }}
          >
            {state.options.confirmLabel ?? t("modal.confirm")}
          </Button>
        </div>
      </ModalShell>
    );
  }

  if (state.type === "prompt") {
    const minLen = state.options.minLength ?? 1;
    const valid = value.trim().length >= minLen;
    return (
      <ModalShell
        title={state.options.title}
        onClose={() => {
          state.resolve(null);
          onClose();
        }}
      >
        {state.options.multiline ? (
          <textarea
            className="input-field min-h-[6rem] resize-y"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={state.options.placeholder}
          />
        ) : (
          <Input
            label={state.options.label}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={state.options.placeholder}
          />
        )}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={() => { state.resolve(null); onClose(); }}>
            {state.options.cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!valid}
            onClick={() => { state.resolve(value.trim()); onClose(); }}
          >
            {state.options.confirmLabel ?? t("modal.confirm")}
          </Button>
        </div>
      </ModalShell>
    );
  }

  if (state.type === "approve") {
    const selected = advisorId !== "" ? Number(advisorId) : null;
    const defaultId = state.options.advisors[0]?.id;
    const effectiveId = selected ?? defaultId ?? null;

    return (
      <ModalShell
        title={state.options.title}
        onClose={() => {
          state.resolve(false);
          onClose();
        }}
      >
        <p className="text-sm leading-relaxed text-slate-600">{state.options.message}</p>
        {state.options.advisors.length > 1 && (
          <div className="mt-4">
            <label className="input-label">{t("clients.selectAdvisor")}</label>
            <select
              className="input-field"
              value={advisorId || defaultId || ""}
              onChange={(e) => setAdvisorId(Number(e.target.value))}
            >
              {state.options.advisors.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
        )}
        {state.options.advisors.length === 1 && (
          <p className="mt-3 text-sm text-slate-500">
            {t("clients.assignedAdvisor")}: <strong>{state.options.advisors[0].label}</strong>
          </p>
        )}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={() => { state.resolve(false); onClose(); }}>
            {state.options.cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!effectiveId}
            onClick={() => {
              if (!effectiveId) return;
              runAsync(
                () => state.options.onConfirm(effectiveId),
                state.options.loadingMessage ?? t("clients.approving"),
              );
            }}
          >
            {state.options.confirmLabel ?? t("clients.approve")}
          </Button>
        </div>
      </ModalShell>
    );
  }

  if (state.type === "reject") {
    const minLen = state.options.minLength ?? 5;
    const valid = value.trim().length >= minLen;
    return (
      <ModalShell
        title={state.options.title}
        onClose={() => {
          state.resolve(false);
          onClose();
        }}
      >
        <p className="text-sm leading-relaxed text-slate-600">{state.options.message}</p>
        <div className="mt-4">
          <label className="input-label">{state.options.reasonLabel}</label>
          <textarea
            className="input-field mt-1 min-h-[6rem] resize-y"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={state.options.reasonPlaceholder}
          />
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={() => { state.resolve(false); onClose(); }}>
            {state.options.cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!valid}
            onClick={() => {
              runAsync(
                () => state.options.onConfirm(value.trim()),
                state.options.loadingMessage ?? t("clients.rejecting"),
              );
            }}
          >
            {state.options.confirmLabel ?? t("clients.reject")}
          </Button>
        </div>
      </ModalShell>
    );
  }

  return null;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);
  const stateRef = useRef<ModalState | null>(null);

  const close = useCallback(() => {
    const current = stateRef.current;
    if (current?.type === "alert") current.resolve();
    stateRef.current = null;
    setState(null);
  }, []);

  const open = useCallback(<T,>(factory: (resolve: (v: T) => void) => ModalState): Promise<T> =>
    new Promise((resolve) => {
      const item = factory(resolve as (v: unknown) => void);
      stateRef.current = item;
      setState(item);
    }), []);

  const alert = useCallback(
    (options: AlertOptions) =>
      open<void>((resolve) => ({
        type: "alert",
        options,
        resolve: () => resolve(),
      })),
    [open],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      open<boolean>((resolve) => ({
        type: "confirm",
        options,
        resolve,
      })),
    [open],
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      open<string | null>((resolve) => ({
        type: "prompt",
        options,
        resolve,
      })),
    [open],
  );

  const approveWithAdvisor = useCallback(
    (options: ApproveOptions) =>
      open<boolean>((resolve) => ({
        type: "approve",
        options,
        resolve,
      })),
    [open],
  );

  const rejectClient = useCallback(
    (options: RejectOptions) =>
      open<boolean>((resolve) => ({
        type: "reject",
        options,
        resolve,
      })),
    [open],
  );

  return (
    <ModalContext.Provider value={{ alert, confirm, prompt, approveWithAdvisor, rejectClient }}>
      {children}
      {state && <ActiveModal key={state.type + JSON.stringify(state.options.title)} state={state} onClose={close} />}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal debe usarse dentro de ModalProvider");
  return ctx;
}
