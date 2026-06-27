import React, { useState, useEffect } from 'react';
import { DollarSign, X } from 'lucide-react';
import type { TransparencyData } from '../../../types';

interface TransparencyPortalConfigProps {
  transparencyData: TransparencyData | null;
  onMonthlyRecordChange: (index: number, field: 'entradas' | 'saidas' | 'atendimentos', value: number) => void;
  onAddProject: (title: string, description: string, date: string, amount: number) => void;
  onRemoveProject: (id: string) => void;
  onPublishTransparency: (oncologia: number, mastologia: number, radiologia: number, geral: number) => Promise<void>;
}

export default function TransparencyPortalConfig({
  transparencyData,
  onMonthlyRecordChange,
  onAddProject,
  onRemoveProject,
  onPublishTransparency
}: TransparencyPortalConfigProps) {
  const [oncologiaPercent, setOncologiaPercent] = useState(0);
  const [mastologiaPercent, setMastologiaPercent] = useState(0);
  const [radiologiaPercent, setRadiologiaPercent] = useState(0);
  const [geralPercent, setGeralPercent] = useState(0);

  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDate, setNewProjectDate] = useState('');
  const [newProjectAmount, setNewProjectAmount] = useState(0);

  useEffect(() => {
    if (transparencyData) {
      const onc = transparencyData.sectors.find(s => s.name === 'Oncologia')?.value ?? 0;
      const mast = transparencyData.sectors.find(s => s.name === 'Mastologia')?.value ?? 0;
      const rad = transparencyData.sectors.find(s => s.name === 'Radiologia')?.value ?? 0;
      const ger = transparencyData.sectors.find(s => s.name === 'Geral')?.value ?? 0;
      setOncologiaPercent(onc);
      setMastologiaPercent(mast);
      setRadiologiaPercent(rad);
      setGeralPercent(ger);
    }
  }, [transparencyData]);

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !newProjectDesc.trim() || !newProjectDate) return;
    onAddProject(newProjectTitle.trim(), newProjectDesc.trim(), newProjectDate, newProjectAmount);
    setNewProjectTitle('');
    setNewProjectDesc('');
    setNewProjectDate('');
    setNewProjectAmount(0);
  };

  const handlePublishSubmit = async () => {
    await onPublishTransparency(oncologiaPercent, mastologiaPercent, radiologiaPercent, geralPercent);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (!transparencyData) {
    return <div className="text-zinc-500 text-xs italic">Carregando dados de transparência...</div>;
  }

  const sectorsSum = oncologiaPercent + mastologiaPercent + radiologiaPercent + geralPercent;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-55 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-pink-600" />
            Faturamento e Gastos Mensais
          </h3>
          <p className="text-zinc-500 text-[0.625rem] mt-0.5">Preencha o consolidado real de entradas e saídas financeiras do ano corrente.</p>
        </div>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-2.5 px-3">Mês de Referência</th>
                <th className="py-2.5 px-3">Entradas Consolidadas (R$)</th>
                <th className="py-2.5 px-3">Saídas Consolidadas (R$)</th>
                <th className="py-2.5 px-3">Atendimentos Clínicos (Qtd)</th>
              </tr>
            </thead>
            <tbody>
              {transparencyData.monthlyRecords.map((record, index) => (
                <tr key={record.month} className="border-b border-zinc-100 dark:border-zinc-850/60 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-955/10">
                  <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                    {record.month}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={record.entradas}
                      onChange={(e) => onMonthlyRecordChange(index, 'entradas', Number(e.target.value))}
                      className="w-32 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 text-xs"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={record.saidas}
                      onChange={(e) => onMonthlyRecordChange(index, 'saidas', Number(e.target.value))}
                      className="w-32 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 text-xs"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={record.atendimentos}
                      onChange={(e) => onMonthlyRecordChange(index, 'atendimentos', Number(e.target.value))}
                      className="w-32 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4 h-full">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Projetos Sociais com Doações Recentes</h3>
            <p className="text-zinc-550 text-[0.625rem] mt-0.5">Cadastre projetos institucionais com captação direta de doadores.</p>
          </div>

          <form onSubmit={handleAddProjectSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Título do Projeto *</label>
                <input
                  type="text"
                  placeholder="Ex: Aquisição Novo Tomógrafo"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Valor Arrecadado (R$)</label>
                <input
                  type="number"
                  value={newProjectAmount}
                  onChange={(e) => setNewProjectAmount(Number(e.target.value))}
                  min={0}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Descrição Detalhada *</label>
                <input
                  type="text"
                  placeholder="Ex: Projeto para modernização da ala de imagem diagnóstica."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data de Conclusão *</label>
                <input
                  type="date"
                  value={newProjectDate}
                  onChange={(e) => setNewProjectDate(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-extrabold text-[0.6875rem] px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              Adicionar Projeto à Lista
            </button>
          </form>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
            <h4 className="text-[0.6875rem] font-bold text-zinc-700 dark:text-zinc-300">Projetos Registrados</h4>
            <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2">
              {transparencyData.projects.length === 0 ? (
                <p className="text-[0.625rem] text-zinc-450 italic">Nenhum projeto social publicado.</p>
              ) : (
                transparencyData.projects.map(proj => (
                  <div key={proj.id} className="flex justify-between items-start bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-100 dark:border-zinc-850 p-3 rounded-xl text-[0.625rem] gap-2">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100 block">{proj.title}</span>
                      <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-normal">{proj.description}</p>
                      <div className="text-[0.5625rem] text-zinc-450 mt-1">
                        Concluído: {formatDate(proj.completedDate)} | Captado: <strong className="text-zinc-700 dark:text-zinc-300">R$ {proj.amountRaised.toLocaleString('pt-BR')}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveProject(proj.id)}
                      className="text-red-500 hover:text-red-750 transition-all p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4 h-full flex flex-col">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Distribuição dos Recursos por Setores (Soma de 100%)</h3>
            <p className="text-zinc-550 text-[0.625rem] mt-0.5">Informe os percentuais de direcionamento do orçamento captado.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs flex-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Setor de Oncologia (%)</label>
              <input
                type="number"
                value={oncologiaPercent}
                onChange={(e) => setOncologiaPercent(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Setor de Mastologia (%)</label>
              <input
                type="number"
                value={mastologiaPercent}
                onChange={(e) => setMastologiaPercent(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Setor de Radiologia (%)</label>
              <input
                type="number"
                value={radiologiaPercent}
                onChange={(e) => setRadiologiaPercent(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Administrativo / Geral (%)</label>
              <input
                type="number"
                value={geralPercent}
                onChange={(e) => setGeralPercent(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
            <div className="text-[10px] font-extrabold">
              Soma Setores:{' '}
              <span className={sectorsSum === 100 ? 'text-emerald-600' : 'text-red-500 animate-pulse'}>
                {sectorsSum}%
              </span>{' '}
              / 100%
            </div>
            <button
              onClick={handlePublishSubmit}
              className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-xs"
            >
              Publicar no Mural
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
