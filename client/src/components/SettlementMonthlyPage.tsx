import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';

/** 4.2 月結算：五欄桑基（發電端／儲能餘額 → 合約數量／儲能 → 用電端／轉移量 → 成功匹配／存入／餘電） */
export default function SettlementMonthlyPage() {
  const [enlarge, setEnlarge] = useState(false);

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
      { name: '合約數量', depth: 1, itemStyle: { color: '#4f46e5' }, label: { ...labelCommon, position: 'inside' as const } },
      { name: '儲能', depth: 1, itemStyle: { color: '#7c3aed' }, label: { ...labelCommon, position: 'inside' as const } },
      { name: '用電端', depth: 2, itemStyle: { color: '#2563eb' }, label: { ...labelCommon, position: 'right' as const, distance: 10 } },
      { name: '用電端轉移量', depth: 2, itemStyle: { color: '#1d4ed8' }, label: { ...labelCommon, position: 'right' as const, distance: 10 } },
      { name: '成功匹配量', depth: 3, itemStyle: { color: '#059669' }, label: { ...labelCommon, position: 'right' as const, distance: 12 } },
      { name: '儲能存入量', depth: 3, itemStyle: { color: '#6366f1' }, label: { ...labelCommon, position: 'right' as const, distance: 12 } },
      { name: '餘電', depth: 3, itemStyle: { color: '#ea580c' }, label: { ...labelCommon, position: 'right' as const, distance: 12 } },
    ];

    const links = [
      { source: '發電端', target: '合約數量', value: 650 },
      { source: '發電端', target: '儲能', value: 230 },
      { source: '發電端', target: '餘電', value: 120, lineStyle: { color: '#ef4444' } },
      { source: '儲能餘額', target: '儲能', value: 150 },
      { source: '合約數量', target: '用電端', value: 650, lineStyle: { color: '#22c55e' } },
      { source: '儲能', target: '用電端轉移量', value: 250 },
      { source: '儲能', target: '儲能存入量', value: 130, lineStyle: { color: '#a855f7' } },
      {
        source: '用電端',
        target: '成功匹配量',
        value: 650,
        lineStyle: { color: '#f97316' },
      },
      { source: '用電端轉移量', target: '成功匹配量', value: 250, lineStyle: { color: '#f97316' } },
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
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
          </div>
        </div>
      </section>
    </div>
  );
}
