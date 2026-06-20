import { useState } from 'react';
import { registerSchema, type RegisterInput, type TrackValue } from '@smauii/validation';
import type { ZodError } from 'zod';
import { VerifyStep } from './auth/steps/VerifyStep';
import { DataStep } from './auth/steps/DataStep';
import { GithubStep } from './auth/steps/GithubStep';
import { TracksStep } from './auth/steps/TracksStep';
import { ConfirmStep } from './auth/steps/ConfirmStep';
import { getSiteConfig } from '@smauii/shared';

const config = getSiteConfig();

type RegistrationStep = 'verify' | 'data' | 'github' | 'tracks' | 'confirm';

export default function RegisterForm() {
  const [nisn, setNisn] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<RegistrationStep>('verify');
  const [error, setError] = useState('');
  const [isWarning, setIsWarning] = useState(false);
  const [hasGithub, setHasGithub] = useState<boolean | null>(null);
  const [dataConfirmed, setDataConfirmed] = useState(false);

  const [formData, setFormData] = useState<RegisterInput>({
    nis: '',
    name: '',
    email: '',
    class: '',
    githubUsername: '',
    tracks: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTrackToggle = (track: TrackValue) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.includes(track)
        ? prev.tracks.filter(t => t !== track)
        : [...prev.tracks, track],
    }));
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
      setError('NIS harus diisi');
      return;
    }

    setError(''); setIsWarning(false);
    setLoading(true);
    setHasGithub(null);
    setDataConfirmed(false);

    try {
      const checkResponse = await fetch(`/api/register?nisn=${encodeURIComponent(nisn.trim())}`);
      const checkResult = await checkResponse.json();

      if (!checkResponse.ok && checkResult.code === 'USER_EXISTS') {
        setError('User dengan NIS/Email ini sudah terdaftar');
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
          setError(`ID tidak ditemukan di database ${config.institution.shortName}`);
          return;
        }
        throw new Error(result.error || 'Verifikasi gagal');
      }

      if (data.isPending) {
        setError('Anggota ini dalam status pending di institusi');
        return;
      }

      const expiredWarning = data.isExpired
        ? `Catatan: keanggotaan kamu expired sejak ${data.expiredAt}. Silakan perpanjang ke institusi.`
        : '';

      setFormData(prev => ({
        ...prev,
        nisn: data.nis || nisn.trim(),
        nis: data.nis || nisn.trim(),
        name: data.name || '',
        email: data.email || '',
        class: '',
      }));
      if (expiredWarning) { setError(expiredWarning); setIsWarning(true); } else { setIsWarning(false); }
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
      if (!formData.class) newErrors.class = 'Kelas harus diisi';
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

      window.location.href = `/success?nis=${encodeURIComponent(formData.nis)}`;
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

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
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

      {step === 'verify' && (
        <VerifyStep
          nisn={nisn}
          onNisnChange={setNisn}
          onVerify={verifyWithSlims}
          loading={loading}
          error={error}
          isWarning={isWarning}
        />
      )}

      {step === 'data' && (
        <DataStep
          formData={formData}
          onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
          onNext={validateAndNext}
          onPrev={prevStep}
          errors={errors}
          dataConfirmed={dataConfirmed}
          onDataConfirmedChange={setDataConfirmed}
        />
      )}

      {step === 'github' && (
        <GithubStep
          hasGithub={hasGithub}
          onHasGithubChange={setHasGithub}
          githubUsername={formData.githubUsername || ''}
          onGithubUsernameChange={(value) => setFormData(prev => ({ ...prev, githubUsername: value }))}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}

      {step === 'tracks' && (
        <TracksStep
          selectedTracks={formData.tracks}
          onTrackToggle={handleTrackToggle}
          onNext={validateAndNext}
          onPrev={prevStep}
          error={errors.tracks}
        />
      )}

      {step === 'confirm' && (
        <ConfirmStep
          formData={formData}
          onSubmit={() => handleSubmit({ preventDefault: () => {} } as any)}
          onPrev={prevStep}
          loading={loading}
          error={errors.submit}
        />
      )}
    </form>
  );
}