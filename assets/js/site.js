/*
 * 全站共享脚本：导航注入 + 线路标志渲染。
 * 新增页面时只需在 PAGES 中加一行，并在页面里引入本文件：
 *   <script src="assets/js/site.js" data-root="./"></script>
 * 子目录页面把 data-root 设为 "../"。
 */
(function () {
  const script = document.currentScript;
  const ROOT = script.getAttribute("data-root") || "./";

  const PAGES = [
    { href: "index.html", title: "首页" },
    { href: "rolling-stock.html", title: "地铁车型" },
    { href: "stations/chatelet-les-halles.html", title: "Châtelet–Les Halles" },
    { href: "stations/gare-de-lyon.html", title: "巴黎里昂站" },
  ];

  /* ---- 线路标志 ---- */
  // 深色底用白字，浅色底用深字
  const DARK_TEXT_LINES = new Set([
    "1", "3bis", "5", "6", "7", "7bis", "8", "9", "10", "13",
    "C",
  ]);

  // 生成一个线路小圆标。line 例：'1' '3bis' '14' 'A'（RER 用 rer:true）
  window.lineBadge = function (line, opts) {
    opts = opts || {};
    const span = document.createElement("span");
    const slug = String(line).toLowerCase();
    const isRer = /^[a-e]$/.test(slug);
    span.className = "line" + (isRer ? " rer" : "") + (String(line).length >= 3 ? " long" : "");
    span.style.background = isRer ? `var(--rer-${slug})` : `var(--m${slug})`;
    if (DARK_TEXT_LINES.has(String(line))) span.classList.add("dark-text");
    if (opts.future) {
      span.classList.add("future-line");
      span.title = "该线路未来将使用此车型";
    }
    span.textContent = line;
    return span;
  };

  // 页面中 <span data-line="4"></span> 自动替换为标志
  function hydrateBadges() {
    document.querySelectorAll("[data-line]").forEach(function (el) {
      const badge = window.lineBadge(el.getAttribute("data-line"), {
        future: el.hasAttribute("data-future"),
      });
      el.replaceWith(badge);
    });
  }

  /* ---- 导航 ---- */
  function buildNav() {
    const nav = document.createElement("nav");
    nav.className = "site-nav";
    const inner = document.createElement("div");
    inner.className = "inner";

    const brand = document.createElement("a");
    brand.className = "brand";
    brand.href = ROOT + "index.html";
    brand.textContent = "巴黎轨道交通手册";
    inner.appendChild(brand);

    const here = location.pathname.replace(/\/+$/, "");
    PAGES.forEach(function (p) {
      const a = document.createElement("a");
      a.className = "nav-link";
      a.href = ROOT + p.href;
      a.textContent = p.title;
      if (here.endsWith("/" + p.href) || here.endsWith("/" + p.href.split("/").pop())) {
        a.classList.add("active");
      }
      inner.appendChild(a);
    });

    nav.appendChild(inner);
    document.body.prepend(nav);
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildNav();
    hydrateBadges();
  });
})();
