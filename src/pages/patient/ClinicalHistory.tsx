import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getClinicalRecords, addClinicalRecord, deleteClinicalRecord } from '../../services/db';
import { FileText } from 'lucide-react';
import type { ClinicalRecord, FileAttachment } from '../../types';

import DocumentUploadForm from '../../components/patient/history/DocumentUploadForm';
import DocumentListFilter from '../../components/patient/history/DocumentListFilter';
import DocumentCard from '../../components/patient/history/DocumentCard';
import PdfPreviewModal from '../../components/patient/history/PdfPreviewModal';
import DeleteConfirmationModal from '../../components/patient/history/DeleteConfirmationModal';

interface ClinicalHistoryProps {
  patientCpf: string;
  onNavigate: (page: string) => void;
}

export default function ClinicalHistory({ patientCpf, onNavigate }: ClinicalHistoryProps) {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUploadSubmit = async (formData: {
    title: string;
    type: 'Exame' | 'Laudo' | 'Receituário';
    date: string;
    specialtyName: string;
    fileAttachment: FileAttachment;
  }) => {
    setIsSubmitting(true);
    setFormError('');
    setSuccessMessage('');
    try {
      const record: ClinicalRecord = {
        patientCpf,
        title: formData.title,
        type: formData.type,
        date: formData.date,
        specialtyName: formData.specialtyName,
        fileAttachment: formData.fileAttachment,
        createdAt: new Date().toISOString(),
      };

      await addClinicalRecord(record);
      setSuccessMessage('Documento adicionado ao seu histórico clínico com sucesso!');
      await loadHistory();
    } catch (err) {
      console.error(err);
      setFormError('Ocorreu um erro ao salvar o documento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteClinicalRecord(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.specialtyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'Todos' || rec.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const countTodos = records.length;
  const countExames = records.filter((r) => r.type === 'Exame').length;
  const countLaudos = records.filter((r) => r.type === 'Laudo').length;
  const countReceituarios = records.filter((r) => r.type === 'Receituário').length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-6">
      <div>
        <Button
          variant="link"
          onClick={() => onNavigate('dashboard')}
          className="text-primary p-0 h-auto font-semibold mb-2"
        >
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans text-left">
          Histórico Clínico Externo
        </h1>
        <p className="text-zinc-500 mt-1 text-left">
          Armazene, organize e consulte exames, laudos e receitas de outras clínicas de forma segura.
        </p>
      </div>

      <DocumentListFilter
        filterType={filterType}
        searchQuery={searchQuery}
        recordsCount={countTodos}
        examesCount={countExames}
        laudosCount={countLaudos}
        receituariosCount={countReceituarios}
        onFilterChange={setFilterType}
        onSearchChange={setSearchQuery}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        <div className="lg:col-span-5 space-y-6">
          <DocumentUploadForm
            isSubmitting={isSubmitting}
            formError={formError}
            successMessage={successMessage}
            onSubmit={handleUploadSubmit}
            setError={setFormError}
            setSuccess={setSuccessMessage}
          />
        </div>

        <div className="lg:col-span-7 space-y-4">
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
                  <DocumentCard
                    key={record.id}
                    record={record}
                    onPreview={setPreviewRecord}
                    onDelete={setDeleteConfirmId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewRecord && (
        <PdfPreviewModal record={previewRecord} onClose={() => setPreviewRecord(null)} />
      )}

      {deleteConfirmId && (
        <DeleteConfirmationModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}
