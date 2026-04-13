import { useRegistration } from '@/contexts/RegistrationContext';
import { toast } from 'sonner';

export default function Step3Storages() {
  const {
    storages, setStep,
    openStorageModal, editStorage, deleteStorage,
    appInfo, contracts,
  } = useRegistration();

  const handleComplete = () => {
    toast.success('代理人註冊與資產綁定已全數完成，資料已寫入系統！', {
      duration: 5000,
    });
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              <i className="fas fa-battery-full mr-2 text-blue-500" />
              代理儲能設施清單
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              綁定儲能設備以執行 ECVN 跨時段綠電調節。此步驟為選填。
            </p>
          </div>
          <button
            onClick={openStorageModal}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow hover:bg-blue-700 transition flex items-center"
          >
            <i className="fas fa-plus mr-2" /> 綁定儲能
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-bold border-r border-white">電號</th>
                <th className="px-4 py-3 font-bold border-r border-white">表號</th>
                <th className="px-4 py-3 font-bold text-right border-r border-white">裝置功率</th>
                <th className="px-4 py-3 font-bold text-right border-r border-white">裝置電量</th>
                <th className="px-4 py-3 font-bold text-right border-r border-white">充電效率</th>
                <th className="px-4 py-3 font-bold text-right border-r border-white">放電效率</th>
                <th className="px-4 py-3 font-bold text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {storages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-bold">
                    尚未綁定儲能設備
                  </td>
                </tr>
              ) : (
                storages.map((storage, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-4 font-mono font-bold text-blue-700">{storage.elecNo}</td>
                    <td className="px-4 py-4 font-mono font-bold text-slate-700">{storage.meterNo}</td>
                    <td className="px-4 py-4 text-right font-black text-slate-700">{storage.power} kW</td>
                    <td className="px-4 py-4 text-right font-black text-slate-700">{storage.capacity} kWh</td>
                    <td className="px-4 py-4 text-right font-black text-emerald-600">{storage.chargeEff}%</td>
                    <td className="px-4 py-4 text-right font-black text-rose-600">{storage.dischargeEff}%</td>
                    <td className="px-4 py-4 text-center space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => editStorage(index)}
                        className="text-blue-500 hover:text-blue-700 transition"
                        title="編輯"
                      >
                        <i className="fas fa-edit" />
                      </button>
                      <button
                        onClick={() => deleteStorage(index)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="刪除"
                      >
                        <i className="fas fa-trash-alt" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t pt-6 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-200 transition"
          >
            返回合約清單
          </button>
          <button
            onClick={handleComplete}
            className="px-8 py-3 rounded-lg font-black text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg"
          >
            <i className="fas fa-check-circle mr-2" /> 完成全部註冊流程
          </button>
        </div>
      </div>
    </div>
  );
}
