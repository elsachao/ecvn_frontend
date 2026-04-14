import { useMemo } from 'react';
import { useRegistration } from '@/contexts/RegistrationContext';

interface RegistrationItem {
  id: string;
  name: string;
  taxId: string;
  type: string;
  status: string;
  updatedAt: string;
}

const mockHistory: RegistrationItem[] = [
  { id: 'APP-24092101', name: '台電綠能聚合商', taxId: '87654321', type: '註冊登記合格交易者', status: '已完成', updatedAt: '2026-04-03' },
  { id: 'APP-24092102', name: '永續綠能科技', taxId: '12345678', type: '資訊變更', status: '審核中', updatedAt: '2026-04-07' },
];

export default function RegistrationOverview() {
  const { appInfo, startNewRegistration } = useRegistration();

  const rows = useMemo<RegistrationItem[]>(
    () => [
      {
        id: appInfo.appId,
        name: appInfo.agentName || '（尚未填寫）',
        taxId: appInfo.taxId || '（尚未填寫）',
        type: appInfo.type || '註冊登記合格交易者',
        status: appInfo.status || '草稿',
        updatedAt: appInfo.date,
      },
      ...mockHistory,
    ],
    [appInfo]
  );

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800">1.1 註冊申請總覽</h3>
            <p className="text-slate-500 mt-2">先從總覽管理申請單，再按「新增註冊」進入 1-2-3 流程。</p>
          </div>
          <button
            onClick={startNewRegistration}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg transition-all hover:scale-[1.02]"
          >
            <i className="fas fa-plus mr-2" />
            新增註冊
          </button>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={`${row.id}-${index}`}
              className="border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all rounded-xl p-4 md:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h4 className="text-lg font-bold text-slate-800">{row.name}</h4>
                <span className="text-xs font-mono text-slate-500">{row.id}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                <div><span className="text-slate-500">統編：</span><span className="font-bold text-slate-700">{row.taxId}</span></div>
                <div><span className="text-slate-500">類型：</span><span className="font-bold text-slate-700">{row.type}</span></div>
                <div><span className="text-slate-500">狀態：</span><span className="font-bold text-blue-700">{row.status}</span></div>
                <div className="lg:col-span-2"><span className="text-slate-500">更新日期：</span><span className="font-bold text-slate-700">{row.updatedAt}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
