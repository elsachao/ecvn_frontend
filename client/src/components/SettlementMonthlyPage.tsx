import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';

/** 4.2 月結算：簡化四欄桑基（發電 → 儲能 → 用電 → 媒合成功），以 depth 固定欄位。 */
export default function SettlementMonthlyPage() {
  const [enlarge, setEnlarge] = useState(false);

  const option = useMemo<EChartsOption>(() => {
    const nodes = [
      { name: '發電｜太陽能組', depth: 0, itemStyle: { color: '#f59e0b' }, label: { position: 'left' as const } },
      { name: '發電｜風力組', depth: 0, itemStyle: { color: '#ea580c' }, label: { position: 'left' as const } },
      { name: '發電｜其他', depth: 0, itemStyle: { color: '#fb923c' }, label: { position: 'left' as const } },
      { name: '儲能｜調節帳戶', depth: 1, itemStyle: { color: '#7c3aed' }, label: { position: 'inside' as const } },
      { name: '用電｜契約戶甲', depth: 2, itemStyle: { color: '#2563eb' }, label: { position: 'right' as const } },
      { name: '用電｜契約戶乙', depth: 2, itemStyle: { color: '#1d4ed8' }, label: { position: 'right' as const } },
      { name: '用電｜契約戶丙', depth: 2, itemStyle: { color: '#3b82f6' }, label: { position: 'right' as const } },
      { name: '媒合成功', depth: 3, itemStyle: { color: '#059669' }, label: { position: 'right' as const } },
    ];

    const links = [
      { source: '發電｜太陽能組', target: '儲能｜調節帳戶', value: 100 },
      { source: '發電｜太陽能組', target: '用電｜契約戶甲', value: 200 },
      { source: '發電｜風力組', target: '儲能｜調節帳戶', value: 120 },
      { source: '發電｜風力組', target: '用電｜契約戶乙', value: 160 },
      { source: '發電｜其他', target: '儲能｜調節帳戶', value: 80 },
      { source: '發電｜其他', target: '用電｜契約戶丙', value: 140 },
      { source: '儲能｜調節帳戶', target: '用電｜契約戶甲', value: 50 },
      { source: '儲能｜調節帳戶', target: '用電｜契約戶乙', value: 100 },
      { source: '儲能｜調節帳戶', target: '用電｜契約戶丙', value: 150 },
      { source: '用電｜契約戶甲', target: '媒合成功', value: 250 },
      { source: '用電｜契約戶乙', target: '媒合成功', value: 260 },
      { source: '用電｜契約戶丙', target: '媒合成功', value: 290 },
    ];

    return {
      animation: false,
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'sankey',
          left: 12,
          right: 24,
          top: 16,
          bottom: 16,
          nodeWidth: 14,
          nodeGap: 10,
          nodeAlign: 'justify',
          layoutIterations: 32,
          emphasis: { focus: 'adjacency' },
          lineStyle: { color: 'source', curveness: 0.35, opacity: 0.55 },
          label: { color: '#0f172a', fontSize: 11, fontWeight: 700, overflow: 'breakAll' },
          data: nodes,
          links,
        },
      ],
    };
  }, []);

  return (
    <div className="space-y-6 pb-8 text-slate-800">
      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">4.2 月結算｜能源流動總覽（簡化桑基）</h3>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-600">
              由左而右依序為：發電來源 → 儲能調節 → 用電端彙整 → 最右為本月媒合成功總出口。數字為示範用假資料，後續可改接月結算 API。
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

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-[10px] font-black text-slate-600 sm:text-xs">
          <span className="rounded-md bg-amber-50 py-1 text-amber-900">① 發電</span>
          <span className="rounded-md bg-violet-50 py-1 text-violet-900">② 儲能</span>
          <span className="rounded-md bg-blue-50 py-1 text-blue-900">③ 用電</span>
          <span className="rounded-md bg-emerald-50 py-1 text-emerald-900">④ 媒合成功</span>
        </div>

        <div className={`mt-4 ${enlarge ? 'h-[520px]' : 'h-[380px]'} rounded-xl border border-slate-200 bg-white p-2`}>
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
      </section>
    </div>
  );
}
