"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { aliasFromUrl } from "@/lib/links/alias";
import { MESSAGES } from "@/lib/links/messages";
import { parseCreateLink, type FieldError } from "@/lib/links/rules";
import { recentLinks, type RecentLink } from "@/lib/recent";

type Status = "idle" | "loading" | "success" | "error";
type CopyState = { id: string; ok: boolean } | null;

const COPY_FEEDBACK_MS = 1800;

async function postLink(body: { url: string; alias?: string; aliasSuggested?: boolean }): Promise<RecentLink | FieldError> {
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
  // The alias follows the link until someone types their own. Emptying the
  // alias field hands it back to the link.
  const [aliasFollowsUrl, setAliasFollowsUrl] = useState(true);
  // Set when someone closes the alias field while a link is typed, so it
  // doesn't pop back open on the next keystroke. Clearing the link resets it.
  const [aliasDismissed, setAliasDismissed] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  // The last error and result stay in state after they're dismissed so
  // they can animate out; status decides whether they're showing.
  const [error, setError] = useState<FieldError | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [result, setResult] = useState<RecentLink | null>(null);
  // Whether the result and recent links are showing. They start put away so
  // a returning visitor sees the plain form; a new link opens them.
  const [panelsOpen, setPanelsOpen] = useState(false);
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
    const typed = value.trim() !== "";
    if (!typed) setAliasDismissed(false);
    // Typing a link opens the alias field so people see what it'll be.
    const opening = typed && !showAlias && !aliasDismissed;
    if (opening) {
      setShowAlias(true);
      setAliasFollowsUrl(true);
    }
    if (opening || (aliasFollowsUrl && showAlias)) {
      setAlias(aliasFromUrl(value));
      clearErrorFor("alias");
    }
  };

  const closeAlias = () => {
    setShowAlias(false);
    setAlias("");
    setAliasFollowsUrl(true);
    clearErrorFor("alias");
  };

  /** Focus or a tap went somewhere outside the form. */
  const onFormLeave = () => {
    if (showAlias && url.trim() === "") closeAlias();
  };

  const onAliasChange = (value: string) => {
    setAlias(value);
    setAliasFollowsUrl(value === "");
    clearErrorFor("alias");
  };

  const toggleAlias = () => {
    // Opening starts from the link already typed; closing drops the alias.
    if (showAlias) {
      closeAlias();
      setAliasDismissed(url.trim() !== "");
      return;
    }
    setAlias(aliasFromUrl(url));
    setShowAlias(true);
    setAliasFollowsUrl(true);
    setAliasDismissed(false);
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

    // An alias still following the link is only a suggestion, so the
    // server may add a suffix if it's taken.
    const body = { url, alias: showAlias ? alias : undefined, aliasSuggested: showAlias && aliasFollowsUrl };
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
    setPanelsOpen(true);
    setStatus("success");
    setUrl("");
    setAlias("");
    setShowAlias(false);
    setAliasFollowsUrl(true);
    setAliasDismissed(false);
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
    panelsOpen,
    hasPanels: result !== null || history.length > 0,
    resultVisible: result !== null && panelsOpen && status !== "error",
    historyVisible: history.length > 0 && panelsOpen,
    togglePanels: () => setPanelsOpen((open) => !open),
    history,
    copied,
    onUrlChange,
    onAliasChange,
    toggleAlias,
    onFormLeave,
    submit,
    copy,
    copyLabel,
    clearHistory: recentLinks.clear,
  };
}

export type Shortener = ReturnType<typeof useShortener>;
