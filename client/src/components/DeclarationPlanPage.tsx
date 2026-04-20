import { useRegistration, type PlanSection } from '@/contexts/RegistrationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal, { type SweetAlertIcon } from 'sweetalert2';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const INTERVAL_COUNT = 96;
const MIN_KW = 0;
const MAX_KW = 50;

function buildIntervalLabels(): string[] {
  return Array.from({ length: INTERVAL_COUNT }, (_, i) => {
    const h = Math.floor(i / 4)
      .toString()
      .padStart(2, '0');
    const m = ((i % 4) * 15).toString().padStart(2, '0');
    return `${h}:${m}`;
  });
}

const INTERVAL_LABELS = buildIntervalLabels();

type ResourceCategory = 'gen' | 'load' | 'bess';
type ResourceSeries = { id: string; data: number[] };

function clampToKwRange(v: number): number {
  if (!Number.isFinite(v)) return MIN_KW;
  if (v < MIN_KW) return MIN_KW;
  if (v > MAX_KW) return MAX_KW;
  return v;
}

function createInitialStore(): Record<ResourceCategory, ResourceSeries[]> {
  return {
    gen: [1, 2, 3, 4, 5].map((i) => ({
      id: `G${i}`,
      data: INTERVAL_LABELS.map(() => clampToKwRange(12 + i * 5 + Math.random() * 3)),
    })),
    load: [1, 2, 3, 4, 5].map((i) => ({
      id: `L${i}`,
      data: INTERVAL_LABELS.map(() => clampToKwRange(10 + i * 4 + Math.random() * 4)),
    })),
    bess: [1, 2, 3].map((i) => ({
      id: `B${i}`,
      data: INTERVAL_LABELS.map(() => clampToKwRange(8 + i * 4 + Math.random() * 3)),
    })),
  };
}

function sumSeriesAt(
  store: Record<ResourceCategory, ResourceSeries[]>,
  cat: ResourceCategory,
  i: number
) {
  return store[cat].reduce((acc, s) => acc + s.data[i], 0);
}

const GEN_LINE_COLORS = ['#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#10b981']; // 藍→綠
const LOAD_LINE_COLORS = ['#dc2626', '#ef4444', '#f97316', '#fb923c', '#f59e0b']; // 紅→橘
const BESS_BAR_COLORS = ['#2563eb', '#4f46e5', '#7c3aed']; // 藍→紫

const SUMMARY_CARD_STATS = [
  {
    title: '發電總量 (G)',
    value: '3298.2',
    unit: 'kW',
    icon: 'fas fa-solar-panel',
    accent: 'border-t-sky-500',
    iconColor: 'text-sky-600',
  },
  {
    title: '用電總量 (L)',
    value: '2998.3',
    unit: 'kW',
    icon: 'fas fa-bolt',
    accent: 'border-t-orange-500',
    iconColor: 'text-orange-600',
  },
  {
    title: '儲能狀態 (BESS)',
    value: '-10.3',
    unit: 'kW',
    icon: 'fas fa-battery-three-quarters',
    accent: 'border-t-violet-600',
    iconColor: 'text-violet-600',
  },
] as const;

function popup(icon: SweetAlertIcon, title: string, text: string) {
  void Swal.fire({
    icon,
    title,
    text,
    timer: 1800,
    timerProgressBar: true,
    showConfirmButton: false,
    position: 'center',
  });
}

