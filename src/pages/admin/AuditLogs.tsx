import { useState, useEffect } from 'react';
import { getAuditLogs } from '../../services/db';
import type { AuditLog } from '../../types';
import { 
  Search, 
  Calendar, 
  Terminal, 
  RefreshCw
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

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
      const endLimit = new Date(endDate + 'T23:59:59').getTime();
      if (logTime > endLimit) return false;
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
          className="inline-flex items-center gap-2 h-10 px-5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 dark:text-zinc-350 text-zinc-650 rounded-xl text-xs font-bold transition-all bg-white dark:bg-zinc-900 shrink-0 self-start disabled:opacity-50"
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
                      <div className="font-bold text-zinc-950 dark:text-zinc-50">{log.userName}</div>
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
                    <td className="py-4 px-4 max-w-[200px] text-zinc-500 italic truncate" title={log.details}>
                      {log.details || 'Sem detalhes.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
