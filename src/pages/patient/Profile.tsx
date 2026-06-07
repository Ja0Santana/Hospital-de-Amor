import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { formatPhone, formatCpf } from '../../lib/sanitizer';
import { getUserByCpf, updatePatientUser, deleteUserAndAppointments, getAppointmentByCpf, updateUserPassword, getDonationsByCpf } from '../../services/db';
import type { PatientUser, Appointment } from '../../types';
import { 
  User, Lock, Mail, Phone, Calendar, MapPin, Download, Trash2, 
  Shield, Bell, AlertTriangle, CheckCircle2, History, ShieldCheck,
  Type, Activity, Eye, EyeOff, Camera
} from 'lucide-react';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';


interface ProfileProps {
  patientCpf: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  onPhotoUpdate?: (url: string) => void;
}

export default function Profile({ patientCpf, onLogout, onNavigate, fontSize, setFontSize, theme, setTheme, onPhotoUpdate }: ProfileProps) {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);


  const [isEmailNotify, setIsEmailNotify] = useState(true);
  const [isSmsNotify, setIsSmsNotify] = useState(false);
  const [isWhatsappNotify, setIsWhatsappNotify] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [openAppointments, setOpenAppointments] = useState<Appointment[]>([]);

  const auditLogs = [
    { date: 'Hoje', time: '20:15', action: 'Autenticação', desc: 'Login efetuado com sucesso no portal.' },
    { date: 'Hoje', time: '10:00', action: 'Leitura de Dados', desc: 'Consulta ao histórico de exames e agendamentos.' },
    { date: 'Ontem', time: '14:32', action: 'Consentimento LGPD', desc: 'Aceite de termos de privacidade no envio de exames.' }
  ];

  useEffect(() => {
    const loadUserData = async () => {
      if (!patientCpf) return;
      try {
        const cleanCpf = patientCpf.replace(/\D/g, "");
        const patient = await getUserByCpf(cleanCpf);
        if (patient) {
          setUser(patient);
          setName(patient.name);
          setEmail(patient.email);
          setPhone(patient.phone);
          setState('SE');
          setCity('Lagarto');
          setBloodType(patient.bloodType || '');
          setAllergies(patient.allergies || '');
          setClinicalDiagnosis(patient.clinicalDiagnosis || '');
          setEmergencyContactName(patient.emergencyContactName || '');
          setEmergencyContactPhone(patient.emergencyContactPhone || '');
          setEmergencyContactRelation(patient.emergencyContactRelation || '');
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadUserData();
  }, [patientCpf]);

  const handlePhotoUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 2MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Formato de arquivo inválido. Selecione uma imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          await updatePatientUser(patientCpf, { photoUrl: base64 });
          if (user) {
            setUser({ ...user, photoUrl: base64 });
          }
          if (onPhotoUpdate) {
            onPhotoUpdate(base64);
          }
          setSuccessMessage('Foto de perfil atualizada com sucesso.');
        } catch (err) {
          setErrorMessage('Erro ao salvar a foto de perfil.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updatePatientUser(patientCpf, { photoUrl: '' });
      if (user) {
        setUser({ ...user, photoUrl: '' });
      }
      if (onPhotoUpdate) {
        onPhotoUpdate('');
      }
      setSuccessMessage('Foto de perfil removida com sucesso.');
    } catch (err) {
      setErrorMessage('Erro ao remover a foto de perfil.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!email.trim() || !phone.trim() || !city.trim() || !state.trim()) {
      setErrorMessage('Todos os campos de contato e endereço são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const updateData: Partial<PatientUser> = {
        email,
        phone,
      };
      if (user?.role !== 'donor') {
        Object.assign(updateData, {
          bloodType,
          allergies,
          clinicalDiagnosis,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelation,
        });
      }
      await updatePatientUser(patientCpf, updateData);
      if (user) {
        const updated = {
          ...user,
          email,
          phone,
        };
        if (user.role !== 'donor') {
          Object.assign(updated, {
            bloodType,
            allergies,
            clinicalDiagnosis,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelation,
          });
        }
        setUser(updated);
      }
      setSuccessMessage('Dados atualizados com sucesso no banco de dados local.');
    } catch (err: any) {
      setErrorMessage('Erro ao atualizar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Todos os campos de senha são obrigatórios.');
      return;
    }

    if (!isNewPasswordValid) {
      setPasswordError('A nova senha não atende aos requisitos mínimos de segurança.');
      return;
    }


    if (newPassword !== confirmNewPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const cleanCpf = patientCpf.replace(/\D/g, "");
      const patient = await getUserByCpf(cleanCpf);
      if (!patient || patient.passwordHash !== currentPassword) {
        setPasswordError('A senha atual informada está incorreta.');
        setLoading(false);
        return;
      }

      await updateUserPassword(cleanCpf, newPassword);
      setPasswordSuccess('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
    } catch (err: any) {
      setPasswordError('Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      const cleanCpf = patientCpf.replace(/\D/g, "");
      
      let report: any = {
        emitidoEm: new Date().toISOString(),
        legislacao: "Lei Geral de Protecao de Dados Pessoais (LGPD) - Lei nº 13.709/2018",
      };

      if (user.role === 'donor') {
        const donations = await getDonationsByCpf(cleanCpf);
        report.dadosDoador = {
          nome: user.name,
          cpf: formatCpf(user.cpf),
          contatos: {
            email: user.email,
            telefone: user.phone
          },
          contaCriadaEm: user.createdAt
        };
        report.historicoDoacoes = donations.map(d => ({
          id: d.id,
          valor: d.amount,
          metodo: d.method,
          status: d.status,
          data: d.date,
          tipo: d.type === 'recurring' ? 'Recorrente' : 'Única',
          hash: d.hash
        }));
      } else {
        const appointments = await getAppointmentByCpf(cleanCpf);
        report.dadosPaciente = {
          nome: user.name,
          cpf: formatCpf(user.cpf),
          nascimento: user.birthDate,
          contatos: {
            email: user.email,
            telefone: user.phone
          },
          fichaClinicaEmergencia: {
            grupoSanguineo: user.bloodType || 'Não informado',
            allergies: user.allergies || 'Nenhuma alergia relatada',
            diagnosticoClinico: user.clinicalDiagnosis || 'Sem diagnóstico informado',
            contatoEmergencia: {
              nome: user.emergencyContactName || 'Não informado',
              telefone: user.emergencyContactPhone ? formatPhone(user.emergencyContactPhone) : 'Não informado',
              parentesco: user.emergencyContactRelation || 'Não informado'
            }
          },
          contaCriadaEm: user.createdAt
        };
        report.historicoAgendamentos = appointments.map(app => ({
          protocolo: app.protocol,
          especialidade: app.specialtyName,
          exame: app.examName,
          criadoEm: app.createdAt,
          status: app.status,
          observacoes: app.observations
        }));
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", user.role === 'donor' ? `dados_doador_${cleanCpf}.json` : `dados_paciente_${cleanCpf}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const cleanCpf = patientCpf.replace(/\D/g, "");
      await deleteUserAndAppointments(cleanCpf);
      setShowDeleteModal(false);
      onLogout();
    } catch (err) {
      console.error(err);
    }
  };

  const OPEN_STATUSES: Appointment['status'][] = ['Pendente', 'Em análise', 'Confirmado'];

  const handleRequestDelete = async () => {
    try {
      const cleanCpf = patientCpf.replace(/\D/g, "");
      const allAppointments = await getAppointmentByCpf(cleanCpf);
      const pendingOnes = allAppointments.filter((a) => OPEN_STATUSES.includes(a.status));
      if (pendingOnes.length > 0) {
        setOpenAppointments(pendingOnes);
        setShowBlockedModal(true);
      } else {
        setShowDeleteModal(true);
      }
    } catch (err) {
      console.error(err);
      setShowDeleteModal(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Meu Perfil</h1>
        <p className="text-zinc-500 mt-1">Gerencie seus dados cadastrais, segurança e preferências de privacidade (LGPD).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Dados do Paciente</h2>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {successMessage && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}
                {errorMessage && (
                  <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-150 dark:border-zinc-800/50">
                  <div className="relative group w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-full border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-primary uppercase select-none">
                        {name ? name.slice(0, 2) : 'HA'}
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
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Foto de Perfil</p>
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
                            if (file) handlePhotoUpload(file);
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
                          onClick={handleRemovePhoto}
                          variant="ghost"
                          className="h-8 text-[10px] font-bold px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg animate-in"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-zinc-500">Nome Completo</Label>
                    <Input value={name} disabled className="bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-500 rounded-xl" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-zinc-500">CPF do Titular</Label>
                    <Input value={formatCpf(patientCpf)} disabled className="bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-500 rounded-xl" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-zinc-500">Data de Nascimento</Label>
                    <div className="relative">
                      <Input value={user ? new Date(user.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : ''} disabled className="pl-9 bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-500 rounded-xl" />
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">E-mail de Contato</Label>
                    <div className="relative">
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Telefone Principal</Label>
                    <div className="relative">
                      <Input id="phone" type="text" value={formatPhone(phone)} onChange={(e) => setPhone(e.target.value)} maxLength={15} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Estado (UF)</Label>
                    <div className="relative">
                      <Input id="state" type="text" value={state} onChange={(e) => setState(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cidade</Label>
                    <div className="relative">
                      <Input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {user?.role !== 'donor' && (
                  <>
                    <div className="border-t border-zinc-200 dark:border-zinc-800 my-6" />

                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Ficha de Saúde e Emergência (F.I.C.E.)</h3>
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

                <div className="flex justify-end pt-6">
                  <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-transform active:scale-[0.98]">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Alterar Senha de Acesso</h2>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {passwordSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Senha Atual</Label>
                    <div className="relative">
                      <Input id="currPass" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10 pr-10" />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                        aria-label={showCurrentPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="newPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nova Senha</Label>
                    <div className="relative">
                      <Input id="newPass" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10 pr-10" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                        aria-label={showNewPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confNewPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input id="confNewPass" type={showConfirmNewPassword ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10 pr-10" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                        aria-label={showConfirmNewPassword ? "Ocultar senha" : "Ver senha"}
                      >
                        {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {newPassword && (
                  <div className="pt-2">
                    <PasswordStrengthMeter password={newPassword} onValidityChange={setIsNewPasswordValid} />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading || !isNewPasswordValid} className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Salvando...' : 'Alterar Senha'}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Acessibilidade Visual</h2>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-500">Tamanho da Fonte</Label>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Ajuste a escala das fontes do portal:
                </p>
                <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/30 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFontSize('small')}
                    className={`h-9 px-0 text-[10px] font-bold rounded-lg transition-colors ${fontSize === 'small' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Menor
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFontSize('default')}
                    className={`h-9 px-0 text-xs font-bold rounded-lg transition-colors ${fontSize === 'default' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Padrão
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFontSize('medium')}
                    className={`h-9 px-0 text-sm font-bold rounded-lg transition-colors ${fontSize === 'medium' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Médio
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFontSize('large')}
                    className={`h-9 px-0 text-base font-bold rounded-lg transition-colors ${fontSize === 'large' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Grande
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setFontSize('xlarge')}
                    className={`h-9 px-0 text-lg font-bold rounded-lg transition-colors ${fontSize === 'xlarge' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    G+
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Label className="text-xs font-semibold text-zinc-500">Contraste e Tema</Label>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                  Escolha o tema de cores de sua preferência:
                </p>
                <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/30 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setTheme('light')}
                    className={`h-9 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${theme === 'light' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Claro
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setTheme('dark')}
                    className={`h-9 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${theme === 'dark' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Escuro
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setTheme('contrast')}
                    className={`h-9 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${theme === 'contrast' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
                  >
                    Contraste
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Alertas e Notificações</h2>
            </div>
            <CardContent className="p-6 space-y-4">
              <p className="text-[11px] text-zinc-500 leading-normal">Selecione seus canais de preferência para alertas de triagem e agendamento médico:</p>
              
              <div className="space-y-3 pt-2">
                <div className="flex gap-2.5 items-start">
                  <Checkbox id="emailNotify" checked={isEmailNotify} onCheckedChange={(checked) => setIsEmailNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
                  <Label htmlFor="emailNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-none cursor-pointer">
                    Notificações por E-mail
                  </Label>
                </div>

                <div className="flex gap-2.5 items-start">
                  <Checkbox id="smsNotify" checked={isSmsNotify} onCheckedChange={(checked) => setIsSmsNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
                  <Label htmlFor="smsNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-none cursor-pointer">
                    Notificações por SMS
                  </Label>
                </div>

                <div className="flex gap-2.5 items-start">
                  <Checkbox id="whatsappNotify" checked={isWhatsappNotify} onCheckedChange={(checked) => setIsWhatsappNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
                  <Label htmlFor="whatsappNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-none cursor-pointer">
                    Mensagens por WhatsApp
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Painel LGPD e Privacidade</h2>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-200/30 dark:border-blue-800/20 p-4 rounded-2xl space-y-2 text-xs leading-normal">
                <p className="text-zinc-700 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
                  Controle de Consentimento:
                </p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  O Hospital de Amor trata seus dados sensíveis e de saúde de forma segura e estritamente para o processo de regulação e agendamento de consultas e exames oncológicos.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button 
                  onClick={handleExportData} 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 font-bold rounded-xl gap-2 text-xs"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Exportar Meus Dados (JSON)
                </Button>

                <Button 
                  onClick={handleRequestDelete} 
                  type="button" 
                  variant="ghost" 
                  className="w-full h-11 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 text-zinc-500 font-bold rounded-xl gap-2 text-xs"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Excluir Meu Cadastro
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Log de Auditoria LGPD</h2>
            </div>
            <CardContent className="p-6">
              <p className="text-[11px] text-zinc-500 leading-normal mb-3">Histórico de ações de processamento sobre suas informações pessoais:</p>
              <ol className="space-y-3 list-none">
                {auditLogs.map((log, idx) => (
                  <li key={idx} className="flex gap-2.5 text-xs">
                    <time className="text-zinc-400 font-mono text-[10px] shrink-0 pt-0.5">{log.date} às {log.time}</time>
                    <div className="space-y-0.5">
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">{log.action}</div>
                      <div className="text-[10px] text-zinc-500 leading-normal">{log.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {showBlockedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5">
            <div className="flex gap-3 items-start">
              <div className="p-2.5 bg-yellow-100 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 rounded-full shrink-0 border border-yellow-200/20">
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-50">Você tem eventos em aberto</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Não é possível excluir sua conta enquanto houver consultas ou exames pendentes. Resolva os itens abaixo antes de continuar.
                </p>
              </div>
            </div>

            <ul className="space-y-2 list-none max-h-48 overflow-y-auto">
              {openAppointments.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{app.examName}</p>
                    <p className="text-zinc-400 text-[10px]">Protocolo: {app.protocol}</p>
                  </div>
                  <span className={`shrink-0 font-semibold text-[10px] px-2 py-0.5 rounded-full border ${
                    app.status === 'Confirmado' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400' :
                    app.status === 'Em análise' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400'
                  }`}>{app.status}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBlockedModal(false)}
                className="h-10 px-4 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-xs"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={() => { setShowBlockedModal(false); onNavigate('status-check'); }}
                className="h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Ver Meus Agendamentos
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex gap-3 items-start">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full shrink-0 border border-red-200/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50">Excluir conta?</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Ao confirmar, seu acesso ao portal será encerrado e todo o seu histórico de agendamentos e exames será removido. Você precisará criar uma nova conta caso queira utilizar o serviço novamente.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="h-10 px-4 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-xs">
                Cancelar
              </Button>
              <Button type="button" onClick={handleDeleteAccount} className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md">
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
