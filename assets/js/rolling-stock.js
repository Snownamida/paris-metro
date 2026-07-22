/*
 * 车型页渲染器：
 *  - 从 window.ROLLING_STOCK（assets/js/data/rolling-stock.js）读取数据；
 *  - 每个体系（胶轮/钢轮）渲染一张表：型号按入役年份从旧到新排列；
 *  - transitions 中的换代计划画成 SVG 箭头：从旧型号行内对应线路的
 *    标志出发，经表右侧的走线槽指向新型号所在行。
 */
(function () {
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  const STATUS_LABELS = {
    active: { text: "现役", cls: "st-active" },
    "phasing-out": { text: "退役中", cls: "st-out" },
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
        if (l.note) badge.title = l.note;
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
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("arrow-layer");
    wrap.appendChild(svg);

    panel.appendChild(wrap);
    container.appendChild(panel);

    function drawArrows() {
      svg.innerHTML = "";
      const wrapBox = wrap.getBoundingClientRect();
      svg.setAttribute("width", wrap.scrollWidth);
      svg.setAttribute("height", wrap.scrollHeight);

      (system.transitions || []).forEach(function (t, i) {
        const fromRow = tbody.querySelector('tr[data-model="' + t.from + '"]');
        const toRow = tbody.querySelector('tr[data-model="' + t.to + '"]');
        if (!fromRow || !toRow) return;
        const badge = fromRow.querySelector('.line-item[data-line="' + t.line + '"]');
        if (!badge) return;

        const b = badge.getBoundingClientRect();
        const r = toRow.getBoundingClientRect();
        const table_ = table.getBoundingClientRect();

        // 起点：线路标志右缘；走线槽：表格右侧，按序号错开；终点：目标行右缘
        const x0 = b.right - wrapBox.left + 4;
        const y0 = b.top + b.height / 2 - wrapBox.top;
        const gutterX = table_.right - wrapBox.left + 14 + i * 12;
        const x1 = table_.right - wrapBox.left + 2;
        const y1 = r.top + r.height / 2 - wrapBox.top;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d =
          "M " + x0 + " " + y0 +
          " H " + (gutterX - 10) +
          " Q " + gutterX + " " + y0 + " " + gutterX + " " + (y0 + Math.sign(y1 - y0) * 10) +
          " V " + (y1 - Math.sign(y1 - y0) * 10) +
          " Q " + gutterX + " " + y1 + " " + (gutterX - 10) + " " + y1 +
          " H " + (x1 + 8);
        path.setAttribute("d", d);
        path.setAttribute("class", "arrow-path");
        const color = getComputedStyle(document.documentElement)
          .getPropertyValue("--m" + String(t.line).toLowerCase())
          .trim() || "currentColor";
        path.setAttribute("stroke", color);
        svg.appendChild(path);

        // 箭头头部（指向目标行）
        const head = document.createElementNS("http://www.w3.org/2000/svg", "path");
        head.setAttribute(
          "d",
          "M " + (x1 + 9) + " " + (y1 - 5) + " L " + (x1 + 1) + " " + y1 +
          " L " + (x1 + 9) + " " + (y1 + 5) + " Z"
        );
        head.setAttribute("fill", color);
        svg.appendChild(head);

        if (t.label) {
          const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
          txt.setAttribute("x", gutterX + 6);
          txt.setAttribute("y", (y0 + y1) / 2);
          txt.setAttribute("class", "arrow-label");
          txt.textContent = t.label;
          svg.appendChild(txt);
        }
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
