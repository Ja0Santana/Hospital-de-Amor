import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Info, Clock, FileText } from 'lucide-react';

export default function InstructionCards() {
  return (
    <Card className="shadow-sm border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-zinc-50/20 dark:bg-zinc-900/10">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold">Instruções</h2>
        </CardTitle>
        <CardDescription>Informações importantes sobre seu preparo e comparecimento.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-xs flex gap-3">
          <div
            className="p-2 bg-yellow-50 dark:bg-yellow-955/20 text-yellow-600 dark:text-yellow-400 rounded-xl h-fit"
            aria-hidden="true"
          >
            <Clock className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Preparo para Exame</h4>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Lembre-se de manter jejum de 8 horas para o seu exame de sangue agendado para amanhã.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-xs flex gap-3">
          <div
            className="p-2 bg-primary/10 text-primary rounded-xl h-fit"
            aria-hidden="true"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Documentos Necessários</h4>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Traga seu documento de identidade e o cartão do SUS para a próxima consulta.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
