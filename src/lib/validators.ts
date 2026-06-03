export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function validatePasswordStrength(password: string): {
  criteria: PasswordCriteria;
  score: number;
  isValid: boolean;
} {
  const criteria: PasswordCriteria = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password)
  };

  const score = Object.values(criteria).filter(Boolean).length;
  const isValid = score === 5;

  return { criteria, score, isValid };
}
