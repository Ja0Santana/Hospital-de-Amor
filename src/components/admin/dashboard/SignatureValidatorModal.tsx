
import { ShieldCheck, X } from 'lucide-react';
import type { Appointment } from '../../../types';

interface SignatureValidatorModalProps {
  app: Appointment | null;
  onClose: () => void;
}

export default function SignatureValidatorModal({
  app,
  onClose,
}: SignatureValidatorModalProps) {
  if (!app || !app.digitalSignature) {
    return null;
  }

  const { digitalSignature } = app;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in animate-duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-955/20 flex items-center justify-center text-emerald-650 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 leading-tight">
              Portal de Validação de Assinaturas
            </h3>
            <span className="text-[10px] text-zinc-400 block font-semibold mt-0.5">
              ITI / ICP-Brasil Validador Simulado
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-500 text-xs font-bold flex items-center justify-center transition-transform hover:rotate-90 duration-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl flex flex-col gap-1">
            <span className="font-extrabold text-xs uppercase tracking-wider">
              Assinatura VÁLIDA
            </span>
            <p className="text-[11px] leading-relaxed font-semibold">
              O documento correspondente a este laudo de triagem está devidamente assinado, contendo
              hash criptográfico intacto e validado pela cadeia ICP-Brasil.
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-955 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 text-xs space-y-3">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-850">
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Paciente</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{app.patientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  CPF do Paciente
                </span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {app.patientCpf}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  Procedimento
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{app.examName}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-850">
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  Médico Assinante
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {digitalSignature.signedBy}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  CPF do Médico
                </span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {digitalSignature.cpf}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  Data da Assinatura
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {new Date(digitalSignature.signedAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                  Série do Certificado
                </span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {digitalSignature.certificateSerial}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 block uppercase font-bold">
                Hash SHA-256 de Integridade
              </span>
              <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-955 p-2.5 rounded-xl block break-all text-zinc-655 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/80">
                {digitalSignature.signatureHash}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-450 pt-1">
              <span>Algoritmo:</span>
              <span className="font-bold text-zinc-600 dark:text-zinc-350">
                SHA-256 com RSA (2048 bits)
              </span>
              <span className="mx-1">•</span>
              <span>Cadeia:</span>
              <span className="font-bold text-zinc-600 dark:text-zinc-350">
                AC VALID v5 / ICP-Brasil
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-xs font-bold transition-all"
          >
            Concluir Verificação
          </button>
        </div>
      </div>
    </div>
  );
}
