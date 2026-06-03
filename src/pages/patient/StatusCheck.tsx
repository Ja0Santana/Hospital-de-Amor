import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { getAppointmentByProtocol, getSpecialties } from '../../services/db';
import type { Appointment, Specialty } from '../../types';
import { formatCpf } from '../../lib/sanitizer';
import { Search, Calendar, MapPin, User, Clock, AlertCircle, CheckCircle2, XCircle, Info, Star, MessageSquare, X } from 'lucide-react';

interface StatusCheckProps {
  initialProtocol?: string;
  onNavigate: (page: string) => void;
}

export default function StatusCheck({ initialProtocol = '', onNavigate }: StatusCheckProps) {
  const [protocolQuery, setProtocolQuery] = useState(initialProtocol);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsComment, setNpsComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [presenceSuccess, setPresenceSuccess] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  useEffect(() => {
    getSpecialties().then(setSpecialties).catch(console.error);
    if (initialProtocol) {
      handleSearch(null, initialProtocol);
    }
  }, [initialProtocol]);

  const handleSearch = async (e: React.FormEvent | null, directProtocol?: string) => {
    if (e) e.preventDefault();
    const query = directProtocol || protocolQuery;
    if (!query.trim()) return;

    setLoading(true);
    setFeedbackSuccess(false);
    setNpsScore(null);
    setNpsComment('');
    
    try {
      const result = await getAppointmentByProtocol(query);
      setAppointment(result);
      setSearched(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;
    if (npsScore === null) {
      setFeedbackError('Por favor, selecione uma nota de 0 a 10.');
      return;
    }
    if (!npsComment.trim()) {
      setFeedbackError('Por favor, escreva um comentário sobre o seu atendimento.');
      return;
    }

    try {
      appointment.feedbackNps = npsScore;
      appointment.feedbackComment = npsComment;

      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('HospitalAmorDB', 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const tx = db.transaction('appointments', 'readwrite');
      const store = tx.objectStore('appointments');
      await new Promise<void>((resolve, reject) => {
        const req = store.put(appointment);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      setFeedbackSuccess(true);
      setFeedbackError('');
    } catch (error) {
      console.error(error);
      setFeedbackError('Ocorreu um erro ao enviar o feedback. Tente novamente.');
    }
  };

  const handleConfirmPresence = async () => {
    if (!appointment) return;
    try {
      const updatedApp: Appointment = {
        ...appointment,
        presenceConfirmed: true
      };

      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('HospitalAmorDB', 4);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const tx = db.transaction('appointments', 'readwrite');
      const store = tx.objectStore('appointments');
      await new Promise<void>((resolve, reject) => {
        const req = store.put(updatedApp);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      setAppointment(updatedApp);
      setPresenceSuccess(true);
      setTimeout(() => setPresenceSuccess(false), 5000);
      window.dispatchEvent(new CustomEvent('appointment-updated'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!appointment || !selectedDate || !selectedTime) return;
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const updatedApp: Appointment = {
        ...appointment,
        rescheduledDate: formattedDate,
        rescheduledTime: selectedTime
      };

      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('HospitalAmorDB', 4);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const tx = db.transaction('appointments', 'readwrite');
      const store = tx.objectStore('appointments');
      await new Promise<void>((resolve, reject) => {
        const req = store.put(updatedApp);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      setAppointment(updatedApp);
      setIsRescheduleOpen(false);
      setRescheduleSuccess(true);
      setTimeout(() => setRescheduleSuccess(false), 5000);
      window.dispatchEvent(new CustomEvent('appointment-updated'));
    } catch (error) {
      console.error(error);
    }
  };

  const getNext5BusinessDays = () => {
    const dates: Date[] = [];
    const current = new Date();
    let loops = 0;
    while (dates.length < 5 && loops < 15) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Pula Domingo (0) e Sábado (6)
        dates.push(new Date(current));
      }
      loops++;
    }
    return dates;
  };

  const getStatusConfig = (status: Appointment['status']) => {
    const config = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, desc: 'Sua solicitação está na fila de espera e será revisada por nossa equipe médica em até 48 horas úteis.' },
      'Em análise': { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', icon: Search, desc: 'Nossos recepcionistas estão revisando o documento e o encaminhamento enviado. Estimativa de resposta: 24 horas úteis.' },
      'Confirmado': { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2, desc: 'Parabéns! Sua triagem foi concluída e sua consulta/exame está agendado e confirmado.' },
      'Cancelado': { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, desc: 'Sua solicitação de agendamento foi cancelada pela triagem administrativa.' }
    };
    return config[status] || config['Pendente'];
  };

  const getExamInstructions = () => {
    if (!appointment) return '';
    const spec = specialties.find((s) => s.id === appointment.specialtyId);
    const exam = spec?.exams.find((e) => e.id === appointment.examId);
    return exam?.defaultPrepInstructions || '';
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4 py-6">
      <div>
        <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-primary p-0 h-auto font-semibold mb-2">
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Acompanhar Agendamento</h1>
        <p className="text-zinc-500 mt-1">Busque sua solicitação pelo código do protocolo para verificar o andamento e o preparo.</p>
      </div>

      <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
        <CardContent className="p-6">
          <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Ex: HA-2026-0001"
                value={protocolQuery}
                onChange={(e) => setProtocolQuery(e.target.value)}
                className="pl-10 h-11 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 font-mono text-zinc-800 dark:text-zinc-100"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
            </div>
            <Button type="submit" disabled={loading} className="h-11 px-6 font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors">
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && (
        <>
          {!appointment ? (
            <Card className="border border-red-200 bg-red-50/10 rounded-2xl shadow-sm">
              <CardContent className="p-6 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-400">Protocolo não encontrado</h3>
                  <p className="text-xs text-red-700 dark:text-red-400/80 mt-1">
                    Não encontramos nenhuma solicitação cadastrada com o código informado. Certifique-se de que digitou o código exatamente como gerado (ex: HA-2026-0001).
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800/80 p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Status do Agendamento</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{appointment.examName}</h2>
                        <Badge variant="outline" className={`w-fit font-mono font-bold py-0.5 px-2 text-[10px] ${getStatusConfig(appointment.status).color}`}>
                          {appointment.protocol}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                      <span className="text-xs font-semibold text-zinc-500">Status:</span>
                      <Badge className={`${getStatusConfig(appointment.status).color} px-2.5 py-0.5 border`}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/30 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex gap-3 items-start">
                    <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">Resumo da Triagem</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {getStatusConfig(appointment.status).desc}
                      </p>
                    </div>
                  </div>

                  {appointment.status === 'Confirmado' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                      <div className="md:col-span-2 space-y-5">
                        <div className="bg-green-50/20 dark:bg-green-950/10 border border-green-200/30 dark:border-green-800/20 p-5 rounded-2xl space-y-4">
                          <h3 className="font-extrabold text-sm text-green-800 dark:text-green-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Dados da Agenda Confirmada
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Data e Horário</span>
                              <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-primary" />
                                {appointment.rescheduledDate && appointment.rescheduledTime ? (
                                  <span>
                                    {new Date(appointment.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {appointment.rescheduledTime}h <span className="text-[10px] text-primary font-bold ml-1">(Reagendado)</span>
                                  </span>
                                ) : (
                                  <span>15/06/2026 às 08:30h</span>
                                )}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Profissional Responsável</span>
                              <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <User className="w-4 h-4 text-primary" />
                                Dra. Patrícia Arantes (Mastologista)
                              </p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Local do Atendimento</span>
                              <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-primary" />
                                Unidade Principal - Bloco B, Sala de Exames 03 (Mamógrafo 01)
                              </p>
                            </div>
                          </div>

                          {presenceSuccess && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                              <CheckCircle2 className="w-4 h-4" />
                              Presença confirmada com sucesso!
                            </div>
                          )}
                          {rescheduleSuccess && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                              <Info className="w-4 h-4" />
                              Atendimento reagendado com sucesso!
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2.5 pt-3 border-t border-zinc-150 dark:border-zinc-800/50">
                            {appointment.presenceConfirmed ? (
                              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40 font-bold px-3 py-1.5 text-[11px] rounded-xl flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                                Presença Confirmada
                              </div>
                            ) : (
                              <Button
                                type="button"
                                onClick={handleConfirmPresence}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Confirmar Presença
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedDate(getNext5BusinessDays()[0]);
                                setSelectedTime('08:30');
                                setIsRescheduleOpen(true);
                              }}
                              className="border-zinc-200/80 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95"
                            >
                              <Calendar className="w-4 h-4 text-primary" />
                              Reagendar Atendimento
                            </Button>
                          </div>
                        </div>

                        {getExamInstructions() && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Instruções de Preparo para o Dia</h4>
                            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 p-4 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              {getExamInstructions()}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center justify-center p-5 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/10 text-center space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Credencial de Acesso</span>
                        <div className="bg-white p-3 rounded-2xl shadow-md border border-zinc-100">
                          <svg className="w-32 h-32 text-zinc-900" viewBox="0 0 100 100">
                            <rect width="100" height="100" fill="white" />
                            <path d="M10,10 h25 v10 h-15 v15 h-10 z" fill="currentColor" />
                            <path d="M90,10 h-25 v10 h-15 v15 h-10" fill="none" stroke="currentColor" strokeWidth="6" />
                            <path d="M10,90 h25 v-10 h-15 v-15 h-10 z" fill="currentColor" />
                            <path d="M90,90 h-25 v-10 h15 v-15 h10 z" fill="currentColor" />
                            <rect x="25" y="25" width="12" height="12" fill="currentColor" />
                            <rect x="63" y="25" width="12" height="12" fill="currentColor" />
                            <rect x="25" y="63" width="12" height="12" fill="currentColor" />
                            <rect x="44" y="44" width="12" height="12" fill="currentColor" />
                            <rect x="63" y="63" width="6" height="6" fill="currentColor" />
                            <rect x="53" y="69" width="6" height="6" fill="currentColor" />
                            <rect x="69" y="53" width="6" height="6" fill="currentColor" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block">QR Code para Recepção</span>
                          <span className="text-[10px] text-zinc-400 block">Apresente na entrada da recepção para confirmar sua presença.</span>
                        </div>
                        <Button type="button" variant="outline" onClick={() => window.print()} className="w-full text-xs font-semibold border-zinc-200 dark:border-zinc-800">
                          Imprimir Credencial
                        </Button>
                      </div>
                    </div>
                  )}

                  {appointment.status === 'Cancelado' && (
                    <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-200/30 dark:border-red-800/20 p-5 rounded-2xl space-y-2">
                      <h4 className="font-extrabold text-sm text-red-800 dark:text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Motivo do Cancelamento
                      </h4>
                      <p className="text-xs text-red-900 dark:text-red-400 font-medium">
                        Documentação Ilegível: A foto do encaminhamento médico anexada está borrada e impossibilita a leitura do carimbo do profissional de saúde.
                      </p>
                      <p className="text-[11px] text-zinc-500 pt-2 border-t border-red-200/50 dark:border-red-800/20 mt-2">
                        <strong>O que fazer agora?</strong> Recomendamos que você faça uma nova solicitação de agendamento anexando uma foto nítida e legível do documento. Certifique-se de que a iluminação esteja boa no momento da captura.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Dados Gerais da Solicitação</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Paciente:</strong> {appointment.patientName}</p>
                      <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">CPF:</strong> {formatCpf(appointment.patientCpf)}</p>
                      <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Especialidade:</strong> {appointment.specialtyName}</p>
                      <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Exame Solicitado:</strong> {appointment.examName}</p>
                      <p className="sm:col-span-2">
                        <strong className="text-zinc-800 dark:text-zinc-300 font-medium">Localidade:</strong> {appointment.city} ({appointment.state})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {appointment.status === 'Confirmado' && (
                <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-md rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Sua opinião é muito importante!
                    </CardTitle>
                    <CardDescription>
                      Por favor, reserve 30 segundos para avaliar o nosso fluxo de agendamento online.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedbackSuccess ? (
                      <div className="p-4 bg-green-50 dark:bg-green-950/10 border border-green-200/30 dark:border-green-800/20 rounded-2xl flex gap-2.5 items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-800 dark:text-green-400">Obrigado! Seu feedback (NPS) foi registrado com sucesso.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                        {feedbackError && (
                          <div className="p-3 bg-red-50/10 border border-red-200 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            {feedbackError}
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <Label className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Em uma escala de 0 a 10, qual a probabilidade de você recomendar o nosso sistema de agendamento para um amigo ou familiar?
                          </Label>
                          <div className="flex flex-wrap justify-between gap-1.5 pt-1">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                              <button
                                key={score}
                                type="button"
                                onClick={() => setNpsScore(score)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${npsScore === score ? 'bg-primary border-primary text-white scale-105' : 'bg-white border-zinc-200 text-zinc-600 hover:border-primary/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'}`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-between text-[10px] text-zinc-400 px-1">
                            <span>0 - Muito Improvável</span>
                            <span>10 - Extremamente Provável</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="npsComment" className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Deixe um comentário explicando sua nota: *
                          </Label>
                          <textarea
                            id="npsComment"
                            rows={3}
                            value={npsComment}
                            onChange={(e) => setNpsComment(e.target.value)}
                            placeholder="Escreva sua sugestão ou elogio..."
                            className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100"
                          />
                        </div>

                        <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-semibold h-10 px-5 shadow-sm text-xs rounded-xl">
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          Enviar Avaliação
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {isRescheduleOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <Card className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">Reagendar Atendimento</CardTitle>
                <CardDescription className="text-xs">Selecione uma nova data e horário abaixo.</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsRescheduleOpen(false)}
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Selecione o Dia</span>
                <div className="grid grid-cols-5 gap-2">
                  {getNext5BusinessDays().map((date, idx) => {
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
                        <span className="text-[8px] font-bold uppercase tracking-wider block opacity-75">
                          {date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                        </span>
                        <span className="text-sm font-extrabold block mt-0.5">
                          {date.getDate()}
                        </span>
                        <span className="text-[8px] font-bold block mt-0.5">
                          {date.toLocaleDateString('pt-BR', { month: 'short' }).slice(0, 3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Selecione o Horário</span>
                <div className="grid grid-cols-4 gap-2">
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
                            : 'bg-zinc-50 border-zinc-150 text-zinc-600 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="flex-1 h-10 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleRescheduleSubmit}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 h-10 text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md"
                >
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
