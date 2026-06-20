import type { RegisterInput } from '@smauii/validation';
import { classOptions } from '@smauii/validation';
import { getSiteConfig } from '@smauii/shared';

const config = getSiteConfig();

interface DataStepProps {
  formData: RegisterInput;
  onFormDataChange: (data: Partial<RegisterInput>) => void;
  onNext: () => void;
  onPrev: () => void;
  errors: Record<string, string>;
  dataConfirmed: boolean;
  onDataConfirmedChange: (value: boolean) => void;
}

export function DataStep({
  formData,
  onFormDataChange,
  onNext,
  onPrev,
  errors,
  dataConfirmed,
  onDataConfirmedChange,
}: DataStepProps) {
  const canProceed = formData.email && dataConfirmed;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="font-bold mb-4">Data Pribadi</h3>
      <p className="text-gray-400 text-sm mb-4">Data ini diambil dari database {config.features.slimsIntegration ? 'SLiMS' : 'Institusi'}</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nama Lengkap</label>
          <input
            type="text"
            value={formData.name}
            readOnly
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 opacity-70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => onFormDataChange({ email: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
            placeholder="email@example.com"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Kelas <span className="text-red-400">*</span></label>
          <select
            value={formData.class}
            onChange={(e) => onFormDataChange({ class: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Pilih Kelas --</option>
            {classOptions.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          {errors.class && <p className="text-red-400 text-xs mt-1">{errors.class}</p>}
        </div>

        {/* Confirmation Checkbox */}
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dataConfirmed}
              onChange={(e) => onDataConfirmedChange(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
            />
            <span className="text-sm text-yellow-400">
              Saya menyatakan data di atas sudah benar dan sesuai dengan identitas saya
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onPrev} className="flex-1 border border-gray-700 hover:border-gray-600 px-4 py-2.5 rounded-lg font-semibold transition">
          ← Kembali
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${
            !canProceed
              ? 'bg-gray-700 cursor-not-allowed text-gray-500'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {!formData.email ? 'Isi email dulu →' : !dataConfirmed ? 'Konfirmasi dulu →' : 'Lanjutkan →'}
        </button>
      </div>
    </div>
  );
}