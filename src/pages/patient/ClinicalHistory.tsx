import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { getClinicalRecords, addClinicalRecord, deleteClinicalRecord } from '../../services/db';
import type { ClinicalRecord, FileAttachment } from '../../types';
import { FileText, Trash2, Eye, Plus, Calendar, Search, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ClinicalHistoryProps {
  patientCpf: string;
  onNavigate: (page: string) => void;
}

export default function ClinicalHistory({ patientCpf, onNavigate }: ClinicalHistoryProps) {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Exame' | 'Laudo' | 'Receituário'>('Exame');
  const [date, setDate] = useState('');
  const [specialtyName, setSpecialtyName] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('Todos');

  const [previewRecord, setPreviewRecord] = useState<ClinicalRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadHistory = async () => {
    try {
      const data = await getClinicalRecords(patientCpf);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientCpf) {
      loadHistory();
    }
  }, [patientCpf]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewRecord(null);
        setDeleteConfirmId(null);
      }
    };
    if (previewRecord || deleteConfirmId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewRecord, deleteConfirmId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!title.trim() || !date || !specialtyName.trim() || !selectedFile) {
      setFormError('Todos os campos, incluindo o anexo, são de preenchimento obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      const record: ClinicalRecord = {
        patientCpf,
        title: title.trim(),
        type,
        date,
        specialtyName: specialtyName.trim(),
        fileAttachment: selectedFile,
        createdAt: new Date().toISOString()
      };

      await addClinicalRecord(record);
      setSuccessMessage('Documento adicionado ao seu histórico clínico com sucesso!');
      
      setTitle('');
      setType('Exame');
      setDate('');
      setSpecialtyName('');
      setSelectedFile(null);
      
      await loadHistory();
    } catch (err) {
      console.error(err);
      setFormError('Ocorreu um erro ao salvar o documento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteClinicalRecord(id);
      setDeleteConfirmId(null);
      await loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.specialtyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'Todos' || rec.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getCountByType = (t: string) => {
    if (t === 'Todos') return records.length;
    return records.filter((r) => r.type === t).length;
  };

  const getBadgeStyle = (t: 'Exame' | 'Laudo' | 'Receituário') => {
    const styles = {
      'Exame': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      'Laudo': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
      'Receituário': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
    };
    return styles[t];
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-6">
      <div>
        <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-primary p-0 h-auto font-semibold mb-2">
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans text-left">Histórico Clínico Externo</h1>
        <p className="text-zinc-500 mt-1 text-left">Armazene, organize e consulte exames, laudos e receitas de outras clínicas de forma segura.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Todos', 'Exame', 'Laudo', 'Receituário'].map((t) => (
          <div
            key={t}
            onClick={() => setFilterType(t)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
              filterType === t
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/10'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-primary/30 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">{t === 'Todos' ? 'Total de Documentos' : t + 's'}</span>
            <span className="text-2xl font-black block mt-2">{getCountByType(t)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        <div className="lg:col-span-5 space-y-6">
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
                  <Label htmlFor="title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Título do Documento *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Hemograma Completo Fleury"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-zinc-250 dark:border-zinc-800 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="type" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tipo de Documento *</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="date" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Data do Exame *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="border-zinc-250 dark:border-zinc-800 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="specialty" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Especialidade *</Label>
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
                    <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors bg-zinc-50/50 dark:bg-zinc-900/10 ${fileError ? 'border-red-400 bg-red-50/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
                      <input
                        type="file"
                        id="clinical-file-upload"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
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
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate block">{selectedFile.name}</span>
                          <span className="text-[10px] text-zinc-400 block">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="icon" onClick={handleRemoveFile} className="h-8 w-8 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-950/20 shrink-0">
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

                <Button type="submit" disabled={isSubmitting} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold h-11 text-xs rounded-xl shadow-sm">
                  {isSubmitting ? 'Salvando...' : 'Salvar Documento'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por título ou especialidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-xs text-zinc-500 py-8">Carregando histórico clínico...</p>
            ) : filteredRecords.length === 0 ? (
              <Card className="border border-zinc-200/60 dark:border-zinc-850 bg-zinc-50/10 rounded-2xl shadow-xs">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-full text-zinc-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Nenhum documento encontrado</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Seu histórico clínico está vazio ou nenhum arquivo corresponde aos filtros ativos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3" role="list">
                {filteredRecords.map((record) => (
                  <Card key={record.id} className="border-zinc-200/80 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-xs" role="listitem">
                    <CardContent className="p-4 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl text-zinc-500 shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm truncate max-w-[200px] sm:max-w-[300px]" title={record.title}>
                              {record.title}
                            </h4>
                            <Badge className={`${getBadgeStyle(record.type)} text-[9px] font-bold px-1.5 py-0.5`}>
                              {record.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-400" />
                              <time dateTime={record.date}>
                                {new Date(record.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                              </time>
                            </span>
                            <span>•</span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-405">{record.specialtyName}</span>
                            <span>•</span>
                            <span>{(record.fileAttachment.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewRecord(record)}
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(record.id || null)}
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewRecord && createPortal(
        <div onClick={() => setPreviewRecord(null)} className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <Card onClick={(e) => e.stopPropagation()} className="max-w-3xl w-full h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 p-5 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {previewRecord.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {previewRecord.type} • {new Date(previewRecord.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {previewRecord.specialtyName}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setPreviewRecord(null)}
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <div className="flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-950">
              <iframe
                src={previewRecord.fileAttachment.base64}
                title={previewRecord.title}
                className="w-full h-full border-0"
              />
            </div>
          </Card>
        </div>,
        document.body
      )}

      {deleteConfirmId && createPortal(
        <div onClick={() => setDeleteConfirmId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 text-left">
            <div className="flex gap-3.5 items-start">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-full shrink-0 border border-red-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Excluir documento?</h3>
                <p className="text-xs text-zinc-500 leading-normal">
                  Tem certeza que deseja remover este documento do seu histórico clínico? Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="h-9 px-4 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="h-9 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs"
              >
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
