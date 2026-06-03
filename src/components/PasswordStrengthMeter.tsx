import { useEffect } from 'react';
import { validatePasswordStrength } from '../lib/validators';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  onValidityChange?: (isValid: boolean) => void;
}

export function PasswordStrengthMeter({ password, onValidityChange }: PasswordStrengthMeterProps) {
  const { criteria, score, isValid } = validatePasswordStrength(password);

  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(isValid);
    }
  }, [isValid, onValidityChange]);

  const getStrengthLabel = () => {
    if (!password) return 'Digite uma senha';
    if (score <= 2) return 'Senha Fraca';
    if (score <= 4) return 'Senha Média';
    return 'Senha Forte';
  };

  const getStrengthColorClass = () => {
    if (!password) return 'bg-zinc-200 dark:bg-zinc-800';
    if (score <= 2) return 'bg-red-500';
    if (score <= 4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStrengthPercentage = () => {
    if (!password) return '0%';
    return `${(score / 5) * 100}%`;
  };

  const requirements = [
    { label: 'Pelo menos 8 caracteres', met: criteria.hasMinLength },
    { label: 'Pelo menos uma letra maiúscula (A-Z)', met: criteria.hasUppercase },
    { label: 'Pelo menos uma letra minúscula (a-z)', met: criteria.hasLowercase },
    { label: 'Pelo menos um número (0-9)', met: criteria.hasNumber },
    { label: 'Pelo menos um caractere especial (ex: @, #, $, %)', met: criteria.hasSpecialChar }
  ];

  return (
    <div className="space-y-3 mt-2 text-left">
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Força da senha:</span>
        <span
          className={`font-bold transition-colors duration-250 ${
            !password
              ? 'text-zinc-400'
              : score <= 2
              ? 'text-red-500'
              : score <= 4
              ? 'text-amber-500'
              : 'text-emerald-500'
          }`}
        >
          {getStrengthLabel()}
        </span>
      </div>

      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStrengthColorClass()}`}
          style={{ width: getStrengthPercentage() }}
        />
      </div>

      <ul className="space-y-1.5 pt-1 text-[11px]" aria-label="Requisitos de senha">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              req.met
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : password
                ? 'text-red-500 dark:text-red-400'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
            ) : (
              <X
                className={`w-3.5 h-3.5 shrink-0 ${
                  password ? 'text-red-400' : 'text-zinc-300 dark:text-zinc-600'
                }`}
                aria-hidden="true"
              />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
