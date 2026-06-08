import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Building2, Calculator, ShieldCheck, CheckCircle2, Sparkles, Send } from 'lucide-react';

export default function CorporateSponsorship() {
  // Simulator State
  const [revenue, setRevenue] = useState<string>('');
  const [selectedFund, setSelectedFund] = useState<'pronon' | 'fia' | 'idoso'>('pronon');
  const [simResult, setSimResult] = useState<{ maxDeduction: number; netCost: number } | null>(null);

  // Form State
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [intentAmount, setIntentAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  // Saved proposals
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('corporate_proposals');
    if (stored) {
      setProposals(JSON.parse(stored));
    }
  }, []);

  // Format CNPJ: 00.000.000/0000-00
  const formatCnpj = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleCnpjChange = (val: string) => {
    setCnpj(formatCnpj(val));
  };

  // Tax calculation
  const handleCalculateTax = () => {
    const cleanVal = revenue.replace(/\./g, '').replace(',', '.');
    const parsedRevenue = parseFloat(cleanVal);
    if (isNaN(parsedRevenue) || parsedRevenue <= 0) {
      alert('Por favor, informe um valor de lucro tributável válido.');
      return;
    }

    // Standard Corporate Income Tax (IRPJ) in Brazil is 15% of the taxable income (Lucro Real)
    const estimatedIRPJ = parsedRevenue * 0.15;
    
    // According to PDF / Brazilian legislation, PJ can deduct up to 1% of the tax due for PRONON/FIA/Idoso
    const maxDeductible = estimatedIRPJ * 0.01;

    setSimResult({
      maxDeduction: maxDeductible,
      netCost: 0 // 100% is deductible from IRPJ due, making the real financial cost zero
    });
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!razaoSocial.trim()) {
      setFormError('Por favor, informe a Razão Social.');
      return;
    }

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length < 14) {
      setFormError('Por favor, informe um CNPJ válido de 14 dígitos.');
      return;
    }

    if (!contactName.trim()) {
      setFormError('Por favor, informe o nome do responsável.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Por favor, informe um e-mail corporativo válido.');
      return;
    }

    if (!phone.trim()) {
      setFormError('Por favor, informe um telefone de contato.');
      return;
    }

    const parsedIntent = parseFloat(intentAmount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(parsedIntent) || parsedIntent <= 0) {
      setFormError('Por favor, informe um valor de intenção de patrocínio válido.');
      return;
    }

    const newProposal = {
      id: 'prop-' + Math.random().toString(36).substring(2, 9),
      razaoSocial,
      cnpj,
      contactName,
      email,
      phone,
      intentAmount: parsedIntent,
      fund: selectedFund === 'pronon' ? 'PRONON' : selectedFund === 'fia' ? 'FIA' : 'Fundo do Idoso',
      date: new Date().toISOString(),
      status: 'Aguardando Análise'
    };

    const updated = [newProposal, ...proposals];
    localStorage.setItem('corporate_proposals', JSON.stringify(updated));
    setProposals(updated);
    setSuccess(true);
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
    setRazaoSocial('');
    setCnpj('');
    setContactName('');
    setEmail('');
    setPhone('');
    setIntentAmount('');
    setSimResult(null);
    setRevenue('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Patrocínio Corporativo (PJ) - RF66
        </h1>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
          Como Pessoa Jurídica (tributada pelo Lucro Real), sua empresa pode direcionar impostos federais diretamente para os projetos oncológicos do Hospital de Amor com 100% de dedução fiscal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Tax Incentives Info & Simulator */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <ShieldCheck className="w-4 h-4 text-brand-pink" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Leis de Incentivo Suportadas</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block text-xs">PRONON</span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Programa de Apoio à Atenção Oncológica. Deduza até 1% do IRPJ devido direto para tratamentos de câncer.
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block text-xs">FIA</span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Fundo para a Infância e Adolescência. Apoie a ala pediátrica oncológica deduzindo até 1% do IRPJ devido.
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Simulador de Benefício Fiscal</h3>
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
                      className="pl-8 h-10 border-zinc-200 focus-visible:ring-brand-pink rounded-xl text-xs"
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

              <Button onClick={handleCalculateTax} className="w-full h-10 bg-primary text-white font-bold rounded-xl text-xs">
                Calcular Incentivo Fiscal
              </Button>

              {simResult && (
                <div className="p-4 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-505 dark:text-zinc-300 font-medium">Patrocínio Máximo Dedutível (1% do IRPJ):</span>
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
        </div>

        {/* Intention Registration Form */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
              <Building2 className="w-4 h-4 text-brand-pink" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Proposta de Patrocínio PJ</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-left">
              {formError && (
                <div className="p-3 bg-red-50/10 border border-red-200/50 text-red-500 text-[11px] font-bold rounded-xl">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="razaoSocial" className="font-semibold text-zinc-700 dark:text-zinc-300">Razão Social</Label>
                <Input
                  id="razaoSocial"
                  type="text"
                  placeholder="Nome Comercial da Empresa"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  className="h-9 border-zinc-200 focus-visible:ring-brand-pink rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="font-semibold text-zinc-700 dark:text-zinc-300">CNPJ</Label>
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  className="h-9 border-zinc-200 focus-visible:ring-brand-pink rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="font-semibold text-zinc-700 dark:text-zinc-300">Responsável de Contato</Label>
                <Input
                  id="contactName"
                  type="text"
                  placeholder="Nome Completo"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-9 border-zinc-200 focus-visible:ring-brand-pink rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-semibold text-zinc-700 dark:text-zinc-300">E-mail Corporativo</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 border-zinc-200 focus-visible:ring-brand-pink rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="font-semibold text-zinc-700 dark:text-zinc-300">Telefone</Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="(79) 3000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 border-zinc-200 focus-visible:ring-brand-pink rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="intentAmount" className="font-semibold text-zinc-700 dark:text-zinc-300">Valor Intencionado de Patrocínio</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-400 font-bold text-xs">R$</span>
                  <Input
                    id="intentAmount"
                    type="text"
                    placeholder="0,00"
                    value={intentAmount}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      if (!digits) { setIntentAmount(''); return; }
                      const formatted = (parseInt(digits, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                      setIntentAmount(formatted);
                    }}
                    className="pl-8 h-9 border-zinc-200 focus-visible:ring-brand-pink rounded-xl text-xs"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 bg-brand-pink hover:bg-brand-pink/95 text-white font-bold rounded-xl text-xs mt-2 flex items-center justify-center gap-1.5 shadow-md shadow-brand-pink/15">
                <Send className="w-3.5 h-3.5" />
                Registrar Interesse
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Corporate Proposals List */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 text-left">
        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans mb-4">Minhas Intenções de Patrocínio PJ</h2>
        
        <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl shadow-sm">
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-xs">
              Nenhuma intenção de patrocínio corporativo registrada para esta conta.
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-bold">
                    <th className="py-2.5">Razão Social / CNPJ</th>
                    <th className="py-2.5">Fundo Destino</th>
                    <th className="py-2.5">Valor Proposto</th>
                    <th className="py-2.5">Data de Envio</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr key={p.id} className="border-b border-zinc-50 dark:border-zinc-900 text-zinc-650 dark:text-zinc-350">
                      <td className="py-3">
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-100 block leading-tight">{p.razaoSocial}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{p.cnpj}</span>
                      </td>
                      <td className="py-3 font-semibold">{p.fund}</td>
                      <td className="py-3 font-extrabold text-zinc-800 dark:text-zinc-100 font-mono">
                        R$ {p.intentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-zinc-400">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Success Modal */}
      {success && (
        <div onClick={handleCloseSuccess} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 flex items-center justify-center text-green-600 dark:text-green-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Intenção de Patrocínio Registrada!</h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Agradecemos o interesse da sua corporação em apoiar os pacientes oncológicos. Nossa equipe de Captação de Recursos entrará em contato pelo e-mail informado em até 2 dias úteis.
              </p>
            </div>
            <div className="p-3.5 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl max-w-xs mx-auto text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-pink fill-brand-pink" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink">Selo Empresa Parceira Pendente</span>
            </div>
            <Button onClick={handleCloseSuccess} className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-8 rounded-xl text-xs w-full shadow-md shadow-primary/20">
              Concluir
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
