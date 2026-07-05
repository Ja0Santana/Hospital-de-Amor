import { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, AlertCircle, Copy, ClipboardCheck } from 'lucide-react';

interface RequestSuccessPanelProps {
  protocol: string;
  onNavigate: (page: string) => void;
}

export default function RequestSuccessPanel({ protocol, onNavigate }: RequestSuccessPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyProtocol = () => {
    navigator.clipboard.writeText(protocol);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
        <CardContent className="p-8 text-center flex flex-col items-center space-y-6">
          <div className="p-4 bg-green-50 dark:bg-green-955/20 text-green-600 dark:text-green-400 rounded-full border border-green-200/50 dark:border-green-800/30">
            <CheckCircle2 className="w-16 h-16" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Solicitação Enviada!
            </h1>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto">
              Seu pedido foi registrado com sucesso na fila de triagem médica do Hospital de Amor.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/80 p-5 rounded-2xl w-full flex flex-col items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Seu Código de Protocolo
            </span>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 px-4 py-2.5 rounded-xl shadow-sm w-full justify-between">
              <span className="text-lg font-black tracking-wider text-zinc-900 dark:text-zinc-50 font-mono">
                {protocol}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyProtocol}
                className="h-9 w-9 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                {copied ? (
                  <ClipboardCheck className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-200/30 dark:border-blue-800/20 p-4 rounded-2xl text-left w-full space-y-2 text-xs leading-normal">
            <p className="text-zinc-700 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-blue-650 dark:text-blue-400" />
              Instruções sobre o Prazo e Próximos Passos:
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-zinc-650 dark:text-zinc-400">
              <li>
                O prazo médio de resposta para a triagem administrativa de documentos é de **48 horas
                úteis**.
              </li>
              <li>Você receberá alertas automáticos sobre qualquer mudança no status de agendamento.</li>
              <li>
                Utilize o número do protocolo acima a qualquer momento na opção "Consultar Protocolo" para
                acompanhar o status e acessar as instruções de preparo do seu exame.
              </li>
            </ul>
          </div>
        </CardContent>
        <div className="bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/80 px-6 md:px-8 py-5 flex justify-center items-center gap-4 w-full box-border">
          <Button
            onClick={() => onNavigate('dashboard')}
            className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold h-11 text-white rounded-xl"
          >
            Voltar ao Início
          </Button>
        </div>
      </Card>
    </div>
  );
}
