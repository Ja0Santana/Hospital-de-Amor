import React, { useState, useEffect } from 'react';
import { Label } from '../../../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { Card, CardContent } from '../../../components/ui/card';
import { getSpecialties } from '../../../services/db';
import type { Specialty, Exam } from '../../../types';
import { AlertCircle, FileText } from 'lucide-react';

interface StepExamSelectionProps {
  formData: {
    specialtyId: string;
    examId: string;
  };
  onChange: (data: { specialtyId: string; specialtyName: string; examId: string; examName: string }) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function StepExamSelection({ formData, onChange, errors, setErrors }: StepExamSelectionProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    getSpecialties().then((results) => {
      setSpecialties(results);
      if (formData.specialtyId) {
        const spec = results.find((s) => s.id === formData.specialtyId);
        if (spec) {
          setSelectedSpecialty(spec);
          if (formData.examId) {
            const ex = spec.exams.find((e) => e.id === formData.examId);
            if (ex) {
              setSelectedExam(ex);
            }
          }
        }
      }
    }).catch(console.error);
  }, [formData.specialtyId, formData.examId]);

  const handleSpecialtyChange = (val: string) => {
    const spec = specialties.find((s) => s.id === val);
    if (spec) {
      setSelectedSpecialty(spec);
      setSelectedExam(null);
      onChange({
        specialtyId: spec.id,
        specialtyName: spec.name,
        examId: '',
        examName: ''
      });
      if (errors.specialtyId) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.specialtyId;
          return next;
        });
      }
    }
  };

  const handleExamChange = (val: string) => {
    if (selectedSpecialty) {
      const ex = selectedSpecialty.exams.find((e) => e.id === val);
      if (ex) {
        setSelectedExam(ex);
        onChange({
          specialtyId: selectedSpecialty.id,
          specialtyName: selectedSpecialty.name,
          examId: ex.id,
          examName: ex.name
        });
        if (errors.examId) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.examId;
            return next;
          });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Especialidade Médica *</Label>
          <Select value={formData.specialtyId} onValueChange={handleSpecialtyChange}>
            <SelectTrigger className={`h-11 border-zinc-200 focus:ring-primary ${errors.specialtyId ? 'border-red-500 focus:ring-red-500' : ''}`}>
              <SelectValue placeholder="Selecione a Especialidade" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((spec) => (
                <SelectItem key={spec.id} value={spec.id}>{spec.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.specialtyId && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.specialtyId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Tipo de Atendimento / Exame *</Label>
          <Select
            value={formData.examId}
            onValueChange={handleExamChange}
            disabled={!formData.specialtyId}
          >
            <SelectTrigger className={`h-11 border-zinc-200 focus:ring-primary ${errors.examId ? 'border-red-500 focus:ring-red-500' : ''}`}>
              <SelectValue placeholder={formData.specialtyId ? "Selecione o Exame" : "Selecione a especialidade primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {selectedSpecialty?.exams.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.examId && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.examId}
            </p>
          )}
        </div>
      </div>

      {selectedExam && (
        <Card className="border border-primary/20 bg-primary/5 rounded-xl shadow-sm overflow-hidden transition-all duration-200 mt-6">
          <CardContent className="p-5 space-y-3">
            <h4 className="font-bold text-sm text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              Instruções de Preparo Prévio - {selectedExam.name}
            </h4>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
              {selectedExam.defaultPrepInstructions}
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200/50 dark:border-yellow-800/30 p-3 rounded-lg flex gap-2.5 items-start mt-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800 dark:text-yellow-400 leading-normal">
                <strong>Atenção:</strong> Siga rigorosamente as instruções de preparo para garantir a qualidade do seu exame e evitar o cancelamento do procedimento no dia do agendamento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
