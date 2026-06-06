import React, { useState, useEffect } from 'react';
import { Heart, Phone, Printer, RotateCw, X, ShieldAlert, HeartHandshake } from 'lucide-react';
import { getUserByCpf } from '../services/db';
import type { PatientUser } from '../types';
import { formatCpf, formatPhone } from '../lib/sanitizer';

interface DigitalCardProps {
  patientCpf: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DigitalCard({ patientCpf, isOpen, onClose }: DigitalCardProps) {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!patientCpf) return;
      try {
        const cleanCpf = patientCpf.replace(/\D/g, '');
        const data = await getUserByCpf(cleanCpf);
        if (data) {
          setUser(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen) {
      fetchUser();
      setIsFlipped(false);
      setIsCalling(false);
    }
  }, [patientCpf, isOpen]);

  if (!isOpen) return null;

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.emergencyContactPhone) return;
    setIsCalling(true);
    setTimeout(() => {
      window.location.href = `tel:${user.emergencyContactPhone?.replace(/\D/g, '')}`;
      setIsCalling(false);
    }, 1500);
  };

  const getPatientId = () => {
    if (!user) return 'HA-000000';
    const digits = user.cpf.replace(/\D/g, '');
    return `HA-${digits.slice(0, 6)}-${user.name.charAt(0).toUpperCase()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 pr-8">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 font-sans flex items-center justify-center gap-1.5">
            <HeartHandshake className="w-5 h-5 text-primary" />
            Carteira Digital do Paciente
          </h2>
          <p className="text-xs text-zinc-500">
            Clique no cartão para girar e ver os dados de emergência (F.I.C.E.).
          </p>
        </div>        <div className="flex justify-center py-4">
          <div 
            id="printable-digital-card"
            className="w-full max-w-[430px] h-[270px] perspective-1000 cursor-pointer group select-none"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`relative w-full h-full preserve-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-950 to-secondary/80 p-4 text-white flex flex-col justify-between shadow-xl border border-white/10">
                <div className="flex justify-between items-start">
                  <div className="font-comfortaa font-bold text-xs tracking-wider flex items-center uppercase">
                    <span>Hospital de Am</span>
                    <Heart className="w-3.5 h-3.5 fill-brand-pink text-brand-pink inline mx-0.5" />
                    <span>r</span>
                  </div>
                  <div className="w-9 h-7 bg-amber-400/90 rounded border border-amber-500/20 relative overflow-hidden shrink-0 shadow-inner">
                    <div className="absolute inset-y-0 left-3 border-r border-amber-600/30" />
                    <div className="absolute inset-y-0 left-6 border-r border-amber-600/30" />
                    <div className="absolute inset-x-0 top-3 border-b border-amber-600/30" />
                  </div>
                </div>

                <div className="flex justify-between items-end gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-blue-200/80 uppercase tracking-widest block">Nome do Paciente</span>
                      <p className="text-base font-black truncate leading-none">{user?.name || 'Carregando...'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-blue-200/80 uppercase tracking-widest block">CPF</span>
                        <p className="text-xs font-bold tracking-wider whitespace-nowrap">{user ? formatCpf(user.cpf) : '***.***.***-**'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold text-blue-200/80 uppercase tracking-widest block">ID Carteira</span>
                        <p className="text-xs font-bold tracking-wider whitespace-nowrap">{getPatientId()}</p>
                      </div>
                    </div>
                  </div>

                  <svg className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 shadow-md" viewBox="0 0 100 100" aria-label="QR Code da Carteira">
                    <rect x="5" y="5" width="25" height="25" fill="#000" />
                    <rect x="10" y="10" width="15" height="15" fill="#fff" />
                    <rect x="13" y="13" width="9" height="9" fill="#000" />
                    
                    <rect x="70" y="5" width="25" height="25" fill="#000" />
                    <rect x="75" y="10" width="15" height="15" fill="#fff" />
                    <rect x="78" y="13" width="9" height="9" fill="#000" />
                    
                    <rect x="5" y="70" width="25" height="25" fill="#000" />
                    <rect x="10" y="75" width="15" height="15" fill="#fff" />
                    <rect x="13" y="78" width="9" height="9" fill="#000" />
                    
                    <path d="M 35,5 H 45 V 15 H 35 Z M 50,5 H 60 V 10 H 50 Z M 50,15 H 55 V 25 H 50 Z M 60,10 H 65 V 20 H 60 Z M 35,20 H 40 V 30 H 35 Z M 45,25 H 55 V 30 H 45 Z M 70,35 H 80 V 45 H 70 Z M 85,35 H 95 V 40 H 85 Z M 85,45 H 90 V 55 H 85 Z M 90,50 H 95 V 60 H 90 Z M 5,35 H 15 V 40 H 5 Z M 20,35 H 25 V 45 H 20 Z M 10,45 H 15 V 50 H 10 Z M 15,50 H 30 V 55 H 15 Z M 5,55 H 10 V 65 H 5 Z M 20,60 H 25 V 65 H 20 Z M 35,70 H 45 V 75 H 35 Z M 50,70 H 55 V 85 H 50 Z M 60,75 H 65 V 85 H 60 Z M 35,80 H 40 V 90 H 35 Z M 45,85 H 55 V 90 H 45 Z M 70,70 H 75 V 80 H 70 Z M 80,75 H 90 V 80 H 80 Z M 75,85 H 85 V 90 H 75 Z M 90,85 H 95 V 95 H 90 Z M 85,90 H 90 V 95 H 85 Z" fill="#000" />
                  </svg>
                </div>
              </div>

              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-zinc-950 text-white p-4 flex flex-col justify-between shadow-xl border border-zinc-800 digital-card-back">
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-900">
                  <span className="text-[10px] font-black tracking-widest text-red-500 uppercase flex items-center gap-1">
                    <ShieldAlert className="w-4.5 h-4.5" />
                    Ficha de Emergência
                  </span>
                  {user?.bloodType && (
                    <span className="bg-red-650 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-red-500/30">
                      SANGUE: {user.bloodType}
                    </span>
                  )}
                </div>

                <div className="flex-1 py-1.5 flex flex-col justify-between text-left min-w-0">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Alergias</span>
                      <p className="text-xs font-bold text-zinc-150 truncate leading-none">
                        {user?.allergies || 'Nenhuma alergia relatada'}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Diagnóstico</span>
                      <p className="text-xs font-bold text-zinc-150 truncate leading-none">
                        {user?.clinicalDiagnosis || 'Sem diagnóstico'}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 border-t border-zinc-900 pt-1.5">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Contato de Emergência</span>
                    <p className="text-xs font-bold text-zinc-100 truncate leading-none">
                      {user?.emergencyContactName ? `${user.emergencyContactName} (${user.emergencyContactRelation})` : 'Não informado'}
                    </p>
                    {user?.emergencyContactPhone && (
                      <p className="text-[10px] text-zinc-400 tracking-wider mt-0.5">
                        Tel: {formatPhone(user.emergencyContactPhone)}
                      </p>
                    )}
                  </div>
                </div>

                {user?.emergencyContactPhone && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleCall}
                      className="flex-1 h-8 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-transform"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {isCalling ? 'Ligando...' : 'Ligar para Contato'}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="h-8 w-10 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg flex items-center justify-center transition-colors"
                      title="Imprimir Carteira"
                      aria-label="Imprimir Carteira"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 h-11 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Girar Carteira
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-md"
          >
            Fechar Carteira
          </button>
        </div>
      </div>
    </div>
  );
}
