import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { HelpCircle, BookOpen } from 'lucide-react';
import { getUserByCpf, updatePatientUser, getAppointmentByCpf } from '../../services/db';

import FaqAccordion from '../../components/patient/help/FaqAccordion';
import RoboFaqEmbeddedChat from '../../components/patient/help/RoboFaqEmbeddedChat';
import BookletsList, { type Booklet, BOOKLETS } from '../../components/patient/help/BookletsList';
import EducationalVideoPlayer from '../../components/patient/help/EducationalVideoPlayer';

interface HelpCenterProps {
  patientCpf: string;
}

export default function HelpCenter({ patientCpf }: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'booklets'>('faq');
  const [isRobofaqHidden, setIsRobofaqHidden] = useState(() => sessionStorage.getItem('robofaq-widget-hidden') === 'true');
  const [readBooklets, setReadBooklets] = useState<string[]>([]);
  const [recommendedBooklet, setRecommendedBooklet] = useState<Booklet | null>(null);

  useEffect(() => {
    const handleVisibility = () => {
      setIsRobofaqHidden(sessionStorage.getItem('robofaq-widget-hidden') === 'true');
    };
    window.addEventListener('robofaq-visibility-change', handleVisibility);
    return () => window.removeEventListener('robofaq-visibility-change', handleVisibility);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!patientCpf) return;
      try {
        const cleanCpf = patientCpf.replace(/\D/g, "");
        const patient = await getUserByCpf(cleanCpf);
        if (patient) {
          setReadBooklets(patient.readBooklets || []);
        }
        const apps = await getAppointmentByCpf(cleanCpf);

        const upcoming = apps.find(a => ['Pendente', 'Confirmado', 'Em análise'].includes(a.status));
        if (upcoming) {
          const exam = upcoming.examName.toLowerCase();
          if (exam.includes('mamografia')) {
            setRecommendedBooklet(BOOKLETS.find(b => b.id === 'b1') || null);
          } else if (exam.includes('tomografia') || exam.includes('ressonância') || exam.includes('ressonancia')) {
            setRecommendedBooklet(BOOKLETS.find(b => b.id === 'b4') || null);
          } else {
            setRecommendedBooklet(BOOKLETS.find(b => b.id === 'b4') || null);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [patientCpf]);

  const handleMarkAsRead = async (bookletId: string) => {
    if (!patientCpf || readBooklets.includes(bookletId)) return;
    const updated = [...readBooklets, bookletId];
    setReadBooklets(updated);
    try {
      const cleanCpf = patientCpf.replace(/\D/g, "");
      await updatePatientUser(cleanCpf, { readBooklets: updated });
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans text-left">
            Central de Ajuda e Orientações
          </h1>
          <p className="text-zinc-500 mt-1 text-left">
            Tire suas dúvidas operacionais e baixe guias de preparo oficiais elaborados pelo corpo médico.
          </p>
        </div>
        {isRobofaqHidden && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem('robofaq-widget-hidden');
              window.dispatchEvent(new Event('robofaq-visibility-change'));
            }}
            className="text-[10px] h-8 px-3 rounded-xl border-zinc-200 text-zinc-650 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-900 font-bold shrink-0 mt-1 self-start sm:self-center"
          >
            Reexibir Balão Assistente
          </Button>
        )}
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab('faq')}
          className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'faq'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Perguntas Frequentes & Robo-FAQ
        </button>
        <button
          onClick={() => setActiveTab('booklets')}
          className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'booklets'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Biblioteca de Orientações (PDFs)
        </button>
      </div>

      {activeTab === 'faq' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3">
            <FaqAccordion />
          </div>

          <div className="lg:col-span-2">
            <RoboFaqEmbeddedChat />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <BookletsList
            readBooklets={readBooklets}
            onMarkAsRead={handleMarkAsRead}
            recommendedBooklet={recommendedBooklet}
          />

          <EducationalVideoPlayer />
        </div>
      )}
    </div>
  );
}
