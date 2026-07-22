# 里昂站参考资料

本站页面（平面示意 + 立体剖视）的空间几何依据，核实于 2026 年 7 月。

## SNCF 官方分层平面图（2021 年版）

| 文件 | 内容 |
|---|---|
| `sncf-plan-niveau-0-hall-1-2.pdf` | 0 层：Hall 1（voies A–N）、Hall 2（voies 5–23）、Galerie des Fresques |
| `sncf-plan-niveau--1-galerie-diderot.pdf` | -1 层：Galerie Diderot、站前广场周边、公交 |
| `sncf-plan-niveau--2-rer-metro.pdf` | -2 层：salle d'échanges 换乘大厅、RER/地铁/出口分布 |

来源：SNCF Gares & Connexions 官网发布的乘客版车站平面图
（garesetconnexions.sncf，经 Wayback Machine 存档获取）。
版权归 © SNCF Gares & Connexions 所有，此处仅作本项目制图的参考留存。

## OSM 室内测绘数据

`osm-indoor-geometry.json` — 经 Overpass API 抓取的站内带楼层标签要素
（站台、走廊、换乘大厅等）的完整几何，用于核准各设施的实际相对位置与轴线方位角
（主线站台轴 ≈ -39°，RER 站体与之平行）。
数据 © OpenStreetMap contributors，ODbL 许可。
