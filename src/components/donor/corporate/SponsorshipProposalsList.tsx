import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { ChevronDown, Award, FileText } from 'lucide-react';

interface SponsorshipProposalsListProps {
  proposals: any[];
}

export default function SponsorshipProposalsList({ proposals }: SponsorshipProposalsListProps) {
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);

  const getProposalExpiryInfo = (pDateStr: string) => {
    const sendDate = new Date(pDateStr);
    const expiryDate = new Date(sendDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return {
      daysRemaining,
      isExpiringSoon: daysRemaining > 0 && daysRemaining <= 60,
      expiryDateFormatted: expiryDate.toLocaleDateString('pt-BR')
    };
  };

  const downloadSeloPdf = (p: any) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    let category = 'Bronze';
    let color = [180, 110, 30];
    if (p.intentAmount > 50000) {
      category = 'Ouro';
      color = [218, 165, 32];
    } else if (p.intentAmount > 10000) {
      category = 'Prata';
      color = [160, 160, 160];
    }

    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(4);
    doc.rect(8, 8, 194, 281);
    doc.setLineWidth(1);
    doc.rect(12, 12, 186, 273);

    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.5);
    doc.circle(105, 150, 60);
    doc.circle(105, 150, 62);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(227, 20, 99);
    doc.text('HOSPITAL DE AMOR', 105, 45, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('FUNDAÇÃO PIO XII | CAPTAÇÃO DE RECURSOS CORPORATIVOS', 105, 52, { align: 'center' });

    doc.setDrawColor(227, 20, 99);
    doc.setLineWidth(0.8);
    doc.line(40, 58, 170, 58);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(50, 50, 50);
    doc.text('SELO DE RESPONSABILIDADE SOCIAL', 105, 80, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`CATEGORIA ${category.toUpperCase()}`, 105, 88, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('Certificamos e reconhecemos publicamente que a instituição', 105, 115, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 30, 30);
    doc.text(p.razaoSocial, 105, 128, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text(`CNPJ: ${p.cnpj}`, 105, 134, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('contribuiu ativamente para os programas oncológicos do Hospital de Amor,', 105, 150, { align: 'center' });
    doc.text(`direcionando seus incentivos fiscais ao fundo ${p.fund}.`, 105, 156, { align: 'center' });
    doc.text('Esta parceria corporativa viabiliza a manutenção do atendimento gratuito,', 105, 166, { align: 'center' });
    doc.text('humanizado e de alta complexidade a milhares de pacientes em tratamento de câncer.', 105, 172, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text(`Valor de Patrocínio: R$ ${p.intentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 105, 195, { align: 'center' });

    if (p.logo) {
      try {
        doc.addImage(p.logo, 'JPEG', 85, 205, 40, 20);
      } catch (e) {
        console.error(e);
      }
    }

    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(40, 248, 95, 248);
    doc.line(115, 248, 170, 248);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Diretoria de Captação PJ', 67.5, 253, { align: 'center' });
    doc.text('Hospital de Amor', 67.5, 257, { align: 'center' });
    doc.text(p.contactName, 142.5, 253, { align: 'center' });
    doc.text('Representante Corporativo', 142.5, 257, { align: 'center' });

    const sendDate = new Date(p.date);
    const expiryDate = new Date(sendDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    doc.setFontSize(9);
    doc.text(`Data de Emissão: ${sendDate.toLocaleDateString('pt-BR')}`, 40, 275);
    doc.text(`Vencimento do Selo: ${expiryDate.toLocaleDateString('pt-BR')}`, 130, 275);

    doc.save(`selo_social_${p.razaoSocial.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const downloadNfPdf = (p: any) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    doc.setFillColor(245, 245, 248);
    doc.rect(10, 10, 190, 25, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('PREFEITURA MUNICIPAL DE BARRETOS', 15, 18);
    doc.setFontSize(9);
    doc.text('Secretaria Municipal de Finanças', 15, 23);
    doc.text('NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e', 15, 28);

    doc.setFontSize(9);
    doc.text('Número da Nota:', 140, 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`202600000${Math.floor(Math.random() * 9000 + 1000)}`, 170, 18);

    doc.setFont('helvetica', 'normal');
    doc.text('Data de Emissão:', 140, 23);
    doc.text(new Date(p.date).toLocaleDateString('pt-BR'), 170, 23);

    doc.text('Código Verificação:', 140, 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`HA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, 170, 28);

    doc.setFillColor(227, 20, 99);
    doc.rect(10, 38, 190, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('PRESTADOR DE SERVIÇOS', 15, 42);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('Razão Social: FUNDAÇÃO PIO XII', 15, 50);
    doc.text('CNPJ: 49.150.352/0001-12', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text('Endereço: Rua Antenor Duarte Villela, 1331 - Dr. Paulo Prata, Barretos - SP, 14784-400', 15, 60);

    doc.setFillColor(227, 20, 99);
    doc.rect(10, 66, 190, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOMADOR DE SERVIÇOS', 15, 70);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(`Razão Social: ${p.razaoSocial}`, 15, 78);
    doc.text(`CNPJ: ${p.cnpj}`, 15, 83);
    doc.setFont('helvetica', 'normal');
    doc.text(`E-mail: ${p.email}  |  Telefone: ${p.phone}`, 15, 88);
    doc.text(`Responsável indicado: ${p.contactName}`, 15, 93);

    doc.setFillColor(227, 20, 99);
    doc.rect(10, 100, 190, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DISCRIMINAÇÃO DOS SERVIÇOS', 15, 104);

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text('Direcionamento de Recursos e Patrocínio Institucional Corporativo ao Hospital de Amor.', 15, 112);
    doc.text(`Apoio direto viabilizado por meio da Lei de Incentivo Federal destinada ao fundo: ${p.fund}.`, 15, 117);
    doc.text('Isento de ISSQN com base no Art. 150, VI, "c" da Constituição Federal (Imunidade Tributária de Templos/Entidades).', 15, 122);

    doc.setFillColor(245, 245, 248);
    doc.rect(10, 130, 190, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text('VALOR TOTAL DA DOAÇÃO/PATROCÍNIO:', 15, 139);
    doc.setFontSize(13);
    doc.setTextColor(227, 20, 99);
    doc.text(`R$ ${p.intentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 130, 139);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('NFS-e gerada eletronicamente para fins de prestação de contas de incentivos fiscais corporativos - Fundação Pio XII.', 105, 280, { align: 'center' });

    doc.save(`nota_fiscal_pj_${p.razaoSocial.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const downloadRelatorioRscPdf = (p: any) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    doc.setFillColor(227, 20, 99);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('RELATÓRIO DE IMPACTO SOCIAL (RSC)', 15, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Prestação de contas para Responsabilidade Social Corporativa  |  Fundo: ${p.fund}`, 15, 27);
    doc.text(`Parceiro: ${p.razaoSocial}  |  CNPJ: ${p.cnpj}`, 15, 33);

    doc.setFontSize(10.5);
    doc.setTextColor(70, 70, 70);
    doc.setFont('helvetica', 'bold');
    doc.text('Apresentação do Impacto das Doações', 15, 55);
    doc.setFont('helvetica', 'normal');

    const introText = `A sua doação intencionada no valor de R$ ${p.intentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} direciona recursos diretamente a atendimentos oncológicos e à modernização de tratamentos contra o câncer no Hospital de Amor (Fundação Pio XII). A seguir, detalhamos o impacto estimado e a conversão de valor nos setores beneficiados.`;
    const splitIntro = doc.splitTextToSize(introText, 180);
    doc.text(splitIntro, 15, 61);

    const chemoSessions = Math.max(1, Math.round(p.intentAmount * 0.4 / 500));
    const mammographies = Math.max(1, Math.round(p.intentAmount * 0.2 / 150));
    const consults = Math.max(1, Math.round(p.intentAmount * 0.2 / 100));
    const pedHospitalDays = Math.max(1, Math.round(p.intentAmount * 0.2 / 1000));

    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento da Alocação de Recursos e Metas de Cuidado', 15, 95);

    doc.setFillColor(245, 245, 248);
    doc.rect(15, 101, 180, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text('Categoria de Cuidado Financiada', 18, 106);
    doc.text('Percentual', 110, 106);
    doc.text('Estimativa de Impacto Alcançado', 140, 106);

    const drawRow = (y: number, cat: string, pct: string, desc: string) => {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(15, y + 2, 195, y + 2);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(cat, 18, y);
      doc.text(pct, 110, y);
      doc.setFont('helvetica', 'bold');
      doc.text(desc, 140, y);
    };

    drawRow(115, 'Sessões de Quimioterapia / Medicamentos', '40%', `${chemoSessions} sessões`);
    drawRow(125, 'Mamografias e Exames Preventivos Móveis', '20%', `${mammographies} exames`);
    drawRow(135, 'Consultas Médicas Especializadas', '20%', `${consults} consultas`);
    drawRow(145, 'Diárias de Internação em Oncologia Pediátrica', '20%', `${pedHospitalDays} dias`);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(50, 50, 50);
    doc.text('Distribuição Gráfica de Recursos', 15, 165);

    const drawBar = (y: number, name: string, percent: number, color: number[]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text(name, 15, y + 4);

      doc.setFillColor(240, 240, 240);
      doc.rect(80, y, 90, 6, 'F');

      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(80, y, Math.round(90 * (percent / 100)), 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text(`${percent}%`, 175, y + 4);
    };

    drawBar(175, 'Quimioterapia', 40, [227, 20, 99]);
    drawBar(185, 'Prevenção e Exames', 20, [59, 130, 246]);
    drawBar(195, 'Consultas Clínicas', 20, [16, 185, 129]);
    drawBar(205, 'Internação e Pediatria', 20, [245, 158, 11]);

    doc.setFillColor(245, 245, 248);
    doc.rect(15, 225, 180, 25, 'F');
    doc.setDrawColor(227, 20, 99);
    doc.setLineWidth(1);
    doc.line(15, 225, 15, 250);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(227, 20, 99);
    doc.text('Selo Social e Responsabilidade Social Corporativa (RSC)', 20, 231);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const rscNotice = 'Esta doação colabora ativamente com o balanço social corporativo e as práticas de ESG (Environmental, Social, and Governance) da sua empresa, reforçando o engajamento com os Objetivos de Desenvolvimento Sustentável (ODS 3 - Saúde e Bem-Estar).';
    const splitNotice = doc.splitTextToSize(rscNotice, 170);
    doc.text(splitNotice, 20, 237);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(155, 155, 155);
    doc.text('Documento gerado dinamicamente para prestação de contas e planejamento tributário corporativo.', 105, 278, { align: 'center' });

    doc.save(`relatorio_impacto_rsc_${p.razaoSocial.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  return (
    <div className="space-y-4 text-left">
      <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans mb-4">Minhas Intenções de Patrocínio PJ</h2>
      
      <Card className="p-6 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm">
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-xs">
            Nenhuma intenção de patrocínio corporativo registrada para esta conta.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold">
                  <th className="py-2.5 pl-2">Razão Social / CNPJ</th>
                  <th className="py-2.5">Fundo Destino</th>
                  <th className="py-2.5">Valor Proposto</th>
                  <th className="py-2.5">Data de Envio</th>
                  <th className="py-2.5 text-right pr-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => {
                  const expiry = getProposalExpiryInfo(p.date);
                  const isExpanded = expandedProposalId === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <tr className="border-b border-zinc-100 dark:border-zinc-905 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 cursor-pointer transition-colors" onClick={() => setExpandedProposalId(isExpanded ? null : p.id)}>
                        <td className="py-3.5 pl-2">
                          <span className="font-extrabold text-zinc-800 dark:text-zinc-100 block leading-tight">{p.razaoSocial}</span>
                          <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{p.cnpj}</span>
                        </td>
                        <td className="py-3.5 font-semibold">{p.fund}</td>
                        <td className="py-3.5 font-extrabold text-zinc-800 dark:text-zinc-100 font-mono">
                          R$ {p.intentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-zinc-400 font-medium">
                          {new Date(p.date).toLocaleDateString('pt-BR')}
                          {expiry.isExpiringSoon && (
                            <span className="text-[9px] font-black text-red-500 block mt-0.5 font-sans animate-pulse">
                              Vence em {expiry.daysRemaining} dias
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${p.status === 'Confirmado' ? 'bg-green-50 text-green-600 dark:bg-green-955/20 dark:text-green-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400'}`}>
                              {p.status}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-250 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-zinc-50/50 dark:bg-zinc-900/20 px-6 py-5 border-b border-zinc-100 dark:border-zinc-900 animate-in slide-in-from-top-1 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                              <div className="md:col-span-7 space-y-4">
                                <div className="flex items-start gap-4">
                                  {p.logo ? (
                                    <div className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white object-contain p-2 shrink-0 flex items-center justify-center">
                                      <img src={p.logo} alt="Logo" className="w-full h-full object-contain" />
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-[10px] text-zinc-400 font-bold uppercase">Sem Logo</div>
                                  )}
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Responsável Principal</span>
                                    <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">{p.contactName}</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.email} · {p.phone}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Representantes Adicionados ({p.representatives?.length || 0})</span>
                                  {(!p.representatives || p.representatives.length === 0) ? (
                                    <p className="text-xs text-zinc-400 italic">Nenhum representante adicional cadastrado para esta proposta.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                      {p.representatives.map((rep: any, idx: number) => (
                                        <div key={idx} className="p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between">
                                          <div>
                                            <span className="font-extrabold text-xs text-zinc-805 dark:text-zinc-205 block leading-none">{rep.name}</span>
                                            <span className="text-[10px] text-zinc-400 font-medium block mt-1">{rep.role}</span>
                                            <span className="text-[9px] text-zinc-400 font-mono block truncate mt-0.5">{rep.email}</span>
                                          </div>
                                          <div className="pt-2 mt-2 border-t border-zinc-50 dark:border-zinc-900 flex justify-between items-center">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400">Permissão</span>
                                            <span className={`px-2 py-0.5 text-[8px] font-black rounded ${rep.permission === 'Administrador' ? 'bg-brand-pink/10 text-brand-pink' : 'bg-zinc-100 text-zinc-500'}`}>{rep.permission}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                                <div className="space-y-2.5 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Documentos e Selos Digitais</span>
                                  
                                  <Button
                                    onClick={(e) => { e.stopPropagation(); downloadSeloPdf(p); }}
                                    className="w-full h-9 bg-brand-pink hover:bg-brand-pink/95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-brand-pink/15"
                                  >
                                    <Award className="w-3.5 h-3.5 shrink-0" />
                                    Baixar Selo de Responsabilidade Social
                                  </Button>

                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      onClick={(e) => { e.stopPropagation(); downloadRelatorioRscPdf(p); }}
                                      className="h-9 bg-primary hover:bg-primary/95 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-sm"
                                    >
                                      <FileText className="w-3.5 h-3.5 shrink-0" />
                                      Relatório de Impacto (RSC)
                                    </Button>
                                    <Button
                                      onClick={(e) => { e.stopPropagation(); downloadNfPdf(p); }}
                                      className="h-9 bg-primary hover:bg-primary/95 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-sm"
                                    >
                                      <FileText className="w-3.5 h-3.5 shrink-0" />
                                      Gerar Nota Fiscal PJ
                                    </Button>
                                  </div>
                                </div>

                                {expiry.isExpiringSoon && (
                                  <div className="p-3 bg-red-50/10 border border-red-200/50 rounded-xl space-y-1">
                                    <span className="text-[9px] font-black uppercase text-red-500 block">Status de Expiração</span>
                                    <p className="text-[10px] text-zinc-500 leading-normal">
                                      Este patrocínio expira em <strong>{expiry.expiryDateFormatted}</strong>. A renovação do contrato de doação é obrigatória a cada 12 meses.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
