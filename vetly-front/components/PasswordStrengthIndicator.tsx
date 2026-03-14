'use client';

interface PasswordStrengthIndicatorProps {
  password: string;
  colorScheme?: 'teal' | 'indigo';
}

function getStrengthScore(password: string): number {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

function getStrengthLabel(score: number): string {
  if (score <= 1) return 'Αδύναμος';
  if (score <= 3) return 'Μέτριος';
  return 'Δυνατός';
}

function getStrengthColor(score: number): string {
  if (score <= 1) return 'bg-red-500';
  if (score <= 3) return 'bg-amber-500';
  return 'bg-green-500';
}

function getStrengthTextColor(score: number): string {
  if (score <= 1) return 'text-red-600';
  if (score <= 3) return 'text-amber-600';
  return 'text-green-600';
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (password.length === 0) return null;

  const score = getStrengthScore(password);
  const filledSegments = score <= 1 ? 1 : score <= 3 ? 2 : 3;
  const color = getStrengthColor(score);

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((segment) => (
          <div
            key={segment}
            className={`h-1 flex-1 rounded-full transition-colors ${
              segment <= filledSegments ? color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${getStrengthTextColor(score)}`}>
        {getStrengthLabel(score)}
      </p>
    </div>
  );
}
