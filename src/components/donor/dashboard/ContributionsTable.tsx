import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { History, Download, FileText } from 'lucide-react';
import { generateTaxDeclarationPdf } from '../../../utils/generateTaxDeclarationPdf';
import type { Donation } from '../../../types';

interface ContributionsTableProps {
  loading: boolean;
  donorName: string;
  donorCpf: string;
  donations: Donation[];
  onOpenTaxModal: (year: string) => void;
}

export default function ContributionsTable({
  loading,
  donorName,
  donorCpf,
  donations,
  onOpenTaxModal
}: ContributionsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const years = Array.from(new Set(donations.map((d) => new Date(d.date).getFullYear()))).sort((a, b) => b - a);

  const getFilteredDonations = () => {
    return donations.filter((d) => {
      const matchesSearch = searchQuery
        ? d.id.toLowerCase().includes(searchQuery.toLowerCase()) || (d.hash && d.hash.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      const donationDate = new Date(d.date);
      const matchesYear = filterYear ? donationDate.getFullYear().toString() === filterYear : true;
      const matchesMonth = filterMonth ? (donationDate.getMonth() + 1).toString() === filterMonth : true;
      
      return matchesSearch && matchesYear && matchesMonth;
    });
  };

  const filteredDonations = getFilteredDonations();
  const totalFilteredAmount = filteredDonations
    .filter((d) => d.status === 'Confirmada')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-pink" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Histórico de Contribuições</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const lastYear = (new Date().getFullYear() - 1).toString();
              generateTaxDeclarationPdf({
                donorName,
                donorCpf,
                year: lastYear,
                donations
              });
            }}
            className="h-8 border-brand-pink/30 hover:border-brand-pink text-brand-pink font-bold text-[10px] rounded-lg gap-1.5 active:scale-[0.98] transition-all uppercase tracking-wider w-full sm:w-auto justify-center"
          >
            <Download className="w-3.5 h-3.5" />
            IR {new Date().getFullYear() - 1} (Download Direto)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const mostRecentYear = donations
                .filter((d) => d.status === 'Confirmada')
                .map((d) => new Date(d.date).getFullYear())
                .sort((a, b) => b - a)[0];
              onOpenTaxModal(mostRecentYear ? mostRecentYear.toString() : new Date().getFullYear().toString());
            }}
            className="h-8 border-brand-pink/30 hover:border-brand-pink text-brand-pink font-bold text-[10px] rounded-lg gap-1.5 active:scale-[0.98] transition-all uppercase tracking-wider w-full sm:w-auto justify-center"
          >
            <FileText className="w-3.5 h-3.5" />
            Declaração de IR
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl gap-3 shadow-xs">
        <div>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block font-bold uppercase tracking-wider">Total doado no período selecionado</span>
          <span className="text-xl font-black text-brand-pink font-mono mt-0.5 block">
            R$ {totalFilteredAmount.toFixed(2)}
          </span>
        </div>
        <p className="text-[0.5625rem] text-zinc-400 leading-normal max-w-sm">
          Apenas doações efetivamente liquidadas e com status <span className="font-extrabold text-green-600 dark:text-green-400">Confirmada</span> compõem este resumo financeiro.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-2">
        <div className="sm:col-span-6">
          <input
            type="text"
            placeholder="Buscar por ID ou Hash da transação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-brand-pink"
          />
        </div>
        <div className="sm:col-span-3">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full h-9 px-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-brand-pink"
          >
            <option value="">Todos os meses</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full h-9 px-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-brand-pink"
          >
            <option value="">Todos os anos</option>
            {years.map((y) => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        {loading ? (
          <div className="text-center py-8 text-xs text-zinc-400">Carregando histórico...</div>
        ) : filteredDonations.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400">Nenhuma doação encontrada para os filtros aplicados.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-150 dark:border-zinc-800 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2.5">Data</th>
                <th className="py-2.5">ID/Hash</th>
                <th className="py-2.5">Valor</th>
                <th className="py-2.5">Método</th>
                <th className="py-2.5">Destinação</th>
                <th className="py-2.5 text-center">Pontos</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
              {filteredDonations.map((d) => (
                <tr key={d.id} className="text-zinc-700 dark:text-zinc-300">
                  <td className="py-3 font-mono">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3">
                    <span className="font-mono text-zinc-500 max-w-[120px] truncate block" title={d.hash || d.id}>
                      {d.hash || d.id}
                    </span>
                  </td>
                  <td className="py-3 font-extrabold text-zinc-900 dark:text-zinc-100">R$ {d.amount.toFixed(2)}</td>
                  <td className="py-3">{d.method}</td>
                  <td className="py-3">{d.projectDestiny || 'Geral'}</td>
                  <td className="py-3 text-center font-bold text-brand-pink">+{d.amount * 10} pts</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      d.status === 'Confirmada' 
                        ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400' 
                        : d.status === 'Aguardando Pagamento' || d.status === 'Pendente' || d.status === 'Processando'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                        : d.status === 'Expirado' || d.status === 'Cancelada'
                        ? 'bg-red-50 text-red-655 dark:bg-red-950/20 dark:text-red-400'
                        : d.status === 'Estornada'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                        : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
