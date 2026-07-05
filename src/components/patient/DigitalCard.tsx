import React, { useState, useEffect, useRef } from 'react';
import { Heart, Phone, Printer, RotateCw, X, ShieldAlert, HeartHandshake, Eye, EyeOff } from 'lucide-react';
import { getUserByCpf } from '../../services/db';
import type { PatientUser } from '../../types';
import { formatCpf, formatPhone } from '../../lib/sanitizer';
import logoHospitalDeAmor from '../../assets/logoHospitalDeAmor.png';

interface DigitalCardProps {
  patientCpf: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DigitalCard({ patientCpf, isOpen, onClose }: DigitalCardProps) {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [angle, setAngle] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const hasDraggedRef = useRef(false);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    setCurrentDeltaX(0);
    hasDraggedRef.current = false;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    setCurrentDeltaX(deltaX);
    if (Math.abs(deltaX) > 10) {
      hasDraggedRef.current = true;
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(currentDeltaX) > 80) {
      setIsFlipped((prev) => !prev);
      setAngle((prev) => (currentDeltaX < 0 ? prev - 180 : prev + 180));
    }
    setCurrentDeltaX(0);
    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 50);
    }
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleDragMove(e.clientX);
      };
      const handleGlobalMouseUp = () => {
        handleDragEnd();
      };
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startX]);

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
      setAngle(0);
      setIsCalling(false);
      setShowSensitiveData(false);
    }
  }, [patientCpf, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  const dragRatio = currentDeltaX / 400;
  const angleOffset = dragRatio * 180;
  const currentAngle = angle + angleOffset;

  const cardStyle: React.CSSProperties = {
    transform: `rotateY(${isDragging ? currentAngle : angle}deg)`,
    transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)',
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
      <div onClick={(e) => e.stopPropagation()} className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl pt-5 pb-6 px-6 max-w-lg w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 font-sans leading-tight">
            Carteira Digital do Paciente
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Clique no cartão para girar e ver os dados de emergência (F.I.C.E.).
          </p>
        </div>        <div className="flex justify-center py-4">
          <div 
            id="printable-digital-card"
            className="w-full max-w-[430px] aspect-[1.58/1] h-auto perspective-1000 cursor-grab active:cursor-grabbing group select-none"
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              handleDragStart(e.clientX);
            }}
            onTouchStart={(e) => {
              handleDragStart(e.touches[0].clientX);
            }}
            onTouchMove={(e) => {
              handleDragMove(e.touches[0].clientX);
            }}
            onTouchEnd={handleDragEnd}
            onClick={() => {
              if (hasDraggedRef.current) return;
              setIsFlipped(!isFlipped);
              setAngle((prev) => prev + 180);
            }}
          >
            <div 
              style={cardStyle}
              className="relative w-full h-full preserve-3d"
            >
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  style={{ transform: `translateZ(${-0.8 + index * 0.2}px)` }}
                  className="absolute inset-0 w-full h-full rounded-2xl bg-zinc-300 dark:bg-zinc-800 border border-zinc-400/5 dark:border-zinc-700/5"
                />
              ))}
              
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-gradient-to-br from-primary via-indigo-950 to-secondary/80 p-3 sm:p-4 text-white flex flex-col justify-between shadow-xl border border-white/10 [transform:translateZ(1px)]">
                <div className="flex justify-between items-start">
                  <div className="font-comfortaa font-bold text-[10px] sm:text-xs tracking-wider flex items-center uppercase">
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

                <div className="flex-1 flex items-center justify-start pl-1 py-1">
                  <img src={logoHospitalDeAmor} alt="Logo" className="w-10 h-10 sm:w-14 sm:h-14 object-contain" />
                </div>

                <div className="flex justify-between items-end gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="space-y-0.5">
                      <span className="text-[8px] sm:text-[9px] font-bold text-blue-200/80 uppercase tracking-widest block">Nome do Paciente</span>
                      <p className="text-sm sm:text-base font-black truncate leading-none">{user?.name || 'Carregando...'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-0.5">
                        <span className="text-[7px] sm:text-[8px] font-bold text-blue-200/80 uppercase tracking-widest block">CPF</span>
                        <p className="text-[10px] sm:text-xs font-bold tracking-wider whitespace-nowrap">{user ? formatCpf(user.cpf) : '***.***.***-**'}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7px] sm:text-[8px] font-bold text-blue-200/80 uppercase tracking-widest block">ID Carteira</span>
                        <p className="text-[10px] sm:text-xs font-bold tracking-wider whitespace-nowrap">{getPatientId()}</p>
                      </div>
                    </div>
                  </div>

                  <svg className="w-12 h-12 sm:w-16 sm:h-16 bg-white p-1 rounded-lg shrink-0 shadow-md" viewBox="0 0 100 100" aria-label="QR Code da Carteira">
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

              <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-zinc-950 text-white p-3 sm:p-4 flex flex-col justify-between shadow-xl border border-zinc-850 digital-card-back [transform:translateZ(-1px)_rotateY(180deg)]">
                <div className="flex justify-between items-center pb-1 sm:pb-1.5 border-b border-zinc-900">
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-red-500 uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    Ficha de Emergência
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSensitiveData(!showSensitiveData);
                      }}
                      className="p-1 hover:bg-zinc-800 active:scale-95 rounded text-zinc-400 hover:text-white transition-all"
                      title={showSensitiveData ? 'Ocultar informações sensíveis' : 'Mostrar informações sensíveis'}
                    >
                      {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {user?.bloodType && (
                      <span className="bg-red-650 text-white font-extrabold text-[8px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full border border-red-500/30">
                        SANGUE: {showSensitiveData ? user.bloodType : '••'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 py-1 sm:py-1.5 flex flex-col justify-between text-left min-w-0">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0">
                      <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Alergias</span>
                      <p className="text-[10px] sm:text-xs font-bold text-zinc-150 truncate leading-none">
                        {showSensitiveData ? (user?.allergies || 'Nenhuma alergia relatada') : '••••••••••••'}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Diagnóstico</span>
                      <p className="text-[10px] sm:text-xs font-bold text-zinc-150 truncate leading-none">
                        {showSensitiveData ? (user?.clinicalDiagnosis || 'Sem diagnóstico') : '••••••••••••'}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 border-t border-zinc-900 pt-1 sm:pt-1.5">
                    <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Contato de Emergência</span>
                    <p className="text-[10px] sm:text-xs font-bold text-zinc-100 truncate leading-none">
                      {user?.emergencyContactName ? `${user.emergencyContactName} (${user.emergencyContactRelation})` : 'Não informado'}
                    </p>
                    {user?.emergencyContactPhone && (
                      <p className="text-[9px] sm:text-[10px] text-zinc-400 tracking-wider mt-0.5">
                        Tel: {formatPhone(user.emergencyContactPhone)}
                      </p>
                    )}
                  </div>
                </div>

                {user?.emergencyContactPhone && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleCall}
                      className="flex-1 h-8 sm:h-11 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-extrabold text-[11px] sm:text-sm rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-transform"
                    >
                      <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                      {isCalling ? 'Ligando...' : 'Ligar para Contato'}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="h-8 sm:h-11 w-10 sm:w-14 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl flex items-center justify-center transition-colors"
                      title="Imprimir Carteira"
                      aria-label="Imprimir Carteira"
                    >
                      <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => {
              setIsFlipped(!isFlipped);
              setAngle((prev) => prev + 180);
            }}
            className="flex-1 h-14 border-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl text-base font-black text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <RotateCw className="w-5 h-5" />
            Girar Carteira
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-14 bg-primary hover:bg-primary/95 text-white rounded-xl text-base font-black shadow-md transition-transform active:scale-[0.98]"
          >
            Fechar Carteira
          </button>
        </div>
      </div>
    </div>
  );
}
