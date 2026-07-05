import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Plus, AlertCircle, CheckCircle2, Upload, FileText, Trash2 } from 'lucide-react';
import { validateClinicalFile } from '../../../lib/sanitizer';
import type { FileAttachment } from '../../../types';

interface DocumentUploadFormProps {
  isSubmitting: boolean;
  formError: string;
  successMessage: string;
  onSubmit: (formData: {
    title: string;
    type: 'Exame' | 'Laudo' | 'Receituário';
    date: string;
    specialtyName: string;
    fileAttachment: FileAttachment;
  }) => void;
  setError: (error: string) => void;
  setSuccess: (msg: string) => void;
}

export default function DocumentUploadForm({
  isSubmitting,
  formError,
  successMessage,
  onSubmit,
  setError,
  setSuccess,
}: DocumentUploadFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Exame' | 'Laudo' | 'Receituário'>('Exame');
  const [date, setDate] = useState('');
  const [specialtyName, setSpecialtyName] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateClinicalFile(file.name, file.type, file.size);
    if (!validation.isValid) {
      setFileError(validation.error || 'Erro na validação do arquivo.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        name: validation.sanitizedName || file.name,
        type: file.type,
        size: file.size,
        base64: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !date || !specialtyName.trim() || !selectedFile) {
      setError('Todos os campos, incluindo o anexo, são de preenchimento obrigatório.');
      return;
    }

    onSubmit({
      title: title.trim(),
      type,
      date,
      specialtyName: specialtyName.trim(),
      fileAttachment: selectedFile,
    });

    setTitle('');
    setType('Exame');
    setDate('');
    setSpecialtyName('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Adicionar Documento
        </CardTitle>
        <CardDescription>Insira os dados do documento externo para salvá-lo em seu histórico.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-4">
        {formError && (
          <div className="p-3 bg-red-50/10 border border-red-200 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4" />
            {formError}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-green-50/10 border border-green-200 rounded-xl text-green-600 dark:text-green-400 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Título do Documento *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Hemograma Completo Fleury"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-zinc-250 dark:border-zinc-800 rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="type" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tipo de Documento *
            </Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100"
            >
              <option value="Exame">Exame</option>
              <option value="Laudo">Laudo</option>
              <option value="Receituário">Receituário</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="date" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Data do Exame *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-zinc-250 dark:border-zinc-800 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="specialty" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Especialidade *
              </Label>
              <Input
                id="specialty"
                placeholder="Ex: Hematologia"
                value={specialtyName}
                onChange={(e) => setSpecialtyName(e.target.value)}
                className="border-zinc-250 dark:border-zinc-800 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Arquivo do Documento *</Label>
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors bg-zinc-50/50 dark:bg-zinc-900/10 ${fileError ? 'border-red-400 bg-red-50/10' : 'border-zinc-200 dark:border-zinc-800'}`}
              >
                <input
                  type="file"
                  id="clinical-file-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <Label htmlFor="clinical-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-full shadow-sm">
                    <Upload className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <span className="font-semibold text-primary hover:text-primary/90 text-xs block">Selecionar arquivo</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">PDF, JPG ou PNG de até 5MB</span>
                  </div>
                </Label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50/20 dark:bg-green-950/10 border border-green-200/60 dark:border-green-800/20 rounded-xl shadow-sm gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-950/20 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
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
            disabled={isSubmitting}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold h-11 text-xs rounded-xl shadow-sm"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Documento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
