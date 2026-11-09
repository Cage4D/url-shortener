"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { MESSAGES } from "@/lib/links/messages";
import { parseCreateLink, type FieldError } from "@/lib/links/rules";
import { recentLinks, type RecentLink } from "@/lib/recent";

type Status = "idle" | "loading" | "success" | "error";
type CopyState = { id: string; ok: boolean } | null;

const COPY_FEEDBACK_MS = 1800;

async function postLink(body: { url: string; alias?: string }): Promise<RecentLink | FieldError> {
  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.status === 201 && data?.slug) return data as RecentLink;
    if (data?.error?.message && (data.error.field === "url" || data.error.field === "alias")) {
      return data.error as FieldError;
    }
  } catch {
    // Network failure; fall through to the generic message.
  }
  return { field: "url", message: MESSAGES.network };
}

export function useShortener(domain: string) {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  // The last error and result stay in state after they're dismissed so
  // they can animate out; status decides whether they're showing.
  const [error, setError] = useState<FieldError | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [result, setResult] = useState<RecentLink | null>(null);
  // Lets people put the result away and get back to the plain form.
  const [resultOpen, setResultOpen] = useState(false);
  const [copied, setCopied] = useState<CopyState>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const history = useSyncExternalStore(
    recentLinks.subscribe,
    recentLinks.getSnapshot,
    recentLinks.getServerSnapshot,
  );

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const clearErrorFor = (field: FieldError["field"]) => {
    if (status !== "error" || error?.field !== field) return;
    setStatus("idle");
  };

  const onUrlChange = (value: string) => {
    setUrl(value);
    clearErrorFor("url");
  };

  const onAliasChange = (value: string) => {
    setAlias(value);
    clearErrorFor("alias");
  };

  const toggleAlias = () => {
    setShowAlias((open) => !open);
    setAlias("");
    clearErrorFor("alias");
  };

  const fail = (err: FieldError) => {
    setError(err);
    setErrorCount((n) => n + 1);
    setStatus("error");
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;

    const body = { url, alias: showAlias ? alias : undefined };
    const parsed = parseCreateLink(body, domain);
    if (!parsed.ok) return fail(parsed.error);

    setStatus("loading");
    const created = await postLink(parsed.data);
    if ("field" in created) return fail(created);

    const link: RecentLink = {
      slug: created.slug,
      shortUrl: created.shortUrl,
      longUrl: created.longUrl,
      createdAt: created.createdAt,
    };
    recentLinks.add(link);
    setResult(link);
    setResultOpen(true);
    setStatus("success");
    setUrl("");
    setAlias("");
  };

  const copy = useCallback(async (text: string, id: string) => {
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      ok = false;
    }
    setCopied({ id, ok });
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), COPY_FEEDBACK_MS);
  }, []);

  const copyLabel = (id: string) => {
    if (copied?.id !== id) return "Copy";
    return copied.ok ? "Copied" : "Copy failed";
  };

  return {
    url,
    alias,
    showAlias,
    status,
    error,
    errorCount,
    errorVisible: status === "error" && error !== null,
    result,
    resultVisible: result !== null && resultOpen && status !== "error",
    dismissResult: () => setResultOpen(false),
    history,
    copied,
    onUrlChange,
    onAliasChange,
    toggleAlias,
    submit,
    copy,
    copyLabel,
    clearHistory: recentLinks.clear,
  };
}

export type Shortener = ReturnType<typeof useShortener>;
