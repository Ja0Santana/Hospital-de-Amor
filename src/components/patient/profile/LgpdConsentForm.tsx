import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { Label } from '../../ui/Label';
import { Shield, ShieldCheck, HelpCircle, Download, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import Tooltip from '../../ui/Tooltip';

interface LgpdConsentFormProps {
  userRole: 'patient' | 'donor';
  loading: boolean;
  lastConsentAt: string;
  privacySuccess: string;
  privacyError: string;
  initialPreferences: {
    emailNotify: boolean;
    smsNotify: boolean;
    whatsappNotify: boolean;
    npsNotify: boolean;
    newsletterNotify: boolean;
    marketingNotify: boolean;
  };
  onSavePrivacy: (preferences: {
    emailNotify: boolean;
    smsNotify: boolean;
    whatsappNotify: boolean;
    npsNotify: boolean;
    newsletterNotify: boolean;
    marketingNotify: boolean;
  }) => Promise<void>;
  onExportData: () => void;
  onRequestDeleteAccount: () => void;
}

export default function LgpdConsentForm({
  userRole,
  loading,
  lastConsentAt,
  privacySuccess,
  privacyError,
  initialPreferences,
  onSavePrivacy,
  onExportData,
  onRequestDeleteAccount
}: LgpdConsentFormProps) {
  const [isEmailNotify, setIsEmailNotify] = useState(true);
  const [isSmsNotify, setIsSmsNotify] = useState(false);
  const [isWhatsappNotify, setIsWhatsappNotify] = useState(true);
  const [isNpsNotify, setIsNpsNotify] = useState(true);
  const [isNewsletterNotify, setIsNewsletterNotify] = useState(false);
  const [isMarketingNotify, setIsMarketingNotify] = useState(false);

  useEffect(() => {
    setIsEmailNotify(initialPreferences.emailNotify);
    setIsSmsNotify(initialPreferences.smsNotify);
    setIsWhatsappNotify(initialPreferences.whatsappNotify);
    setIsNpsNotify(initialPreferences.npsNotify);
    setIsNewsletterNotify(initialPreferences.newsletterNotify);
    setIsMarketingNotify(initialPreferences.marketingNotify);
  }, [initialPreferences]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSavePrivacy({
      emailNotify: isEmailNotify,
      smsNotify: isSmsNotify,
      whatsappNotify: isWhatsappNotify,
      npsNotify: isNpsNotify,
      newsletterNotify: isNewsletterNotify,
      marketingNotify: isMarketingNotify
    });
  };

  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 text-left">
      <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Painel de Privacidade & LGPD</h2>
      </div>
      <CardContent className="p-6 space-y-6">
        <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-200/30 dark:border-blue-800/20 p-4 rounded-2xl space-y-2 text-xs leading-normal">
          <p className="text-zinc-700 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            Controle de Consentimento:
            <Tooltip id="tooltip-privacy-consent" content="Gerencie quais comunicações opcionais deseja receber do Hospital de Amor a qualquer momento.">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-650 transition-colors animate-in" />
            </Tooltip>
          </p>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {userRole === 'donor'
              ? 'O Hospital de Amor trata seus dados cadastrais e de doação de forma segura e estritamente para o processamento de contribuições, prestação de contas e emissão de comprovantes fiscais.'
              : 'O Hospital de Amor trata seus dados sensíveis e de saúde de forma segura e estritamente para o processo de regulação e agendamento de consultas e exames oncológicos.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Finalidades do Tratamento de Dados:</h3>
          
          <div className="space-y-3">
            <div className="flex gap-2.5 items-start">
              <Checkbox id="emailNotify" checked={isEmailNotify} onCheckedChange={(checked) => setIsEmailNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
              <Label htmlFor="emailNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal cursor-pointer">
                <span className="font-bold block">Notificações por E-mail</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Alertas de triagem, confirmações de consulta e avisos operacionais do hospital.</span>
              </Label>
            </div>

            <div className="flex gap-2.5 items-start">
              <Checkbox id="smsNotify" checked={isSmsNotify} onCheckedChange={(checked) => setIsSmsNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
              <Label htmlFor="smsNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal cursor-pointer">
                <span className="font-bold block">Notificações por SMS</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Mensagens rápidas no celular sobre horários de consultas e cancelamentos urgentes.</span>
              </Label>
            </div>

            <div className="flex gap-2.5 items-start">
              <Checkbox id="whatsappNotify" checked={isWhatsappNotify} onCheckedChange={(checked) => setIsWhatsappNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
              <Label htmlFor="whatsappNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal cursor-pointer">
                <span className="font-bold block">Notificações por WhatsApp</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Comprovantes digitais com QR Code e lembretes amigáveis de documentação.</span>
              </Label>
            </div>

            <div className="flex gap-2.5 items-start">
              <Checkbox id="npsNotify" checked={isNpsNotify} onCheckedChange={(checked) => setIsNpsNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
              <Label htmlFor="npsNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal cursor-pointer">
                <span className="font-bold block">Pesquisas de Satisfação (NPS)</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Envio de pesquisas após os atendimentos para avaliar a qualidade e sugerir melhorias.</span>
              </Label>
            </div>

            <div className="flex gap-2.5 items-start">
              <Checkbox id="newsletterNotify" checked={isNewsletterNotify} onCheckedChange={(checked) => setIsNewsletterNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
              <Label htmlFor="newsletterNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal cursor-pointer">
                <span className="font-bold block">Boletins Informativos e Dicas de Saúde</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Recebimento de manuais de nutrição oncológica e cartilhas da biblioteca digital.</span>
              </Label>
            </div>

            <div className="flex gap-2.5 items-start">
              <Checkbox id="marketingNotify" checked={isMarketingNotify} onCheckedChange={(checked) => setIsMarketingNotify(checked === true)} className="mt-0.5 focus-visible:ring-primary border-zinc-300" />
              <Label htmlFor="marketingNotify" className="text-xs text-zinc-700 dark:text-zinc-300 leading-normal cursor-pointer">
                <span className="font-bold block">Campanhas de Apoio e Marketing Institucional</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Informações sobre captação de recursos, eventos beneficentes e notícias do hospital.</span>
              </Label>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center text-[10px] text-zinc-400 border-t border-zinc-150 dark:border-zinc-800">
            <span>Último consentimento: {lastConsentAt ? new Date(lastConsentAt).toLocaleString('pt-BR') : 'Não registrado'}</span>
            <a href={userRole === 'donor' ? '#/doador/central-ajuda' : '#/paciente/central-ajuda'} className="text-primary hover:underline font-bold">Ver Política de Privacidade</a>
          </div>

          {privacySuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-955/20 border border-green-200/50 dark:border-green-800/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl flex gap-2.5 items-start animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{privacySuccess}</span>
            </div>
          )}
          {privacyError && (
            <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{privacyError}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl text-xs">
            {loading ? 'Salvando...' : 'Salvar Preferências de Privacidade'}
          </Button>
        </form>

        <div className="border-t border-zinc-100 dark:border-zinc-800 my-4" />

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Ações e Direitos do Titular:</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={onExportData} 
              type="button" 
              variant="outline" 
              className="h-10 w-full border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 font-bold rounded-xl gap-2 text-xs justify-start px-4"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Exportar Meus Dados
            </Button>

            <Button 
              onClick={onRequestDeleteAccount} 
              type="button" 
              variant="ghost" 
              className="h-10 w-full hover:bg-red-50 hover:text-red-655 dark:hover:bg-red-955/20 text-zinc-500 font-bold rounded-xl gap-2 text-xs justify-start px-4"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Excluir Meu Cadastro
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
