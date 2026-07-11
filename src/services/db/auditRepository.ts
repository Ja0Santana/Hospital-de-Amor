import type { AuditLog } from '../../types';
import { initDb, DB_STORES } from './base';

export async function computeSHA256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createAuditLog(
  log: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.AUDIT_LOGS, 'readwrite');
    const store = tx.objectStore(DB_STORES.AUDIT_LOGS);
    const getAllReq = store.getAll();
    getAllReq.onsuccess = async () => {
      const logs = getAllReq.result || [];
      const sorted = logs.sort(
        (a: any, b: any) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const lastLog = sorted[sorted.length - 1];
      const previousHash = lastLog ? lastLog.hash || '0' : '0';

      const newLog: AuditLog = {
        ...log,
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        previousHash,
      };

      const messageToHash = `${newLog.timestamp}|${newLog.userCpf}|${newLog.action}|${newLog.module}|${newLog.details}|${previousHash}`;
      const hash = await computeSHA256(messageToHash);
      newLog.hash = hash;

      const request = store.add(newLog);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    };
    getAllReq.onerror = () => reject(getAllReq.error);
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.AUDIT_LOGS, 'readonly');
    const store = tx.objectStore(DB_STORES.AUDIT_LOGS);
    const request = store.getAll();
    request.onsuccess = () => {
      const sorted = (request.result || []).sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addAuditLogAdmin(
  action: string,
  module: string,
  details: string,
  employeeCpf: string,
  employeeName: string,
  changes?: Record<string, { old: any; new: any }>
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.AUDIT_LOGS, 'readwrite');
    const store = tx.objectStore(DB_STORES.AUDIT_LOGS);
    const getAllReq = store.getAll();
    getAllReq.onsuccess = async () => {
      const logs = getAllReq.result || [];
      const sorted = logs.sort(
        (a: any, b: any) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const lastLog = sorted[sorted.length - 1];
      const previousHash = lastLog ? lastLog.hash || '0' : '0';

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: employeeCpf,
        userName: employeeName,
        action,
        module,
        ipAddress: '192.168.1.100',
        details,
        changes,
        previousHash,
      };

      const messageToHash = `${log.timestamp}|${log.userCpf}|${log.action}|${log.module}|${log.details}|${previousHash}`;
      const hash = await computeSHA256(messageToHash);
      log.hash = hash;

      const request = store.add(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    };
    getAllReq.onerror = () => reject(getAllReq.error);
  });
}
