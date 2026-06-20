import { getSiteConfig } from '@smauii/shared';

const config = getSiteConfig();

interface VerifyStepProps {
  nisn: string;
  onNisnChange: (value: string) => void;
  onVerify: () => void;
  loading: boolean;
  error: string;
  isWarning: boolean;
}

export function VerifyStep({ nisn, onNisnChange, onVerify, loading, error, isWarning }: VerifyStepProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="font-bold mb-4">Verifikasi ID</h3>
      <p className="text-gray-400 text-sm mb-4">
        Masukkan ID (NIS/NIM/Email) untuk verifikasi data dari database {config.institution.shortName}
      </p>

      <div className="mb-4">
        <input
          type="text"
          value={nisn}
          onChange={(e) => {
            onNisnChange(e.target.value.trim().slice(0, 20));
            if (error) onNisnChange(''); // Clear error on change
          }}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
          placeholder="Masukkan ID"
          maxLength={20}
        />
        {error && <p className={`text-xs mt-1 ${isWarning ? 'text-yellow-400' : 'text-red-400'}`}>{error}</p>}
      </div>

      <button
        type="button"
        onClick={onVerify}
        disabled={nisn.length < 3 || loading}
        className={`w-full px-4 py-2.5 rounded-lg font-semibold transition ${
          nisn.length < 3 || loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
        } text-white`}
      >
        {loading ? 'Memverifikasi...' : `Verifikasi dengan ${config.features.slimsIntegration ? 'SLiMS' : 'Database'}`}
      </button>
    </div>
  );
}