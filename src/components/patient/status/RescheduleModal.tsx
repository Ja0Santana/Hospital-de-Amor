import { createPortal } from 'react-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { X, Info, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: Date, time: string, reason: string) => Promise<void>;
  nextBusinessDays: Date[];
}

export default function RescheduleModal({
  isOpen,
  onClose,
  onSubmit,
  nextBusinessDays
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(nextBusinessDays[0] || null);
  const [selectedTime, setSelectedTime] = useState<string | null>('08:30');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    if (!rescheduleReason.trim()) {
      setRescheduleError('Por favor, informe o motivo da solicitação de reagendamento.');
      return;
    }
    setRescheduleError('');
    setLoading(true);
    try {
      await onSubmit(selectedDate, selectedTime, rescheduleReason.trim());
      onClose();
    } catch (error: any) {
      setRescheduleError(error.message || 'Erro ao solicitar reagendamento.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <Card onClick={(e) => e.stopPropagation()} className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="border-b border-zinc-100 dark:border-zinc-800 p-5 flex flex-row items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-550">Reagendar Atendimento</h3>
            <p className="text-xs text-zinc-400">Selecione uma nova data e horário abaixo.</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4 text-left">
          <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-200/30 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-2xl text-[11px] font-semibold flex items-start gap-1.5 animate-in fade-in leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Atenção: A alteração de data/horário está sujeita à aprovação da triagem clínica do hospital.</span>
          </div>
          
          {rescheduleError && (
            <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-205 dark:border-red-805/30 text-red-850 dark:text-red-400 rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{rescheduleError}</span>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[0.625rem] uppercase font-bold text-zinc-400 block tracking-wider">Selecione o Dia</span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {nextBusinessDays.map((date, idx) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border text-center transition-all ${
                      isSelected
                        ? 'bg-primary border-primary text-white scale-[1.03] shadow-md shadow-primary/10'
                        : 'bg-zinc-50 border-zinc-150 text-zinc-700 hover:border-primary/30 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400'
                    }`}
                  >
                    <span className="text-[0.5rem] font-bold uppercase tracking-wider block opacity-75">
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                    </span>
                    <span className="text-sm font-extrabold block mt-0.5">
                      {date.getDate()}
                    </span>
                    <span className="text-[0.5rem] font-bold block mt-0.5">
                      {date.toLocaleDateString('pt-BR', { month: 'short' }).slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[0.625rem] uppercase font-bold text-zinc-450 block tracking-wider">Selecione o Horário</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['08:30', '10:00', '13:30', '15:00'].map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-primary border-primary text-white scale-[1.02] shadow-sm'
                        : 'bg-zinc-50 border-zinc-150 text-zinc-650 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="rescheduleReason" className="text-[0.625rem] uppercase font-bold text-zinc-450 block tracking-wider">Motivo da Solicitação *</label>
            <textarea
              id="rescheduleReason"
              rows={2}
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="Explique brevemente por que precisa alterar a data/horário..."
              className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100"
              required
            />
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-10 text-xs font-semibold rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !selectedDate || !selectedTime}
              className="flex-1 h-10 text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md"
            >
              {loading ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
}
