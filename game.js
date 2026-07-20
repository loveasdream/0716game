(function bootDeliveryGame(root) {
  "use strict";

  const VERSION = "20260720a";
  const resources = [
    { src: "game-core.js", ready: () => Boolean(root.DeliveryCore) },
    { src: "web-platform.js", ready: () => Boolean(root.DeliveryPlatform) },
    { src: "renderer.js", ready: () => typeof root.createCanvasRenderer === "function" },
    { src: "web-game.js", ready: () => Boolean(root.DeliveryWebGameReady) }
  ];

  function showBootError(resource) {
    console.error(`游戏资源加载失败：${resource}`);
    const warning = document.createElement("div");
    warning.textContent = `游戏资源没有加载完整（${resource}），请刷新页面；如果仍失败，请重新上传全部游戏文件。`;
    Object.assign(warning.style, {
      position: "fixed", left: "12px", right: "12px", top: "12px", zIndex: "9999",
      padding: "14px", color: "#fff", background: "#9f2f32", fontSize: "16px",
      textAlign: "center", border: "3px solid #fff"
    });
    document.body.appendChild(warning);
  }

  function loadResource(resource) {
    if (resource.ready()) return Promise.resolve();
    document.querySelectorAll(`script[src*="${resource.src}"]`).forEach((script) => script.remove());
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${resource.src}?v=${VERSION}`;
      script.onload = () => resource.ready() ? resolve() : reject(new Error(`${resource.src} 未完成注册`));
      script.onerror = () => reject(new Error(`${resource.src} 加载失败`));
      document.head.appendChild(script);
    });
  }

  resources.reduce((chain, resource) => chain.then(() => loadResource(resource)), Promise.resolve())
    .catch((error) => showBootError(error.message));
})(typeof globalThis !== "undefined" ? globalThis : window);
