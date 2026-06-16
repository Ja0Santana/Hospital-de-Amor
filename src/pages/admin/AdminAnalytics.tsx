import React, { useState, useEffect, useRef } from 'react';
import { 
  getAppointmentsForAdmin, 
  getSpecialties, 
  runDataLifecycleArchiving,
  addAuditLogAdmin
} from '../../services/db';
import type { Appointment, Specialty, Exam, PatientUser } from '../../types';
import jsPDF from 'jspdf';
import { 
  Download, 
  FileText, 
  Settings, 
  CheckCircle, 
  Database, 
  Mail, 
  Info
} from 'lucide-react';

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

  const [simulatedReportAlert, setSimulatedReportAlert] = useState<string>('');

  const chartCityRef = useRef<SVGSVGElement | null>(null);
  const chartExamsRef = useRef<SVGSVGElement | null>(null);
  const chartEvolutionRef = useRef<SVGSVGElement | null>(null);

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
    }
  };

  const getCityChartData = () => {
    const counts: Record<string, number> = {};
    let total = 0;
    appointments.forEach(app => {
      const city = app.city || 'Desconhecida';
      counts[city] = (counts[city] || 0) + 1;
      total++;
    });

    const list = Object.keys(counts).map(city => {
      const count = counts[city];
      const percent = total > 0 ? (count / total) * 100 : 0;
      return { city, count, percent };
    });

    return { list, total };
  };

  const getExamsChartData = () => {
    const counts: Record<string, number> = {};
    appointments.forEach(app => {
      const examId = app.examId;
      if (examId) {
        counts[examId] = (counts[examId] || 0) + 1;
      }
    });

    const examsList: Array<{ exam: Exam; count: number; specName: string }> = [];
    specialties.forEach(spec => {
      if (spec.exams) {
        spec.exams.forEach(ex => {
          const count = counts[ex.id] || 0;
          examsList.push({ exam: ex, count, specName: spec.name });
        });
      }
    });

    if (examRankingMode === 'top') {
      return examsList.sort((a, b) => b.count - a.count).slice(0, 5);
    } else {
      return examsList.sort((a, b) => a.count - b.count).slice(0, 5);
    }
  };

  const getEvolutionChartData = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().substring(0, 7));
    }

    const counts = months.map(m => {
      const count = appointments.filter(app => app.createdAt && app.createdAt.substring(0, 7) === m).length;
      return { month: m, count };
    });

    const movingAverages = counts.map((item, index) => {
      if (index < 2) return item.count;
      const val = (counts[index].count + counts[index - 1].count + counts[index - 2].count) / 3;
      return Math.round(val);
    });

    const projections = [];
    if (counts.length >= 2) {
      const lastVal = movingAverages[movingAverages.length - 1];
      const prevVal = movingAverages[movingAverages.length - 2];
      const diff = lastVal - prevVal;
      projections.push(Math.max(0, Math.round(lastVal + diff)));
      projections.push(Math.max(0, Math.round(lastVal + 2 * diff)));
      projections.push(Math.max(0, Math.round(lastVal + 3 * diff)));
    } else {
      projections.push(0, 0, 0);
    }

    return { counts, movingAverages, projections, months };
  };

  const formatMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${names[parseInt(month) - 1]}/${year.substring(2)}`;
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
          doc.text(app.status || '', 172, y + 4.5);
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
        <td>${app.status || ''}</td>
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
          content += `"${app.protocol || ''}","${app.patientName || ''}","${app.patientCpf || ''}","${app.city || ''}","${app.specialtyName || ''}","${app.examName || ''}","${app.createdAt || ''}","${app.status || ''}"\n`;
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

  const handleExportChartPng = (ref: React.RefObject<SVGSVGElement | null>, filename: string) => {
    const svgElement = ref.current;
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgElement.clientWidth || 600;
      canvas.height = svgElement.clientHeight || 400;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const cityData = getCityChartData();
  const examsData = getExamsChartData();
  const evolutionData = getEvolutionChartData();

  const filteredAppointmentsList = appointments.filter(app => {
    if (!selectedCityFilter) return true;
    return app.city?.toLowerCase() === selectedCityFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Relatórios & Indicadores</h1>
        <p className="text-zinc-500 mt-1 text-sm">Painel analítico consolidado e exportação de dados operacionais.</p>
      </div>

      {simulatedReportAlert && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <Mail className="w-4 h-4 shrink-0 text-emerald-500 animate-bounce" />
          <span>{simulatedReportAlert}</span>
        </div>
      )}

      {archiveSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{archiveSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col h-full">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Demanda por Cidade</h3>
            <button
              onClick={() => handleExportChartPng(chartCityRef, 'Grafico_Demanda_Cidades.png')}
              className="text-[10px] font-extrabold text-pink-600 hover:underline"
            >
              Exportar Imagem
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <svg
              ref={chartCityRef}
              width="240"
              height="200"
              viewBox="0 0 240 200"
              className="w-full max-w-[240px]"
            >
              {(() => {
                const radius = 60;
                const circumference = 2 * Math.PI * radius;
                const colors = ['#e31463', '#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];
                let currentOffset = 0;

                return cityData.list.map((item, index) => {
                  const strokeLength = (item.percent / 100) * circumference;
                  const strokeOffset = currentOffset;
                  currentOffset -= strokeLength;
                  const color = colors[index % colors.length];

                  return (
                    <circle
                      key={item.city}
                      cx="120"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={color}
                      strokeWidth="16"
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={strokeOffset}
                      onClick={() => {
                        setSelectedCityFilter(selectedCityFilter === item.city ? '' : item.city);
                      }}
                      className={`cursor-pointer transition-all duration-300 ${selectedCityFilter === item.city ? 'stroke-[22]' : 'hover:stroke-[18]'}`}
                    />
                  );
                });
              })()}
              <circle cx="120" cy="100" r="45" className="fill-white dark:fill-zinc-900" />
              <text
                x="120"
                y="105"
                textAnchor="middle"
                className="font-black text-sm fill-zinc-850 dark:fill-zinc-100"
              >
                {cityData.total}
              </text>
            </svg>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setCityViewMode('quantitativo')}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg ${cityViewMode === 'quantitativo' ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-400'}`}
              >
                Qtd
              </button>
              <button
                onClick={() => setCityViewMode('percentual')}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg ${cityViewMode === 'percentual' ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-400'}`}
              >
                %
              </button>
            </div>

            <div className="w-full mt-auto space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {cityData.list.map((item, index) => {
                const colors = ['#e31463', '#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];
                const color = colors[index % colors.length];
                const isActive = selectedCityFilter === item.city;

                return (
                  <div
                    key={item.city}
                    onClick={() => setSelectedCityFilter(isActive ? '' : item.city)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${isActive ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-650 dark:text-zinc-350'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-semibold truncate">{item.city}</span>
                    </div>
                    <span className="font-extrabold shrink-0">
                      {cityViewMode === 'quantitativo' ? item.count : `${item.percent.toFixed(1)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col h-full">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Demanda por Exame</h3>
            <button
              onClick={() => handleExportChartPng(chartExamsRef, 'Grafico_Demanda_Exames.png')}
              className="text-[10px] font-extrabold text-pink-600 hover:underline"
            >
              Exportar Imagem
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setExamRankingMode('top')}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${examRankingMode === 'top' ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/20 dark:border-pink-900/30 dark:text-pink-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 bg-white dark:bg-zinc-950'}`}
            >
              Mais Solicitados
            </button>
            <button
              onClick={() => setExamRankingMode('bottom')}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${examRankingMode === 'bottom' ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/20 dark:border-pink-900/30 dark:text-pink-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 bg-white dark:bg-zinc-950'}`}
            >
              Menos Solicitados
            </button>
          </div>

          <svg
            ref={chartExamsRef}
            width="320"
            height="220"
            viewBox="0 0 320 220"
            className="w-full"
          >
            {(() => {
              const maxCount = Math.max(...examsData.map(e => e.count), 1);
              return examsData.map((item, index) => {
                const y = index * 42 + 20;
                const barWidth = (item.count / maxCount) * 200;
                const isOverLimit = item.count >= (item.exam.maintenanceLimit ?? 100);

                return (
                  <g key={item.exam.id}>
                    <text
                      x="0"
                      y={y - 6}
                      className="text-[10px] font-bold fill-zinc-800 dark:fill-zinc-200"
                    >
                      {item.exam.name.substring(0, 32)}
                    </text>
                    <rect
                      x="0"
                      y={y}
                      width="200"
                      height="10"
                      rx="5"
                      className="fill-zinc-100 dark:fill-zinc-800"
                    />
                    <rect
                      x="0"
                      y={y}
                      width={Math.max(barWidth, 6)}
                      height="10"
                      rx="5"
                      className={`${isOverLimit ? 'fill-red-600 animate-pulse' : 'fill-pink-600'}`}
                    />
                    <text
                      x={Math.max(barWidth, 6) + 8}
                      y={y + 8}
                      className="text-[10px] font-black fill-zinc-900 dark:fill-zinc-100"
                    >
                      {item.count}
                    </text>
                  </g>
                );
              });
            })()}
          </svg>

          <div className="space-y-3 pt-2 max-h-[160px] overflow-y-auto pr-1 mt-auto">
            {examsData.map((item) => {
              const limit = item.exam.maintenanceLimit ?? 100;
              const isOverLimit = item.count >= limit;

              return (
                <div key={item.exam.id} className="flex flex-col p-2.5 bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{item.exam.name}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.specName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500">Capacidade de Utilização: {item.count} / {limit}</span>
                    {isOverLimit && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-lg border border-red-200/40 dark:border-red-900/30 animate-pulse">
                        ⚠️ Alerta de Manutenção!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col h-full">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Evolução e Projeções</h3>
            <button
              onClick={() => handleExportChartPng(chartEvolutionRef, 'Grafico_Evolucao_Demanda.png')}
              className="text-[10px] font-extrabold text-pink-600 hover:underline"
            >
              Exportar Imagem
            </button>
          </div>

          <svg
            ref={chartEvolutionRef}
            width="350"
            height="215"
            viewBox="0 0 350 215"
            className="w-full"
          >
            {(() => {
              const maxVal = Math.max(...evolutionData.counts.map(c => c.count), ...evolutionData.movingAverages, ...evolutionData.projections, 1);
              
              const pointsActual = evolutionData.counts.map((item, index) => {
                const x = index * 34 + 35;
                const y = 170 - (item.count / maxVal) * 140;
                return { x, y, label: formatMonthName(item.month), count: item.count };
              });

              const pointsMA = evolutionData.movingAverages.map((val, index) => {
                const x = index * 34 + 35;
                const y = 170 - (val / maxVal) * 140;
                return { x, y };
              });

              const startProjIndex = pointsMA.length - 1;
              const pointsProj = [{
                x: pointsMA[startProjIndex].x,
                y: pointsMA[startProjIndex].y,
                value: evolutionData.movingAverages[startProjIndex]
              }];
              evolutionData.projections.forEach((val, index) => {
                const x = (startProjIndex + index + 1) * 34 + 35;
                const y = 170 - (val / maxVal) * 140;
                pointsProj.push({ x, y, value: val });
              });

              const getProjMonthLabel = (projIndex: number) => {
                if (evolutionData.counts.length === 0) return '';
                const lastMonthStr = evolutionData.counts[evolutionData.counts.length - 1].month;
                const [yearStr, monthStr] = lastMonthStr.split('-');
                let y = parseInt(yearStr);
                let m = parseInt(monthStr);
                
                m += projIndex + 1;
                while (m > 12) {
                  m -= 12;
                  y += 1;
                }
                const paddedMonth = m < 10 ? `0${m}` : `${m}`;
                return formatMonthName(`${y}-${paddedMonth}`);
              };

              const pathActualD = pointsActual.length > 0 ? `M ${pointsActual[0].x} ${pointsActual[0].y} ` + pointsActual.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';
              const pathMAD = pointsMA.length > 0 ? `M ${pointsMA[0].x} ${pointsMA[0].y} ` + pointsMA.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';
              const pathProjD = pointsProj.length > 0 ? `M ${pointsProj[0].x} ${pointsProj[0].y} ` + pointsProj.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';

              return (
                <g>
                  {/* Y-Axis Labels */}
                  <text x="28" y="33" textAnchor="end" className="text-[8px] font-bold fill-zinc-450 dark:fill-zinc-400">{Math.round(maxVal)}</text>
                  <text x="28" y="103" textAnchor="end" className="text-[8px] font-bold fill-zinc-450 dark:fill-zinc-400">{Math.round(maxVal / 2)}</text>
                  <text x="28" y="173" textAnchor="end" className="text-[8px] font-bold fill-zinc-450 dark:fill-zinc-400">0</text>

                  {/* Grid Lines */}
                  <line x1="35" y1="30" x2="335" y2="30" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="35" y1="100" x2="335" y2="100" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="35" y1="170" x2="335" y2="170" className="stroke-zinc-200 dark:stroke-zinc-750" strokeWidth="1.5" />

                  {/* Projection line */}
                  {pathProjD && (
                    <path
                      d={pathProjD}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* MA Line */}
                  {pathMAD && (
                    <path
                      d={pathMAD}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Actual demand line */}
                  {pathActualD && (
                    <path
                      d={pathActualD}
                      fill="none"
                      stroke="#e31463"
                      strokeWidth="3"
                    />
                  )}

                  {/* Points & Labels */}
                  {pointsActual.map((p, idx) => {
                    const hasNote = p.label.includes('Out') || p.label.includes('Nov');
                    return (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          className="fill-pink-600 stroke-white dark:stroke-zinc-900 stroke-2"
                        />
                        <text
                          x={p.x}
                          y={p.y - 8}
                          textAnchor="middle"
                          className="text-[8px] font-extrabold fill-pink-600 dark:fill-pink-400"
                        >
                          {p.count}
                        </text>
                        <text
                          x={p.x}
                          y="192"
                          textAnchor="end"
                          transform={`rotate(-45, ${p.x}, 192)`}
                          className="text-[8px] font-bold fill-zinc-500 dark:fill-zinc-400"
                        >
                          {p.label}
                        </text>
                        {hasNote && (
                          <g>
                            <line x1={p.x} y1="30" x2={p.x} y2="170" className="stroke-pink-500/20" strokeWidth="1" strokeDasharray="2 2" />
                            <circle cx={p.x} cy="30" r="3" className="fill-pink-500" />
                          </g>
                        )}
                      </g>
                    );
                  })}
                  {/* Projections Points */}
                  {pointsProj.slice(1).map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        className="fill-violet-500 stroke-white dark:stroke-zinc-900 stroke-2"
                      />
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        className="text-[8px] font-extrabold fill-violet-600 dark:fill-violet-400"
                      >
                        {p.value}
                      </text>
                      <text
                        x={p.x}
                        y="192"
                        textAnchor="end"
                        transform={`rotate(-45, ${p.x}, 192)`}
                        className="text-[8px] font-bold fill-zinc-500 dark:fill-zinc-400"
                      >
                        {getProjMonthLabel(idx)}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>

          <div className="flex flex-col gap-2 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1.5 bg-pink-600 rounded-sm shrink-0" />
              <span className="text-zinc-650 dark:text-zinc-350">Demanda Real</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-0.5 border-t-2 border-emerald-500 border-dashed shrink-0" />
              <span className="text-zinc-650 dark:text-zinc-350">Média Móvel (3 Meses)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-0.5 border-t-2 border-violet-500 border-dashed shrink-0" />
              <span className="text-zinc-650 dark:text-zinc-350 font-bold text-violet-650">Projeção (Mais 3 Meses)</span>
            </div>
          </div>

          <div className="mt-auto p-3 bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl text-[10px] space-y-2 text-zinc-500">
            <div className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-750 dark:text-zinc-350">Nota de Contexto Outubro:</strong> Outubro Rosa impulsiona exames preventivos de mamografia (+25% demanda histórica).
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col gap-6 h-full">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <FileText className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Exportar Relatórios Operacionais</h3>
          </div>

          <div className="flex flex-col justify-between flex-1 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data de Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={today}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data de Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={today}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">Formato de Saída:</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={reportFormat === 'pdf'}
                    onChange={() => setReportFormat('pdf')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  PDF Institucional
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={reportFormat === 'csv'}
                    onChange={() => setReportFormat('csv')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  CSV
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={reportFormat === 'excel'}
                    onChange={() => setReportFormat('excel')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  Excel (Planilha Formatada)
                </label>
              </div>
            </div>

            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : 'Exportar Relatório'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col gap-6 h-full">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <Mail className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Agendar Relatórios de Gestão</h3>
          </div>

          <form onSubmit={handleSaveReportSchedule} className="flex flex-col justify-between text-xs flex-1 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Destinatários da Diretoria (Separados por vírgula)</label>
              <input
                type="text"
                placeholder="diretoria@hospitaldeamor.org.br"
                value={reportRecipients}
                onChange={(e) => setReportRecipients(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dia do Envio</label>
                <select
                  value={reportDay}
                  onChange={(e) => setReportDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none"
                >
                  <option value={1}>1º Dia Útil</option>
                  <option value={2}>2º Dia Útil</option>
                  <option value={5}>5º Dia Útil</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hora do Disparo</label>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 py-1">
              <input
                type="checkbox"
                id="schedulerActive"
                checked={isReportScheduled}
                onChange={(e) => setIsReportScheduled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-350 text-pink-600 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-950"
              />
              <label htmlFor="schedulerActive" className="font-semibold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none">
                Habilitar envio recorrente automático
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-11 border border-pink-500 hover:bg-pink-50 text-pink-600 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-pink-955/15 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Settings className="w-4 h-4" />
              Salvar Configurações
            </button>
            {scheduledReportSuccess && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-center">
                {scheduledReportSuccess}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <Database className="w-5 h-5 text-pink-600" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Manutenção e Ciclo de Vida de Dados</h3>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200 block">Arquivamento Automático (Cold Storage)</span>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs">
              Conforme a regulamentação interna e LGPD (RF14.5), solicitações resolvidas (Concluídas ou Canceladas) há mais de 2 anos devem ser transferidas para o armazenamento frio. Isso otimiza o desempenho das buscas do painel.
            </p>
          </div>

          <button
            onClick={handleRunColdStorage}
            className="h-11 px-5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs shrink-0"
          >
            <Database className="w-4 h-4" />
            Rodar Limpeza (+2 anos)
          </button>
        </div>
      </div>
    </div>
  );
}
