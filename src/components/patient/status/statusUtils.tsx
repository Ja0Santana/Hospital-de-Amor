import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { Appointment } from '../../../types';

export interface StatusStyleConfig {
  color: string;
  icon: any;
  desc: React.ReactNode;
}

export function getStatusConfig(
  status: Appointment['status'],
  averageTriageTime: string
): StatusStyleConfig {
  const config: Record<Appointment['status'], StatusStyleConfig> = {
    Pendente: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: Clock,
      desc: 'Sua solicitação está na fila de espera e será revisada por nossa equipe médica em até 48 horas úteis.',
    },
    'Em análise': {
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      icon: Clock,
      desc: (
        <span>
          Nossos recepcionistas estão revisando o documento e o encaminhamento enviado. Estimativa de resposta:{' '}
          {averageTriageTime ? (
            <span className="font-semibold">{averageTriageTime}</span>
          ) : (
            <span className="inline-block w-20 h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded align-middle" />
          )}
          .
        </span>
      ),
    },
    Confirmado: {
      color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      icon: CheckCircle2,
      desc: 'Parabéns! Sua triagem foi concluída e sua consulta/exame está agendado e confirmado.',
    },
    Cancelado: {
      color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
      icon: XCircle,
      desc: 'Sua solicitação de agendamento foi cancelada pela triagem administrativa.',
    },
    'Reagendamento Pendente': {
      color: 'bg-amber-100 text-amber-800 border-amber-250 dark:bg-amber-900/30 dark:text-amber-400',
      icon: Clock,
      desc: 'Sua solicitação de alteração de horário foi enviada para a triagem e está sob análise administrativa.',
    },
    'Aguardando Follow-up': {
      color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
      icon: Clock,
      desc: 'Sua solicitação possui pendências sob acompanhamento. Aguarde contato da nossa equipe.',
    },
    Concluído: {
      color: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400',
      icon: CheckCircle2,
      desc: 'Seu atendimento foi concluído com sucesso. Agradecemos pela sua confiança!',
    },
    'Arquivado por Documentação Pendente': {
      color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
      icon: XCircle,
      desc: 'Sua solicitação foi arquivada por falta de envio dos documentos solicitados dentro do prazo.',
    },
  };
  return config[status] || config['Pendente'];
}
