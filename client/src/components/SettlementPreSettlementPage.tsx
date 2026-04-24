import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';

type HourRow = {
  hour: number;
  generationPlan: number;
  generationActual: number;
  loadPlan: number;
  loadActual: number;
  storagePlan: number;
  storageActual: number;
};

function buildHourlyRows(): HourRow[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const baseGen = hour >= 6 && hour <= 17 ? 55 + Math.sin((hour - 6) / 11 * Math.PI) * 95 : 18;
    const generationPlan = Number(baseGen.toFixed(1));
    const generationActual = Number((generationPlan * (0.93 + ((hour % 5) - 2) * 0.018)).toFixed(1));

    const baseLoad = 72 + Math.cos((hour - 13) / 11 * Math.PI) * 26 + (hour >= 18 && hour <= 22 ? 24 : 0);
    const loadPlan = Number(baseLoad.toFixed(1));
    const loadActual = Number((loadPlan * (0.95 + ((hour % 4) - 1) * 0.02)).toFixed(1));

    const storagePlan = Number((hour >= 11 && hour <= 14 ? 20 + (hour - 11) * 4 : hour >= 18 && hour <= 20 ? -28 + (hour - 18) * 2 : 0).toFixed(1));
    const storageActual = Number((storagePlan * (0.88 + ((hour % 3) - 1) * 0.06)).toFixed(1));

    return {
      hour,
      generationPlan,
      generationActual,
      loadPlan,
      loadActual,
      storagePlan,
      storageActual,
    };
  });
}

function buildSeriesChartOption(title: string, rows: HourRow[], planKey: keyof HourRow, actualKey: keyof HourRow, unit: string): EChartsOption {
  return {
    animation: false,
    title: { text: title, left: 8, top: 4, textStyle: { fontSize: 13, fontWeight: 700, color: '#0f172a' } },
    grid: { top: 34, right: 18, bottom: 46, left: 52, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: { top: 8, right: 10, textStyle: { fontSize: 11, color: '#0f172a', fontWeight: 700 } },
    xAxis: {
      type: 'category',
      data: rows.map((r) => `${String(r.hour).padStart(2, '0')}:00`),
      axisLabel: { fontSize: 10, interval: 3, color: '#0f172a', fontWeight: 600 },
      axisLine: { lineStyle: { color: '#334155', width: 1.3 } },
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: '#0f172a', fontWeight: 700 },
      axisLabel: { fontSize: 10, color: '#0f172a', fontWeight: 600 },
      axisLine: { show: true, lineStyle: { color: '#334155', width: 1.3 } },
      splitLine: { lineStyle: { color: '#94a3b8', width: 1, opacity: 0.65 } },
    },
    series: [
      {
        name: '規劃量',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { type: 'dashed', width: 2, color: '#334155' },
        itemStyle: { color: '#334155' },
        data: rows.map((r) => Number(r[planKey])),
      },
      {
        name: '即時量測',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2.4, color: '#2563eb' },
        itemStyle: { color: '#2563eb' },
        data: rows.map((r) => Number(r[actualKey])),
      },
    ],
  };
}

type SankeyStyleMode = 'ab' | 'c';
type SankeyGranularity = 'summary4h' | 'detail24h';

function pickRowsByGranularity(rows: HourRow[], granularity: SankeyGranularity): HourRow[] {
  if (granularity === 'detail24h') return rows;
  return rows.filter((r) => r.hour % 4 === 0);
}

