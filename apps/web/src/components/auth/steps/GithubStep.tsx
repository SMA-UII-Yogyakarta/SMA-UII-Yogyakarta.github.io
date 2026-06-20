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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">Ya, saya punya akun GitHub</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={hasGithub === false}
            onChange={() => {
              onHasGithubChange(false);
              onGithubUsernameChange('');
            }}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">Tidak, saya belum punya akun GitHub</span>
        </label>
      </div>

      {hasGithub && (
        <div>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => onGithubUsernameChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
            placeholder="username"
          />
        </div>
      )}

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
          {hasGithub === null ? 'Pilih dulu →' : (hasGithub === true && githubUsername ? 'Lanjutkan →' : 'Lewati →')}
        </button>
      </div>
    </div>
  );
}