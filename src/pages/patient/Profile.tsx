import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { formatPhone, formatCpf } from '../../lib/sanitizer';
import { getUserByCpf, updatePatientUser, deleteUserAndAppointments, getAppointmentByCpf, updateUserPassword } from '../../services/db';
import type { PatientUser } from '../../types';
import { 
  User, Lock, Mail, Phone, Calendar, MapPin, Download, Trash2, 
  Shield, Bell, AlertTriangle, CheckCircle2, History, ShieldCheck 
} from 'lucide-react';

interface ProfileProps {
  patientCpf: string;
  onLogout: () => void;
}

export default function Profile({ patientCpf, onLogout }: ProfileProps) {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isEmailNotify, setIsEmailNotify] = useState(true);
  const [isSmsNotify, setIsSmsNotify] = useState(false);
  const [isWhatsappNotify, setIsWhatsappNotify] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadUserData();
  }, [patientCpf]);

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
      await updatePatientUser(patientCpf, {
        email,
        phone,
      });
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

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve conter no mínimo 6 caracteres.');
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
      const appointments = await getAppointmentByCpf(cleanCpf);
      
      const report = {
        emitidoEm: new Date().toISOString(),
        legislacao: "Lei Geral de Protecao de Dados Pessoais (LGPD) - Lei nº 13.709/2018",
        dadosPaciente: {
          nome: user.name,
          cpf: formatCpf(user.cpf),
          nascimento: user.birthDate,
          contatos: {
            email: user.email,
            telefone: user.phone
          },
          contaCriadaEm: user.createdAt
        },
        historicoAgendamentos: appointments.map(app => ({
          protocolo: app.protocol,
          especialidade: app.specialtyName,
          exame: app.examName,
          criadoEm: app.createdAt,
          status: app.status,
          observacoes: app.observations
        }))
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `dados_pessoais_${cleanCpf}.json`);
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
              <User className="w-5 h-5 text-primary" />
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
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">E-mail de Contato</Label>
                    <div className="relative">
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Telefone Principal</Label>
                    <div className="relative">
                      <Input id="phone" type="text" value={formatPhone(phone)} onChange={(e) => setPhone(e.target.value)} maxLength={15} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Estado (UF)</Label>
                    <div className="relative">
                      <Input id="state" type="text" value={state} onChange={(e) => setState(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Cidade</Label>
                    <div className="relative">
                      <Input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className="pl-9 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl" />
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-transform active:scale-[0.98]">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
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
                    <Input id="currPass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="newPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nova Senha</Label>
                    <Input id="newPass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confNewPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirmar Nova Senha</Label>
                    <Input id="confNewPass" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-transform active:scale-[0.98]">
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
              <Bell className="w-5 h-5 text-primary" />
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
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Painel LGPD e Privacidade</h2>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-200/30 dark:border-blue-800/20 p-4 rounded-2xl space-y-2 text-xs leading-normal">
                <p className="text-zinc-700 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
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
                  <Download className="w-4 h-4" />
                  Exportar Meus Dados (JSON)
                </Button>

                <Button 
                  onClick={() => setShowDeleteModal(true)} 
                  type="button" 
                  variant="ghost" 
                  className="w-full h-11 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 text-zinc-500 font-bold rounded-xl gap-2 text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Meu Cadastro
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
            <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Log de Auditoria LGPD</h2>
            </div>
            <CardContent className="p-6">
              <p className="text-[11px] text-zinc-500 leading-normal mb-3">Histórico de ações de processamento sobre suas informações pessoais:</p>
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs">
                    <div className="text-zinc-400 font-mono text-[10px] shrink-0 pt-0.5">{log.date} às {log.time}</div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">{log.action}</div>
                      <div className="text-[10px] text-zinc-500 leading-normal">{log.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex gap-3 items-start">
              <div className="p-2.5 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full shrink-0 border border-red-200/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50">Tem certeza absoluta?</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Ao confirmar a exclusão do cadastro, sua conta de acesso e **todos os seus agendamentos, protocolos e arquivos de exames enviados** serão apagados permanentemente do banco de dados local (IndexedDB) em conformidade com o seu direito de exclusão da LGPD. Esta ação não poderá ser desfeita.
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
