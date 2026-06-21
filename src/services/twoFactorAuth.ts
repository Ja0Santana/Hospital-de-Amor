interface TwoFactorSession {
  code: string;
  expiresAt: number;
}

const SESSION_KEY = 'hospital_amor_2fa_state';

export function generateTwoFactorCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 60000;
  
  const state: TwoFactorSession = { code, expiresAt };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  
  return code;
}

export function validateTwoFactorCode(inputCode: string): boolean {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return false;
  
  try {
    const state: TwoFactorSession = JSON.parse(stored);
    if (Date.now() > state.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    
    const isValid = state.code === inputCode.trim();
    if (isValid) {
      sessionStorage.removeItem(SESSION_KEY);
    }
    return isValid;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return false;
  }
}

export function clearTwoFactorSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getTwoFactorRemainingTime(): number {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return 0;
  
  try {
    const state: TwoFactorSession = JSON.parse(stored);
    const diff = state.expiresAt - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  } catch {
    return 0;
  }
}
