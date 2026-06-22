import { trackOptions, type TrackValue } from '@smauii/validation';

interface TracksStepProps {
  selectedTracks: TrackValue[];
  onTrackToggle: (track: TrackValue) => void;
  onNext: () => void;
  onPrev: () => void;
  error?: string;
}

export function TracksStep({ selectedTracks, onTrackToggle, onNext, onPrev, error }: TracksStepProps) {
  const canProceed = selectedTracks.length > 0;

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md">
      <h3 className="font-bold mb-4">Pilih Track Minat</h3>
      <p className="text-gray-400 text-sm mb-4">Pilih 1-3 track yang kamu minati</p>

      <div className="grid md:grid-cols-2 gap-3">
        {trackOptions.map((track: { value: string; label: string }) => (
          <button
            key={track.value}
            type="button"
            onClick={() => onTrackToggle(track.value as TrackValue)}
            className={`text-left p-4 rounded-xl border-2 transition-all duration-300 ${
              selectedTracks.includes(track.value as TrackValue)
                ? 'border-blue-500 bg-blue-500/10 text-white font-semibold shadow-md shadow-blue-500/5'
                : 'border-gray-800/80 hover:border-gray-700 bg-gray-950/40 hover:bg-gray-950/80 text-gray-300 font-semibold'
            }`}
          >
            <span className="font-semibold">{track.label}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

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
          {!canProceed ? 'Pilih track dulu →' : 'Lanjutkan →'}
        </button>
      </div>
    </div>
  );
}