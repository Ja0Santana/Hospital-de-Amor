import React, { useState } from 'react';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import type { FileAttachment } from '../../../types';
import { AlertCircle, Upload, FileText, Eye, Trash2, Edit2 } from 'lucide-react';

interface StepUploadReviewProps {
  formData: {
    patientName: string;
    patientCpf: string;
    patientBirthDate: string;
    patientPhone: string;
    patientEmail: string;
    state: string;
    city: string;
    specialtyName: string;
    examName: string;
    fileAttachment: FileAttachment | null;
    consentLgpd: boolean;
  };
  onChange: (data: Partial<StepUploadReviewProps['formData']>) => void;
  onEditStep: (step: number) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function StepUploadReview({ formData, onChange, onEditStep, errors, setErrors }: StepUploadReviewProps) {
  const [fileError, setFileError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const forbiddenExtensions = ['.exe', '.bat', '.sh', '.msi', '.cmd', '.js', '.vbs'];
    const fileName = file.name.toLowerCase();
    const isForbidden = forbiddenExtensions.some((ext) => fileName.endsWith(ext));

    if (isForbidden) {
      setFileError('Arquivo não permitido. Selecione apenas imagens (JPG, PNG) ou PDF.');
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      setFileError('Tipo de arquivo inválido. Apenas imagens (JPG/PNG) ou PDF são aceitos.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('O arquivo excede o limite máximo de 5MB.');
      return;
    }

    setFileError('');
    if (errors.fileAttachment) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.fileAttachment;
        return next;
      });
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({
        fileAttachment: {
          name: file.name,
          type: file.type,
          size: file.size,
          base64: reader.result as string
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    onChange({ fileAttachment: null });
    setFileError('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreview = () => {
    if (!formData.fileAttachment) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe src="${formData.fileAttachment.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Anexar Encaminhamento Médico *
        </h3>
        <p className="text-zinc-500 text-sm">
          Selecione a foto ou PDF do seu encaminhamento ou pedido de exame emitido pelo médico. O arquivo é obrigatório para validação da triagem.
        </p>

        {!formData.fileAttachment ? (
          <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors bg-zinc-50/50 dark:bg-zinc-900/10 ${errors.fileAttachment ? 'border-red-400 bg-red-50/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
              <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-full shadow-sm">
                <Upload className="w-6 h-6 text-zinc-500" />
              </div>
              <div>
                <span className="font-semibold text-primary hover:text-primary/90 text-sm block">Clique para selecionar</span>
                <span className="text-xs text-zinc-400 mt-1 block">PDF, JPG ou PNG de até 5MB</span>
              </div>
            </Label>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50/20 dark:bg-green-950/10 border border-green-200/60 dark:border-green-800/20 rounded-xl shadow-sm gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm truncate block">{formData.fileAttachment.name}</span>
                <span className="text-xs text-zinc-400 mt-0.5 block">{formatFileSize(formData.fileAttachment.size)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="icon" onClick={handlePreview} className="h-9 w-9 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <Eye className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={handleRemoveFile} className="h-9 w-9 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-950/20">
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        )}

        {fileError && (
          <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {fileError}
          </p>
        )}
        {errors.fileAttachment && (
          <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.fileAttachment}
          </p>
        )}
      </div>

      <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Revisão dos Dados</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-zinc-100 dark:border-zinc-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h4 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Dados do Paciente</h4>
                <Button type="button" variant="ghost" size="icon" onClick={() => onEditStep(0)} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                </Button>
              </div>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Nome:</strong> {formData.patientName}</p>
                <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">CPF:</strong> {formData.patientCpf}</p>
                <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Nascimento:</strong> {formData.patientBirthDate ? new Date(formData.patientBirthDate).toLocaleDateString('pt-BR') : ''}</p>
                <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Telefone:</strong> {formData.patientPhone}</p>
                <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">E-mail:</strong> {formData.patientEmail}</p>
                <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Localidade:</strong> {formData.city} ({formData.state})</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-100 dark:border-zinc-800">
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <h4 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Atendimento Escolhido</h4>
                <Button type="button" variant="ghost" size="icon" onClick={() => onEditStep(1)} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                </Button>
              </div>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Especialidade:</strong> {formData.specialtyName}</p>
                <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Exame:</strong> {formData.examName}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex gap-3 items-start p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
          <Checkbox
            id="consentLgpd"
            checked={formData.consentLgpd}
            onCheckedChange={(checked) => {
              onChange({ consentLgpd: checked === true });
              if (errors.consentLgpd) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.consentLgpd;
                  return next;
                });
              }
            }}
            className="mt-1 focus-visible:ring-primary border-zinc-300"
          />
          <div className="space-y-1">
            <Label htmlFor="consentLgpd" className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-normal cursor-pointer">
              Declaração de Consentimento de Dados (LGPD) *
            </Label>
            <p className="text-[11px] sm:text-xs text-zinc-500 leading-normal">
              Estou ciente e dou consentimento explícito para que o Hospital de Amor realize o tratamento dos meus dados pessoais e dados de saúde contidos neste formulário e nos documentos anexados, estritamente para a finalidade de realizar a triagem e o agendamento do exame solicitado.
            </p>
          </div>
        </div>
        {errors.consentLgpd && (
          <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.consentLgpd}
          </p>
        )}
      </div>
    </div>
  );
}
