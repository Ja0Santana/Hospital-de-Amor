import { Compass, AlertCircle } from 'lucide-react';

interface GeolocSuggestionProps {
  geoStatus: 'idle' | 'prompting' | 'granted' | 'denied' | 'error';
}

export default function GeolocSuggestion({ geoStatus }: GeolocSuggestionProps) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-full text-primary shrink-0 shadow-sm">
          <Compass className={`w-6 h-6 ${geoStatus === 'prompting' ? 'animate-spin' : ''}`} />
        </div>
        <div>
          <h4 className="font-bold text-xs text-zinc-850 dark:text-zinc-200">Sugestão de Geolocalização</h4>
          <p className="text-[11px] text-zinc-500 leading-normal max-w-md mt-0.5">
            {geoStatus === 'granted' &&
              'Localização ativada! As unidades estão ordenadas pela distância real até a sua posição atual.'}
            {geoStatus === 'prompting' && 'Solicitando autorização de geolocalização no seu dispositivo...'}
            {geoStatus === 'denied' &&
              'Acesso à localização foi recusado. Ative as permissões no navegador para identificar a unidade mais próxima de você.'}
            {geoStatus === 'error' &&
              'Não foi possível detectar sua localização atual. A lista está exibindo a ordenação padrão por Estado.'}
            {geoStatus === 'idle' && 'Verificando serviços de geolocalização...'}
          </p>
        </div>
      </div>
      {geoStatus === 'denied' && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-250/50 dark:border-yellow-900/30 rounded-xl text-[10px] font-bold">
          <AlertCircle className="w-3.5 h-3.5" />
          Permissão de Localização Desativada
        </div>
      )}
    </div>
  );
}
