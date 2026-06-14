import React, { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';
import { getCities } from '../../../services/db';
import type { City } from '../../../types';
import { formatCpf, formatPhone, validateCpf, sanitizeString } from '../../../lib/sanitizer';
import { AlertCircle, HelpCircle } from 'lucide-react';
import Tooltip from '../../../components/ui/Tooltip';

interface StepPatientDataProps {
  formData: {
    patientName: string;
    patientCpf: string;
    patientBirthDate: string;
    patientPhone: string;
    patientEmail: string;
    state: string;
    city: string;
    region?: string;
  };
  onChange: (data: Partial<StepPatientDataProps['formData']>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function StepPatientData({ formData, onChange, errors, setErrors }: StepPatientDataProps) {
  const [availableCities, setAvailableCities] = useState<City[]>([]);

  useEffect(() => {
    getCities().then((results) => {
      if (formData.state === 'SE') {
        setAvailableCities(results.filter((c) => c.state === 'SE'));
      } else {
        setAvailableCities([]);
      }
    }).catch(console.error);
  }, [formData.state]);

  const handleCpfBlur = () => {
    const rawCpf = formData.patientCpf;
    if (!rawCpf) {
      setErrors((prev) => ({ ...prev, patientCpf: 'O CPF é obrigatório.' }));
      return;
    }
    const isValid = validateCpf(rawCpf);
    if (!isValid) {
      setErrors((prev) => ({ ...prev, patientCpf: 'Número de CPF inválido.' }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.patientCpf;
        return next;
      });
      onChange({ patientCpf: formatCpf(rawCpf) });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    const clean = formatted.replace(/\D/g, "");
    
    let updates: Partial<StepPatientDataProps['formData']> = { patientPhone: formatted };

    if (clean.startsWith('79')) {
      updates.state = 'SE';
      updates.city = 'Lagarto';
      updates.region = 'Região de Lagarto';
    }

    onChange(updates);
    
    if (errors.patientPhone) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.patientPhone;
        return next;
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange({ patientName: val });
    if (errors.patientName) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.patientName;
        return next;
      });
    }
  };

  const handleNameBlur = () => {
    onChange({ patientName: sanitizeString(formData.patientName) });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="patientName" className="font-semibold text-zinc-700 dark:text-zinc-300">Nome Completo *</Label>
          <Input
            id="patientName"
            type="text"
            value={formData.patientName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            className={`h-11 border-zinc-200 focus-visible:ring-primary ${errors.patientName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            placeholder="Digite seu nome completo"
          />
          {errors.patientName && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.patientName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientCpf" className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            CPF *
            <Tooltip id="tooltip-cpf" position="bottom" content="Seu CPF é validado matematicamente e protegido de acordo com as normas da LGPD.">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-650 transition-colors" />
            </Tooltip>
          </Label>
          <Input
            id="patientCpf"
            type="text"
            value={formData.patientCpf}
            onChange={(e) => onChange({ patientCpf: e.target.value })}
            onBlur={handleCpfBlur}
            maxLength={14}
            className={`h-11 border-zinc-200 focus-visible:ring-primary ${errors.patientCpf ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            placeholder="000.000.000-00"
          />
          {errors.patientCpf && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.patientCpf}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientBirthDate" className="font-semibold text-zinc-700 dark:text-zinc-300">Data de Nascimento *</Label>
          <Input
            id="patientBirthDate"
            type="date"
            value={formData.patientBirthDate}
            onChange={(e) => {
              onChange({ patientBirthDate: e.target.value });
              if (errors.patientBirthDate) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.patientBirthDate;
                  return next;
                });
              }
            }}
            className={`h-11 border-zinc-200 focus-visible:ring-primary ${errors.patientBirthDate ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {errors.patientBirthDate && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.patientBirthDate}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientPhone" className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            Telefone para Contato *
            <Tooltip id="tooltip-phone" position="bottom" content="Para números de Sergipe (DDD 79), o sistema sugere automaticamente o estado e a cidade.">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-650 transition-colors" />
            </Tooltip>
          </Label>
          <Input
            id="patientPhone"
            type="text"
            value={formData.patientPhone}
            onChange={handlePhoneChange}
            maxLength={15}
            className={`h-11 border-zinc-200 focus-visible:ring-primary ${errors.patientPhone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            placeholder="(00) 00000-0000"
          />
          {errors.patientPhone && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.patientPhone}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientEmail" className="font-semibold text-zinc-700 dark:text-zinc-300">E-mail Principal *</Label>
          <Input
            id="patientEmail"
            type="email"
            value={formData.patientEmail}
            onChange={(e) => {
              onChange({ patientEmail: e.target.value });
              if (errors.patientEmail) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.patientEmail;
                  return next;
                });
              }
            }}
            className={`h-11 border-zinc-200 focus-visible:ring-primary ${errors.patientEmail ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            placeholder="exemplo@email.com"
          />
          {errors.patientEmail && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.patientEmail}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
        <div className="space-y-2">
          <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Estado *</Label>
          <Select
            value={formData.state}
            onValueChange={(val) => {
              onChange({ state: val, city: '' });
              if (errors.state) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.state;
                  return next;
                });
              }
            }}
          >
            <SelectTrigger className={`h-11 border-zinc-200 focus:ring-primary ${errors.state ? 'border-red-500 focus:ring-red-500' : ''}`}>
              <SelectValue placeholder="Selecione o Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SE">Sergipe</SelectItem>
              <SelectItem value="AL">Alagoas</SelectItem>
              <SelectItem value="BA">Bahia</SelectItem>
              <SelectItem value="PE">Pernambuco</SelectItem>
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.state}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Cidade *</Label>
          <Select
            value={formData.city}
            onValueChange={(val) => {
              const matchedCity = availableCities.find((c) => c.name === val);
              onChange({ city: val, region: matchedCity ? matchedCity.region : 'Outra' });
              if (errors.city) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.city;
                  return next;
                });
              }
            }}
            disabled={!formData.state}
          >
            <SelectTrigger className={`h-11 border-zinc-200 focus:ring-primary ${errors.city ? 'border-red-500 focus:ring-red-500' : ''}`}>
              <SelectValue placeholder={formData.state ? "Selecione a Cidade" : "Selecione o Estado primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {formData.state === 'SE' ? (
                availableCities.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name} ({c.region})</SelectItem>
                ))
              ) : (
                <SelectItem value="Outra">Outra (Fora de Sergipe)</SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="text-red-500 text-xs flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.city}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
