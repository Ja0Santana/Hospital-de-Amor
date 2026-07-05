import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Heart, Activity, RefreshCw, MapPin } from 'lucide-react';
import type { Unit } from '../../../types';

interface UnitCardProps {
  unit: Unit & { distance?: number };
  isClosest: boolean;
}

export default function UnitCard({ unit, isClosest }: UnitCardProps) {
  const getBadgeStyle = (type: 'Prevenção' | 'Tratamento' | 'Reabilitação') => {
    const styles = {
      Prevenção: 'bg-pink-100 text-pink-850 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400',
      Tratamento: 'bg-blue-100 text-blue-850 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
      Reabilitação: 'bg-emerald-100 text-emerald-850 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400',
    };
    return styles[type];
  };

  const getTypeIcon = (type: 'Prevenção' | 'Tratamento' | 'Reabilitação') => {
    if (type === 'Prevenção') return <Heart className="w-3 h-3 mr-1 shrink-0" />;
    if (type === 'Tratamento') return <Activity className="w-3 h-3 mr-1 shrink-0" />;
    return <RefreshCw className="w-3 h-3 mr-1 shrink-0 animate-spin-slow" />;
  };

  return (
    <Card
      className={`border-zinc-200/80 dark:border-zinc-850 hover:border-zinc-350 dark:hover:border-zinc-750 transition-all rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 flex flex-col justify-between shadow-xs ${
        isClosest ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-950' : ''
      }`}
    >
      <div>
        <CardHeader className="p-5 pb-3">
          <div className="flex justify-between items-start gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {unit.state} • {unit.city}
            </span>
            {isClosest && (
              <Badge className="bg-primary text-white font-bold text-[8px] px-1.5 py-0.5 tracking-wider uppercase animate-pulse">
                Mais Próxima
              </Badge>
            )}
          </div>
          <CardTitle className="text-base font-extrabold text-zinc-800 dark:text-zinc-100 mt-1 leading-snug">
            {unit.name}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {unit.types.map((type) => (
              <Badge
                key={type}
                className={`${getBadgeStyle(type)} text-[8px] font-bold px-1.5 py-0.5 border flex items-center`}
              >
                {getTypeIcon(type)}
                {type}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-2.5">
            {unit.specialties.map((spec) => (
              <span
                key={spec}
                className="px-2 py-0.5 bg-zinc-150/40 text-zinc-650 dark:bg-zinc-900 dark:text-zinc-400 rounded-lg text-[8px] font-black border border-zinc-200/20"
              >
                {spec}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 pb-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-3">
          <p className="flex items-start gap-1.5">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{unit.address}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <div>
              <span className="text-zinc-400 font-bold block">TELEFONE</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{unit.phone}</span>
            </div>
            <div>
              <span className="text-zinc-400 font-bold block">HORÁRIO</span>
              <span className="font-semibold text-zinc-850 dark:text-zinc-200 leading-tight block">{unit.hours}</span>
            </div>
          </div>
        </CardContent>
      </div>

      <div className="p-5 pt-0 border-t border-zinc-100/50 dark:border-zinc-900/50 flex flex-col gap-2 bg-zinc-50/50 dark:bg-zinc-900/5">
        {unit.distance !== undefined && (
          <div className="text-center py-2 bg-primary/5 text-primary rounded-xl text-xs font-bold mt-3">
            A cerca de {Math.round(unit.distance)} km de você
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${unit.lat},${unit.lng}`, '_blank')}
            className="flex-1 h-9 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Google Maps
          </Button>
          <Button
            type="button"
            onClick={() => window.open(`https://waze.com/ul?ll=${unit.lat},${unit.lng}&navigate=yes`, '_blank')}
            className="flex-1 h-9 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900"
          >
            Waze
          </Button>
        </div>
      </div>
    </Card>
  );
}
