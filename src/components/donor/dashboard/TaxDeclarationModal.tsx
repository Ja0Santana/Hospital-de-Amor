import { createPortal } from 'react-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { X } from 'lucide-react';
import type { Donation } from '../../../types';

interface TaxDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaxYear: string;
  setSelectedTaxYear: (year: string) => void;
  years: number[];
  donorName: string;
  donorCpf: string;
  donations: Donation[];
}

export default function TaxDeclarationModal({
  isOpen,
  onClose,
  selectedTaxYear,
  setSelectedTaxYear,
  years,
  donorName,
  donorCpf,
  donations
}: TaxDeclarationModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 print:hidden">
          <div>
            <h2 className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-550 font-sans">Declaração Anual de Doações</h2>
            <p className="text-[9px] text-zinc-400">Comprovante consolidado para fins de Imposto de Renda - Ano Calendário {selectedTaxYear}</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTaxYear}
              onChange={(e) => setSelectedTaxYear(e.target.value)}
              className="h-8 px-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-[10px] font-bold focus:outline-none dark:text-zinc-50"
            >
              {years.length > 0 ? (
                years.map((y) => (
                  <option key={y} value={y.toString()}>Ano Calendário {y}</option>
                ))
              ) : (
                <option value={new Date().getFullYear().toString()}>Ano Calendário {new Date().getFullYear()}</option>
              )}
            </select>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50">
              <X className="w-4 h-4 text-zinc-500" />
            </Button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6 text-left text-zinc-800 dark:text-zinc-200 font-sans print:overflow-visible print:p-0">
          <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
            <div className="space-y-1">
              <h3 className="font-black text-sm uppercase text-primary">Hospital de Amor</h3>
              <p className="text-[0.625rem] text-zinc-550 dark:text-zinc-400">Fundação Pio XII — CNPJ: 60.102.102/0001-10</p>
              <p className="text-[0.5625rem] text-zinc-450 dark:text-zinc-505">Rua Antenor Duarte Villela, 1331 — Barretos/SP</p>
            </div>
            <div className="text-right text-[0.625rem] text-zinc-400">
              <span className="font-bold block">Documento de Comprovação</span>
              <span>Emitido em: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl space-y-2 text-[0.625rem]">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Identificação do Doador</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-zinc-455 block font-semibold">Nome Completo:</span>
                <span className="font-bold">{donorName}</span>
              </div>
              <div>
                <span className="text-zinc-455 block font-semibold">CPF:</span>
                <span className="font-bold font-mono">
                  {donorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[0.625rem] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Doações Recebidas em {selectedTaxYear}</h4>
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-x-auto">
              <table className="w-full text-[0.625rem] text-left min-w-[450px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 border-b border-zinc-150 dark:border-zinc-800 font-bold uppercase tracking-wider text-[0.5625rem]">
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3">Método</th>
                    <th className="py-2 px-3">ID da Transação</th>
                    <th className="py-2 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {donations
                    .filter((d) => d.status === 'Confirmada' && new Date(d.date).getFullYear().toString() === selectedTaxYear)
                    .map((d) => (
                      <tr key={d.id} className="text-zinc-700 dark:text-zinc-300">
                        <td className="py-2 px-3 font-mono">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                        <td className="py-2 px-3">{d.method}</td>
                        <td className="py-2 px-3 font-mono text-zinc-500 truncate max-w-[120px]">{d.hash || d.id}</td>
                        <td className="py-2 px-3 text-right font-bold font-mono">R$ {d.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  {donations.filter((d) => d.status === 'Confirmada' && new Date(d.date).getFullYear().toString() === selectedTaxYear).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-400">Nenhuma doação realizada no ano fiscal de {selectedTaxYear}.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
            <span className="text-[0.6875rem] font-black uppercase text-zinc-500">Valor Total Consolidado em {selectedTaxYear}:</span>
            <span className="text-sm font-black text-brand-pink font-mono">
              R$ {donations
                .filter((d) => d.status === 'Confirmada' && new Date(d.date).getFullYear().toString() === selectedTaxYear)
                .reduce((sum, d) => sum + d.amount, 0)
                .toFixed(2)}
            </span>
          </div>

          <div className="text-[0.5625rem] text-zinc-450 dark:text-zinc-400 leading-relaxed space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-850">
            <p>
              Declaramos para os devidos fins de comprovação e dedução fiscal que a Fundação Pio XII (Hospital de Amor) é uma entidade filantrópica qualificada nos termos da legislação federal brasileira e que recebeu os valores acima identificados a título de doação espontânea, sem que tenha ocorrido qualquer contraprestação direta ou indireta de bens ou serviços.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="w-12 h-12 border border-zinc-300 flex items-center justify-center bg-white p-1 text-[8px] font-bold leading-tight select-none">
                QR CODE SIMULADO
              </div>
              <div>
                <span className="font-extrabold block text-zinc-800">Assinatura Eletrônica da Entidade</span>
                <span className="font-mono text-zinc-400 select-all block">HA-DECL-CNPJ-60102102000110-SEC-{selectedTaxYear}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 print:hidden pt-4 border-t border-zinc-150 dark:border-zinc-800">
            <Button
              onClick={() => window.print()}
              className="flex-1 h-10 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-pink/20"
            >
              Imprimir Declaração
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-xl text-xs font-bold border-zinc-200"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
}
