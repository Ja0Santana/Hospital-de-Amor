import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { AlertCircle, Info, ChevronDown } from 'lucide-react';
import type { Appointment } from '../../../types';

interface PrepAlert {
  id: string;
  title: string;
  desc: string;
}

interface DashboardAlertsProps {
  pendingDocApp: Appointment | null;
  showDiaryAlert: boolean;
  prepAlerts: PrepAlert[];
  onNavigate: (page: string) => void;
}

export default function DashboardAlerts({
  pendingDocApp,
  showDiaryAlert,
  prepAlerts,
  onNavigate,
}: DashboardAlertsProps) {
  const [expandedPrepId, setExpandedPrepId] = useState<string | null>(
    prepAlerts.length > 0 ? prepAlerts[0].id : null
  );
  const [isPrepCardExpanded, setIsPrepCardExpanded] = useState(true);

  if (!pendingDocApp && !showDiaryAlert && prepAlerts.length === 0) return null;

  return (
    <div className="space-y-4">
      {pendingDocApp && (
        <div className="p-4 rounded-3xl bg-red-50/60 dark:bg-red-955/20 border border-red-200/50 dark:border-red-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3 items-start text-left">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-55">
                Documentação Pendente de Correção
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sua solicitação de {pendingDocApp.examName} possui documentos com problemas identificados na
                triagem. Substitua o documento para prosseguir.
              </p>
            </div>
          </div>
          <Button
            onClick={() => onNavigate('status-' + pendingDocApp.protocol)}
            className="bg-red-500 hover:bg-red-650 text-white font-bold h-9 px-4 rounded-xl text-xs shrink-0 self-end sm:self-center transition-transform active:scale-95 shadow-sm border border-transparent"
          >
            Corrigir Documento
          </Button>
        </div>
      )}

      {showDiaryAlert && (
        <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex gap-3 items-start text-left">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-55">
                Diário de Sintomas Pendente
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Você ainda não informou como está se sentindo hoje. Registrar seus sintomas ajuda na regulação
                do seu tratamento.
              </p>
            </div>
          </div>
          <Button
            onClick={() => onNavigate('symptoms')}
            className="bg-amber-500 hover:bg-amber-650 text-white font-bold h-9 px-4 rounded-xl text-xs shrink-0 self-end sm:self-center transition-transform active:scale-95 shadow-sm border border-transparent"
          >
            Registrar Saúde
          </Button>
        </div>
      )}

      {prepAlerts.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-md shadow-zinc-100/50 dark:shadow-none animate-in slide-in-from-top-2 duration-300">
          <button
            onClick={() => setIsPrepCardExpanded(!isPrepCardExpanded)}
            className={`w-full bg-zinc-50/80 dark:bg-zinc-900/50 px-5 py-4 flex items-center justify-between hover:bg-zinc-100/40 dark:hover:bg-zinc-800/10 transition-colors text-left focus:outline-none ${
              isPrepCardExpanded ? 'border-b border-zinc-150 dark:border-zinc-800' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Info className="w-4 h-4" />
              </div>
              <h3 className="font-black text-sm text-zinc-800 dark:text-zinc-200">
                Instruções de Preparo para Exames
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-450 border-none text-[10px] font-black rounded-lg">
                {prepAlerts.length} {prepAlerts.length === 1 ? 'Exame' : 'Exames'}
              </Badge>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-250 ${
                  isPrepCardExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {isPrepCardExpanded && (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in duration-200">
              {prepAlerts.map((alert) => {
                const isExpanded = expandedPrepId === alert.id;
                return (
                  <div key={alert.id} className="group">
                    <button
                      onClick={() => setExpandedPrepId(isExpanded ? null : alert.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10 transition-colors focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full transition-colors ${
                            isExpanded
                              ? 'bg-blue-600 dark:bg-blue-400 scale-110'
                              : 'bg-zinc-300 dark:bg-zinc-650'
                          }`}
                        />
                        <span className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">
                          {alert.title}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-250 ${
                          isExpanded ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 bg-blue-50/20 dark:bg-blue-955/5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="pl-5 border-l-2 border-blue-500/35 dark:border-blue-500/20 py-1 space-y-1">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                            Recomendações da equipe médica
                          </span>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                            {alert.desc}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
