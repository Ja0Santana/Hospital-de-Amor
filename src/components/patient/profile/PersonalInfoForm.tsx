import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Camera, CheckCircle2, AlertTriangle, User, Activity, HelpCircle, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import Tooltip from '../../ui/Tooltip';
import { formatPhone, formatCpf } from '../../../lib/sanitizer';
import type { PatientUser } from '../../../types';

interface PersonalInfoFormProps {
  user: PatientUser | null;
  userRole: 'patient' | 'donor';
  loading: boolean;
  onPhotoUpload: (file: File) => void;
  onRemovePhoto: () => void;
  photoSuccess: string;
  photoError: string;
  profileSuccess: string;
  profileError: string;
  onSaveProfile: (data: Partial<PatientUser>) => Promise<void>;
}

export default function PersonalInfoForm({
  user,
  userRole,
  loading,
  onPhotoUpload,
  onRemovePhoto,
  photoSuccess,
  photoError,
  profileSuccess,
  profileError,
  onSaveProfile
}: PersonalInfoFormProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('SE');
  const [city, setCity] = useState('Lagarto');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBloodType(user.bloodType || '');
      setAllergies(user.allergies || '');
      setClinicalDiagnosis(user.clinicalDiagnosis || '');
      setEmergencyContactName(user.emergencyContactName || '');
      setEmergencyContactPhone(user.emergencyContactPhone || '');
      setEmergencyContactRelation(user.emergencyContactRelation || '');
    }
  }, [user]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoUpload(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const updateData: Partial<PatientUser> = {
      email,
      phone
    };
    if (userRole !== 'donor') {
      Object.assign(updateData, {
        bloodType,
        allergies,
        clinicalDiagnosis,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation
      });
    }
    onSaveProfile(updateData);
  };

  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 text-left">
      <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <User className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-zinc-805 dark:text-zinc-205">
          {userRole === 'donor' ? 'Dados do Doador' : 'Dados do Paciente'}
        </h2>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-150 dark:border-zinc-800/50">
            <div className="relative group w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-primary uppercase select-none">
                  {user?.name ? user.name.slice(0, 2) : 'HA'}
                </span>
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                />
              </label>
            </div>
            <div className="text-center sm:text-left space-y-1.5">
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-305">Foto de Perfil</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo: 2MB.
              </p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <Button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) onPhotoUpload(file);
                    };
                    input.click();
                  }}
                  variant="outline"
                  className="h-8 text-[10px] font-bold px-3 border-zinc-200 dark:border-zinc-800 rounded-lg animate-in"
                >
                  Alterar Foto
                </Button>
                {user?.photoUrl && (
                  <Button
                    type="button"
                    onClick={onRemovePhoto}
                    variant="ghost"
                    className="h-8 text-[10px] font-bold px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg animate-in"
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          {photoSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-955/20 border border-green-200/50 dark:border-green-800/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl flex gap-2.5 items-start animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{photoSuccess}</span>
            </div>
          )}
          {photoError && (
            <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{photoError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-zinc-500">Nome Completo</Label>
              <Input value={user?.name || ''} disabled className="bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-500 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-500">CPF do Titular</Label>
              <Input value={user ? formatCpf(user.cpf) : ''} disabled className="bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-500 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-500">Data de Nascimento</Label>
              <div className="relative">
                <Input value={user ? new Date(user.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''} disabled className="pl-9 bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-500 rounded-xl" />
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">E-mail de Contato</Label>
              <div className="relative">
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Telefone Principal</Label>
              <div className="relative">
                <Input id="phone" type="text" value={formatPhone(phone)} onChange={(e) => setPhone(e.target.value)} maxLength={15} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Estado (UF)</Label>
              <div className="relative">
                <Input id="state" type="text" value={state} onChange={(e) => setState(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cidade</Label>
              <div className="relative">
                <Input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {userRole !== 'donor' && (
            <>
              <div className="border-t border-zinc-200 dark:border-zinc-800 my-6" />

              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  Ficha de Saúde e Emergência (F.I.C.E.)
                  <Tooltip id="tooltip-fice" content="Dados de saúde compartilhados para agilizar o atendimento em caso de emergência ou triagem clínica.">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-650 transition-colors animate-in" />
                  </Tooltip>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bloodType" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Grupo Sanguíneo</Label>
                  <select
                    id="bloodType"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary rounded-xl bg-white dark:bg-zinc-950 text-sm focus-visible:outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="allergies" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Alergias Conhecidas</Label>
                  <Input
                    id="allergies"
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="Ex: Medicamentos, alimentos, etc."
                    className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="clinicalDiagnosis" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Diagnóstico Clínico Principal</Label>
                  <Input
                    id="clinicalDiagnosis"
                    type="text"
                    value={clinicalDiagnosis}
                    onChange={(e) => setClinicalDiagnosis(e.target.value)}
                    placeholder="Ex: Neoplasia de mama sob acompanhamento."
                    className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emergencyContactName" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nome do Contato de Emergência</Label>
                  <Input
                    id="emergencyContactName"
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Ex: Carlos Alberto"
                    className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContactPhone" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Telefone do Contato</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="text"
                      value={formatPhone(emergencyContactPhone)}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContactRelation" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Grau de Parentesco</Label>
                    <Input
                      id="emergencyContactRelation"
                      type="text"
                      value={emergencyContactRelation}
                      onChange={(e) => setEmergencyContactRelation(e.target.value)}
                      placeholder="Ex: Cônjuge, Filho(a)"
                      className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {profileSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-955/20 border border-green-200/50 dark:border-green-800/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl flex gap-2.5 items-start animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{profileSuccess}</span>
            </div>
          )}
          {profileError && (
            <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-transform active:scale-[0.98]">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