export default function DeclarationPlanPage() {
  const { declarationPlanSection, declarationPlanNavSeq, currentView } = useRegistration();

  const [store, setStore] = useState(createInitialStore);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('資料上傳');
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modifyCategory, setModifyCategory] = useState<ResourceCategory>('gen');
  const [modifyTargetIndex, setModifyTargetIndex] = useState(0);
  const [refCode, setRefCode] = useState('REF-EDIT-99');
  const [editBuffer, setEditBuffer] = useState<number[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentView !== 'declaration-plan') return;
    const el = document.getElementById(`declaration-section-${declarationPlanSection}`);
    requestAnimationFrame(() => {
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [currentView, declarationPlanSection, declarationPlanNavSeq]);

  const summaryRows = useMemo(() => {
    return INTERVAL_LABELS.map((time, i) => ({
      time,
      gen: sumSeriesAt(store, 'gen', i),
      load: sumSeriesAt(store, 'load', i),
      bess: sumSeriesAt(store, 'bess', i),
    }));
  }, [store]);

  const genRows = useMemo(() => {
    return INTERVAL_LABELS.map((time, i) => {
      const row: Record<string, string | number> = { time };
      store.gen.forEach((g, j) => {
        row[`g${j}`] = g.data[i];
      });
      return row;
    });
  }, [store]);

  const loadRows = useMemo(() => {
    return INTERVAL_LABELS.map((time, i) => {
      const row: Record<string, string | number> = { time };
      store.load.forEach((g, j) => {
        row[`l${j}`] = g.data[i];
      });
      return row;
    });
  }, [store]);

  const bessRows = useMemo(() => {
    return INTERVAL_LABELS.map((time, i) => {
      const row: Record<string, string | number> = { time };
      store.bess.forEach((g, j) => {
        row[`b${j}`] = g.data[i];
      });
      return row;
    });
  }, [store]);

  const openUpload = (title: string) => {
    setUploadTitle(title);
    popup('info', '提示', '請上傳 CSV 檔案');
    setUploadOpen(true);
  };

  const openModify = (preset?: ResourceCategory) => {
    const cat = preset ?? 'gen';
    setModifyCategory(cat);
    setModifyTargetIndex(0);
    setModifyOpen(true);
  };

  useEffect(() => {
    if (!modifyOpen) return;
    const series = store[modifyCategory][modifyTargetIndex];
    if (series) setEditBuffer([...series.data]);
  }, [modifyOpen, modifyCategory, modifyTargetIndex, store]);

  const validateAndClampValue = useCallback(
    (raw: number, interval: string): number => {
      const clamped = clampToKwRange(raw);
      if (!Number.isFinite(raw) || raw !== clamped) {
        popup('warning', '警告', `${interval} 超出範圍，已自動修正為 ${clamped.toFixed(3)} kW`);
      }
      return clamped;
    },
    []
  );

  const updateEditValue = useCallback((index: number, value: number) => {
    setEditBuffer((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const validateIndexOnBlur = useCallback(
    (index: number) => {
      setEditBuffer((prev) => {
        const next = [...prev];
        next[index] = validateAndClampValue(next[index], INTERVAL_LABELS[index]);
        return next;
      });
    },
    [validateAndClampValue]
  );

  const saveModify = () => {
    if (!refCode.trim()) {
      popup('error', '錯誤', '請輸入參考碼後再提交');
      return;
    }
    const newData = editBuffer.map((v, i) => validateAndClampValue(v, INTERVAL_LABELS[i]));
    setStore((prev) => ({
      ...prev,
      [modifyCategory]: prev[modifyCategory].map((s, i) =>
        i === modifyTargetIndex ? { ...s, data: newData } : s
      ),
    }));
    popup('success', '成功', `資源 ${store[modifyCategory][modifyTargetIndex]?.id} 已更新`);
    setModifyOpen(false);
  };

  const chartWrap = 'h-[320px] w-full min-h-[280px]';
  const sectionTitleClass = 'border-b border-slate-300 pb-2 text-lg font-bold text-slate-900';
  const axisStyle = { fontSize: 10, fill: '#0f172a' };
  const tooltipFormatter = (value: number) => [`${Number(value).toFixed(3)} kW`, ''];
  const firstInterval = summaryRows[0] ?? { gen: 0, load: 0, bess: 0 };
  const surplusKw = Math.max(firstInterval.gen - firstInterval.load, 0);
  const unstoredSurplusKw = Math.max(surplusKw - firstInterval.bess, 0);
  const lampConfig =
    unstoredSurplusKw > 3
      ? { color: 'bg-red-500', text: 'text-red-700', label: '危險', icon: 'fas fa-triangle-exclamation' }
      : unstoredSurplusKw > 1
        ? { color: 'bg-orange-500', text: 'text-orange-700', label: '注意', icon: 'fas fa-circle-exclamation' }
        : { color: 'bg-emerald-500', text: 'text-emerald-700', label: '正常', icon: 'fas fa-circle-check' };

  return (
    <div className="space-y-6 pb-10">
      {/* 3.1 總量 */}
      <section id="declaration-section-total" className="scroll-mt-28 space-y-6">
        <h2 className={sectionTitleClass}>3.1 總量</h2>
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-4 w-4 rounded-full ${lampConfig.color}`} />
              <p className={`text-sm font-bold ${lampConfig.text}`}>
                <i className={`${lampConfig.icon} mr-2`} />
                餘電燈號：{lampConfig.label}（未儲存餘電 {unstoredSurplusKw.toFixed(3)} kW）
              </p>
            </div>
            <p className="text-xs font-semibold text-slate-700">
              計算：餘電 = max(發電 - 用電, 0)，未儲存餘電 = max(餘電 - 儲能吸收, 0)
            </p>
          </div>
          {/* 網頁註解：綠色 <= 1kW，橘色 > 1kW，紅色 > 3kW */}
          <p className="mt-2 text-xs text-slate-700">
            註解：若未儲存餘電超過 1 kW 顯示橘燈；超過 3 kW 顯示紅燈；其餘顯示綠燈。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SUMMARY_CARD_STATS.map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border border-slate-300 bg-white p-6 shadow-sm border-t-4 ${card.accent}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700">{card.title}</p>
                <i className={`${card.icon} ${card.iconColor} text-lg`} />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {card.value} <span className="text-sm font-medium text-slate-700">{card.unit}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-bold text-slate-900">全資源覆蓋趨勢圖（kW）</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-400 text-slate-800 hover:bg-slate-100"
                onClick={() => openUpload('總表資源上傳')}
              >
                上傳
              </Button>
              <Button type="button" className="bg-blue-700 text-white hover:bg-blue-800" onClick={() => openModify('gen')}>
                調整
              </Button>
            </div>
          </div>
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={summaryRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" />
                <XAxis dataKey="time" tick={axisStyle} interval={7} />
                <YAxis tick={axisStyle}>
                  <Label value="kW" angle={-90} position="insideLeft" fill="#0f172a" />
                </YAxis>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#94a3b8', color: '#0f172a' }}
                  formatter={tooltipFormatter}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#0f172a' }} />
                <Line type="monotone" dataKey="gen" name="發電 (kW)" stroke="#0ea5e9" strokeWidth={2.2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="load"
                  name="用電 (kW)"
                  stroke="#ef4444"
                  strokeWidth={2.2}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Bar dataKey="bess" name="儲能 (kW)" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={6} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 3.2 負載預測 */}
      <section id="declaration-section-load" className="scroll-mt-28 space-y-4">
        <h2 className={sectionTitleClass}>3.2 負載預測</h2>
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm md:p-8 border-t-4 border-t-rose-500">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-bold text-slate-900">用電明細：L 系列用戶（kW）</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-400 text-slate-800 hover:bg-slate-100"
                onClick={() => openUpload('用電用戶資料上傳')}
              >
                上傳
              </Button>
              <Button type="button" className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => openModify('load')}>
                修改
              </Button>
            </div>
          </div>
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loadRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" />
                <XAxis dataKey="time" tick={axisStyle} interval={7} />
                <YAxis tick={axisStyle}>
                  <Label value="kW" angle={-90} position="insideLeft" fill="#0f172a" />
                </YAxis>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#94a3b8', color: '#0f172a' }}
                  formatter={tooltipFormatter}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#0f172a' }} />
                {store.load.map((obj, i) => (
                  <Line
                    key={obj.id}
                    type="monotone"
                    dataKey={`l${i}`}
                    name={`用戶 ${obj.id} (kW)`}
                    stroke={LOAD_LINE_COLORS[i % LOAD_LINE_COLORS.length]}
                    strokeWidth={2.2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 3.3 再生能源預測 */}
      <section id="declaration-section-renewable" className="scroll-mt-28 space-y-4">
        <h2 className={sectionTitleClass}>3.3 再生能源預測</h2>
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm md:p-8 border-t-4 border-t-cyan-500">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-bold text-slate-900">發電明細：G 系列案場（kW）</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-400 text-slate-800 hover:bg-slate-100"
                onClick={() => openUpload('發電案場資料上傳')}
              >
                上傳
              </Button>
              <Button type="button" className="bg-cyan-600 text-white hover:bg-cyan-700" onClick={() => openModify('gen')}>
                修改
              </Button>
            </div>
          </div>
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={genRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" />
                <XAxis dataKey="time" tick={axisStyle} interval={7} />
                <YAxis tick={axisStyle}>
                  <Label value="kW" angle={-90} position="insideLeft" fill="#0f172a" />
                </YAxis>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#94a3b8', color: '#0f172a' }}
                  formatter={tooltipFormatter}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#0f172a' }} />
                {store.gen.map((obj, i) => (
                  <Line
                    key={obj.id}
                    type="monotone"
                    dataKey={`g${i}`}
                    name={`場號 ${obj.id} (kW)`}
                    stroke={GEN_LINE_COLORS[i % GEN_LINE_COLORS.length]}
                    strokeWidth={2.2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 3.4 儲能計畫 */}
      <section id="declaration-section-storage" className="scroll-mt-28 space-y-4">
        <h2 className={sectionTitleClass}>3.4 儲能計畫</h2>
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm md:p-8 border-t-4 border-t-indigo-600">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">儲能明細：BESS 排程（kW）</h3>
              <p className="mt-1 text-sm font-semibold text-indigo-700">堆疊圖</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-400 text-slate-800 hover:bg-slate-100"
                onClick={() => openUpload('儲能站點資料上傳')}
              >
                上傳
              </Button>
              <Button type="button" className="bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => openModify('bess')}>
                修改
              </Button>
            </div>
          </div>
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bessRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" />
                <XAxis dataKey="time" tick={axisStyle} interval={7} />
                <YAxis tick={axisStyle}>
                  <Label value="kW" angle={-90} position="insideLeft" fill="#0f172a" />
                </YAxis>
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: '#94a3b8', color: '#0f172a' }}
                  formatter={tooltipFormatter}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#0f172a' }} />
                {store.bess.map((obj, i) => (
                  <Bar
                    key={obj.id}
                    dataKey={`b${i}`}
                    name={`儲能站 ${obj.id} (kW)`}
                    stackId="bess"
                    fill={BESS_BAR_COLORS[i % BESS_BAR_COLORS.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 3.5 COP */}
      <section id="declaration-section-cop" className="scroll-mt-28 space-y-4">
        <h2 className={sectionTitleClass}>3.5 COP 申報與公告</h2>
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm md:p-8">
          <p className="mb-6 text-sm leading-relaxed text-slate-800">
            此區用於 COP（Capacity Obligation Program）相關申報與市場公告檢視。以下為介面占位，實際送出須對接後端 API。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" className="bg-slate-900 text-white hover:bg-slate-800">
              <i className="fas fa-file-signature mr-2" />
              申報草稿
            </Button>
            <Button type="button" variant="outline" className="border-slate-400 text-slate-800 hover:bg-slate-100">
              <i className="fas fa-bullhorn mr-2" />
              公告紀錄
            </Button>
          </div>
        </div>
      </section>

      {/* 上傳 Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setUploadOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-300 bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-lg font-bold text-slate-900">{uploadTitle}</h3>
            <div className="mb-8 space-y-4">
              <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-400 bg-slate-100 p-8">
                <i className="fas fa-file-csv mb-3 text-3xl text-blue-600" />
                <p className="mb-4 text-center text-sm font-semibold text-slate-800">拖放或點擊選擇 CSV 檔案</p>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) popup('info', '提示', `已選取：${f.name}`);
                  }}
                />
                <Button
                  type="button"
                  className="bg-blue-700 text-white hover:bg-blue-800"
                  onClick={() => csvInputRef.current?.click()}
                >
                  選擇 CSV 檔案
                </Button>
              </div>
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-700">
                支援格式：MVRN 標準 CSV 檔
              </p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1 text-slate-800 hover:bg-slate-100" onClick={() => setUploadOpen(false)}>
                取消
              </Button>
              <Button
                type="button"
                className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => {
                  popup('success', '成功', '已模擬批次更新 G/L/BESS 資料');
                  setUploadOpen(false);
                }}
              >
                完成上傳
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 修改 Modal */}
      {modifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setModifyOpen(false)} />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-300 bg-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">智慧資源修改面板</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Interval Adjustment（96 時段，範圍 0~50 kW）
                </p>
              </div>
              <button type="button" className="text-slate-700 hover:text-slate-900" onClick={() => setModifyOpen(false)}>
                <i className="fas fa-times text-xl" />
              </button>
            </div>

            <div className="grid shrink-0 gap-4 border-b border-slate-300 p-6 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-700">資源類別</label>
                <Select
                  value={modifyCategory}
                  onValueChange={(v) => {
                    setModifyCategory(v as ResourceCategory);
                    setModifyTargetIndex(0);
                  }}
                >
                  <SelectTrigger className="border-slate-400 bg-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gen">發電明細 (G)</SelectItem>
                    <SelectItem value="load">用電明細 (L)</SelectItem>
                    <SelectItem value="bess">儲能明細 (BESS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-700">具體對象</label>
                <Select
                  value={String(modifyTargetIndex)}
                  onValueChange={(v) => setModifyTargetIndex(Number(v))}
                >
                  <SelectTrigger className="border-slate-400 bg-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {store[modifyCategory].map((obj, idx) => (
                      <SelectItem key={obj.id} value={String(idx)}>
                        {obj.id} 資源案場
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-700">參考碼</label>
                <Input
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="border-slate-400 bg-white font-mono text-sm text-slate-900"
                />
              </div>
            </div>

            <ScrollArea className="h-[50vh] border-b border-slate-300">
              <div>
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white shadow-sm">
                    <tr className="border-b border-slate-300 text-xs font-bold uppercase text-slate-700">
                      <th className="p-3 pl-6">時段</th>
                      <th className="p-3 text-center">調整量 (kW)</th>
                      <th className="p-3 pr-6">滑動調節 (0~50 kW)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INTERVAL_LABELS.map((time, i) => (
                      <tr key={time} className="border-b border-slate-200 hover:bg-slate-100/80">
                        <td className="p-3 pl-6 font-mono text-xs font-semibold text-slate-800">{time}</td>
                        <td className="p-3 text-center">
                          <Input
                            type="number"
                            step="0.001"
                            className="mx-auto w-36 border-slate-400 text-center font-mono text-sm text-slate-900"
                            value={editBuffer[i] ?? 0}
                            onChange={(e) => updateEditValue(i, Number.parseFloat(e.target.value))}
                            onBlur={() => validateIndexOnBlur(i)}
                          />
                        </td>
                        <td className="p-3 pr-6">
                          <Slider
                            min={MIN_KW}
                            max={MAX_KW}
                            step={0.001}
                            value={[clampToKwRange(editBuffer[i] ?? 0)]}
                            onValueChange={(vals) => updateEditValue(i, vals[0] ?? 0)}
                            onValueCommit={() => validateIndexOnBlur(i)}
                            className="[&_[data-slot=slider-track]]:bg-blue-200 [&_[data-slot=slider-range]]:bg-blue-600 [&_[data-slot=slider-thumb]]:border-blue-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            <div className="flex shrink-0 flex-wrap gap-3 p-6">
              <Button type="button" variant="ghost" className="text-slate-800 hover:bg-slate-100" onClick={() => setModifyOpen(false)}>
                放棄修改
              </Button>
              <Button
                type="button"
                className="flex-1 bg-blue-700 text-white hover:bg-blue-800 sm:flex-none sm:px-10"
                onClick={saveModify}
              >
                確認提交變更並更新圖表
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
