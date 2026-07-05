import { Button } from '../../ui/Button';

interface CredentialCardProps {
  qrCodeUrl: string;
  onPrint: () => void;
  onSendEmail: () => Promise<void>;
  onSendWhatsapp: () => void;
}

export default function CredentialCard({
  qrCodeUrl,
  onPrint,
  onSendEmail,
  onSendWhatsapp
}: CredentialCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-5 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 text-center space-y-4 shadow-xs">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Credencial de Acesso</span>
      <div className="bg-white p-3 rounded-2xl shadow-md border border-zinc-100 flex items-center justify-center">
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QR Code da Credencial" className="w-32 h-32" />
        ) : (
          <div className="w-32 h-32 bg-zinc-150 animate-pulse rounded-lg" />
        )}
      </div>
      <div className="space-y-1 w-full">
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block">QR Code para Recepção</span>
        <span className="text-[10px] text-zinc-400 block mb-2">Apresente na entrada da recepção.</span>
        <div className="flex flex-col gap-2 w-full">
          <Button type="button" variant="outline" onClick={onPrint} className="w-full text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            Imprimir Credencial
          </Button>
          <Button type="button" variant="outline" onClick={onSendEmail} className="w-full text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            Enviar por E-mail
          </Button>
          <Button type="button" variant="outline" onClick={onSendWhatsapp} className="w-full text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            Enviar WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
