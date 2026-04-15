import { useState } from 'react';
import { registerSchema, trackOptions, type RegisterInput } from '@lib/validation';
import type { ZodError } from 'zod';

type RegistrationStep = 'verify' | 'data' | 'github' | 'tracks' | 'confirm';

export default function RegisterForm() {
  const [nisn, setNisn] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<RegistrationStep>('verify');
  const [error, setError] = useState('');
  const [hasGithub, setHasGithub] = useState<boolean | null>(null);
  const [dataConfirmed, setDataConfirmed] = useState(false);

  const [formData, setFormData] = useState<RegisterInput>({
    nisn: '',
    nis: '',
    name: '',
    email: '',
    class: '',
    githubUsername: '',
    tracks: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTrackToggle = (track: string) => {
    setFormData(prev => {
      const tracks = prev.tracks.includes(track as any)
        ? prev.tracks.filter(t => t !== track)
        : [...prev.tracks, track as any];
      return { ...prev, tracks };
    });
  };

  const nextStep = () => {
    const stepOrder: RegistrationStep[] = ['verify', 'data', 'github', 'tracks', 'confirm'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const stepOrder: RegistrationStep[] = ['verify', 'data', 'github', 'tracks', 'confirm'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const verifyWithSlims = async () => {
    if (!nisn.trim()) {
      setError('NISN harus diisi');
      return;
    }

    setError('');
    setLoading(true);
    setHasGithub(null);
    setDataConfirmed(false);

    try {
      // Check if user already exists
      const checkResponse = await fetch(`/api/register?nisn=${encodeURIComponent(nisn.trim())}`);
      const checkResult = await checkResponse.json();
      
      if (!checkResponse.ok && checkResult.code === 'USER_EXISTS') {
        setError('User dengan NISN/NIS/Email ini sudah terdaftar');
        return;
      }

      const response = await fetch('/api/slims/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisn: nisn.trim() }),
      });

      const result = await response.json();
      const data = result.data;

      if (!response.ok) {
        if (result.code === 'MEMBER_NOT_FOUND') {
          setError('NISN tidak ditemukan di SLiMS');
          return;
        }
        throw new Error(result.error || 'Verifikasi gagal');
      }

      if (data.isPending) {
        setError('Anggota ini dalam status pending');
        return;
      }

      if (data.isExpired) {
        setError(`Keanggotaan expired pada ${data.expiredAt}`);
        return;
      }

      setFormData(prev => ({
        ...prev,
        nisn: data.nisn || nisn.trim(),
        nis: data.nis || data.nisn || nisn.trim(),
        name: data.name,
        email: data.email || '',
        class: data.class,
      }));
      setStep('data');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verifikasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {};
    
    if (step === 'data') {
      if (!formData.email) newErrors.email = 'Email harus diisi';
    } else if (step === 'tracks') {
      if (formData.tracks.length === 0) newErrors.tracks = 'Pilih minimal 1 track';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    nextStep();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validated = registerSchema.parse(formData);
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Pendaftaran gagal');
      }

      window.location.href = `/success?nisn=${encodeURIComponent(formData.nisn)}`;
    } catch (err) {
      if (err instanceof Error && 'issues' in err) {
        const zodError = err as ZodError;
        const fieldErrors: Record<string, string> = {};
        zodError.issues.forEach(issue => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else if (err instanceof Error) {
        setErrors({ submit: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const stepConfig = [
    { key: 'verify', label: '1' },
    { key: 'data', label: '2' },
    { key: 'github', label: '3' },
    { key: 'tracks', label: '4' },
    { key: 'confirm', label: '5' },
  ];

  const currentStepIndex = stepConfig.findIndex(s => s.key === step);

  // Success Step - Immersive
  if (step === ('success' as RegistrationStep)) {
    return (
      <>
        <div className="fixed inset-0 bg-gray-950 z-40" />
        <div className="relative z-50 min-h-screen flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 animate-fade-in">
            <div className="text-8xl mb-8 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold mb-4 text-white">Pendaftaran Berhasil!</h2>
            <p className="text-xl text-gray-300 mb-8">
              Pendaftaranmu sedang diproses. Tunggu persetujuan dari maintainer.
            </p>
            <a 
              href="/dashboard" 
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold transition text-lg"
            >
              Lihat Status Pendaftaran →
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {stepConfig.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              idx < currentStepIndex 
                ? 'bg-green-500 text-white' 
                : idx === currentStepIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400'
            }`}>
              {idx < currentStepIndex ? '✓' : s.label}
            </div>
            {idx < stepConfig.length - 1 && (
              <div className={`w-6 h-0.5 ${idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Verify NISN */}
      {step === 'verify' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-4">Verifikasi NISN</h3>
          <p className="text-gray-400 text-sm mb-4">Masukkan NISN untuk verifikasi data siswa dari SLiMS</p>
          
          <div className="mb-4">
            <input
              type="text"
              value={nisn}
              onChange={(e) => {
                setNisn(e.target.value.replace(/\D/g, '').slice(0, 10));
                setError('');
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              placeholder="Masukkan NISN"
              maxLength={10}
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <button
            type="button"
            onClick={verifyWithSlims}
            disabled={nisn.length < 4 || loading}
            className={`w-full px-4 py-2.5 rounded-lg font-semibold transition ${
              nisn.length < 4 || loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
            } text-white`}
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi dengan SLiMS'}
          </button>
        </div>
      )}

      {/* Step 2: Personal Data */}
      {step === 'data' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-4">Data Pribadi</h3>
          <p className="text-gray-400 text-sm mb-4">Data ini diambil dari database SLiMS</p>
          
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
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Kelas</label>
              <input
                type="text"
                value={formData.class}
                readOnly
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 opacity-70"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dataConfirmed}
                  onChange={(e) => setDataConfirmed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-sm text-yellow-400">
                  Saya menyatakan data di atas sudah benar dan sesuai dengan identitas saya
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={prevStep} className="flex-1 border border-gray-700 hover:border-gray-600 px-4 py-2.5 rounded-lg font-semibold transition">
              ← Kembali
            </button>
            <button 
              type="button" 
              onClick={validateAndNext} 
              disabled={!formData.email || !dataConfirmed}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${
                !formData.email || !dataConfirmed
                  ? 'bg-gray-700 cursor-not-allowed text-gray-500' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {!formData.email ? 'Isi email dulu →' : !dataConfirmed ? 'Konfirmasi dulu →' : 'Lanjutkan →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: GitHub */}
      {step === 'github' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-4">Akun GitHub</h3>
          <p className="text-gray-400 text-sm mb-4">Apakah kamu punya akun GitHub?</p>
          
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasGithub === true}
                onChange={() => {
                  setHasGithub(true);
                  setFormData(prev => ({ ...prev, githubUsername: '' }));
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
                  setHasGithub(false);
                  setFormData(prev => ({ ...prev, githubUsername: '' }));
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
                name="githubUsername"
                value={formData.githubUsername || ''}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                placeholder="username"
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={prevStep} className="flex-1 border border-gray-700 hover:border-gray-600 px-4 py-2.5 rounded-lg font-semibold transition">
              ← Kembali
            </button>
            <button 
              type="button" 
              onClick={nextStep} 
              disabled={hasGithub === null || (hasGithub === true && !formData.githubUsername)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${
                hasGithub === null || (hasGithub === true && !formData.githubUsername)
                  ? 'bg-gray-700 cursor-not-allowed text-gray-500' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {hasGithub === null ? 'Pilih dulu →' : (hasGithub === true && formData.githubUsername ? 'Lanjutkan →' : 'Lewati →')}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Tracks */}
      {step === 'tracks' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-4">Pilih Track Minat</h3>
          <p className="text-gray-400 text-sm mb-4">Pilih 1-3 track yang kamu minati</p>
          
          <div className="grid md:grid-cols-2 gap-3">
            {trackOptions.map(track => (
              <button
                key={track.value}
                type="button"
                onClick={() => handleTrackToggle(track.value)}
                className={`text-left p-4 rounded-lg border-2 transition ${
                  formData.tracks.includes(track.value as any)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <span className="font-semibold">{track.label}</span>
              </button>
            ))}
          </div>
          {errors.tracks && <p className="text-red-400 text-xs mt-2">{errors.tracks}</p>}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={prevStep} className="flex-1 border border-gray-700 hover:border-gray-600 px-4 py-2.5 rounded-lg font-semibold transition">
              ← Kembali
            </button>
            <button 
              type="button" 
              onClick={validateAndNext} 
              disabled={formData.tracks.length === 0}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${
                formData.tracks.length === 0 
                  ? 'bg-gray-700 cursor-not-allowed text-gray-500' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {formData.tracks.length === 0 ? 'Pilih track dulu →' : 'Lanjutkan →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 'confirm' && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold mb-4">Konfirmasi Pendaftaran</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">NISN</span>
                <span className="font-medium">{formData.nisn}</span>
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

          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={prevStep} disabled={loading} className="flex-1 border border-gray-700 hover:border-gray-600 px-4 py-2.5 rounded-lg font-semibold transition">
              ← Kembali
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-semibold transition">
              {loading ? 'Mendaftarkan...' : 'Konfirmasi & Daftar'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
