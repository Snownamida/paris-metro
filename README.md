# 巴黎轨道交通手册

巴黎地铁车辆型号与主要枢纽车站结构的图解笔记。纯静态站点，无构建步骤。

## 页面

- `index.html` — 首页
- `rolling-stock.html` — 地铁车厢型号（胶轮/钢轮两表，含换代计划箭头）
- `stations/chatelet-les-halles.html` — Châtelet–Les Halles 车站群结构
- `stations/gare-de-lyon.html` — 巴黎里昂站结构

## 结构

```
assets/css/main.css          全站样式（含 IDFM 线路色变量）
assets/js/site.js            导航注入 + 线路标志渲染
assets/js/rolling-stock.js   车型表与换代箭头渲染器
assets/js/data/              数据文件（车型数据与页面渲染分离）
stations/                    车站结构页
```

## 新增页面

1. 在根目录或 `stations/` 下新建 HTML，引入 `main.css` 和 `site.js`
   （子目录页面把 `data-root` 设为 `../`）；
2. 在 `assets/js/site.js` 的 `PAGES` 数组中加一行即可出现在导航栏。

页面中写 `<span data-line="4"></span>` 会自动渲染成对应线路标志
（RER 用字母：`data-line="A"`）。

## 部署

Cloudflare Pages 直接连接本仓库即可：构建命令留空，输出目录 `/`。
`_headers` 将 `/assets/*` 缓存压到 5 分钟；改动 CSS/JS 时请把各页面
引用处的 `?v=N` 版本号 +1，保证访客立即拿到新资源。

## 数据来源

法语维基百科、RATP、Île-de-France Mobilités。数据核实于 2026 年 7 月。
