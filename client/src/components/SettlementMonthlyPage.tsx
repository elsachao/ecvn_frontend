import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';

type GenerationDetailRow = {
  slot: string;
  generation: number;
  toContract: number;
  toStorage: number;
};

/** 4.2 月結算：五欄桑基（發電端／儲能餘額 → 合約數量／儲能 → 用電端／轉移量 → 成功匹配／存入／餘電） */
export default function SettlementMonthlyPage() {
  const [enlarge, setEnlarge] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>('發電端');
  const [openLeftDetail, setOpenLeftDetail] = useState(true);
  const [openRightDetail, setOpenRightDetail] = useState(true);

  const generationRows: GenerationDetailRow[] = [
    { slot: '00:00', generation: 140, toContract: 140, toStorage: 0 },
    { slot: '04:00', generation: 160, toContract: 160, toStorage: 0 },
    { slot: '08:00', generation: 150, toContract: 150, toStorage: 0 },
    { slot: '12:00', generation: 240, toContract: 90, toStorage: 150 },
    { slot: '16:00', generation: 180, toContract: 180, toStorage: 0 },
    { slot: '20:00', generation: 130, toContract: 130, toStorage: 0 },
  ];

  const generationTotals = generationRows.reduce(
    (acc, row) => {
      acc.generation += row.generation;
      acc.toContract += row.toContract;
      acc.toStorage += row.toStorage;
      return acc;
    },
    { generation: 0, toContract: 0, toStorage: 0 },
  );

  const option = useMemo<EChartsOption>(() => {
    const edge = enlarge ? 52 : 44;
    const labelCommon = {
      color: '#0f172a',
      fontSize: enlarge ? 11 : 9,
      fontWeight: 700,
      lineHeight: 15,
      width: enlarge ? 108 : 84,
      distance: 6,
      overflow: 'breakAll' as const,
    };

    const nodes = [
      { name: '發電端', depth: 0, itemStyle: { color: '#f59e0b' }, label: { ...labelCommon, position: 'left' as const, distance: 8 } },
      { name: '儲能餘額', depth: 0, itemStyle: { color: '#0f766e' }, label: { ...labelCommon, position: 'left' as const, distance: 8 } },
      { name: '合約數量', depth: 1, itemStyle: { color: '#92400e' }, label: { ...labelCommon, position: 'inside' as const } },
      { name: '儲能', depth: 1, itemStyle: { color: '#7c3aed' }, label: { ...labelCommon, position: 'inside' as const } },
      { name: '用電端', depth: 2, itemStyle: { color: '#f97316' }, label: { ...labelCommon, position: 'right' as const, distance: 10 } },
      { name: '用電端轉移量', depth: 2, itemStyle: { color: '#f97316' }, label: { ...labelCommon, position: 'right' as const, distance: 10 } },
      { name: '成功匹配量', depth: 3, itemStyle: { color: '#059669' }, label: { ...labelCommon, position: 'right' as const, distance: 12 } },
      { name: '儲能存入量', depth: 3, itemStyle: { color: '#6366f1' }, label: { ...labelCommon, position: 'right' as const, distance: 12 } },
      { name: '餘電', depth: 3, itemStyle: { color: '#ea580c' }, label: { ...labelCommon, position: 'right' as const, distance: 12 } },
    ];

    const links = [
      { source: '發電端', target: '合約數量', value: 650 },
      { source: '發電端', target: '儲能', value: 230 },
      { source: '發電端', target: '餘電', value: 120, lineStyle: { color: '#ef4444' } },
      { source: '儲能餘額', target: '儲能', value: 150 },
      { source: '合約數量', target: '用電端', value: 650, lineStyle: { color: '#f97316' } },
      { source: '儲能', target: '用電端轉移量', value: 250, lineStyle: { color: '#f97316' } },
      { source: '儲能', target: '儲能存入量', value: 130, lineStyle: { color: '#a855f7' } },
      {
        source: '用電端',
        target: '成功匹配量',
        value: 650,
        lineStyle: { color: '#22c55e' },
      },
      { source: '用電端轉移量', target: '成功匹配量', value: 250, lineStyle: { color: '#22c55e' } },
    ];

    return {
      animation: false,
      tooltip: {
        trigger: 'item',
        formatter: (p: unknown) => {
          const item = p as { name?: string; dataType?: string; value?: number };
          if (item.dataType === 'edge') return '';
          return item.name ?? '';
        },
      },
      series: [
        {
          type: 'sankey',
          left: edge,
          right: enlarge ? 140 : 120,
          top: edge,
          bottom: edge,
          nodeWidth: 10,
          nodeGap: enlarge ? 42 : 36,
          nodeAlign: 'justify',
          layoutIterations: 64,
          emphasis: { focus: 'adjacency' },
          draggable: true,
          roam: true,
          lineStyle: { color: 'source', curveness: 0.32, opacity: 0.55 },
          label: labelCommon,
          data: nodes,
          links,
        },
      ],
    };
  }, [enlarge]);

  const chartEvents = {
    click: (params: unknown) => {
      const node = params as { dataType?: string; name?: string };
      if (node.dataType === 'node' && node.name) setActiveNode(node.name);
    },
  };

  return (
    <div className="space-y-6 pb-8 text-slate-800">
      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">4.2 月結算｜能源流動總覽（桑基）</h3>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
              儲能餘額僅流入第二層「儲能」；「餘電」僅由「發電端」直接流入。第三層「用電端」與「用電端轉移量」僅接至最右「成功匹配量」，不連餘電。數字為示範假資料，可改接月結算 API。圖表可左右捲動或拖曳縮放，避免標籤被裁切。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnlarge((v) => !v)}
            className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700"
          >
            {enlarge ? '縮小圖表' : '放大圖表'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-[10px] font-black text-slate-600 sm:grid-cols-5 sm:text-xs">
          <span className="rounded-md bg-amber-50 py-1 text-amber-900">① 發電端／儲能餘額</span>
          <span className="rounded-md bg-indigo-50 py-1 text-indigo-900">② 合約數量／儲能</span>
          <span className="rounded-md bg-blue-50 py-1 text-blue-900">③ 用電端／轉移量</span>
          <span className="rounded-md bg-emerald-50 py-1 text-emerald-900 sm:col-span-2">④ 成功匹配／存入／餘電</span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">
          <div className={`${enlarge ? 'h-[620px] min-w-[1100px]' : 'h-[520px] min-w-[1020px]'}`}>
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} onEvents={chartEvents} />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-600">可點擊節點開啟明細（目前先支援「發電端」左右展開）。</p>
          {activeNode === '發電端' ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => setOpenLeftDetail((v) => !v)}
                  className="w-full rounded-md bg-amber-50 px-3 py-2 text-left text-sm font-bold text-amber-900"
                >
                  發電端左側明細（時段發電）{openLeftDetail ? '▲' : '▼'}
                </button>
                {openLeftDetail ? (
                  <div className="mt-2 space-y-1 text-xs font-semibold text-slate-700">
                    {generationRows.map((row) => (
                      <div key={row.slot} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
                        <span>{row.slot}</span>
                        <span>{row.generation}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-slate-900">
                      <span>合計</span>
                      <span>{generationTotals.generation}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => setOpenRightDetail((v) => !v)}
                  className="w-full rounded-md bg-emerald-50 px-3 py-2 text-left text-sm font-bold text-emerald-900"
                >
                  發電端右側明細（流向拆分）{openRightDetail ? '▲' : '▼'}
                </button>
                {openRightDetail ? (
                  <div className="mt-2 space-y-1 text-xs font-semibold text-slate-700">
                    {generationRows.map((row) => (
                      <div key={`${row.slot}-flow`} className="rounded bg-slate-50 px-2 py-1">
                        <div className="flex items-center justify-between">
                          <span>{row.slot} → 合約數量</span>
                          <span>{row.toContract}</span>
                        </div>
                        {row.toStorage > 0 ? (
                          <div className="mt-1 flex items-center justify-between text-purple-700">
                            <span>{row.slot} → 儲能（10:00-14:00）</span>
                            <span>{row.toStorage}</span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 text-slate-900">
                      <div className="flex items-center justify-between">
                        <span>流向合約總量</span>
                        <span>{generationTotals.toContract}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span>流向儲能總量（10:00-14:00）</span>
                        <span>{generationTotals.toStorage}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-red-600">
                        <span>流向餘電</span>
                        <span>120</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-slate-600">目前先開放「發電端」明細，請點選「發電端」節點查看。</p>
          )}
        </div>
      </section>
    </div>
  );
}
