import type { Appointment, PatientUser, FeedbackResponse } from '../../../types';

export function validateInstitutionalEmails(emailsString: string): { isValid: boolean; error?: string } {
  const emails = emailsString.split(',').map((email) => email.trim());
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmail = emails.find((email) => !emailRegex.test(email));

  if (invalidEmail) {
    return { isValid: false, error: 'Erro: Formato de e-mail inválido encontrado.' };
  }

  const isHospitalDomain = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return (
      domain &&
      (domain.endsWith('hospitaldeamor.org.br') ||
        domain.endsWith('fundacaopioxii.org.br') ||
        domain.endsWith('hcancerbarretos.com.br'))
    );
  };

  const invalidDomain = emails.find((email) => !isHospitalDomain(email));
  if (invalidDomain) {
    return {
      isValid: false,
      error: 'Erro: Apenas e-mails institucionais (@hospitaldeamor.org.br, @fundacaopioxii.org.br ou @hcancerbarretos.com.br) são permitidos.',
    };
  }

  return { isValid: true };
}

export function exportWaitTimeToCSV(activeQueue: any[]) {
  let content = '\uFEFFProtocolo,Paciente,Especialidade,Horario Entrada,Tempo de Espera (min)\n';
  activeQueue.forEach((app) => {
    content += `"${app.protocol || ''}","${app.patientName || ''}","${app.specialtyName || ''}","${
      app.checkInAt ? new Date(app.checkInAt).toLocaleTimeString('pt-BR') : ''
    }",${app.elapsedMin}\n`;
  });
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Fila_Espera_Recepcao_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportWaitTimeToPDF(
  activeQueue: any[],
  averageWaitToday: number,
  loggedEmployee: PatientUser
) {
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
  doc.text(
    `Total Aguardando: ${activeQueue.length} pacientes | Críticos (>30 min): ${
      activeQueue.filter((p) => p.isCritical).length
    }`,
    16,
    49
  );

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
}

export async function handleExportData(
  appointments: Appointment[],
  reportFormat: 'pdf' | 'csv' | 'excel',
  startDate: string,
  endDate: string,
  loggedEmployee: PatientUser
) {
  const filtered = appointments.filter((app) => {
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
    const pendente = filtered.filter((a) => a.status === 'Pendente').length;
    const analise = filtered.filter((a) => a.status === 'Em análise').length;
    const confirmado = filtered.filter((a) => a.status === 'Confirmado').length;
    const cancelado = filtered.filter((a) => a.status === 'Cancelado').length;

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
    doc.text(
      `Confirmadas: ${confirmado} | Pendentes: ${pendente} | Em Análise: ${analise} | Canceladas: ${cancelado}`,
      16,
      55
    );

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
      doc.text(app.digitalSignature ? `${app.status} (e-CPF)` : app.status || '', 172, y + 4.5);
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
    filtered.forEach((app) => {
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
    filtered.forEach((app) => {
      content += `"${app.protocol || ''}","${app.patientName || ''}","${app.patientCpf || ''}","${
        app.city || ''
      }","${app.specialtyName || ''}","${app.examName || ''}","${app.createdAt || ''}","${app.status || ''}${
        app.digitalSignature ? ' (Assinado)' : ''
      }"\n`;
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
}

export async function handleExportNpsData(
  feedbacks: FeedbackResponse[],
  npsExportFormat: 'pdf' | 'csv' | 'excel',
  startDate: string,
  endDate: string,
  loggedEmployee: PatientUser
) {
  const filtered = feedbacks.filter((fb) => {
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
    const promoters = filtered.filter((f) => f.npsScore >= 9).length;
    const passives = filtered.filter((f) => f.npsScore >= 7 && f.npsScore <= 8).length;
    const detractors = filtered.filter((f) => f.npsScore <= 6).length;

    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;

    doc.setFont('Helvetica', 'bold');
    doc.text('Metricas Consolidadas:', 12, 42);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Total de Feedbacks: ${total}`, 12, 48);
    doc.text(
      `Promotores (9-10): ${promoters} (${total > 0 ? ((promoters / total) * 100).toFixed(1) : 0}%)`,
      12,
      53
    );
    doc.text(`Passivos (7-8): ${passives} (${total > 0 ? ((passives / total) * 100).toFixed(1) : 0}%)`, 12, 58);
    doc.text(
      `Detratores (0-6): ${detractors} (${total > 0 ? ((detractors / total) * 100).toFixed(1) : 0}%)`,
      12,
      63
    );

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(140, 42, 58, 22, 3, 3, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(227, 20, 99);
    doc.text(npsScore > 0 ? `+${npsScore}` : `${npsScore}`, 148, 54);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('SCORE NPS GERAL', 148, 60);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(227, 20, 99);
    doc.setFontSize(10);
    doc.text('DETALHAMENTO DOS COMENTARIOS DOS PACIENTES', 12, 76);

    let y = 82;
    filtered.forEach((fb) => {
      if (y > 275) {
        doc.addPage();
        doc.setFillColor(227, 20, 99);
        doc.rect(0, 0, 210, 10, 'F');
        y = 20;
      }
      doc.setFillColor(250, 250, 250);
      doc.rect(12, y, 186, 12, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(`Nota: ${fb.npsScore}/10 | Protocolo: ${fb.appointmentProtocol}`, 14, y + 4.5);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(fb.comment ? fb.comment.substring(0, 80) : 'Sem comentario.', 14, y + 9);
      y += 14;
    });

    doc.save(`Relatorio_NPS_${new Date().toISOString().split('T')[0]}.pdf`);
  } else if (npsExportFormat === 'excel') {
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
        <th>Score NPS</th>
        <th>Comentário</th>
        <th>Respondido em</th>
      </tr>
    </thead>
    <tbody>`;
    filtered.forEach((fb) => {
      content += `
      <tr>
        <td>${fb.appointmentProtocol || ''}</td>
        <td>${fb.npsScore}</td>
        <td>${fb.comment || ''}</td>
        <td>${fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('pt-BR') : ''}</td>
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
    link.setAttribute('download', `Relatorio_NPS_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    let content = '\uFEFFProtocolo,Score NPS,Comentario,Respondido em\n';
    filtered.forEach((fb) => {
      content += `"${fb.appointmentProtocol || ''}",${fb.npsScore},"${fb.comment || ''}","${
        fb.createdAt || ''
      }"\n`;
    });
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_NPS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
