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
  onSubmit: () => void;
  onPrev: () => void;
  loading: boolean;
  error?: string;
}

export function ConfirmStep({ formData, onSubmit, onPrev, loading, error }: ConfirmStepProps) {
  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-bold mb-4">Konfirmasi Pendaftaran</h3>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">NIS</span>
            <span className="font-medium">{formData.nis}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">Nama</span>
            <span className="font-medium">{formData.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">Email</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">Kelas</span>
            <span className="font-medium">{formData.class}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700">
            <span className="text-gray-400">GitHub</span>
            <span className="font-medium">{formData.githubUsername || '-'}</span>
          </div>
          <div className="py-2">
            <span className="text-gray-400 block mb-2">Track Minat</span>
            <div className="flex flex-wrap gap-2">
              {formData.tracks.map(t => (
                <span key={t} className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
                  {trackOptions.find(o => o.value === t)?.label.replace(/^[^\s]+\s/, '')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400 text-sm">
        ⚠️ Pastikan data sudah benar. Setelah submit, tunggu persetujuan maintainer.
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onPrev} disabled={loading} className="flex-1 border border-gray-700 hover:border-gray-600 px-4 py-2.5 rounded-lg font-semibold transition">
          ← Kembali
        </button>
        <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-semibold transition">
          {loading ? 'Mendaftarkan...' : 'Konfirmasi & Daftar'}
        </button>
      </div>
    </>
  );
}