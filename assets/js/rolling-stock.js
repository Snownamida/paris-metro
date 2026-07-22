/*
 * 车型页渲染器：
 *  - 从 window.ROLLING_STOCK（assets/js/data/rolling-stock.js）读取数据；
 *  - 每个体系（胶轮/钢轮）渲染一张表：型号按入役年份从旧到新排列；
 *  - transitions 中的换代计划画成 SVG 箭头：从旧型号行内相关线路标志
 *    出发，经表右侧走线槽指向新型号所在行；逐线时间表列在表格下方。
 */
(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function lineColor(line) {
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue("--m" + String(line).toLowerCase())
        .trim() || "currentColor"
    );
  }

  const STATUS_LABELS = {
    active: { text: "现役", cls: "st-active" },
    "phasing-out": { text: "换代中", cls: "st-out" },
    delivering: { text: "交付中", cls: "st-new" },
    future: { text: "未来车型", cls: "st-future" },
  };

  function renderSystem(system, container) {
    const panel = el("section", "panel stock-panel");
    panel.appendChild(el("h2", "stock-title", system.title));
    if (system.subtitle) panel.appendChild(el("p", "stock-subtitle", system.subtitle));

    const wrap = el("div", "stock-table-wrap");
    const table = el("table", "stock-table");
    const thead = el("thead");
    const hr = el("tr");
    hr.appendChild(el("th", null, "型号"));
    hr.appendChild(el("th", null, "使用线路"));
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = el("tbody");
    const models = system.models.slice().sort((a, b) => a.year - b.year);

    models.forEach(function (m) {
      const tr = el("tr");
      tr.dataset.model = m.id;

      const tdModel = el("td", "cell-model");
      const nameRow = el("div", "model-name-row");
      nameRow.appendChild(el("span", "model-name", m.name));
      const st = STATUS_LABELS[m.status];
      if (st) nameRow.appendChild(el("span", "status " + st.cls, st.text));
      tdModel.appendChild(nameRow);
      tdModel.appendChild(el("div", "model-year", m.yearLabel || m.year + " 年入役"));
      if (m.note) tdModel.appendChild(el("div", "model-note", m.note));
      tr.appendChild(tdModel);

      const tdLines = el("td", "cell-lines");
      const lineWrap = el("div", "line-wrap");
      m.lines.forEach(function (l) {
        const item = el("span", "line-item");
        item.dataset.line = l.line;
        const badge = window.lineBadge(l.line, { future: l.future });
        if (l.note) badge.title = l.line + " 号线：" + l.note;
        item.appendChild(badge);
        lineWrap.appendChild(item);
      });
      tdLines.appendChild(lineWrap);
      tr.appendChild(tdLines);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);

    // 箭头图层
    const svg = svgEl("svg", { class: "arrow-layer" });
    wrap.appendChild(svg);
    panel.appendChild(wrap);

    // 逐线换代时间表
    if ((system.transitions || []).length) {
      const sched = el("div", "transition-sched");
      sched.appendChild(el("h3", null, "换代时间表"));
      const ul = el("ul");
      system.transitions.forEach(function (t) {
        const fromName = (system.models.find((m) => m.id === t.from) || {}).name || t.from;
        const toName = (system.models.find((m) => m.id === t.to) || {}).name || t.to;
        t.lines.forEach(function (l) {
          const li = el("li");
          li.appendChild(window.lineBadge(l.line));
          li.appendChild(el("span", null, fromName + " → " + toName + "（" + l.label + "）"));
          ul.appendChild(li);
        });
      });
      sched.appendChild(ul);
      panel.appendChild(sched);
    }

    container.appendChild(panel);

    function drawArrows() {
      svg.innerHTML = "";
      const wrapBox = wrap.getBoundingClientRect();
      svg.setAttribute("width", wrap.scrollWidth);
      svg.setAttribute("height", wrap.scrollHeight);

      (system.transitions || []).forEach(function (t, lane) {
        const fromRow = tbody.querySelector('tr[data-model="' + t.from + '"]');
        const toRow = tbody.querySelector('tr[data-model="' + t.to + '"]');
        if (!fromRow || !toRow) return;

        // 参与换代的线路标志的联合包围盒
        let right = -Infinity, top = Infinity, bottom = -Infinity;
        t.lines.forEach(function (l) {
          const badge = fromRow.querySelector('.line-item[data-line="' + l.line + '"]');
          if (!badge) return;
          const b = badge.getBoundingClientRect();
          right = Math.max(right, b.right);
          top = Math.min(top, b.top);
          bottom = Math.max(bottom, b.bottom);
        });
        if (right === -Infinity) return;

        const tableBox = table.getBoundingClientRect();
        const toBox = toRow.getBoundingClientRect();

        const x0 = right - wrapBox.left + 5;
        const y0 = (top + bottom) / 2 - wrapBox.top;
        const gutterX = tableBox.right - wrapBox.left + 12 + lane * 16;
        const x1 = tableBox.right - wrapBox.left + 2;
        const y1 = toBox.top + toBox.height / 2 - wrapBox.top;
        const s = Math.sign(y1 - y0) || 1;

        const color = lineColor(t.lines[0].line);
        const path = svgEl("path", { class: "arrow-path", stroke: color });
        path.setAttribute(
          "d",
          "M " + x0 + " " + y0 +
          " H " + (gutterX - 10) +
          " Q " + gutterX + " " + y0 + " " + gutterX + " " + (y0 + s * 10) +
          " V " + (y1 - s * 10) +
          " Q " + gutterX + " " + y1 + " " + (gutterX - 10) + " " + y1 +
          " H " + (x1 + 9)
        );
        const fromName = (system.models.find((m) => m.id === t.from) || {}).name || t.from;
        const toName = (system.models.find((m) => m.id === t.to) || {}).name || t.to;
        const tip = svgEl("title", {});
        tip.textContent = fromName + " → " + toName + "：" + (t.label || "");
        path.appendChild(tip);
        svg.appendChild(path);

        const head = svgEl("path", {
          fill: color,
          d:
            "M " + (x1 + 10) + " " + (y1 - 5) + " L " + (x1 + 1) + " " + y1 +
            " L " + (x1 + 10) + " " + (y1 + 5) + " Z",
        });
        svg.appendChild(head);
      });
    }

    // 布局稳定后绘制，窗口变化时重绘
    requestAnimationFrame(drawArrows);
    window.addEventListener("resize", drawArrows);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawArrows);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("stock-container");
    if (!container || !window.ROLLING_STOCK) return;
    window.ROLLING_STOCK.systems.forEach(function (s) {
      renderSystem(s, container);
    });
  });
})();
