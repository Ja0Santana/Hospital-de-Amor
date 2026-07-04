import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import SponsorshipTaxCalculator from '../../components/donor/corporate/SponsorshipTaxCalculator';
import SponsorshipProposalForm from '../../components/donor/corporate/SponsorshipProposalForm';
import SponsorshipProposalsList from '../../components/donor/corporate/SponsorshipProposalsList';
import SponsorshipSuccessModal from '../../components/donor/corporate/SponsorshipSuccessModal';

export default function CorporateSponsorship() {
  const [revenue, setRevenue] = useState<string>('');
  const [selectedFund, setSelectedFund] = useState<'pronon' | 'fia' | 'idoso'>('pronon');
  const [simResult, setSimResult] = useState<{ maxDeduction: number; netCost: number } | null>(null);

  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('corporate_proposals');
    let loadedProposals = stored ? JSON.parse(stored) : [];
    const hasExpiringDummy = loadedProposals.some((p: any) => p.id === 'prop-dummy-expiring');
    if (!hasExpiringDummy) {
      const elevenMonthsAgo = new Date();
      elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);
      const dummyExpiring = {
        id: 'prop-dummy-expiring',
        razaoSocial: 'Inovações Médicas S.A.',
        cnpj: '12.345.678/0001-99',
        contactName: 'Carlos Drummond',
        email: 'carlos@inovamed.com.br',
        phone: '(79) 99988-7766',
        intentAmount: 75000,
        fund: 'PRONON',
        date: elevenMonthsAgo.toISOString(),
        status: 'Confirmado',
        representatives: [
          { name: 'Aline Souza', email: 'aline@inovamed.com.br', role: 'Diretora de Marketing', permission: 'Administrador' },
          { name: 'Ricardo Dias', email: 'ricardo@inovamed.com.br', role: 'Gestor de RH', permission: 'Visualizador' }
        ],
        logo: null
      };
      loadedProposals = [...loadedProposals, dummyExpiring];
      localStorage.setItem('corporate_proposals', JSON.stringify(loadedProposals));
    }
    setProposals(loadedProposals);
  }, []);

  const handleCalculateTax = () => {
    const cleanVal = revenue.replace(/\./g, '').replace(',', '.');
    const parsedRevenue = parseFloat(cleanVal);
    if (isNaN(parsedRevenue) || parsedRevenue <= 0) {
      alert('Por favor, informe um valor de lucro tributável válido.');
      return;
    }
    const estimatedIRPJ = parsedRevenue * 0.15;
    const maxDeductible = estimatedIRPJ * 0.01;
    setSimResult({
      maxDeduction: maxDeductible,
      netCost: 0
    });
  };

  const handleProposalSubmit = (data: {
    razaoSocial: string;
    cnpj: string;
    contactName: string;
    email: string;
    phone: string;
    intentAmount: number;
    logo: string | null;
    representatives: any[];
  }) => {
    const newProposal = {
      id: 'prop-' + Math.random().toString(36).substring(2, 9),
      ...data,
      fund: selectedFund === 'pronon' ? 'PRONON' : selectedFund === 'fia' ? 'FIA' : 'Fundo do Idoso',
      date: new Date().toISOString(),
      status: 'Confirmado'
    };

    const updated = [newProposal, ...proposals];
    localStorage.setItem('corporate_proposals', JSON.stringify(updated));
    setProposals(updated);
    setSuccess(true);
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
    setSimResult(null);
    setRevenue('');
  };

  const checkExpiringProposals = () => {
    return proposals.filter((p) => {
      const sendDate = new Date(p.date);
      const expiryDate = new Date(sendDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 60 && p.status === 'Confirmado';
    });
  };

  const expiringProposals = checkExpiringProposals();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans text-left">
          Patrocínio Corporativo (PJ) - RF66
        </h1>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed text-left">
          Como Pessoa Jurídica (tributada pelo Lucro Real), sua empresa pode direcionar impostos federais diretamente para os projetos oncológicos do Hospital de Amor com 100% de dedução fiscal.
        </p>
      </div>

      {expiringProposals.length > 0 && (
        <div className="p-4 rounded-3xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3 items-start text-left">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Contrato de Patrocínio Próximo do Vencimento</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                O patrocínio da empresa <strong>{expiringProposals[0].razaoSocial}</strong> vence inminentemente em menos de 60 dias. Regularize o contrato anual para manter ativo o Selo de Responsabilidade Social.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <SponsorshipTaxCalculator
            revenue={revenue}
            setRevenue={setRevenue}
            selectedFund={selectedFund}
            setSelectedFund={setSelectedFund}
            simResult={simResult}
            onCalculate={handleCalculateTax}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <SponsorshipProposalForm
            formError={formError}
            setFormError={setFormError}
            onSubmit={handleProposalSubmit}
          />
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <SponsorshipProposalsList proposals={proposals} />
      </div>

      <SponsorshipSuccessModal isOpen={success} onClose={handleCloseSuccess} />
    </div>
  );
}
