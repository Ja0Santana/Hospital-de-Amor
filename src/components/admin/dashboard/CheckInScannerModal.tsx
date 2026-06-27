import React, { useState } from 'react';
import { X, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import { updateAppointment, addAuditLogAdmin } from '../../../services/db';
import type { Appointment, PatientUser } from '../../../types';

interface CheckInScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  loggedEmployee: PatientUser;
}

export default function CheckInScannerModal({
  isOpen,
  onClose,
  appointments,
  setAppointments,
  loggedEmployee,
}: CheckInScannerModalProps) {
  const [scannedCode, setScannedCode] = useState('');
  const [scannedApp, setScannedApp] = useState<Appointment | null>(null);
  const [scannerError, setScannerError] = useState('');
  const [scannerSuccess, setScannerSuccess] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setScannedCode('');
    setScannedApp(null);
    setScannerError('');
    setScannerSuccess('');
    onClose();
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScannerError('');
    setScannerSuccess('');
    if (!scannedCode.trim()) {
      return;
    }

    let protocol = '';
    let id = '';
    if (scannedCode.startsWith('HA-QR|')) {
      const parts = scannedCode.split('|');
      protocol = parts[1];
      id = parts[2];
    } else {
      protocol = scannedCode.trim();
    }

    const app = appointments.find(
      (a) => a.protocol === protocol || a.id === id || a.protocol === scannedCode.trim()
    );

    if (!app) {
      setScannerError('Código inválido: Nenhum agendamento encontrado para este QR Code.');
      setScannedApp(null);
      return;
    }

    if (app.status === 'Cancelado' || app.status === 'Arquivado por Documentação Pendente') {
      setScannerError(`Código inválido: Esta solicitação está com status de ${app.status}.`);
      setScannedApp(null);
      return;
    }

    if (app.rescheduledDate) {
      const appDateTime = new Date(`${app.rescheduledDate}T${app.rescheduledTime || '08:00'}:00`);
      const now = new Date();
      const diffMs = now.getTime() - appDateTime.getTime();
      if (diffMs > 1 * 60 * 60 * 1000) {
        setScannerError(
          `Código inválido: O horário do agendamento expirou há mais de 1 hora. (Agendado para: ${new Date(
            app.rescheduledDate + 'T12:00:00'
          ).toLocaleDateString('pt-BR')} às ${app.rescheduledTime}h).`
        );
        setScannedApp(null);
        return;
      }
    }

    setScannedApp(app);
  };

  const handleConfirmPresence = async () => {
    if (!scannedApp) {
      return;
    }
    try {
      const updatedApp = {
        ...scannedApp,
        presenceConfirmed: true,
        presenceConfirmedAt: new Date().toISOString(),
      };
      await updateAppointment(updatedApp);
      await addAuditLogAdmin(
        `Confirmação de presença via QR Code (Recepção) - Protocolo ${scannedApp.protocol}`,
        'Recepção',
        `Presença de ${scannedApp.patientName} registrada na recepção física.`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );

      const allApps = appointments.map((a) => (a.id === scannedApp.id ? updatedApp : a));
      setAppointments(allApps);

      setScannerSuccess('Presença confirmada com sucesso!');
      setScannedApp(updatedApp);
    } catch (e: any) {
      setScannerError(e.message || 'Erro ao salvar confirmação de presença.');
    }
  };

  const confirmedAppointments = appointments.filter((a) => a.status === 'Confirmado');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 rounded-full transition-transform hover:rotate-90 duration-200 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-pink-500" />
          <span>Recepção - Validação de QR Code</span>
        </h3>

        <form onSubmit={handleScanSubmit} className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="qr-code-input"
              className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider"
            >
              Ler QR Code (Simulado)
            </label>
            <div className="flex gap-2">
              <input
                id="qr-code-input"
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Digite a string do QR Code ou cole..."
                className="flex-1 p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 font-mono"
              />
              <button
                type="submit"
                className="px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold text-xs rounded-xl transition-all"
              >
                Escanear
              </button>
            </div>
          </div>
        </form>

        {scannerError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-850 dark:text-red-400 rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{scannerError}</span>
          </div>
        )}

        {scannerSuccess && (
          <div className="p-3.5 bg-green-50 dark:bg-green-955/20 border border-green-200/30 dark:border-green-800/30 text-green-850 dark:text-green-400 rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{scannerSuccess}</span>
          </div>
        )}

        {scannedApp && (
          <div className="bg-zinc-50 dark:bg-zinc-955 p-4 rounded-2xl border border-zinc-250/50 dark:border-zinc-850 space-y-3 text-xs animate-in slide-in-from-top-2">
            <div className="flex justify-between items-start border-b border-zinc-200/50 dark:border-zinc-800 pb-2">
              <div>
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Paciente</span>
                <h4 className="font-extrabold text-zinc-900 dark:text-zinc-50">
                  {scannedApp.patientName}
                </h4>
              </div>
              <span className="font-mono bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-655 dark:text-zinc-400">
                {scannedApp.protocol}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                  Procedimento
                </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {scannedApp.examName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                  Horário
                </span>
                <span className="font-bold text-zinc-850 dark:text-zinc-150">
                  {scannedApp.rescheduledDate
                    ? new Date(scannedApp.rescheduledDate + 'T12:00:00').toLocaleDateString(
                        'pt-BR'
                      )
                    : ''}{' '}
                  às {scannedApp.rescheduledTime}h
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-2 pt-1">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">
                  Presença no Sistema:
                </span>
                {scannedApp.presenceConfirmed ? (
                  <span className="text-green-600 font-extrabold bg-green-50 dark:bg-green-955/35 px-2 py-0.5 rounded border border-green-200/30">
                    Confirmada
                  </span>
                ) : (
                  <span className="text-zinc-500 font-bold bg-zinc-150 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    Pendente
                  </span>
                )}
              </div>
            </div>

            {!scannedApp.presenceConfirmed && (
              <button
                onClick={handleConfirmPresence}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-green-600/10 active:scale-95"
              >
                Confirmar Presença na Recepção (1 Clique)
              </button>
            )}
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
            Consultas Disponíveis para Check-in (Mocks)
          </span>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
            {confirmedAppointments.length === 0 ? (
              <p className="text-zinc-400 italic">
                Nenhuma consulta confirmada disponível no momento.
              </p>
            ) : (
              confirmedAppointments.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    setScannedCode(`HA-QR|${app.protocol}|${app.id}`);
                    setScannerError('');
                    setScannerSuccess('');
                    setScannedApp(app);
                  }}
                  className="w-full p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-955 dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl text-left flex justify-between items-center transition-all"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate">
                      {app.patientName}
                    </span>
                    <span className="text-zinc-500 font-mono text-[9px]">
                      {app.protocol} | {app.examName}
                    </span>
                  </div>
                  <span className="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-black shrink-0">
                    Simular QR
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
