export function sanitizeString(val: string): string {
  return val.trim().replace(/\s+/g, " ");
}

export function validateCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;

  return true;
}

export function formatCpf(val: string): string {
  const clean = val.replace(/\D/g, "");
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

export function formatPhone(val: string): string {
  const clean = val.replace(/\D/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

export function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, "");
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").slice(0, 19);
}

export function formatCardExpiry(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2, 4);
}

export function formatCnpj(val: string): string {
  const digits = val.replace(/\D/g, "");
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
}

export function validateClinicalFile(fileName: string, fileType: string, fileSize: number): FileValidationResult {
  const forbiddenExtensions = ['.exe', '.bat', '.sh', '.msi', '.cmd', '.js', '.vbs'];
  const lowerName = fileName.toLowerCase();
  const isForbidden = forbiddenExtensions.some((ext) => lowerName.endsWith(ext));

  if (isForbidden) {
    return {
      isValid: false,
      error: 'Arquivo não permitido. Selecione apenas imagens (JPG, PNG) ou PDF.'
    };
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimeTypes.includes(fileType)) {
    return {
      isValid: false,
      error: 'Tipo de arquivo inválido. Apenas imagens (JPG/PNG) ou PDF são aceitos.'
    };
  }

  if (fileSize > 5 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'O arquivo excede o limite máximo de 5MB.'
    };
  }

  const lastDotIndex = fileName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  const cleanBaseName = baseName
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  return {
    isValid: true,
    sanitizedName: cleanBaseName + extension.toLowerCase()
  };
}
