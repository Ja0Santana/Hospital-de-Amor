import type { PatientUser, UserRole } from '../../types';
import { initDb, DB_STORES } from './base';

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export async function getUserByCpf(cpf: string): Promise<PatientUser | null> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.USERS, 'readonly');
    const store = tx.objectStore(DB_STORES.USERS);
    const request = store.get(cleanCpf);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function createUser(
  user: Omit<PatientUser, 'createdAt'>
): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(user.cpf);

  return new Promise<void>((resolve, reject) => {
    const txCheck = db.transaction(DB_STORES.USERS, 'readonly');
    const storeCheck = txCheck.objectStore(DB_STORES.USERS);
    const getAllReq = storeCheck.getAll();
    getAllReq.onsuccess = () => {
      const allUsers = getAllReq.result as PatientUser[];
      const emailExists = allUsers.some(
        (u) =>
          u.email.trim().toLowerCase() === user.email.trim().toLowerCase()
      );
      if (emailExists) {
        reject(new Error('Este e-mail já está cadastrado em outra conta.'));
        return;
      }
      resolve();
    };
    txCheck.onerror = () => reject(txCheck.error);
  }).then(async () => {
    const existing = await getUserByCpf(cleanCpf);
    if (existing) {
      const existingRole = existing.role || 'patient';
      const newRole = user.role || 'patient';

      if (existingRole === newRole || existingRole === 'both') {
        throw new Error('Este CPF já está cadastrado');
      }

      existing.role = 'both';

      return new Promise<void>((resolve, reject) => {
        const stores =
          newRole === 'donor'
            ? [DB_STORES.USERS, DB_STORES.DONOR_POINTS]
            : [DB_STORES.USERS];
        const tx = db.transaction(stores, 'readwrite');

        const userStore = tx.objectStore(DB_STORES.USERS);
        userStore.put(existing);

        if (newRole === 'donor') {
          const donorPointsStore = tx.objectStore(DB_STORES.DONOR_POINTS);
          donorPointsStore.put({
            donorCpf: cleanCpf,
            balance: 0,
            level: 'Bronze',
          });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    const newUser: PatientUser = {
      ...user,
      cpf: cleanCpf,
      createdAt: new Date().toISOString(),
    };

    return new Promise<void>((resolve, reject) => {
      const stores =
        newUser.role === 'donor'
          ? [DB_STORES.USERS, DB_STORES.DONOR_POINTS]
          : [DB_STORES.USERS];
      const tx = db.transaction(stores, 'readwrite');

      const userStore = tx.objectStore(DB_STORES.USERS);
      userStore.add(newUser);

      if (newUser.role === 'donor') {
        const donorPointsStore = tx.objectStore(DB_STORES.DONOR_POINTS);
        donorPointsStore.put({
          donorCpf: cleanCpf,
          balance: 0,
          level: 'Bronze',
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function updateUserPassword(
  cpf: string,
  newPassword: string
): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  const user = await getUserByCpf(cleanCpf);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  user.passwordHash = newPassword;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.USERS, 'readwrite');
    const store = tx.objectStore(DB_STORES.USERS);
    const request = store.put(user);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function authenticateUser(
  cpf: string,
  password: string
): Promise<PatientUser | null> {
  const cleanCpf = normalizeCpf(cpf);
  const user = await getUserByCpf(cleanCpf);
  if (!user) {
    return null;
  }
  if (user.passwordHash !== password) {
    return null;
  }
  return user;
}

export async function getLoginAttempts(
  cpf: string
): Promise<{ attemptsCount: number; blockedUntil: string | null } | null> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.LOGIN_ATTEMPTS, 'readonly');
    const store = tx.objectStore(DB_STORES.LOGIN_ATTEMPTS);
    const req = store.get(cleanCpf);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function recordLoginAttempt(
  cpf: string,
  isSuccess: boolean
): Promise<{ attemptsCount: number; blockedUntil: string | null }> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  const currentRecord = await getLoginAttempts(cleanCpf);

  const record = currentRecord || {
    cpf: cleanCpf,
    attemptsCount: 0,
    blockedUntil: null,
  };

  if (isSuccess) {
    record.attemptsCount = 0;
    record.blockedUntil = null;
  } else {
    record.attemptsCount += 1;
    if (record.attemptsCount >= 5) {
      record.blockedUntil = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    }
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.LOGIN_ATTEMPTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.LOGIN_ATTEMPTS);
    const req = store.put(record);
    req.onsuccess = () =>
      resolve({
        attemptsCount: record.attemptsCount,
        blockedUntil: record.blockedUntil,
      });
    req.onerror = () => reject(req.error);
  });
}

export async function clearLoginAttempts(cpf: string): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.LOGIN_ATTEMPTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.LOGIN_ATTEMPTS);
    const req = store.delete(cleanCpf);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updatePatientUser(
  cpf: string,
  data: Partial<Omit<PatientUser, 'cpf' | 'createdAt'>>
): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  const user = await getUserByCpf(cleanCpf);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const oldEmail = user.email;
  const oldPhone = user.phone;
  const updatedUser: PatientUser = {
    ...user,
    ...data,
  };

  const newEmail = updatedUser.email;
  const newPhone = updatedUser.phone;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.USERS, DB_STORES.APPOINTMENTS, DB_STORES.EMAIL_QUEUE],
      'readwrite'
    );
    const userStore = tx.objectStore(DB_STORES.USERS);
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const emailStore = tx.objectStore(DB_STORES.EMAIL_QUEUE);

    userStore.put(updatedUser);

    const emailChanged =
      newEmail?.trim().toLowerCase() !== oldEmail?.trim().toLowerCase();
    const phoneChanged = newPhone?.trim() !== oldPhone?.trim();

    const getAppsReq = appStore.getAll();
    getAppsReq.onsuccess = () => {
      const appointments = getAppsReq.result;
      const patientApps = appointments.filter(
        (app: any) => normalizeCpf(app.patientCpf) === cleanCpf
      );

      if (emailChanged || phoneChanged) {
        patientApps.forEach((app: any) => {
          if (emailChanged && newEmail) app.patientEmail = newEmail.trim();
          if (phoneChanged && newPhone) app.patientPhone = newPhone.trim();
          appStore.put(app);
        });
      }

      if (emailChanged && newEmail) {
        const emailReq = emailStore.getAll();
        emailReq.onsuccess = () => {
          const emails = emailReq.result;
          const patientProtocols = new Set(
            patientApps.map((app: any) => app.protocol.trim().toLowerCase())
          );
          const oldEmailClean = oldEmail?.trim().toLowerCase();
          const newEmailClean = newEmail.trim().toLowerCase();
          for (const item of emails) {
            const itemEmailClean = item.recipientEmail?.trim().toLowerCase();
            const itemProtoClean = item.appointmentProtocol?.trim().toLowerCase();
            const matchesEmail =
              itemEmailClean === oldEmailClean ||
              itemEmailClean === newEmailClean;
            const matchesProtocol =
              itemProtoClean && patientProtocols.has(itemProtoClean);
            if (matchesEmail || matchesProtocol) {
              if (item.bounced) {
                item.bounced = false;
                emailStore.put(item);
              }
            }
          }
        };
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllUsersForAdmin(): Promise<PatientUser[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.USERS, 'readonly');
    const store = tx.objectStore(DB_STORES.USERS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteUserAdmin(cpf: string): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.USERS, 'readwrite');
    const store = tx.objectStore(DB_STORES.USERS);
    const request = store.delete(cleanCpf);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateUserAdmin(
  cpf: string,
  updatedData: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    qualifiedExamIds?: string[];
  },
  employeeCpf: string,
  employeeName: string
): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction([DB_STORES.USERS, DB_STORES.AUDIT_LOGS], 'readwrite');
    const userStore = tx.objectStore(DB_STORES.USERS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = userStore.get(cleanCpf);
    getReq.onsuccess = () => {
      const user = getReq.result as PatientUser | undefined;
      if (!user) {
        reject(new Error('Usuário não encontrado.'));
        return;
      }

      const allReq = userStore.getAll();
      allReq.onsuccess = () => {
        const allUsers = allReq.result as PatientUser[];
        const emailExists = allUsers.some(
          (u) =>
            u.email.trim().toLowerCase() ===
              updatedData.email.trim().toLowerCase() && u.cpf !== cleanCpf
        );
        if (emailExists) {
          reject(new Error('Este e-mail já está cadastrado em outra conta.'));
          return;
        }

        const oldName = user.name;
        const oldEmail = user.email;
        const oldPhone = user.phone;
        const oldRole = user.role;
        const oldQualified = user.qualifiedExamIds || [];

        const changes: Record<string, { old: any; new: any }> = {};
        if (oldName !== updatedData.name.trim()) {
          changes.name = { old: oldName, new: updatedData.name.trim() };
        }
        if (oldEmail.toLowerCase() !== updatedData.email.trim().toLowerCase()) {
          changes.email = { old: oldEmail, new: updatedData.email.trim() };
        }
        if (oldPhone !== updatedData.phone.trim()) {
          changes.phone = { old: oldPhone, new: updatedData.phone.trim() };
        }
        if (oldRole !== updatedData.role) {
          changes.role = { old: oldRole, new: updatedData.role };
        }

        const newQualified =
          updatedData.qualifiedExamIds !== undefined
            ? updatedData.qualifiedExamIds
            : oldQualified;
        const isQualifiedEqual =
          oldQualified.length === newQualified.length &&
          oldQualified.every((val) => newQualified.includes(val));
        if (!isQualifiedEqual) {
          changes.qualifiedExamIds = { old: oldQualified, new: newQualified };
        }

        user.name = updatedData.name.trim();
        user.email = updatedData.email.trim();
        user.phone = updatedData.phone.trim();
        user.role = updatedData.role;
        user.qualifiedExamIds = newQualified;

        userStore.put(user);

        const log = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          userCpf: employeeCpf,
          userName: employeeName,
          action: `Edição do usuário ${user.name} (CPF: ${cleanCpf})`,
          module: 'Controle de Usuários',
          ipAddress: '192.168.1.100',
          details: `Dados cadastrais atualizados pelo gestor.`,
          changes: Object.keys(changes).length > 0 ? changes : undefined,
        };

        const messageToHash = `${log.timestamp}|${log.userCpf}|${log.action}|${log.module}|${log.details}|0`;
        crypto.subtle
          .digest('SHA-256', new TextEncoder().encode(messageToHash))
          .then((hashBuffer) => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hash = hashArray
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('');
            const fullLog = { ...log, hash, previousHash: '0' };
            auditStore.add(fullLog);
          });
      };
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