export default function SettlementPreSettlementPage() {
  const hourlyRows = useMemo(() => buildHourlyRows(), []);

  const allocationRows = useMemo(
    () =>
      hourlyRows.map((row) => {
        const allocated = Math.min(row.generationActual + Math.max(row.storageActual, 0), row.loadPlan);
        const transferred = Math.max(0, Math.min(allocated, row.loadActual));
        return {
          hour: row.hour,
          allocated: Number(allocated.toFixed(1)),
          transferred: Number(transferred.toFixed(1)),
          diff: Number((transferred - row.loadActual).toFixed(1)),
        };
      }),
    [hourlyRows]
  );

  const storageSettlementRows = useMemo(
    () =>
      hourlyRows
        .filter((r) => r.storagePlan !== 0 || r.storageActual !== 0)
        .map((r) => ({
          hour: r.hour,
          plan: r.storagePlan,
          actual: r.storageActual,
          delta: Number((r.storageActual - r.storagePlan).toFixed(1)),
          consistent: Math.abs(r.storageActual - r.storagePlan) <= 3.5,
        })),
    [hourlyRows]
  );

  const [styleMode, setStyleMode] = useState<SankeyStyleMode>('ab');
  const [granularity, setGranularity] = useState<SankeyGranularity>('summary4h');
  const [cExpanded, setCExpanded] = useState(false);
  const [enlargeSankey, setEnlargeSankey] = useState(false);
  const [showSankeyTable, setShowSankeyTable] = useState(false);
  const [showAllocationTable, setShowAllocationTable] = useState(false);
  const [showStorageTable, setShowStorageTable] = useState(false);

  const effectiveGranularity: SankeyGranularity = styleMode === 'ab' ? granularity : cExpanded ? 'detail24h' : 'summary4h';

  const sankeyModel = useMemo(() => {
    const selectedRows = pickRowsByGranularity(hourlyRows, effectiveGranularity);
    const leftNodes = selectedRows.map(
      (row) => `發電端 ${String(row.hour).padStart(2, '0')}:00 (${row.generationActual.toFixed(1)}度)`
    );
    const middleContract = 'ECVN合約與調節帳戶｜合約履行';
    const middleStorage = 'ECVN合約與調節帳戶｜儲能調節帳戶';
    const middleSurplus = 'ECVN合約與調節帳戶｜未履約餘電';
    const rightContractUser = '合約用戶（匹配成功）';
    const rightStorageTimeNodes = selectedRows.map(
      (row) => `儲能 ${String(row.hour).padStart(2, '0')}:00 (${Math.max(Math.abs(row.storageActual), 0.1).toFixed(1)}度)`
    );
    const rightStorageBucket = '儲能時段總覽（點擊展開24時段）';
    const rightStorageBalance = '儲能餘額';
    const rightSurplus = '餘電';
    const showStorageHours = styleMode === 'ab' || cExpanded;
    const storageHourTargets = showStorageHours ? rightStorageTimeNodes : [rightStorageBucket];

    const nodes: Array<{ name: string; itemStyle?: { color: string }; label?: { position: 'left' | 'right' | 'inside' } }> = [
      ...leftNodes.map((name) => ({ name, itemStyle: { color: '#f59e0b' }, label: { position: 'left' as const } })),
      { name: middleContract, itemStyle: { color: '#4f46e5' }, label: { position: 'inside' as const } },
      { name: middleStorage, itemStyle: { color: '#7c3aed' }, label: { position: 'inside' as const } },
      { name: middleSurplus, itemStyle: { color: '#a16207' }, label: { position: 'inside' as const } },
      { name: rightContractUser, itemStyle: { color: '#2563eb' }, label: { position: 'right' as const } },
      ...storageHourTargets.map((name) => ({ name, itemStyle: { color: '#3b82f6' }, label: { position: 'right' as const } })),
      { name: rightStorageBalance, itemStyle: { color: '#10b981' }, label: { position: 'right' as const } },
      { name: rightSurplus, itemStyle: { color: '#f97316' }, label: { position: 'right' as const } },
    ];

    const links: Array<{ source: string; target: string; value: number }> = [];
    let totalContract = 0;
    let totalStorageFlow = 0;
    let totalUnfulfilled = 0;
    let totalStorageBalance = 0;
    let totalSurplus = 0;

    selectedRows.forEach((row, index) => {
      const left = `發電端 ${String(row.hour).padStart(2, '0')}:00 (${row.generationActual.toFixed(1)}度)`;
      const gen = Math.max(row.generationActual, 0);
      const load = Math.max(row.loadActual, 0);
      const storageDispatch = Math.max(-row.storageActual, 0);
      const storageCharge = Math.max(row.storageActual, 0);
      const contractPart = Math.min(gen, load * 0.35);
      const storageAccountPart = Math.max(0, gen - contractPart - storageCharge);
      const unfulfilledPart = Math.max(0, gen - contractPart - storageAccountPart);
      const userMatched = Math.min(load, contractPart + storageAccountPart + storageDispatch);
      const storageBalancePart = Math.max(0, storageCharge - storageDispatch * 0.15);
      const surplusPart = Math.max(0, unfulfilledPart + Math.max(0, gen - userMatched - contractPart));

      totalContract += contractPart;
      totalStorageFlow += storageAccountPart;
      totalUnfulfilled += unfulfilledPart;
      totalStorageBalance += storageBalancePart;
      totalSurplus += surplusPart;

      links.push({ source: left, target: middleContract, value: Number(contractPart.toFixed(1)) });
      links.push({ source: left, target: middleStorage, value: Number(storageAccountPart.toFixed(1)) });
      if (unfulfilledPart > 0.05) {
        links.push({ source: left, target: middleSurplus, value: Number(unfulfilledPart.toFixed(1)) });
      }
      const storageToHour = Number(
        Math.max(0, userMatched - Math.min(contractPart, userMatched) + storageDispatch * 0.25).toFixed(1)
      );
      const storageTarget = storageHourTargets[Math.min(index, storageHourTargets.length - 1)];
      links.push({ source: middleStorage, target: storageTarget, value: storageToHour });
    });

    links.push({ source: middleContract, target: rightContractUser, value: Number(totalContract.toFixed(1)) });
    links.push({ source: middleStorage, target: rightStorageBalance, value: Number(totalStorageBalance.toFixed(1)) });
    links.push({ source: middleSurplus, target: rightSurplus, value: Number(Math.max(totalSurplus, totalUnfulfilled).toFixed(1)) });

    return {
      nodes,
      links: links.filter((l) => l.value > 0.05),
      summary: {
        totalContract: Number(totalContract.toFixed(1)),
        totalStorageFlow: Number(totalStorageFlow.toFixed(1)),
        totalUnfulfilled: Number(totalUnfulfilled.toFixed(1)),
      },
    };
  }, [hourlyRows, effectiveGranularity, styleMode, cExpanded]);

  const sankeyOption = useMemo<EChartsOption>(
    () => ({
      animation: false,
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'sankey',
          left: 6,
          right: 170,
          top: 8,
          bottom: 8,
          emphasis: { focus: 'adjacency' },
          nodeWidth: 12,
          nodeGap: 7,
          draggable: true,
          lineStyle: { color: 'source', curveness: 0.45, opacity: 0.6 },
          label: { color: '#0f172a', fontSize: 11, fontWeight: 600, overflow: 'breakAll' },
          data: sankeyModel.nodes,
          links: sankeyModel.links,
        },
      ],
    }),
    [sankeyModel]
  );

  const genChartOption = useMemo(
    () => buildSeriesChartOption('發電量：規劃 vs 即時', hourlyRows, 'generationPlan', 'generationActual', 'kWh'),
    [hourlyRows]
  );
  const loadChartOption = useMemo(
    () => buildSeriesChartOption('用電量：規劃 vs 即時', hourlyRows, 'loadPlan', 'loadActual', 'kWh'),
    [hourlyRows]
  );
  const storageChartOption = useMemo(
    () => buildSeriesChartOption('儲能量：規劃 vs 即時', hourlyRows, 'storagePlan', 'storageActual', 'kWh'),
    [hourlyRows]
  );

  return (
    <div className="space-y-6 pb-8 text-slate-800">
      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">資料來源：AMI(量測)</span>
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">資料來源：M表(量測)</span>
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">資料來源：計畫量</span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-700">桑基呈現模式：</span>
          <button
            type="button"
            onClick={() => setStyleMode('ab')}
            className={`rounded-full px-3 py-1 text-xs font-bold ${styleMode === 'ab' ? 'bg-blue-700 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
          >
            樣式A+B（推薦）
          </button>
          <button
            type="button"
            onClick={() => setStyleMode('c')}
            className={`rounded-full px-3 py-1 text-xs font-bold ${styleMode === 'c' ? 'bg-indigo-700 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
          >
            樣式C（互動展開）
          </button>
          {styleMode === 'ab' && (
            <>
              <button
                type="button"
                onClick={() => setGranularity('summary4h')}
                className={`rounded-full px-3 py-1 text-xs font-bold ${granularity === 'summary4h' ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
              >
                摘要（每4小時）
              </button>
              <button
                type="button"
                onClick={() => setGranularity('detail24h')}
                className={`rounded-full px-3 py-1 text-xs font-bold ${granularity === 'detail24h' ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}
              >
                詳細（24時段）
              </button>
            </>
          )}
          {styleMode === 'c' && (
            <span className="text-xs font-semibold text-slate-700">
              先看摘要，點「儲能調節帳戶」可切換 24 時段展開。
            </span>
          )}
          <button
            type="button"
            onClick={() => setEnlargeSankey((v) => !v)}
            className="ml-auto rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700"
          >
            {enlargeSankey ? '縮小圖表' : '放大圖表'}
          </button>
        </div>
        <h3 className="text-lg font-bold text-slate-900">4.1 預結算 - 桑基匹配圖</h3>
        <p className="mt-1 text-xs font-semibold text-slate-800">以單日加總量，呈現發電端 → ECVN合約與調節帳戶 → 合約用戶/儲能時段/儲能餘額/餘電。</p>
        <div className={`mt-4 ${enlargeSankey ? 'h-[560px]' : 'h-[360px]'} rounded-xl border border-slate-200 bg-slate-50 p-2`}>
          <ReactECharts
            option={sankeyOption}
            style={{ height: '100%', width: '100%' }}
            onEvents={{
              click: (params: { data?: { name?: string } }) => {
                if (styleMode === 'c' && params.data?.name === 'ECVN合約與調節帳戶｜儲能調節帳戶') {
                  setCExpanded((v) => !v);
                }
              },
            }}
          />
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-800">
          合約履行只流向「合約用戶（匹配成功）」；24 時段節點為「儲能時段價值」，由「儲能調節帳戶」流入。
        </p>
        <button
          type="button"
          onClick={() => setShowSankeyTable((v) => !v)}
          className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-800"
        >
          {showSankeyTable ? '收合詳細表格' : '展開詳細表格'}
        </button>
        {showSankeyTable && <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-900">
              <tr>
                <th className="px-3 py-2 text-left font-bold">中間帳戶</th>
                <th className="px-3 py-2 text-right font-bold">加總量(kWh)</th>
                <th className="px-3 py-2 text-left font-bold">說明</th>
              </tr>
            </thead>
            <tbody className="text-slate-900">
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2">合約履行</td>
                <td className="px-3 py-2 text-right tabular-nums">{sankeyModel.summary.totalContract.toFixed(1)}</td>
                <td className="px-3 py-2">對應右側第一筆「合約用戶（匹配成功）」</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2">儲能調節帳戶</td>
                <td className="px-3 py-2 text-right tabular-nums">{sankeyModel.summary.totalStorageFlow.toFixed(1)}</td>
                <td className="px-3 py-2">流向 24 時段用戶端與儲能餘額</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="px-3 py-2">未履約餘電</td>
                <td className="px-3 py-2 text-right tabular-nums">{sankeyModel.summary.totalUnfulfilled.toFixed(1)}</td>
                <td className="px-3 py-2">流向右側最後一筆「餘電」</td>
              </tr>
            </tbody>
          </table>
        </div>}
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">預結算分配量 / 轉移成功量</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-[260px] rounded-xl border border-slate-200 bg-slate-50 p-2"><ReactECharts option={genChartOption} style={{ height: '100%' }} /></div>
          <div className="h-[260px] rounded-xl border border-slate-200 bg-slate-50 p-2"><ReactECharts option={loadChartOption} style={{ height: '100%' }} /></div>
          <div className="h-[260px] rounded-xl border border-slate-200 bg-slate-50 p-2"><ReactECharts option={storageChartOption} style={{ height: '100%' }} /></div>
        </div>
        <button
          type="button"
          onClick={() => setShowAllocationTable((v) => !v)}
          className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-800"
        >
          {showAllocationTable ? '收合詳細表格' : '展開詳細表格'}
        </button>
        {showAllocationTable && <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-900">
              <tr>
                <th className="px-3 py-2 text-left font-bold">時間</th>
                <th className="px-3 py-2 text-right font-bold">預結算分配量(kWh)</th>
                <th className="px-3 py-2 text-right font-bold">轉移成功量(kWh)</th>
                <th className="px-3 py-2 text-right font-bold">與用電即時差異(kWh)</th>
              </tr>
            </thead>
            <tbody className="text-slate-900">
              {allocationRows.map((r) => (
                <tr key={`alloc-${r.hour}`} className="border-t border-slate-200">
                  <td className="px-3 py-2">{`${String(r.hour).padStart(2, '0')}:00`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.allocated.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.transferred.toFixed(1)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${r.diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{r.diff.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">儲能預結算一致性（計畫量 vs 實際運轉）</h3>
        <p className="mt-1 text-xs font-semibold text-slate-800">計畫量對應申報計畫數值；比對實際運轉是否一致。</p>
        <button
          type="button"
          onClick={() => setShowStorageTable((v) => !v)}
          className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-800"
        >
          {showStorageTable ? '收合詳細表格' : '展開詳細表格'}
        </button>
        {showStorageTable && <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-900">
              <tr>
                <th className="px-3 py-2 text-left font-bold">時間</th>
                <th className="px-3 py-2 text-right font-bold">計畫量(kWh)</th>
                <th className="px-3 py-2 text-right font-bold">實際運轉(kWh)</th>
                <th className="px-3 py-2 text-right font-bold">差異(kWh)</th>
                <th className="px-3 py-2 text-center font-bold">一致性</th>
              </tr>
            </thead>
            <tbody className="text-slate-900">
              {storageSettlementRows.map((r) => (
                <tr key={`storage-settlement-${r.hour}`} className="border-t border-slate-200">
                  <td className="px-3 py-2">{`${String(r.hour).padStart(2, '0')}:00`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.plan.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.actual.toFixed(1)}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${r.delta === 0 ? 'text-slate-700' : r.delta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{r.delta.toFixed(1)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.consistent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.consistent ? '一致' : '需調整'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </section>
    </div>
  );
}
