/*
 * 巴黎地铁车型数据（核实于 2026-07-22）。
 * 来源：法语维基百科各车型/线路条目、RATP、Alstom、Île-de-France Mobilités。
 *
 * 结构说明：
 *  - models[].lines[]     该车型服务的线路；future: true 表示该线路未来才使用此车型
 *  - systems[].transitions[]  换代计划：from 型号（内含 lines 所列线路）→ to 型号；
 *                             lines[].label 为该线的换代时间
 */
window.ROLLING_STOCK = {
  updated: "2026-07-22",
  note:
    "已退役车型不予列出：MP 59（2024 年 6 月退役，末班于 11 号线）、" +
    "MP 73（2026 年 7 月 8 日退役，末班于 6 号线）。" +
    "1 号线 MP 05 仅有 2035 年前后更新的远期设想，尚无确认计划，故不画箭头。",
  systems: [
    {
      id: "pneu",
      title: "胶轮体系",
      subtitle: "1、4、6、11、14 号线 · 目前没有进行中的换代计划",
      models: [
        {
          id: "MP89CC",
          name: "MP 89 CC",
          year: 1997,
          status: "active",
          note: "有人驾驶版；原 4 号线车辆翻新并缩编为 5 节后转入 6 号线",
          lines: [
            { line: "6", note: "2026 年 7 月 8 日完成接替 MP 73，现为 6 号线唯一车型" },
          ],
        },
        {
          id: "MP89CA",
          name: "MP 89 CA",
          year: 1998,
          status: "active",
          note: "无人驾驶版；随 14 号线换车转入 4 号线（2022 年起）",
          lines: [
            { line: "4", note: "约 21 列，自 14 号线转入" },
          ],
        },
        {
          id: "MP05",
          name: "MP 05",
          year: 2011,
          status: "active",
          note: "无人驾驶",
          lines: [
            { line: "1", note: "56 列，2011 年起；仅有约 2035 年前后更新的远期设想" },
            { line: "4", note: "11 列，自 14 号线转入" },
          ],
        },
        {
          id: "MP14",
          name: "MP 14",
          year: 2020,
          status: "delivering",
          note: "CA 8 节：14 号线；CA 6 节：4 号线；CC 5 节：11 号线（有人驾驶）",
          lines: [
            { line: "4", note: "MP 14 CA 6 节 20 列；2025 年增订 4 列，2027 年前交付" },
            { line: "11", note: "MP 14 CC 5 节 39 列，2023 年起（接替 MP 59）" },
            { line: "14", note: "MP 14 CA 8 节 72 列；2025 年增订 3 列" },
          ],
        },
      ],
      transitions: [],
    },
    {
      id: "fer",
      title: "钢轮体系",
      subtitle: "2、3、3bis、5、7、7bis、8、9、10、12、13 号线 · MF 19 正分批接替 MF 67 / MF 88 / MF 77",
      models: [
        {
          id: "MF67",
          name: "MF 67",
          year: 1967,
          status: "phasing-out",
          note: "现役最老车型，剩约 132 列",
          lines: [
            { line: "3", note: "将换为 MF 19：约 2031–2033" },
            { line: "3bis", note: "将换为 MF 19（4 节版）：2026 年底–2027" },
            { line: "10", note: "与 MF 19 混跑中，2027 年夏替换完毕" },
            { line: "12", note: "将换为 MF 19：约 2028–2030" },
          ],
        },
        {
          id: "MF77",
          name: "MF 77",
          year: 1978,
          status: "active",
          note: "7、8、13 号线车队均已翻新或翻新中（8 号线 2023–2026）",
          lines: [
            { line: "7", note: "将换为 MF 19：约 2033–2035，为最后一批" },
            { line: "8", note: "将换为 MF 19：约 2029–2031" },
            { line: "13", note: "MF 19 已于 2026 年 4 月起在 13 号线试车，2027 年中投入运营" },
          ],
        },
        {
          id: "MF88",
          name: "MF 88",
          year: 1993,
          status: "phasing-out",
          note: "仅 8 列可用，限速 40 km/h",
          lines: [
            { line: "7bis", note: "计划 2026 年底由 MF 19（4 节版）接替" },
          ],
        },
        {
          id: "MF01",
          name: "MF 01",
          year: 2008,
          status: "active",
          note: "又称 MF 2000；无替换计划，2025 年底起分批更换 IDFM 涂装",
          lines: [
            { line: "2", note: "45 列，2008 年起" },
            { line: "5", note: "52 列，2011 年起" },
            { line: "9", note: "74 列，2013 年起" },
          ],
        },
        {
          id: "MF19",
          name: "MF 19",
          year: 2025,
          status: "delivering",
          note: "已确认订单 147 列（合同上限 410 列）；将陆续接替 MF 67、MF 88、MF 77",
          lines: [
            { line: "10", note: "2025 年 10 月 16 日全网首发载客，与 MF 67 混跑" },
            { line: "7bis", future: true, note: "计划 2026 年底" },
            { line: "3bis", future: true, note: "2026 年底–2027" },
            { line: "13", future: true, note: "2027 年中起（约 2035 年转全自动）" },
            { line: "12", future: true, note: "约 2028–2030" },
            { line: "8", future: true, note: "约 2029–2031" },
            { line: "3", future: true, note: "约 2031–2033" },
            { line: "7", future: true, note: "约 2033–2035" },
          ],
        },
      ],
      transitions: [
        {
          from: "MF67",
          to: "MF19",
          label: "2025–2033 分批",
          lines: [
            { line: "10", label: "进行中，2027 年夏完成" },
            { line: "3bis", label: "2026 年底–2027" },
            { line: "12", label: "约 2028–2030" },
            { line: "3", label: "约 2031–2033" },
          ],
        },
        {
          from: "MF77",
          to: "MF19",
          label: "2027–2035 分批",
          lines: [
            { line: "13", label: "2027 年中起" },
            { line: "8", label: "约 2029–2031" },
            { line: "7", label: "约 2033–2035" },
          ],
        },
        {
          from: "MF88",
          to: "MF19",
          label: "2026 年底",
          lines: [{ line: "7bis", label: "2026 年底" }],
        },
      ],
    },
  ],
};
