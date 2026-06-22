import { trackOptions, type TrackValue } from '@smauii/validation';

interface ConfirmStepProps {
  formData: {
    nis: string;
    name: string;
    email: string;
    class: string;
    githubUsername?: string;
    tracks: TrackValue[];
  };
  onPrev: () => void;
  loading: boolean;
  error?: string;
}

export function ConfirmStep({ formData, onPrev, loading, error }: ConfirmStepProps) {
  return (
    <>
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md">
        <h3 className="font-bold mb-4">Konfirmasi Pendaftaran</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-800/80">
            <span className="text-gray-400">NIS</span>
            <span className="font-medium text-gray-200">{formData.nis}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800/80">
            <span className="text-gray-400">Nama</span>
            <span className="font-medium text-gray-200">{formData.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800/80">
            <span className="text-gray-400">Email</span>
            <span className="font-medium text-gray-200">{formData.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800/80">
            <span className="text-gray-400">Kelas</span>
            <span className="font-medium text-gray-200">{formData.class}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800/80">
            <span className="text-gray-400">GitHub</span>
            <span className="font-medium text-gray-200">{formData.githubUsername || '-'}</span>
          </div>
          <div className="py-2">
            <span className="text-gray-400 block mb-2">Track Minat</span>
            <div className="flex flex-wrap gap-2">
              {formData.tracks.map(t => (
                <span key={t} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-semibold">
                  {trackOptions.find((o: { value: string }) => o.value === t)?.label.replace(/^[^\s]+\s/, '')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400 text-sm font-medium leading-relaxed">
        ⚠️ Pastikan data sudah benar. Setelah submit, tunggu persetujuan maintainer.
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onPrev} disabled={loading} className="btn-ripple flex-1 border border-gray-800/85 bg-gray-900/40 hover:bg-gray-900/80 text-gray-400 hover:text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300">
          ← Kembali
        </button>
        <button type="submit" disabled={loading} className="btn-ripple flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-800/50 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-green-600/10">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Mendaftarkan...</span>
            </>
          ) : (
            <span>Konfirmasi & Daftar</span>
          )}
        </button>
      </div>
    </>
  );
}