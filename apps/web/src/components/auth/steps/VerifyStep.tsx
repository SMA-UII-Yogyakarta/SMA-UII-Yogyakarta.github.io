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
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md">
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
          className="w-full bg-gray-950/60 border border-gray-800/80 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 placeholder-gray-600 hover:border-gray-700/80"
          placeholder="Masukkan ID"
          maxLength={20}
        />
        {error && <p className={`text-xs mt-1.5 ${isWarning ? 'text-yellow-400' : 'text-red-400'}`}>{error}</p>}
      </div>

      <button
        type="button"
        onClick={onVerify}
        disabled={nisn.length < 3 || loading}
        className={`btn-ripple w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
          nisn.length < 3 || loading 
            ? 'bg-gray-800/50 opacity-40 cursor-not-allowed text-gray-500' 
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/15'
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>Memverifikasi...</span>
          </>
        ) : (
          <span>Verifikasi dengan {config.features.slimsIntegration ? 'SLiMS' : 'Database'}</span>
        )}
      </button>
    </div>
  );
}