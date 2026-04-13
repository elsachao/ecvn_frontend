import { useRegistration } from '@/contexts/RegistrationContext';
import { STORAGE_FORM_FIELDS } from '@/lib/constants';

export default function StorageModal() {
  const {
    isStorageModalOpen, editStorageIndex, tempStorage,
    closeStorageModal, setTempStorage, saveStorage,
  } = useRegistration();

  if (!isStorageModalOpen) return null;

  const isEditMode = editStorageIndex !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeStorageModal}
      />

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl z-10 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-slate-800">
            <i className="fas fa-battery-full mr-2 text-blue-500" />
            {isEditMode ? '編輯儲能設備' : '新增儲能設備 (完整登錄表單)'}
          </h3>
          <button onClick={closeStorageModal} className="text-slate-400 hover:text-red-500">
            <i className="fas fa-times text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-5">
            {STORAGE_FORM_FIELDS.map((field) => (
              <div key={field.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 transition">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 truncate" title={field.label}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={tempStorage[field.id] || ''}
                  onChange={(e) => setTempStorage(field.id, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm font-mono text-slate-800 focus:bg-white focus:border-blue-500 outline-none transition"
                  placeholder={field.type === 'number' ? '請輸入數字' : (field.type === 'date' ? '' : '請輸入')}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end space-x-3 shrink-0">
          <button onClick={closeStorageModal} className="px-6 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition">
            取消
          </button>
          <button
            onClick={saveStorage}
            disabled={!tempStorage.elecNo}
            className="px-8 py-2.5 rounded-lg font-bold transition shadow-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            <i className="fas fa-save mr-2" /> {isEditMode ? '儲存變更' : '確認綁定'}
          </button>
        </div>
      </div>
    </div>
  );
}
