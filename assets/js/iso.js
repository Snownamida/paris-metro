/*
 * 等轴测（isometric）分层剖视图渲染器。
 * 用法：window.renderIso(container, model)
 * model = {
 *   footprint: { w, d },                    // 每层楼板的平面尺寸（世界坐标）
 *   levelGap: 95,                           // 相邻楼层的屏幕垂直间距
 *   levels: [{ id, z, tag, label, items: [
 *     { x, y, w, d, h, color: '--css-var', label, labelSide: 'left'|'right', labelDy }
 *   ]}],
 *   connectors: [{ x, y, from, to, label, labelDy }]   // from/to 为 z 值
 * }
 * 楼层 z 值为屏幕高度（0 在最上，负值向下）。点击图例可单独高亮某层。
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const SX = 0.866, SY = 0.5;

  function cssColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";
  }

  function px(x, y, z) {
    return [(x - y) * SX, (x + y) * SY - z];
  }

  function el(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function poly(points, fill, extra) {
    const p = el("polygon", Object.assign({ points: points.map((pt) => pt.join(",")).join(" ") }, extra || {}));
    p.setAttribute("style", "fill:" + fill + (extra && extra._style ? ";" + extra._style : ""));
    p.removeAttribute("_style");
    return p;
  }

  // 画一个长方体：顶面 + 两个可见侧面（+x 侧、+y 侧），侧面用黑色叠加做明暗。
  // opts.opacity < 1 时（楼板）呈半透明，让下层内容透出；opts.outline 给顶面描边。
  function prism(g, x, y, w, d, z, h, color, opts) {
    opts = opts || {};
    const A = px(x, y, z + h), B = px(x + w, y, z + h), C = px(x + w, y + d, z + h), D = px(x, y + d, z + h);
    const Bb = px(x + w, y, z), Cb = px(x + w, y + d, z), Db = px(x, y + d, z);
    const sideX = [B, C, Cb, Bb];   // +x 侧
    const sideY = [C, D, Db, Cb];   // +y 侧
    const parts = [
      poly(sideX, color), poly(sideX, "rgba(0,0,0,0.32)"),
      poly(sideY, color), poly(sideY, "rgba(0,0,0,0.14)"),
    ];
    const top = poly([A, B, C, D], color);
    if (opts.outline) {
      top.setAttribute("stroke-width", "1");
      top.style.stroke = cssColor("--text-dim");
      top.style.strokeOpacity = "0.5";
    }
    parts.push(top);
    parts.forEach(function (p) {
      if (opts.opacity != null) p.setAttribute("opacity", opts.opacity);
      g.appendChild(p);
    });
    return { topCenter: px(x + w / 2, y + d / 2, z + h) };
  }

  window.renderIso = function (container, model) {
    container.innerHTML = "";

    // 图例
    const legend = document.createElement("div");
    legend.className = "iso-legend";
    container.appendChild(legend);

    const svg = el("svg", {});
    container.appendChild(svg);

    const pts = [];
    function track(p) { pts.push(p); return p; }

    const fw = model.footprint.w, fd = model.footprint.d;
    const levels = model.levels.slice().sort((a, b) => a.z - b.z); // 自下而上绘制

    levels.forEach(function (lv) {
      const g = el("g", { class: "iso-level", "data-level": lv.id });

      // 楼板（半透明，让下层内容透出）
      const plateColor = cssColor("--border");
      prism(g, 0, 0, fw, fd, lv.z - 5, 5, plateColor, { opacity: 0.5, outline: true });
      [px(0, 0, lv.z), px(fw, 0, lv.z), px(fw, fd, lv.z), px(0, fd, lv.z)].forEach(track);

      // 楼层内容
      (lv.items || []).forEach(function (it) {
        const color = cssColor(it.color || "--text-dim");
        const info = prism(g, it.x, it.y, it.w, it.d, lv.z, it.h, color);
        track(info.topCenter);
        if (it.label) {
          const side = it.labelSide || "right";
          const lx = side === "right" ? px(fw, 0, lv.z)[0] + 46 : px(0, fd, lv.z)[0] - 46;
          const ly = info.topCenter[1] + (it.labelDy || 0);
          const lead = el("polyline", {
            points: info.topCenter.join(",") + " " + (side === "right" ? lx - 8 : lx + 8) + "," + ly,
            fill: "none", "stroke-width": "1", "stroke-dasharray": "2 3",
          });
          lead.setAttribute("style", "stroke:" + cssColor("--text-dim"));
          g.appendChild(lead);
          const t = el("text", {
            x: lx, y: ly + 4, "font-size": "12.5",
            "text-anchor": side === "right" ? "start" : "end",
          });
          t.setAttribute("style", "fill:" + cssColor("--text"));
          t.textContent = it.label;
          g.appendChild(t);
          track([lx + (side === "right" ? 190 : -190), ly]);
        }
      });

      // 楼层标签（左下角楼板边）
      const corner = px(0, fd, lv.z);
      const tag = el("text", { x: corner[0] - 14, y: corner[1] + 5, "font-size": "15", "font-weight": "700", "text-anchor": "end" });
      tag.setAttribute("style", "fill:" + cssColor("--text-dim"));
      tag.textContent = lv.tag;
      g.appendChild(tag);
      track([corner[0] - 90, corner[1]]);

      svg.appendChild(g);
    });

    // 垂直连接（楼层之间的楼扶梯）
    (model.connectors || []).forEach(function (c) {
      const g = el("g", { class: "iso-connector" });
      const a = px(c.x, c.y, c.from), b = px(c.x, c.y, c.to);
      const line = el("line", {
        x1: a[0], y1: a[1], x2: b[0], y2: b[1],
        "stroke-width": "2.5", "stroke-dasharray": "6 4",
      });
      line.setAttribute("style", "stroke:" + cssColor("--text-dim"));
      g.appendChild(line);
      [a, b].forEach(function (p) {
        const dot = el("circle", { cx: p[0], cy: p[1], r: 3.5 });
        dot.setAttribute("style", "fill:" + cssColor("--text-dim"));
        g.appendChild(dot);
      });
      if (c.label) {
        const t = el("text", { x: a[0] + 8, y: (a[1] + b[1]) / 2 + (c.labelDy || 0), "font-size": "12" });
        t.setAttribute("style", "fill:" + cssColor("--text-dim"));
        t.textContent = c.label;
        g.appendChild(t);
        track([a[0] + 8 + c.label.length * 12, (a[1] + b[1]) / 2]);
      }
      svg.appendChild(g);
    });

    // 视野
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) {
      minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
    });
    const m = 24;
    svg.setAttribute("viewBox", (minX - m) + " " + (minY - m) + " " + (maxX - minX + 2 * m) + " " + (maxY - minY + 2 * m));
    svg.setAttribute("style", "width:100%;height:auto;font-family:inherit;");

    // 图例交互：单击高亮一层，再点「全部」恢复
    const groups = svg.querySelectorAll(".iso-level");
    function setActive(id) {
      groups.forEach(function (g) {
        g.classList.toggle("iso-dim", id !== null && g.dataset.level !== id);
      });
      legend.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("active", b.dataset.level === String(id));
      });
    }
    const allBtn = document.createElement("button");
    allBtn.textContent = "全部楼层";
    allBtn.dataset.level = "null";
    allBtn.addEventListener("click", function () { setActive(null); });
    legend.appendChild(allBtn);
    model.levels.forEach(function (lv) {
      const b = document.createElement("button");
      b.textContent = lv.tag + "：" + lv.label;
      b.dataset.level = lv.id;
      b.addEventListener("click", function () { setActive(lv.id); });
      legend.appendChild(b);
    });

    // 主题切换时重绘（颜色是渲染时解析的）
    if (!container._isoThemeHooked) {
      container._isoThemeHooked = true;
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        window.renderIso(container, model);
      });
    }
  };
})();
