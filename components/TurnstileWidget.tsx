"use client";

import { useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    __turnstileScriptLoading?: boolean;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      `script[src="${SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// Cloudflare Turnstile CAPTCHA widget. Sits on top of the server-side rate
// limiting already in place on public, unauthenticated forms (prayer
// request submission, sign up) to blunt scripted bot abuse. Renders
// invisible-to-managed challenge depending on Cloudflare's risk scoring for
// the visitor; most real visitors never see an interactive puzzle.
//
// On a flaky connection (weak signal, restrictive network, etc.) the widget
// itself can fail to reach Cloudflare's challenge servers and gets stuck
// showing its own "Unable to connect to website" error with no way to
// recover short of reloading the whole page. We wire up Turnstile's
// error-callback so we can surface a friendlier retry option instead of
// leaving people stuck on the form.
export default function TurnstileWidget({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}) {
  const containerId = `turnstile-${useId().replace(/:/g, "")}`;
  const widgetIdRef = useRef<string | undefined>(undefined);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onVerify, onExpire]);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    let cancelled = false;

    loadTurnstileScript().then(() => {
      if (cancelled || !window.turnstile) return;
      const el = document.getElementById(containerId);
      if (!el) return;

      widgetIdRef.current = window.turnstile.render(el, {
        sitekey: siteKey,
        callback: (token: string) => {
          setHasError(false);
          onVerifyRef.current(token);
        },
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => setHasError(true),
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  function handleRetry() {
    setHasError(false);
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    } else {
      // Widget never finished rendering in the first place -- a reload is
      // the only reliable way to get a clean slate.
      window.location.reload();
    }
  }

  return (
    <div>
      <div id={containerId} className="my-2" />
      {hasError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          The verification widget couldn&apos;t connect, which usually means
          a weak or restricted network connection.{" "}
          <button
            type="button"
            onClick={handleRetry}
            className="font-medium underline underline-offset-2 hover:text-amber-900"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
