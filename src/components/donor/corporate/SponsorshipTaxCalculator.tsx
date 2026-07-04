import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { ShieldCheck, Calculator } from 'lucide-react';

interface SponsorshipTaxCalculatorProps {
  revenue: string;
  setRevenue: (val: string) => void;
  selectedFund: 'pronon' | 'fia' | 'idoso';
  setSelectedFund: (fund: 'pronon' | 'fia' | 'idoso') => void;
  simResult: { maxDeduction: number; netCost: number } | null;
  onCalculate: () => void;
}

export default function SponsorshipTaxCalculator({
  revenue,
  setRevenue,
  selectedFund,
  setSelectedFund,
  simResult,
  onCalculate
}: SponsorshipTaxCalculatorProps) {
  return (
    <Card className="p-6 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-6 shadow-sm text-left">
      <div className="space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <ShieldCheck className="w-4 h-4 text-brand-pink" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450">Leis de Incentivo Suportadas</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block text-xs">PRONON</span>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Programa de Apoio à Atenção Oncológica. Deduza até 1% do IRPJ devido direto para tratamentos de câncer.
            </p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block text-xs">FIA</span>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Fundo para a Infância e Adolescência. Apoie a ala pediátrica oncológica deduzindo até 1% do IRPJ devido.
            </p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block text-xs">Fundo do Idoso</span>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Fundo Nacional do Idoso. Apoie tratamentos e cuidados de pacientes da melhor idade deduzindo 1% do imposto.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 text-xs border-t border-zinc-100 dark:border-zinc-800 pt-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-brand-pink" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-405">Simulador de Benefício Fiscal</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Lucro Real Tributável Anual</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-xs">R$</span>
              <Input
                type="text"
                placeholder="Ex: 5.000.000,00"
                value={revenue}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  if (!digits) { setRevenue(''); return; }
                  const formatted = (parseInt(digits, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                  setRevenue(formatted);
                }}
                className="pl-8 h-10 border-zinc-205 focus-visible:ring-brand-pink rounded-xl text-xs bg-white dark:bg-zinc-950 dark:border-zinc-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Fundo de Destinação</Label>
            <select
              value={selectedFund}
              onChange={(e) => setSelectedFund(e.target.value as any)}
              className="w-full h-10 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs px-3 text-zinc-900 dark:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
            >
              <option value="pronon">PRONON (Oncologia - Recomendado)</option>
              <option value="fia">FIA (Ala Infantil)</option>
              <option value="idoso">Fundo do Idoso</option>
            </select>
          </div>
        </div>

        <Button onClick={onCalculate} className="w-full h-10 bg-primary text-white font-bold rounded-xl text-xs">
          Calcular Incentivo Fiscal
        </Button>

        {simResult && (
          <div className="p-4 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-550 dark:text-zinc-300 font-medium">Patrocínio Máximo Dedutível (1% do IRPJ):</span>
              <strong className="text-base text-brand-pink font-mono">R$ {simResult.maxDeduction.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-400 border-t border-brand-pink/10 pt-2">
              <span>Dedução Fiscal do IRPJ Devido:</span>
              <span className="font-extrabold text-green-600 dark:text-green-400">100% dedutível</span>
            </div>
            <div className="text-[9px] text-zinc-400 text-center leading-normal">
              Ao doar o valor de R$ {simResult.maxDeduction.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}, o imposto de renda da sua empresa a pagar diminui exatamente no mesmo valor, resultando em custo financeiro líquido zero para a corporação.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
