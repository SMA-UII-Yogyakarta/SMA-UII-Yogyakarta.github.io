interface GithubStepProps {
  hasGithub: boolean | null;
  onHasGithubChange: (value: boolean) => void;
  githubUsername: string;
  onGithubUsernameChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function GithubStep({
  hasGithub,
  onHasGithubChange,
  githubUsername,
  onGithubUsernameChange,
  onNext,
  onPrev,
}: GithubStepProps) {
  const canProceed = hasGithub !== null && (hasGithub === false || githubUsername.trim() !== '');

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-md">
      <h3 className="font-bold mb-4">Akun GitHub</h3>
      <p className="text-gray-400 text-sm mb-4">Apakah kamu punya akun GitHub?</p>

      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasGithub === true}
            onChange={() => {
              onHasGithubChange(true);
              onGithubUsernameChange('');
            }}
            className="w-5 h-5 rounded border-gray-800 bg-gray-950 text-blue-600 focus:ring-blue-500/40 cursor-pointer"
          />
          <span className="text-sm font-medium">Ya, saya punya akun GitHub</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={hasGithub === false}
            onChange={() => {
              onHasGithubChange(false);
              onGithubUsernameChange('');
            }}
            className="w-5 h-5 rounded border-gray-800 bg-gray-950 text-blue-600 focus:ring-blue-500/40 cursor-pointer"
          />
          <span className="text-sm font-medium">Tidak, saya belum punya akun GitHub</span>
        </label>
      </div>

      {hasGithub && (
        <div>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => onGithubUsernameChange(e.target.value)}
            className="w-full bg-gray-950/60 border border-gray-800/80 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 placeholder-gray-600 hover:border-gray-700/80"
            placeholder="username"
          />
        </div>
      )}

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
          {hasGithub === null ? 'Pilih dulu →' : (hasGithub === true && githubUsername ? 'Lanjutkan →' : 'Lewati →')}
        </button>
      </div>
    </div>
  );
}