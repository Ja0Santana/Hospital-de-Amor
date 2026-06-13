import { useState, useEffect } from 'react';
import { getAuditLogs } from '../../services/db';
import type { AuditLog } from '../../types';
import { 
  Search, 
  Calendar, 
  Terminal, 
  RefreshCw,
  X
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<Record<string, { old: any; new: any }> | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await getAuditLogs();
      setLogs(allLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userCpf.includes(searchQuery) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    if (startDate) {
      const logTime = new Date(log.timestamp).getTime();
      const startLimit = new Date(startDate + 'T00:00:00').getTime();
      if (logTime < startLimit) return false;
    }

    if (endDate) {
      const logTime = new Date(log.timestamp).getTime();
      const startLimit = new Date(endDate + 'T23:59:59').getTime();
      if (logTime > startLimit) return false;
    }

    return matchesSearch;
  });

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const translateFieldName = (key: string) => {
    const map: Record<string, string> = {
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone',
      role: 'Perfil / Permissão',
      isActive: 'Status de Ativação',
      dailyLimit: 'Capacidade Limite Diária',
      defaultPrepInstructions: 'Instruções de Preparo do Exame',
      cost: 'Custo do Exame',
      duration: 'Duração',
      room: 'Sala de Exame',
      presenceConfirmed: 'Confirmação de Presença',
      rescheduledDate: 'Data Agendada',
      rescheduledTime: 'Horário Agendado',
      scheduledRoom: 'Sala Confirmada',
      scheduledDoctor: 'Médico Confirmado',
      priority: 'Prioridade da Fila',
      status: 'Status do Agendamento'
    };
    return map[key] || key;
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Histórico de Auditoria</h1>
          <p className="text-zinc-500 mt-1 text-sm">Registro cronológico e imutável de ações executadas no sistema administrativo.</p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 h-10 px-5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 dark:text-zinc-350 text-zinc-655 rounded-xl text-xs font-bold transition-all bg-white dark:bg-zinc-900 shrink-0 self-start disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Histórico
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-455" />
            <input
              type="text"
              placeholder="Buscar por operador, CPF, ação ou IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            />
          </div>

          <div className="relative flex items-center">
            <Calendar className="absolute left-3.5 w-4 h-4 text-zinc-455" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
              placeholder="Data Início"
            />
          </div>

          <div className="relative flex items-center">
            <Calendar className="absolute left-3.5 w-4 h-4 text-zinc-455" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
              placeholder="Data Fim"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Operador (CPF)</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Ação Realizada</th>
                <th className="py-3 px-4">IP Origem</th>
                <th className="py-3 px-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-700 dark:text-zinc-355 transition-colors"
                  >
                    <td className="py-4 px-4 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-955 dark:text-zinc-50">{log.userName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {log.userCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200">
                        <Terminal className="w-3.5 h-3.5 text-pink-650" />
                        {log.module}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-[220px] font-medium leading-relaxed">{log.action}</td>
                    <td className="py-4 px-4 font-mono text-zinc-500">{log.ipAddress}</td>
                    <td className="py-4 px-4 max-w-[200px] text-zinc-500">
                      {log.changes ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="italic truncate max-w-[180px] block" title={log.details}>
                            {log.details || 'Sem detalhes.'}
                          </span>
                          <button
                            onClick={() => setSelectedChanges(log.changes || null)}
                            className="px-2 py-0.5 bg-pink-50 text-pink-650 hover:bg-pink-100 dark:bg-pink-950/20 dark:text-pink-400 border border-pink-200/10 rounded-lg text-[10px] font-bold transition-all shrink-0"
                          >
                            Ver Alterações
                          </button>
                        </div>
                      ) : (
                        <span className="italic truncate max-w-[180px] block" title={log.details}>
                          {log.details || 'Sem detalhes.'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedChanges && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in scale-in">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
              <div>
                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-xs">Detalhamento de Alterações</h3>
                <span className="text-[10px] text-zinc-400 mt-0.5">Visão estruturada de valores antes e depois da modificação</span>
              </div>
              <button 
                onClick={() => setSelectedChanges(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-455 dark:text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
              {Object.entries(selectedChanges).map(([field, values]) => (
                <div key={field} className="space-y-1.5 pb-3 border-b border-zinc-100 dark:border-zinc-850 last:border-0 last:pb-0">
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 block">
                    {translateFieldName(field)}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center">
                    <div className="sm:col-span-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-900/25 rounded-2xl text-[11px] text-red-900 dark:text-red-350 font-mono break-all leading-normal">
                      <span className="text-[9px] uppercase font-bold text-red-400 block mb-0.5">Antes</span>
                      {values.old !== undefined && values.old !== null ? String(values.old) : <span className="italic text-red-400/70">Vazio</span>}
                    </div>
                    
                    <div className="sm:col-span-1 flex justify-center text-zinc-400 font-extrabold">
                      →
                    </div>
                    
                    <div className="sm:col-span-3 p-3 bg-emerald-55/40 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-900/25 rounded-2xl text-[11px] text-emerald-900 dark:text-emerald-450 font-mono break-all leading-normal">
                      <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-0.5">Depois</span>
                      {values.new !== undefined && values.new !== null ? String(values.new) : <span className="italic text-emerald-400/70">Vazio</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-150 dark:border-zinc-800 text-right">
              <button
                onClick={() => setSelectedChanges(null)}
                className="h-9 px-4 bg-zinc-200 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
