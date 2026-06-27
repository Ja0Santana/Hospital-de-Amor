import React, { useState, useEffect, useRef } from 'react';
import {
  getAppointmentsForAdmin,
  getSpecialties,
  runDataLifecycleArchiving,
  addAuditLogAdmin,
  getFeedbacks,
  saveFeedbackReply,
  setFeedbackResolutionStatus
} from '../../services/db';
import type { Appointment, Specialty, PatientUser, FeedbackResponse } from '../../types';

import { Mail } from 'lucide-react';

import AnalyticsCharts from '../../components/admin/analytics/AnalyticsCharts';
import AnalyticsReports from '../../components/admin/analytics/AnalyticsReports';
import NpsFeedbackBoard from '../../components/admin/analytics/NpsFeedbackBoard';
import WaitTimeMonitor from '../../components/admin/analytics/WaitTimeMonitor';

interface AdminAnalyticsProps {
  loggedEmployee: PatientUser;
}

export default function AdminAnalytics({ loggedEmployee }: AdminAnalyticsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
  const [cityViewMode, setCityViewMode] = useState<'quantitativo' | 'percentual'>('quantitativo');
  const [examRankingMode, setExamRankingMode] = useState<'top' | 'bottom'>('top');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const today = new Date().toISOString().split('T')[0];

  const [reportRecipients, setReportRecipients] = useState<string>('diretoria@hospitaldeamor.org.br');
  const [reportDay, setReportDay] = useState<number>(1);
  const [isReportScheduled, setIsReportScheduled] = useState<boolean>(false);
  const [scheduledReportSuccess, setScheduledReportSuccess] = useState<string>('');
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string>('');
  const [archiveErrorMsg, setArchiveErrorMsg] = useState<string>('');

  const [simulatedReportAlert, setSimulatedReportAlert] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'demanda' | 'nps' | 'espera'>('demanda');
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [npsSearch, setNpsSearch] = useState<string>('');
  const [selectedNpsSpecialty, setSelectedNpsSpecialty] = useState<string>('');
  const [selectedNpsRegion, setSelectedNpsRegion] = useState<string>('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [npsExportFormat, setNpsExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [npsRecipients, setNpsRecipients] = useState<string>('diretoria@hospitaldeamor.org.br');
  const [isNpsReportScheduled, setIsNpsReportScheduled] = useState<boolean>(false);
  const [npsReportDay] = useState<number>(1);
  const [npsReportSuccessMsg, setNpsReportSuccessMsg] = useState<string>('');
  const [replySuccessMsgMap, setReplySuccessMsgMap] = useState<Record<string, string>>({});
  const [npsStatusFilter, setNpsStatusFilter] = useState<'Todos' | 'Pendentes' | 'Em andamento' | 'Resolvidos'>('Todos');

  const [timeOffsetMin, setTimeOffsetMin] = useState(0);
  const [, setAnalyticsTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnalyticsTick(t => t + 1);
      if (activeTab === 'espera') {
        loadData();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const todayApps = appointments.filter(app => {
    if (!app.checkInAt) return false;
    const checkInDate = app.checkInAt.split('T')[0];
    return checkInDate === today;
  });

  const completedWaits = todayApps
    .filter(app => app.attendanceStartedAt)
    .map(app => Math.max(0, Math.floor((new Date(app.attendanceStartedAt!).getTime() - new Date(app.checkInAt!).getTime()) / 60000)));

  const averageWaitToday = completedWaits.length > 0
    ? Math.round(completedWaits.reduce((a, b) => a + b, 0) / completedWaits.length)
    : 18;

  const activeQueue = todayApps
    .filter(app => !app.attendanceStartedAt)
    .map(app => {
      const elapsedMs = new Date().getTime() - new Date(app.checkInAt!).getTime() + (timeOffsetMin * 60 * 1000);
      const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60000));
      const isCritical = elapsedMin > 30;
      return { ...app, elapsedMin, isCritical };
    });

  const criticalCount = activeQueue.filter(p => p.isCritical).length;
  const prevCriticalCount = useRef(0);

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      setTimeout(() => {
        const audioCtx2 = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc2 = audioCtx2.createOscillator();
        const gain2 = audioCtx2.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx2.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx2.currentTime);
        gain2.gain.setValueAtTime(0.15, audioCtx2.currentTime);
        osc2.start();
        osc2.stop(audioCtx2.currentTime + 0.15);
      }, 250);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (criticalCount >= 5 && criticalCount !== prevCriticalCount.current) {
      playAlertSound();
    }
    prevCriticalCount.current = criticalCount;
  }, [criticalCount]);

  const getHourlyData = () => {
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    const baseline = [15, 28, 35, 18, 24, 12];
    return hours.map((h, idx) => {
      const actualCount = appointments.filter(app => {
        if (!app.checkInAt) return false;
        const time = new Date(app.checkInAt).getHours();
        const startHour = parseInt(h.split(':')[0]);
        return time >= startHour && time < startHour + 2;
      }).length;
      const value = Math.max(8, baseline[idx] + (actualCount * 2));
      return { hour: h, value };
    });
  };

  const hourlyData = getHourlyData();
  const maxVal = Math.max(...hourlyData.map(d => d.value), 40);

  const exportWaitTimeToCSV = () => {
    let content = '\uFEFFProtocolo,Paciente,Especialidade,Horario Entrada,Tempo de Espera (min)\n';
    activeQueue.forEach(app => {
      content += `"${app.protocol || ''}","${app.patientName || ''}","${app.specialtyName || ''}","${app.checkInAt ? new Date(app.checkInAt).toLocaleTimeString('pt-BR') : ''}",${app.elapsedMin}\n`;
    });
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Fila_Espera_Recepcao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWaitTimeToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    doc.setFillColor(227, 20, 99);
    doc.rect(0, 0, 210, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('HOSPITAL DE AMOR - TEMPO DE ESPERA DA RECEPÇÃO', 12, 10);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Gerado por: ${loggedEmployee.name} (${loggedEmployee.cpf})`, 12, 22);
    doc.text(`Data de Geração: ${new Date().toLocaleString('pt-BR')}`, 12, 27);
    doc.text(`Média de Espera Geral do Dia: ${averageWaitToday} minutos`, 12, 32);

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(12, 38, 186, 15, 3, 3, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(227, 20, 99);
    doc.setFontSize(10);
    doc.text('RESUMO DA FILA ATIVA', 16, 44);
    doc.setTextColor(60, 60, 60);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Aguardando: ${activeQueue.length} pacientes | Críticos (>30 min): ${activeQueue.filter(p => p.isCritical).length}`, 16, 49);

    let y = 60;
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(227, 20, 99);
    doc.text('FILA DE ESPERA ATIVA DETALHADA', 12, y);

    y += 6;
    doc.setFontSize(8);
    doc.setFillColor(235, 235, 235);
    doc.rect(12, y, 186, 6, 'F');
    doc.setTextColor(40, 40, 40);
    doc.text('Protocolo', 14, y + 4.5);
    doc.text('Paciente', 42, y + 4.5);
    doc.text('Especialidade', 95, y + 4.5);
    doc.text('Entrada', 142, y + 4.5);
    doc.text('Espera', 178, y + 4.5);

    y += 6;
    activeQueue.forEach((app, idx) => {
      if (y > 275) {
        doc.addPage();
        doc.setFillColor(227, 20, 99);
        doc.rect(0, 0, 210, 10, 'F');
        y = 20;
      }
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(12, y, 186, 6.5, 'F');
      }
      doc.setTextColor(60, 60, 60);
      doc.setFont('Helvetica', 'normal');
      doc.text(app.protocol || '', 14, y + 4.5);
      doc.text(app.patientName ? app.patientName.substring(0, 26) : '', 42, y + 4.5);
      doc.text(app.specialtyName || '', 95, y + 4.5);
      doc.text(app.checkInAt ? new Date(app.checkInAt).toLocaleTimeString('pt-BR') : '', 142, y + 4.5);
      doc.text(`${app.elapsedMin} min`, 178, y + 4.5);
      y += 6.5;
    });

    doc.save(`Relatorio_Espera_Recepcao_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  useEffect(() => {
    loadData();
    checkSimulatedReports();
  }, []);

  const loadData = async () => {
    try {
      const allApps = await getAppointmentsForAdmin();
      setAppointments(allApps);
      const allSpecs = await getSpecialties();
      setSpecialties(allSpecs);
      const allFeedbacks = await getFeedbacks();
      setFeedbacks(allFeedbacks);
    } catch (e) {
      console.error(e);
    }
  };

  const checkSimulatedReports = () => {
    const isSched = localStorage.getItem('report_scheduler_active') === 'true';
    if (isSched) {
      const recipients = localStorage.getItem('report_scheduler_recipients') || 'diretoria@hospitaldeamor.org.br';
      setSimulatedReportAlert(`Simulação reativa: Relatório consolidado automático enviado com sucesso para ${recipients} (Agendado para o 1º dia útil do mês).`);
      setTimeout(() => setSimulatedReportAlert(''), 8000);
    }
    const isNpsSched = localStorage.getItem('nps_report_scheduler_active') === 'true';
    if (isNpsSched) {
      const npsRecs = localStorage.getItem('nps_report_scheduler_recipients') || 'diretoria@hospitaldeamor.org.br';
      setSimulatedReportAlert(prev => prev ? prev + ` | Relatório de Satisfação NPS enviado para ${npsRecs}.` : `Simulação reativa: Relatório de Satisfação NPS enviado automaticamente para ${npsRecs} (Agendado trimestralmente).`);
      setTimeout(() => setSimulatedReportAlert(''), 10000);
    }
  };

  const handleSaveReportSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = reportRecipients.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = emails.find(email => !emailRegex.test(email));
    if (invalidEmail) {
      setScheduledReportSuccess('Erro: Formato de e-mail inválido encontrado.');
      setTimeout(() => setScheduledReportSuccess(''), 4000);
      return;
    }
    const isHospitalDomain = (email: string) => {
      const domain = email.split('@')[1]?.toLowerCase();
      return domain && (
        domain.endsWith('hospitaldeamor.org.br') ||
        domain.endsWith('fundacaopioxii.org.br') ||
        domain.endsWith('hcancerbarretos.com.br')
      );
    };
    const invalidDomain = emails.find(email => !isHospitalDomain(email));
    if (invalidDomain) {
      setScheduledReportSuccess('Erro: Apenas e-mails institucionais (@hospitaldeamor.org.br ou @fundacaopioxii.org.br) são permitidos.');
      setTimeout(() => setScheduledReportSuccess(''), 4000);
      return;
    }

    localStorage.setItem('report_scheduler_active', isReportScheduled.toString());
    localStorage.setItem('report_scheduler_recipients', reportRecipients);
    localStorage.setItem('report_scheduler_day', reportDay.toString());

    await addAuditLogAdmin(
      `Configuração de envio de relatórios automáticos atualizada: Ativo: ${isReportScheduled ? 'Sim' : 'Não'}, Destinatários: ${reportRecipients}, Dia útil: ${reportDay}`,
      'Relatórios',
      'Configuração de agendamento automático de relatórios consolidados',
      loggedEmployee.cpf,
      loggedEmployee.name
    );

    setScheduledReportSuccess('Configuração de agendamento salva com sucesso!');
    setTimeout(() => setScheduledReportSuccess(''), 4000);
  };

  const handleRunColdStorage = async () => {
    setArchiveSuccessMsg('');
    setArchiveErrorMsg('');
    try {
      const count = await runDataLifecycleArchiving();
      await loadData();
      await addAuditLogAdmin(
        `Rotina de arquivamento automático (Cold Storage) executada. Registros arquivados: ${count}`,
        'Sistema',
        'Limpeza periódica de solicitações inativas há mais de 2 anos',
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setArchiveSuccessMsg(`Rotina concluída com sucesso! ${count} registros movidos para o Cold Storage.`);
      setTimeout(() => setArchiveSuccessMsg(''), 5000);
    } catch (e: any) {
      console.error(e);
      setArchiveErrorMsg(e.message || 'Erro ao rodar rotina de arquivamento.');
      setTimeout(() => setArchiveErrorMsg(''), 5000);
    }
  };

  const handleSaveFeedbackReply = async (feedbackId: string) => {
    const text = replyTextMap[feedbackId];
    if (!text || !text.trim()) return;

    try {
      await saveFeedbackReply(feedbackId, text.trim(), loggedEmployee.cpf, loggedEmployee.name);
      await loadData();
      setReplyTextMap(prev => ({ ...prev, [feedbackId]: '' }));
      setReplySuccessMsgMap(prev => ({ ...prev, [feedbackId]: 'Resposta enviada com sucesso!' }));
      setTimeout(() => {
        setReplySuccessMsgMap(prev => ({ ...prev, [feedbackId]: '' }));
      }, 4000);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSetFeedbackResolutionStatus = async (feedbackId: string, status: 'Pendente' | 'Em andamento' | 'Resolvido') => {
    try {
      await setFeedbackResolutionStatus(feedbackId, status, loggedEmployee.cpf, loggedEmployee.name);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportNpsData = async () => {
    setIsExporting(true);
    try {
      const filtered = feedbacks.filter(fb => {
        if (!fb.createdAt) return false;
        const dateStr = fb.createdAt.split('T')[0];
        if (startDate && dateStr < startDate) return false;
        if (endDate && dateStr > endDate) return false;
        return true;
      });

      if (npsExportFormat === 'pdf') {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        doc.setFillColor(227, 20, 99);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('HOSPITAL DE AMOR - RELATORIO DE SATISFACAO (NPS)', 12, 10);

        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Gerado por: ${loggedEmployee.name} (${loggedEmployee.cpf})`, 12, 22);
        doc.text(`Data de Geracao: ${new Date().toLocaleString('pt-BR')}`, 12, 27);
        doc.text(`Periodo de Triagem: ${startDate || 'Inicio'} ate ${endDate || 'Fim'}`, 12, 32);

        const total = filtered.length;
        const promoters = filtered.filter(f => f.npsScore >= 9).length;
        const passives = filtered.filter(f => f.npsScore >= 7 && f.npsScore <= 8).length;
        const detractors = filtered.filter(f => f.npsScore <= 6).length;

        const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

        doc.setFont('Helvetica', 'bold');
        doc.text('Metricas Consolidadas:', 12, 42);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Total de Feedbacks: ${total}`, 12, 48);
        doc.text(`Promotores (9-10): ${promoters} (${total > 0 ? ((promoters / total) * 100).toFixed(1) : 0}%)`, 12, 53);
        doc.text(`Passivos (7-8): ${passives} (${total > 0 ? ((passives / total) * 100).toFixed(1) : 0}%)`, 12, 58);
        doc.text(`Detratores (0-6): ${detractors} (${total > 0 ? ((detractors / total) * 100).toFixed(1) : 0}%)`, 12, 63);

        doc.setFont('Helvetica', 'bold');
        doc.setFillColor(244, 244, 245);
        doc.rect(12, 68, 186, 12, 'F');
        doc.setTextColor(227, 20, 99);
        doc.setFontSize(11);
        doc.text(`SCORE NPS CONSOLIDADO: ${npsScore}`, 16, 76);

        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'bold');
        doc.text('Comentarios dos Pacientes:', 12, 90);
        doc.setFont('Helvetica', 'normal');

        let yOffset = 96;
        filtered.slice(0, 10).forEach((fb, idx) => {
          if (yOffset > 270) {
            doc.addPage();
            doc.setFillColor(227, 20, 99);
            doc.rect(0, 0, 210, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('HOSPITAL DE AMOR - RELATORIO DE SATISFACAO (NPS)', 12, 10);
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(9);
            yOffset = 25;
          }
          const text = `${idx + 1}. Nota: ${fb.npsScore}/10 - "${fb.comment}"`;
          const lines = doc.splitTextToSize(text, 180);
          lines.forEach((line: string) => {
            doc.text(line, 12, yOffset);
            yOffset += 5;
          });
          if (fb.adminResponse) {
            doc.setFont('Helvetica', 'oblique');
            const respText = `   Resposta Ouvidoria: "${fb.adminResponse}"`;
            const respLines = doc.splitTextToSize(respText, 175);
            respLines.forEach((line: string) => {
              doc.text(line, 12, yOffset);
              yOffset += 5;
            });
            doc.setFont('Helvetica', 'normal');
          }
          yOffset += 2;
        });

        doc.save(`Relatorio_NPS_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (npsExportFormat === 'csv') {
        let csvContent = '\uFEFFProtocolo,CPF Paciente,Nota NPS,Comentario,Data,Resposta Administrativa\n';
        filtered.forEach(f => {
          const row = [
            f.appointmentProtocol,
            f.userCpf,
            f.npsScore,
            `"${f.comment.replace(/"/g, '""')}"`,
            f.createdAt,
            f.adminResponse ? `"${f.adminResponse.replace(/"/g, '""')}"` : ''
          ];
          csvContent += row.join(',') + '\n';
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Relatorio_NPS_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (npsExportFormat === 'excel') {
        let htmlTable = `
          <meta charset="utf-8">
          <table border="1" style="border-collapse: collapse; font-family: sans-serif;">
            <tr style="background-color: #E31463; color: white; font-weight: bold;">
              <th>Protocolo</th>
              <th>CPF Paciente</th>
              <th>Nota NPS</th>
              <th>Comentario</th>
              <th>Data</th>
              <th>Resposta Administrativa</th>
            </tr>
        `;
        filtered.forEach(f => {
          htmlTable += `
            <tr>
              <td>${f.appointmentProtocol}</td>
              <td>${f.userCpf}</td>
              <td align="right">${f.npsScore}</td>
              <td>${f.comment}</td>
              <td>${f.createdAt}</td>
              <td>${f.adminResponse || ''}</td>
            </tr>
          `;
        });
        htmlTable += '</table>';
        const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Relatorio_NPS_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveNpsReportSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = npsRecipients.split(',').map(email => email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = emails.find(email => !emailRegex.test(email));
    if (invalidEmail) {
      setNpsReportSuccessMsg('Erro: Formato de e-mail invalido encontrado.');
      setTimeout(() => setNpsReportSuccessMsg(''), 4000);
      return;
    }
    const isHospitalDomain = (email: string) => {
      const domain = email.split('@')[1]?.toLowerCase();
      return domain && (
        domain.endsWith('hospitaldeamor.org.br') ||
        domain.endsWith('fundacaopioxii.org.br') ||
        domain.endsWith('hcancerbarretos.com.br')
      );
    };
    const invalidDomain = emails.find(email => !isHospitalDomain(email));
    if (invalidDomain) {
      setNpsReportSuccessMsg('Erro: Apenas e-mails institucionais sao permitidos.');
      setTimeout(() => setNpsReportSuccessMsg(''), 4000);
      return;
    }

    localStorage.setItem('nps_report_scheduler_active', isNpsReportScheduled.toString());
    localStorage.setItem('nps_report_scheduler_recipients', npsRecipients);
    localStorage.setItem('nps_report_scheduler_day', npsReportDay.toString());

    await addAuditLogAdmin(
      `Agendamento de relatorio NPS atualizado: Ativo: ${isNpsReportScheduled ? 'Sim' : 'Nao'}, Destinatarios: ${npsRecipients}`,
      'Relatorios',
      'Configuracao de agendamento de relatorio NPS',
      loggedEmployee.cpf,
      loggedEmployee.name
    );

    setNpsReportSuccessMsg('Agendamento salvo com sucesso!');
    setTimeout(() => setNpsReportSuccessMsg(''), 4000);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const filtered = appointments.filter(app => {
        if (!app.createdAt) return false;
        const dateStr = app.createdAt.split('T')[0];
        if (startDate && dateStr < startDate) return false;
        if (endDate && dateStr > endDate) return false;
        return true;
      });

      if (reportFormat === 'pdf') {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        doc.setFillColor(227, 20, 99);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('HOSPITAL DE AMOR - RELATÓRIO OPERACIONAL CONSOLIDADO', 12, 10);

        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Gerado por: ${loggedEmployee.name} (${loggedEmployee.cpf})`, 12, 22);
        doc.text(`Data de Geração: ${new Date().toLocaleString('pt-BR')}`, 12, 27);
        doc.text(`Período de Triagem: ${startDate || 'Início'} até ${endDate || 'Fim'}`, 12, 32);

        const total = filtered.length;
        const pendente = filtered.filter(a => a.status === 'Pendente').length;
        const analise = filtered.filter(a => a.status === 'Em análise').length;
        const confirmado = filtered.filter(a => a.status === 'Confirmado').length;
        const cancelado = filtered.filter(a => a.status === 'Cancelado').length;

        doc.setFillColor(245, 245, 245);
        doc.roundedRect(12, 38, 186, 22, 3, 3, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(227, 20, 99);
        doc.setFontSize(10);
        doc.text('INDICADORES DE DESEMPENHO', 16, 44);

        doc.setTextColor(60, 60, 60);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Total de Solicitações: ${total}`, 16, 50);
        doc.text(`Confirmadas: ${confirmado} | Pendentes: ${pendente} | Em Análise: ${analise} | Canceladas: ${cancelado}`, 16, 55);

        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(227, 20, 99);
        doc.text('LISTAGEM DE ATENDIMENTOS NO PERÍODO', 12, 68);

        let y = 74;
        doc.setFontSize(8);
        doc.setFillColor(235, 235, 235);
        doc.rect(12, y, 186, 6, 'F');
        doc.setTextColor(40, 40, 40);
        doc.text('Protocolo', 14, y + 4.5);
        doc.text('Paciente', 42, y + 4.5);
        doc.text('Cidade', 95, y + 4.5);
        doc.text('Exame', 130, y + 4.5);
        doc.text('Status', 172, y + 4.5);

        y += 6;
        filtered.forEach((app, idx) => {
          if (y > 275) {
            doc.addPage();
            doc.setFillColor(227, 20, 99);
            doc.rect(0, 0, 210, 10, 'F');
            y = 20;
          }
          if (idx % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(12, y, 186, 6.5, 'F');
          }
          doc.setTextColor(60, 60, 60);
          doc.setFont('Helvetica', 'normal');
          doc.text(app.protocol || '', 14, y + 4.5);
          doc.text(app.patientName ? app.patientName.substring(0, 26) : '', 42, y + 4.5);
          doc.text(app.city || '', 95, y + 4.5);
          doc.text(app.examName ? app.examName.substring(0, 20) : '', 130, y + 4.5);
          doc.text(app.digitalSignature ? `${app.status} (e-CPF)` : (app.status || ''), 172, y + 4.5);
          y += 6.5;
        });

        doc.save(`Relatorio_Consolidado_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (reportFormat === 'excel') {
        let content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; }
    th { background-color: #E31463; color: #ffffff; font-weight: bold; border: 1px solid #d4d4d8; padding: 10px; text-align: left; font-family: sans-serif; font-size: 12px; }
    td { border: 1px solid #e4e4e7; padding: 8px; text-align: left; font-family: sans-serif; font-size: 11px; mso-number-format: "\\@"; }
    tr:nth-child(even) { background-color: #fafafa; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th>Protocolo</th>
        <th>Paciente</th>
        <th>CPF</th>
        <th>Cidade</th>
        <th>Especialidade</th>
        <th>Exame</th>
        <th>Data Solicitação</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>`;
        filtered.forEach(app => {
          content += `
      <tr>
        <td>${app.protocol || ''}</td>
        <td>${app.patientName || ''}</td>
        <td>${app.patientCpf || ''}</td>
        <td>${app.city || ''}</td>
        <td>${app.specialtyName || ''}</td>
        <td>${app.examName || ''}</td>
        <td>${app.createdAt ? new Date(app.createdAt).toLocaleDateString('pt-BR') : ''}</td>
        <td>${app.status || ''}${app.digitalSignature ? ' (Assinado)' : ''}</td>
      </tr>`;
        });
        content += `
    </tbody>
  </table>
</body>
</html>`;
        const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Relatorio_Consolidado_${new Date().toISOString().split('T')[0]}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        let content = '\uFEFFProtocolo,Paciente,CPF,Cidade,Especialidade,Exame,Data Solicitacao,Status\n';
        filtered.forEach(app => {
          content += `"${app.protocol || ''}","${app.patientName || ''}","${app.patientCpf || ''}","${app.city || ''}","${app.specialtyName || ''}","${app.examName || ''}","${app.createdAt || ''}","${app.status || ''}${app.digitalSignature ? ' (Assinado)' : ''}"\n`;
        });
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Relatorio_Consolidado_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      await addAuditLogAdmin(
        `Relatório consolidado exportado: Formato: ${reportFormat.toUpperCase()}, Período: ${startDate || 'Início'} a ${endDate || 'Fim'}`,
        'Relatórios',
        'Exportação de dados consolidada realizada pelo operador',
        loggedEmployee.cpf,
        loggedEmployee.name
      );
    } catch (e) {
      console.error(e);
    }
    setIsExporting(false);
  };

  const filteredAppointmentsList = appointments.filter(app => {
    if (!selectedCityFilter) return true;
    return app.city?.toLowerCase() === selectedCityFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-55 tracking-tight font-sans">Relatórios & Indicadores</h1>
        <p className="text-zinc-500 mt-1 text-sm">Painel analítico consolidado e exportação de dados operacionais.</p>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <button
          onClick={() => setActiveTab('demanda')}
          className={`py-2 px-1 text-sm font-extrabold border-b-2 transition-all ${activeTab === 'demanda' ? 'border-pink-600 text-pink-600' : 'border-transparent text-zinc-400 hover:text-zinc-650'}`}
        >
          Indicadores de Demanda
        </button>
        <button
          onClick={() => setActiveTab('nps')}
          className={`py-2 px-1 text-sm font-extrabold border-b-2 transition-all ${activeTab === 'nps' ? 'border-pink-600 text-pink-600' : 'border-transparent text-zinc-400 hover:text-zinc-650'}`}
        >
          Pesquisa de Satisfação (NPS)
        </button>
        <button
          onClick={() => setActiveTab('espera')}
          className={`py-2 px-1 text-sm font-extrabold border-b-2 transition-all ${activeTab === 'espera' ? 'border-pink-600 text-pink-600' : 'border-transparent text-zinc-400 hover:text-zinc-650'}`}
        >
          Tempo de Espera (Realtime)
        </button>
      </div>

      {simulatedReportAlert && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <Mail className="w-4 h-4 shrink-0 text-emerald-500 animate-bounce" />
          <span>{simulatedReportAlert}</span>
        </div>
      )}

      {activeTab === 'demanda' && (
        <div className="space-y-8 animate-in fade-in">
          <AnalyticsCharts
            appointments={appointments}
            specialties={specialties}
            selectedCityFilter={selectedCityFilter}
            onCityFilterChange={setSelectedCityFilter}
            cityViewMode={cityViewMode}
            onCityViewModeChange={setCityViewMode}
            examRankingMode={examRankingMode}
            onExamRankingModeChange={setExamRankingMode}
          />

          {selectedCityFilter && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Solicitações Filtradas - {selectedCityFilter}
                </h3>
                <button
                  onClick={() => setSelectedCityFilter('')}
                  className="text-xs font-bold text-pink-600 hover:underline"
                >
                  Limpar Filtro
                </button>
              </div>

              <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-850 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      <th className="py-2.5 px-3">Protocolo</th>
                      <th className="py-2.5 px-3">Paciente</th>
                      <th className="py-2.5 px-3">Exame</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointmentsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-450 dark:text-zinc-500">
                          Nenhuma solicitação encontrada para esta cidade.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointmentsList.map((app) => (
                        <tr key={app.id} className="border-b border-zinc-100 dark:border-zinc-850">
                          <td className="py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">{app.protocol}</td>
                          <td className="py-2 px-3 text-zinc-650 dark:text-zinc-300">{app.patientName}</td>
                          <td className="py-2 px-3 text-zinc-650 dark:text-zinc-300">{app.examName}</td>
                          <td className="py-2 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <AnalyticsReports
            loggedEmployee={loggedEmployee}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            reportFormat={reportFormat}
            onReportFormatChange={setReportFormat}
            isExporting={isExporting}
            onExportReport={handleExportData}
            reportRecipients={reportRecipients}
            onReportRecipientsChange={setReportRecipients}
            reportDay={reportDay}
            onReportDayChange={setReportDay}
            isReportScheduled={isReportScheduled}
            onIsReportScheduledChange={setIsReportScheduled}
            onSaveSchedule={handleSaveReportSchedule}
            scheduledSuccess={scheduledReportSuccess}
            onRunColdStorage={handleRunColdStorage}
            archiveSuccessMsg={archiveSuccessMsg}
            archiveErrorMsg={archiveErrorMsg}
          />
        </div>
      )}

      {activeTab === 'nps' && (
        <NpsFeedbackBoard
          feedbacks={feedbacks}
          appointments={appointments}
          specialties={specialties}
          loggedEmployee={loggedEmployee}
          npsSearch={npsSearch}
          onNpsSearchChange={setNpsSearch}
          selectedNpsSpecialty={selectedNpsSpecialty}
          onSelectedNpsSpecialtyChange={setSelectedNpsSpecialty}
          selectedNpsRegion={selectedNpsRegion}
          onSelectedNpsRegionChange={setSelectedNpsRegion}
          npsStatusFilter={npsStatusFilter}
          onNpsStatusFilterChange={setNpsStatusFilter}
          replyTextMap={replyTextMap}
          onReplyTextChange={(id, text) => setReplyTextMap(prev => ({ ...prev, [id]: text }))}
          onSendReply={handleSaveFeedbackReply}
          replySuccessMsgMap={replySuccessMsgMap}
          onSetResolutionStatus={handleSetFeedbackResolutionStatus}
          npsExportFormat={npsExportFormat}
          onNpsExportFormatChange={setNpsExportFormat}
          isExporting={isExporting}
          onExportNpsReport={handleExportNpsData}
          npsRecipients={npsRecipients}
          onNpsRecipientsChange={setNpsRecipients}
          isNpsReportScheduled={isNpsReportScheduled}
          onIsNpsReportScheduledChange={setIsNpsReportScheduled}
          onSaveNpsSchedule={handleSaveNpsReportSchedule}
          npsReportSuccessMsg={npsReportSuccessMsg}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
        />
      )}

      {activeTab === 'espera' && (
        <WaitTimeMonitor
          activeQueue={activeQueue}
          averageWaitToday={averageWaitToday}
          timeOffsetMin={timeOffsetMin}
          onTimeOffsetMinChange={setTimeOffsetMin}
          hourlyData={hourlyData}
          maxVal={maxVal}
          onExportWaitCSV={exportWaitTimeToCSV}
          onExportWaitPDF={exportWaitTimeToPDF}
          criticalCount={criticalCount}
        />
      )}
    </div>
  );
}
