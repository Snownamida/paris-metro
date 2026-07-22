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

  // 以任意平面多边形为底、向上拉伸 h 的棱柱：顶面 + 各侧面
  // （侧面按远近排序，被遮挡的自然画在下面），侧面按朝向叠加黑色做明暗。
  // 顶点请按顺时针（y 向下的世界坐标系）给出，保证明暗方向一致。
  // opts.opacity < 1 时呈半透明，让下层内容透出；opts.outline 给顶面描边。
  function prismCorners(g, corners, z, h, color, opts) {
    opts = opts || {};
    const n = corners.length;
    const top = corners.map(function (p) { return px(p[0], p[1], z + h); });
    const bot = corners.map(function (p) { return px(p[0], p[1], z); });

    // 侧面：远的先画
    const sides = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ex = corners[j][0] - corners[i][0], ey = corners[j][1] - corners[i][1];
      const len = Math.hypot(ex, ey) || 1;
      const nx = ey / len, ny = -ex / len; // 外法线
      const depth = (corners[i][0] + corners[j][0] + corners[i][1] + corners[j][1]) / 2;
      let shade = 0.05;
      if (nx > 0.5) shade = 0.32;
      else if (ny > 0.5) shade = 0.14;
      else if (nx + ny > 0) shade = 0.22;
      sides.push({ quad: [top[i], top[j], bot[j], bot[i]], shade: shade, depth: depth });
    }
    sides.sort(function (p, q) { return p.depth - q.depth; });

    const parts = [];
    sides.forEach(function (s) {
      parts.push(poly(s.quad, color));
      parts.push(poly(s.quad, "rgba(0,0,0," + s.shade + ")"));
    });
    const topPoly = poly(top, color);
    if (opts.outline) {
      topPoly.setAttribute("stroke-width", "1");
      topPoly.style.stroke = cssColor("--text-dim");
      topPoly.style.strokeOpacity = "0.5";
    }
    parts.push(topPoly);
    parts.forEach(function (p) {
      if (opts.opacity != null) p.setAttribute("opacity", opts.opacity);
      g.appendChild(p);
    });
    let cx = 0, cy = 0;
    corners.forEach(function (p) { cx += p[0]; cy += p[1]; });
    return { topCenter: px(cx / n, cy / n, z + h), angle: opts.angle || 0 };
  }

  // 长方体（可绕中心旋转 angle 度），内部转为多边形棱柱
  function prism(g, x, y, w, d, z, h, color, opts) {
    opts = opts || {};
    const cx = x + w / 2, cy = y + d / 2;
    const a = (opts.angle || 0) * Math.PI / 180;
    const ca = Math.cos(a), sa = Math.sin(a);
    const corners = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]].map(function (p) {
      const dx = p[0] - cx, dy = p[1] - cy;
      return [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca];
    });
    return prismCorners(g, corners, z, h, color, opts);
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
        const info = it.poly
          ? prismCorners(g, it.poly, lv.z, it.h, color, { angle: it.angle, opacity: it.opacity })
          : prism(g, it.x, it.y, it.w, it.d, lv.z, it.h, color, { angle: it.angle, opacity: it.opacity });
        track(info.topCenter);
        // 直接印在顶面上的文字（沿方块长轴铺在面内，跟随旋转角）
        if (it.topLabel) {
          let th = ((it.angle || 0) * Math.PI) / 180;
          // 保证文字从左往右读
          if ((Math.cos(th) - Math.sin(th)) < 0) th += Math.PI;
          const ca = Math.cos(th), sa = Math.sin(th);
          // 文字平面基向量（世界系旋转后投影到屏幕）
          const m = [
            (ca - sa) * SX, (ca + sa) * SY,
            (-sa - ca) * SX, (-sa + ca) * SY,
          ];
          const t = el("text", {
            x: 0, y: 4.5,
            transform: "matrix(" + m[0].toFixed(4) + " " + m[1].toFixed(4) + " " + m[2].toFixed(4) + " " + m[3].toFixed(4) + " " + info.topCenter[0] + " " + info.topCenter[1] + ")",
            "text-anchor": "middle",
            "font-size": it.topLabelSize || 12.5,
            "font-weight": "700",
          });
          t.setAttribute("style", "fill:" + (it.topLabelColor || "#fff"));
          t.textContent = it.topLabel;
          g.appendChild(t);
        }
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
          track([lx + (side === "right" ? 270 : -270), ly]);
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
