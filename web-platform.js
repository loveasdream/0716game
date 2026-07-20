(function initWebPlatform(root) {
  "use strict";

  function readJSON(key, fallback) {
    try {
      const raw = root.localStorage?.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (_) { return fallback; }
  }

  function writeJSON(key, value) {
    try { root.localStorage?.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }

  async function copyText(text) {
    if (!root.navigator?.clipboard?.writeText) return false;
    try { await root.navigator.clipboard.writeText(text); return true; }
    catch (_) { return false; }
  }

  async function share(payload) {
    try {
      if (root.navigator?.share) {
        await root.navigator.share(payload);
        return { status: "shared" };
      }
      const copied = await copyText([payload.text, payload.url].filter(Boolean).join(" "));
      return { status: copied ? "copied" : "failed" };
    } catch (error) {
      if (error?.name === "AbortError") return { status: "cancelled" };
      const copied = await copyText([payload.text, payload.url].filter(Boolean).join(" "));
      return { status: copied ? "copied" : "failed", error };
    }
  }

  root.DeliveryPlatform = {
    kind: "web",
    storage: { getJSON: readJSON, setJSON: writeJSON },
    share,
    copyText,
    vibrate(duration = 12) {
      try { return Boolean(root.navigator?.vibrate?.(duration)); }
      catch (_) { return false; }
    },
    onVisibilityChange(callback) {
      const handler = () => callback(Boolean(root.document?.hidden));
      root.document?.addEventListener("visibilitychange", handler);
      return () => root.document?.removeEventListener("visibilitychange", handler);
    },
    isHidden: () => Boolean(root.document?.hidden),
    randomId: () => root.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    now: () => Date.now(),
    currentUrl: () => root.location?.href || ""
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
