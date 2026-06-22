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
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md">
      <h3 className="font-bold mb-4">Data Pribadi</h3>
      <p className="text-gray-400 text-sm mb-4">Data ini diambil dari database {config.features.slimsIntegration ? 'SLiMS' : 'Institusi'}</p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
          <input
            type="text"
            value={formData.name}
            readOnly
            className="w-full bg-gray-950/30 border border-gray-800/60 rounded-xl px-4 py-3 text-sm text-gray-400 opacity-60 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => onFormDataChange({ email: e.target.value })}
            className="w-full bg-gray-950/60 border border-gray-800/80 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 placeholder-gray-600 hover:border-gray-700/80"
            placeholder="email@example.com"
          />
          {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Kelas <span className="text-red-400">*</span></label>
          <select
            value={formData.class}
            onChange={(e) => onFormDataChange({ class: e.target.value })}
            className="w-full bg-gray-950/60 border border-gray-800/80 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 hover:border-gray-700/80 cursor-pointer"
          >
            <option value="">-- Pilih Kelas --</option>
            {classOptions.map((k: string) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          {errors.class && <p className="text-red-400 text-xs mt-1.5">{errors.class}</p>}
        </div>

        {/* Confirmation Checkbox */}
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dataConfirmed}
              onChange={(e) => onDataConfirmedChange(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-800 bg-gray-950 text-yellow-500 focus:ring-yellow-500/40 cursor-pointer"
            />
            <span className="text-sm text-yellow-400 font-medium leading-relaxed">
              Saya menyatakan data di atas sudah benar dan sesuai dengan identitas saya
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onPrev} className="btn-ripple flex-1 border border-gray-800/85 bg-gray-900/40 hover:bg-gray-900/80 text-gray-400 hover:text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300">
          ← Kembali
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`btn-ripple flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
            !canProceed
              ? 'bg-gray-800/50 opacity-40 cursor-not-allowed text-gray-500'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/15'
          }`}
        >
          {!formData.email ? 'Isi email dulu →' : !dataConfirmed ? 'Konfirmasi dulu →' : 'Lanjutkan →'}
        </button>
      </div>
    </div>
  );
}