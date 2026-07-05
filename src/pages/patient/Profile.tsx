import { useState, useEffect } from 'react';
import { 
  getUserByCpf, 
  updatePatientUser, 
  deleteUserAndAppointments, 
  getAppointmentByCpf, 
  updateUserPassword, 
  getDonationsByCpf 
} from '../../services/db';
import type { PatientUser, Appointment } from '../../types';
import { formatCpf, formatPhone } from '../../lib/sanitizer';

import PersonalInfoForm from '../../components/patient/profile/PersonalInfoForm';
import PasswordChangeForm from '../../components/patient/profile/PasswordChangeForm';
import AccessibilitySettings from '../../components/patient/profile/AccessibilitySettings';
import LgpdConsentForm from '../../components/patient/profile/LgpdConsentForm';
import LgpdAuditLogs from '../../components/patient/profile/LgpdAuditLogs';
import DeleteAccountModals from '../../components/patient/profile/DeleteAccountModals';

interface ProfileProps {
  patientCpf: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  onPhotoUpdate?: (url: string) => void;
  userRole?: 'patient' | 'donor';
}

export default function Profile({
  patientCpf,
  onLogout,
  onNavigate,
  fontSize,
  setFontSize,
  theme,
  setTheme,
  onPhotoUpdate,
  userRole = 'patient'
}: ProfileProps) {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [loading, setLoading] = useState(false);

  const [photoSuccess, setPhotoSuccess] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [privacySuccess, setPrivacySuccess] = useState('');
  const [privacyError, setPrivacyError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [lastConsentAt, setLastConsentAt] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [openAppointments, setOpenAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!patientCpf) return;
      try {
        const cleanCpf = patientCpf.replace(/\D/g, "");
        const patient = await getUserByCpf(cleanCpf);
        if (patient) {
          setUser(patient);
          setLastConsentAt(patient.lastConsentAt || patient.createdAt || '');
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadUserData();
  }, [patientCpf]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBlockedModal(false);
        setShowDeleteModal(false);
      }
    };
    if (showBlockedModal || showDeleteModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showBlockedModal, showDeleteModal]);

  const clearLocalMessages = () => {
    setPhotoSuccess('');
    setPhotoError('');
    setProfileSuccess('');
    setProfileError('');
    setPrivacySuccess('');
    setPrivacyError('');
  };

  const handlePhotoUpload = (file: File) => {
    clearLocalMessages();
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('A imagem deve ter no máximo 2MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Formato de arquivo inválido. Selecione uma imagem.');
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
          setPhotoSuccess('Foto de perfil atualizada com sucesso.');
        } catch (err) {
          setPhotoError('Erro ao salvar a foto de perfil.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    clearLocalMessages();
    try {
      await updatePatientUser(patientCpf, { photoUrl: '' });
      if (user) {
        setUser({ ...user, photoUrl: '' });
      }
      if (onPhotoUpdate) {
        onPhotoUpdate('');
      }
      setPhotoSuccess('Foto de perfil removida com sucesso.');
    } catch (err) {
      setPhotoError('Erro ao remover a foto de perfil.');
    }
  };

  const handleUpdateProfile = async (updateData: Partial<PatientUser>) => {
    clearLocalMessages();
    if (!updateData.email?.trim() || !updateData.phone?.trim()) {
      setProfileError('Todos os campos de contato e endereço são obrigatórios.');
      throw new Error();
    }

    setLoading(true);
    try {
      await updatePatientUser(patientCpf, updateData);
      if (user) {
        setUser({
          ...user,
          ...updateData
        });
      }
      setProfileSuccess('Dados atualizados com sucesso no banco de dados local.');
    } catch (err: any) {
      setProfileError('Erro ao atualizar os dados.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrivacy = async (preferences: {
    emailNotify: boolean;
    smsNotify: boolean;
    whatsappNotify: boolean;
    npsNotify: boolean;
    newsletterNotify: boolean;
    marketingNotify: boolean;
  }) => {
    clearLocalMessages();
    setLoading(true);
    try {
      const consentTime = new Date().toISOString();
      const privacyData = {
        privacyPreferences: preferences,
        lastConsentAt: consentTime
      };
      await updatePatientUser(patientCpf, privacyData);
      setLastConsentAt(consentTime);
      if (user) {
        setUser({
          ...user,
          ...privacyData
        });
      }
      setPrivacySuccess('Preferências de privacidade e consentimento atualizados com sucesso.');
    } catch (err) {
      setPrivacyError('Erro ao atualizar preferências de privacidade.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (
    currentPass: string,
    newPass: string,
    isNewPasswordValid: boolean,
    confirmNewPass: string
  ) => {
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPass || !newPass || !confirmNewPass) {
      setPasswordError('Todos os campos de senha são obrigatórios.');
      throw new Error();
    }

    if (!isNewPasswordValid) {
      setPasswordError('A nova senha não atende aos requisitos mínimos de segurança.');
      throw new Error();
    }

    if (newPass !== confirmNewPass) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      throw new Error();
    }

    setLoading(true);
    try {
      const cleanCpf = patientCpf.replace(/\D/g, "");
      const patient = await getUserByCpf(cleanCpf);
      if (!patient || patient.passwordHash !== currentPass) {
        setPasswordError('A senha atual informada está incorreta.');
        setLoading(false);
        throw new Error();
      }

      await updateUserPassword(cleanCpf, newPass);
      setPasswordSuccess('Senha alterada com sucesso.');
    } catch (err: any) {
      setPasswordError('Erro ao atualizar a senha.');
      throw err;
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

      if (userRole === 'donor') {
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
      downloadAnchor.setAttribute("download", userRole === 'donor' ? `dados_doador_${cleanCpf}.json` : `dados_paciente_${cleanCpf}.json`);
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
      const isPatient = user?.role === 'patient' || user?.role === 'both';
      if (!isPatient) {
        setShowDeleteModal(true);
        return;
      }
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
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Meu Perfil</h1>
        <p className="text-zinc-500 mt-1">Gerencie seus dados cadastrais, segurança e preferências de privacidade (LGPD).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <PersonalInfoForm
            user={user}
            userRole={userRole}
            loading={loading}
            onPhotoUpload={handlePhotoUpload}
            onRemovePhoto={handleRemovePhoto}
            photoSuccess={photoSuccess}
            photoError={photoError}
            profileSuccess={profileSuccess}
            profileError={profileError}
            onSaveProfile={handleUpdateProfile}
          />

          <PasswordChangeForm
            loading={loading}
            passwordSuccess={passwordSuccess}
            passwordError={passwordError}
            onSavePassword={handleUpdatePassword}
          />
        </div>

        <div className="lg:col-span-4 space-y-8">
          <AccessibilitySettings
            fontSize={fontSize}
            setFontSize={setFontSize}
            theme={theme}
            setTheme={setTheme}
          />

          <LgpdConsentForm
            userRole={userRole}
            loading={loading}
            lastConsentAt={lastConsentAt}
            privacySuccess={privacySuccess}
            privacyError={privacyError}
            initialPreferences={{
              emailNotify: user?.privacyPreferences?.emailNotify ?? true,
              smsNotify: user?.privacyPreferences?.smsNotify ?? false,
              whatsappNotify: user?.privacyPreferences?.whatsappNotify ?? true,
              npsNotify: user?.privacyPreferences?.npsNotify ?? true,
              newsletterNotify: user?.privacyPreferences?.newsletterNotify ?? false,
              marketingNotify: user?.privacyPreferences?.marketingNotify ?? false
            }}
            onSavePrivacy={handleUpdatePrivacy}
            onExportData={handleExportData}
            onRequestDeleteAccount={handleRequestDelete}
          />

          <LgpdAuditLogs />
        </div>
      </div>

      <DeleteAccountModals
        user={user}
        showBlockedModal={showBlockedModal}
        setShowBlockedModal={setShowBlockedModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        openAppointments={openAppointments}
        onConfirmDelete={handleDeleteAccount}
        onNavigate={onNavigate}
      />
    </div>
  );
}
