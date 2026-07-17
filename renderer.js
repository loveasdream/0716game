"use strict";

(() => {
  function createCanvasRenderer(options) {
    const {
      skyCanvas, bagCanvas, dragCanvas, getState, getFood, getShape,
      getItemCells, canPlace, recipeFor, findMergePlacement, getSprite, grid = 4
    } = options;
    const skyContext = skyCanvas.getContext("2d");
    const bagContext = bagCanvas.getContext("2d");
    const dragContext = dragCanvas.getContext("2d");
    const sizeCache = new WeakMap();
    let palette = null;
    let paletteTheme = "";

    function colors() {
      const theme = document.body.dataset.theme || "warm";
      if (palette && paletteTheme === theme) return palette;
      const style = getComputedStyle(document.documentElement);
      const value = (name) => style.getPropertyValue(name).trim();
      paletteTheme = theme;
      palette = {
        ink: value("--ink"), panel: value("--panel"), panel2: value("--panel2"),
        line: value("--line"), accent: value("--accent"), accent2: value("--accent2"),
        good: value("--good"), bad: value("--bad"), muted: value("--muted"), grid: value("--grid")
      };
      return palette;
    }

    function prepare(canvas, context) {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      const cached = sizeCache.get(canvas);
      if (!cached || cached.width !== width || cached.height !== height) {
        canvas.width = width;
        canvas.height = height;
        sizeCache.set(canvas, { width, height });
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
      return { rect, width: rect.width, height: rect.height };
    }

    function dropGeometry(drop, width, height) {
      const x = width * ((drop.lane + .5) / 3);
      const top = -70 + drop.progress * (height + 18);
      return { x, y: top, width: 64, height: 76 };
    }

    function drawDrop(context, drop, geometry, now) {
      const p = colors();
      const { x, y } = geometry;
      const bob = Math.sin(now / 115 + drop.lane) * 2;
      context.save();
      context.translate(Math.round(x), Math.round(y + bob));
      context.fillStyle = p.accent2;
      context.strokeStyle = p.ink;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-24, 18);
      context.quadraticCurveTo(0, -5, 24, 18);
      context.closePath();
      context.fill();
      context.stroke();
      context.beginPath();
      context.moveTo(-20, 17); context.lineTo(-14, 34);
      context.moveTo(20, 17); context.lineTo(14, 34);
      context.stroke();
      context.fillStyle = "#c98b4e";
      context.fillRect(-23, 31, 46, 42);
      context.strokeRect(-23, 31, 46, 42);
      context.strokeStyle = "#e9b46f";
      context.lineWidth = 3;
      context.strokeRect(-19, 35, 38, 34);
      const sprite = getSprite(drop.type);
      context.drawImage(sprite, -17, 36, 34, 34);
      context.font = "900 10px monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      const label = getFood(drop.type).name;
      const labelWidth = Math.max(36, context.measureText(label).width + 10);
      context.fillStyle = "rgba(48,29,24,.86)";
      context.fillRect(-labelWidth / 2, 67, labelWidth, 17);
      context.fillStyle = "white";
      context.fillText(label, 0, 76);
      context.restore();
    }

    function drawSky(now) {
      const { width, height } = prepare(skyCanvas, skyContext);
      skyContext.clearRect(0, 0, width, height);
      const state = getState();
      [...state.falling.values()].forEach((drop) => drawDrop(skyContext, drop, dropGeometry(drop, width, height), now));
    }

    function cellRect(x, y, cellSize, inset = 3) {
      return { x: x * cellSize + inset, y: y * cellSize + inset, size: cellSize - inset * 2 };
    }

    function paintCell(context, x, y, cellSize, fill, stroke, lineWidth = 3) {
      const rect = cellRect(x, y, cellSize);
      context.fillStyle = fill;
      context.fillRect(rect.x, rect.y, rect.size, rect.size);
      context.strokeStyle = stroke;
      context.lineWidth = lineWidth;
      context.strokeRect(rect.x + 1, rect.y + 1, rect.size - 2, rect.size - 2);
    }

    function drawPlacementHints(context, state, cellSize, now) {
      if (!state.hand) return;
      const p = colors();
      const pulse = .20 + (Math.sin(now / 130) + 1) * .08;
      for (let y = 0; y < grid; y += 1) {
        for (let x = 0; x < grid; x += 1) {
          if (!canPlace(state.hand.type, x, y, state.hand.rotation)) continue;
          const rect = cellRect(x, y, cellSize, 4);
          context.fillStyle = `rgba(73,150,94,${pulse})`;
          context.fillRect(rect.x, rect.y, rect.size, rect.size);
          context.fillStyle = p.good;
          const badge = Math.min(26, cellSize * .36);
          context.fillRect(rect.x + (rect.size - badge) / 2, rect.y + (rect.size - badge) / 2, badge, badge);
          context.strokeStyle = p.ink;
          context.lineWidth = 2;
          context.strokeRect(rect.x + (rect.size - badge) / 2, rect.y + (rect.size - badge) / 2, badge, badge);
          context.fillStyle = "white";
          context.font = `900 ${Math.max(15, badge * .72)}px monospace`;
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText("+", rect.x + rect.size / 2, rect.y + rect.size / 2 + 1);
        }
      }
    }

    function drawPreview(context, state, cellSize) {
      if (!state.preview) return;
      const p = colors();
      const preview = state.preview;
      const shape = preview.shapeOverride || getShape(preview.type, preview.rotation);
      shape.forEach(([dx, dy]) => {
        const x = preview.x + dx;
        const y = preview.y + dy;
        if (x < 0 || y < 0 || x >= grid || y >= grid) return;
        paintCell(context, x, y, cellSize, preview.valid ? "rgba(73,150,94,.55)" : "rgba(188,65,72,.62)", preview.valid ? p.good : p.bad, 4);
      });
    }

    function itemBounds(item, shape, cellSize) {
      const width = Math.max(...shape.map(([x]) => x)) + 1;
      const height = Math.max(...shape.map(([, y]) => y)) + 1;
      return { x: item.x * cellSize, y: item.y * cellSize, width: width * cellSize, height: height * cellSize };
    }

    function drawItem(context, item, state, cellSize, now) {
      const p = colors();
      const shape = getShape(item.type, item.rotation, item.shapeOverride);
      const bounds = itemBounds(item, shape, cellSize);
      const selected = state.selectedId === item.id;
      const draggedItem = state.bagGesture?.moved && state.bagGesture.itemId
        ? state.items.find((candidate) => candidate.id === state.bagGesture.itemId) : null;
      const activeType = state.hand?.type || draggedItem?.type;
      const handRecipe = activeType && draggedItem?.id !== item.id && recipeFor(activeType, item.type);
      const mergeFits = handRecipe && Boolean(findMergePlacement(handRecipe.result, [item]));
      const blockedMerge = handRecipe && !mergeFits;
      const incompatible = state.hand && !handRecipe && item.type !== "badReview";
      const isDragged = state.bagGesture?.moved && state.bagGesture.itemId === item.id;
      context.save();
      context.globalAlpha = isDragged ? .28 : incompatible ? .58 : 1;
      shape.forEach(([dx, dy]) => {
        let fill = item.type === "badReview" ? "#596069" : p.panel;
        let stroke = p.line;
        if (mergeFits) { fill = p.panel2; stroke = p.good; }
        if (blockedMerge) { fill = p.panel2; stroke = p.bad; }
        paintCell(context, item.x + dx, item.y + dy, cellSize, fill, stroke, mergeFits || blockedMerge ? 5 : 3);
      });
      if (selected && !state.hand) {
        context.strokeStyle = p.accent2;
        context.lineWidth = 4 + (Math.sin(now / 120) + 1);
        context.strokeRect(bounds.x + 5, bounds.y + 5, bounds.width - 10, bounds.height - 10);
      }
      const artSize = Math.min(bounds.width, bounds.height) * .62;
      context.drawImage(getSprite(item.type), bounds.x + (bounds.width - artSize) / 2, bounds.y + (bounds.height - artSize) / 2 - 3, artSize, artSize);
      const name = getFood(item.type).name;
      context.font = `900 ${Math.max(9, Math.min(12, cellSize * .15))}px monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "rgba(48,29,24,.86)";
      context.fillRect(bounds.x + 5, bounds.y + bounds.height - 21, bounds.width - 10, 16);
      context.fillStyle = "white";
      context.fillText(name, bounds.x + bounds.width / 2, bounds.y + bounds.height - 13);
      if (item.timer != null) {
        const badge = Math.min(27, cellSize * .34);
        context.fillStyle = item.timer <= 1 ? p.bad : p.good;
        context.fillRect(bounds.x + bounds.width - badge - 3, bounds.y + 3, badge, badge);
        context.strokeStyle = p.ink;
        context.lineWidth = 2;
        context.strokeRect(bounds.x + bounds.width - badge - 3, bounds.y + 3, badge, badge);
        context.fillStyle = "white";
        context.font = `900 ${Math.max(11, badge * .52)}px monospace`;
        context.fillText(String(item.timer), bounds.x + bounds.width - badge / 2 - 3, bounds.y + badge / 2 + 4);
      }
      if (mergeFits || blockedMerge) {
        const badge = Math.min(29, cellSize * .38);
        context.fillStyle = mergeFits ? p.good : p.bad;
        context.fillRect(bounds.x + 4, bounds.y + 4, badge, badge);
        context.strokeStyle = p.ink;
        context.strokeRect(bounds.x + 4, bounds.y + 4, badge, badge);
        context.fillStyle = "white";
        context.font = `900 ${Math.max(12, badge * .5)}px monospace`;
        context.fillText(mergeFits ? "合" : "!", bounds.x + 4 + badge / 2, bounds.y + 4 + badge / 2 + 1);
      }
      context.restore();
    }

    function drawBag(now) {
      const { width, height } = prepare(bagCanvas, bagContext);
      bagContext.clearRect(0, 0, width, height);
      const state = getState();
      const cellSize = Math.min(width, height) / grid;
      drawPlacementHints(bagContext, state, cellSize, now);
      drawPreview(bagContext, state, cellSize);
      state.items.forEach((item) => drawItem(bagContext, item, state, cellSize, now));
    }

    function drawGhost(context, type, x, y, validity) {
      const p = colors();
      const size = 64;
      context.save();
      context.translate(Math.round(x), Math.round(y));
      context.fillStyle = validity === false ? "rgba(188,65,72,.76)" : "rgba(73,150,94,.78)";
      context.beginPath();
      context.arc(0, 0, 39, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = p.ink;
      context.lineWidth = 3;
      context.stroke();
      context.drawImage(getSprite(type), -size / 2, -size / 2, size, size);
      context.restore();
    }

    function drawDrag() {
      const { width, height } = prepare(dragCanvas, dragContext);
      dragContext.clearRect(0, 0, width, height);
      const state = getState();
      if (state.catchDrag && state.hand) drawGhost(dragContext, state.hand.type, state.catchDrag.x, state.catchDrag.y, state.dragValidity);
      else if (state.bagGesture?.moved && state.bagGesture.itemId) {
        const item = state.items.find((candidate) => candidate.id === state.bagGesture.itemId);
        if (item) drawGhost(dragContext, item.type, state.bagGesture.x, state.bagGesture.y, state.dragValidity);
      }
    }

    function frame(now) {
      drawSky(now);
      drawBag(now);
      drawDrag();
    }

    function skyDropAt(clientX, clientY) {
      const { rect, width, height } = prepare(skyCanvas, skyContext);
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return [...getState().falling.values()]
        .map((drop) => ({ drop, geometry: dropGeometry(drop, width, height) }))
        .filter(({ geometry }) => x >= geometry.x - 37 && x <= geometry.x + 37 && y >= geometry.y - 10 && y <= geometry.y + geometry.height + 12)
        .sort((a, b) => b.drop.progress - a.drop.progress)[0]?.drop || null;
    }

    function bagPoint(clientX, clientY) {
      const rect = bagCanvas.getBoundingClientRect();
      const inside = clientX >= rect.left && clientX < rect.right && clientY >= rect.top && clientY < rect.bottom;
      const cellSize = Math.min(rect.width, rect.height) / grid;
      return {
        inside,
        x: Math.max(0, Math.min(grid - 1, Math.floor((clientX - rect.left) / cellSize))),
        y: Math.max(0, Math.min(grid - 1, Math.floor((clientY - rect.top) / cellSize))),
        localX: clientX - rect.left,
        localY: clientY - rect.top,
        cellSize
      };
    }

    function itemAtPoint(clientX, clientY) {
      const point = bagPoint(clientX, clientY);
      if (!point.inside) return null;
      return getState().items.find((item) => getItemCells(item).some(([x, y]) => x === point.x && y === point.y)) || null;
    }

    return { frame, skyDropAt, bagPoint, itemAtPoint, refreshPalette: () => { palette = null; } };
  }

  window.createCanvasRenderer = createCanvasRenderer;
})();
