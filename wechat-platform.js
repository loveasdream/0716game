(function initWechatPlatform(root) {
  "use strict";
  const api = root.wx;
  if (!api) return;

  root.DeliveryPlatform = {
    kind: "wechat",
    storage: {
      getJSON(key, fallback) {
        try { const value = api.getStorageSync(key); return value == null || value === "" ? fallback : value; }
        catch (_) { return fallback; }
      },
      setJSON(key, value) {
        try { api.setStorageSync(key, value); return true; }
        catch (_) { return false; }
      }
    },
    share(payload) {
      try {
        api.shareAppMessage({ title: payload.title, query: payload.query || "", imageUrl: payload.imageUrl });
        return Promise.resolve({ status: "shared" });
      } catch (error) { return Promise.resolve({ status: "failed", error }); }
    },
    copyText(text) {
      return new Promise((resolve) => api.setClipboardData({ data: text, success: () => resolve(true), fail: () => resolve(false) }));
    },
    vibrate(duration = 12) {
      try { api.vibrateShort({ type: duration >= 30 ? "medium" : "light" }); return true; }
      catch (_) { return false; }
    },
    onVisibilityChange(callback) {
      const onHide = () => callback(true);
      const onShow = () => callback(false);
      api.onHide(onHide); api.onShow(onShow);
      return () => { api.offHide?.(onHide); api.offShow?.(onShow); };
    },
    isHidden: () => false,
    randomId: () => `wx-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    now: () => Date.now(),
    currentUrl: () => ""
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
