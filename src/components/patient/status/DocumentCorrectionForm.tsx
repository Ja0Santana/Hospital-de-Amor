import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { AlertCircle, FileText, Eye, Trash2, ChevronUp, ChevronDown, Upload, CheckCircle2 } from 'lucide-react';
import type { Appointment } from '../../../types';

interface DocumentCorrectionFormProps {
  appointment: Appointment;
  onSubstituteDocument: (file: { name: string; type: string; size: number; base64: string }) => Promise<void>;
}

export default function DocumentCorrectionForm({
  appointment,
  onSubstituteDocument
}: DocumentCorrectionFormProps) {
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [submittingFile, setSubmittingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [substituteSuccess, setSubstituteSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const forbiddenExtensions = ['.exe', '.bat', '.sh', '.msi', '.cmd', '.js', '.vbs'];
    const fileName = file.name.toLowerCase();
    const isForbidden = forbiddenExtensions.some((ext) => fileName.endsWith(ext));

    if (isForbidden) {
      setFileError('Arquivo não permitido. Selecione apenas imagens (JPG, PNG) ou PDF.');
      setSelectedFile(null);
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      setFileError('Tipo de arquivo inválido. Apenas imagens (JPG/PNG) ou PDF são aceitos.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('O arquivo excede o limite máximo de 5MB.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setSubmittingFile(true);
    setFileError('');

    try {
      await onSubstituteDocument(selectedFile);
      setSubstituteSuccess(true);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      setFileError('Erro ao atualizar o documento. Tente novamente.');
    } finally {
      setSubmittingFile(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-200/30 dark:border-red-800/20 p-5 rounded-2xl space-y-2">
        <h4 className="font-extrabold text-sm text-red-800 dark:text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          Documentação Pendente de Correção
        </h4>
        <p className="text-xs text-red-900 dark:text-red-400 font-medium">
          {appointment.fileAttachment?.feedback || appointment.observations || 'Documentação Ilegível: A foto do encaminhamento médico anexada está borrada e impossibilita a leitura do carimbo do profissional de saúde.'}
        </p>
        <p className="text-[11px] text-zinc-500 pt-2 border-t border-red-200/50 dark:border-red-800/20 mt-2">
          <strong>O que fazer agora?</strong> Você pode anexar um novo documento legível abaixo para reabrir sua solicitação para análise.
        </p>
      </div>

      {appointment.fileAttachment && (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Documento Atual Recusado</span>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[250px]">
              {appointment.fileAttachment.name}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newWindow = window.open();
                if (newWindow && appointment.fileAttachment) {
                  newWindow.document.write(
                    `<iframe src="${appointment.fileAttachment.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                  );
                }
              }}
              className="h-8 text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
            >
              Ver Documento
            </Button>
          </div>
        </div>
      )}

      {appointment.rejectedFilesHistory && appointment.rejectedFilesHistory.length > 0 && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mt-3">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Histórico de Arquivos Recusados ({appointment.rejectedFilesHistory.length})
            </span>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          {showHistory && (
            <div className="p-4 bg-white dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-800">
              {appointment.rejectedFilesHistory.map((hist, index) => (
                <div key={index} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]">
                      {hist.name}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newWindow = window.open();
                        if (newWindow) {
                          newWindow.document.write(
                            `<iframe src="${hist.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                          );
                        }
                      }}
                      className="h-7 px-2 text-[10px] font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                    >
                      Visualizar
                    </Button>
                  </div>
                  {hist.feedback && (
                    <div className="bg-red-50/10 dark:bg-red-950/5 border border-red-200/20 dark:border-red-800/10 p-2 rounded-lg text-[10px] text-red-800 dark:text-red-400 leading-normal font-medium">
                      Motivo: {hist.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {substituteSuccess ? (
        <div className="p-4 bg-green-50 dark:bg-green-955/10 border border-green-200/30 dark:border-green-800/20 rounded-2xl flex gap-2.5 items-center">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-semibold text-green-800 dark:text-green-400">
            Documento substituído com sucesso! O agendamento foi reaberto e está em análise.
          </span>
        </div>
      ) : (
        <form onSubmit={handleFileSubmit} className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Enviar Novo Documento Legível</span>
            {!selectedFile ? (
              <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors bg-white dark:bg-zinc-950 ${fileError ? 'border-red-400 bg-red-50/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
                <input
                  type="file"
                  id="substitute-file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={submittingFile}
                />
                <Label htmlFor="substitute-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-full shadow-xs">
                    <Upload className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-primary hover:text-primary/95 text-xs block">Clique para selecionar novo arquivo</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">PDF, JPG ou PNG de até 5MB</span>
                  </div>
                </Label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50/20 dark:bg-green-955/10 border border-green-200/60 dark:border-green-800/20 rounded-xl shadow-xs gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate block">{selectedFile.name}</span>
                    <span className="text-[10px] text-zinc-400 block">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newWindow = window.open();
                      if (newWindow && selectedFile) {
                        newWindow.document.write(
                          `<iframe src="${selectedFile.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                        );
                      }
                    }}
                    className="h-8 w-8 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950"
                    disabled={submittingFile}
                  >
                    <Eye className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={() => setSelectedFile(null)} className="h-8 w-8 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-955/20 bg-white dark:bg-zinc-950" disabled={submittingFile}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            )}
            {fileError && (
              <p className="text-red-500 text-[10px] flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3 h-3" />
                {fileError}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={submittingFile || !selectedFile}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold h-10 text-xs rounded-xl transition-all shadow-xs"
          >
            {submittingFile ? 'Processando e criptografando documento...' : 'Substituir Documento'}
          </Button>
        </form>
      )}
    </div>
  );
}
