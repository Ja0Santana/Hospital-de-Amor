import type {
  Donation,
  DonorPoints,
  SupportMessage,
  RecurringSubscription,
  TransparencyData,
} from '../../types';
import { initDb, DB_STORES } from './base';

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export async function createDonation(donation: Donation): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.DONATIONS, 'readwrite');
    const store = tx.objectStore(DB_STORES.DONATIONS);
    const request = store.add(donation);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateDonation(
  id: string,
  updates: Partial<Donation>
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.DONATIONS, 'readwrite');
    const store = tx.objectStore(DB_STORES.DONATIONS);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        reject(new Error('Doação não encontrada.'));
        return;
      }
      const updated = { ...existing, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getDonationsByCpf(cpf: string): Promise<Donation[]> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<Donation[]>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.DONATIONS, 'readonly');
    const store = tx.objectStore(DB_STORES.DONATIONS);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result || []) as Donation[];
      const filtered = results.filter(
        (d) => normalizeCpf(d.donorCpf) === cleanCpf
      );
      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDonorPoints(cpf: string): Promise<DonorPoints | null> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<DonorPoints | null>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.DONOR_POINTS, 'readonly');
    const store = tx.objectStore(DB_STORES.DONOR_POINTS);
    const request = store.get(cleanCpf);
    request.onsuccess = () => {
      const res = request.result;
      if (res) {
        if (res.prestige === undefined) res.prestige = 0;
        if (!res.redeemedBadges) res.redeemedBadges = [];
      }
      resolve(res || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addDonorPoints(
  cpf: string,
  points: number
): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  const currentPoints = await getDonorPoints(cleanCpf);

  const prestige = currentPoints?.prestige || 0;
  const multiplier = 1 + prestige * 0.1;

  const balance = (currentPoints?.balance || 0) + points;
  const spentPoints =
    currentPoints?.redeemedBadges
      ?.filter((b) => b.prestigeAtAcquisition === prestige)
      ?.reduce((sum, b) => sum + b.cost, 0) || 0;
  const rankPoints = balance + spentPoints;

  let level: 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Diamante' = 'Bronze';
  if (rankPoints >= 30000 * multiplier) {
    level = 'Diamante';
  } else if (rankPoints >= 15000 * multiplier) {
    level = 'Platina';
  } else if (rankPoints >= 5000 * multiplier) {
    level = 'Ouro';
  } else if (rankPoints >= 1000 * multiplier) {
    level = 'Prata';
  }

  const updatedPoints: DonorPoints = {
    donorCpf: cleanCpf,
    balance,
    level,
    prestige,
    redeemedBadges: currentPoints?.redeemedBadges || [],
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.DONOR_POINTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.DONOR_POINTS);
    const request = store.put(updatedPoints);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function redeemDonorBadge(
  cpf: string,
  badgeId: string,
  badgeName: string,
  cost: number
): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  const currentPoints = await getDonorPoints(cleanCpf);
  if (!currentPoints) throw new Error('Pontos não encontrados.');

  const balance = currentPoints.balance - cost;
  if (balance < 0) throw new Error('Pontos insuficientes para o resgate.');

  const newBadge = {
    id: 'badge-' + crypto.randomUUID().slice(0, 8),
    badgeId,
    name: badgeName,
    cost,
    date: new Date().toISOString(),
    prestigeAtAcquisition: currentPoints.prestige || 0,
  };

  const badgesList = currentPoints.redeemedBadges || [];
  const currentPrestige = currentPoints.prestige || 0;
  const alreadyRedeemed = badgesList.some(
    (b) => b.badgeId === badgeId && b.prestigeAtAcquisition === currentPrestige
  );
  if (alreadyRedeemed) {
    throw new Error('Este selo já foi resgatado no nível de prestígio atual.');
  }

  const updatedPoints: DonorPoints = {
    ...currentPoints,
    balance,
    redeemedBadges: [...badgesList, newBadge],
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.DONOR_POINTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.DONOR_POINTS);
    const request = store.put(updatedPoints);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function triggerDonorPrestige(cpf: string): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  const currentPoints = await getDonorPoints(cleanCpf);
  if (!currentPoints) throw new Error('Pontos não encontrados.');

  const prestige = (currentPoints.prestige || 0) + 1;
  const updatedPoints: DonorPoints = {
    ...currentPoints,
    balance: 0,
    level: 'Bronze',
    prestige,
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.DONOR_POINTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.DONOR_POINTS);
    const request = store.put(updatedPoints);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveSupportMessage(msg: SupportMessage): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SUPPORT_MESSAGES, 'readwrite');
    const store = tx.objectStore(DB_STORES.SUPPORT_MESSAGES);
    const request = store.add(msg);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSupportMessages(): Promise<SupportMessage[]> {
  const db = await initDb();
  return new Promise<SupportMessage[]>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SUPPORT_MESSAGES, 'readonly');
    const store = tx.objectStore(DB_STORES.SUPPORT_MESSAGES);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result || []) as SupportMessage[];
      const sorted = results.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function createRecurringSubscription(
  sub: RecurringSubscription
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.RECURRING_SUBSCRIPTIONS, 'readwrite');
    const store = tx.objectStore(DB_STORES.RECURRING_SUBSCRIPTIONS);
    const request = store.add(sub);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getRecurringSubscriptionsByCpf(
  cpf: string
): Promise<RecurringSubscription[]> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<RecurringSubscription[]>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.RECURRING_SUBSCRIPTIONS, 'readonly');
    const store = tx.objectStore(DB_STORES.RECURRING_SUBSCRIPTIONS);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result || []) as RecurringSubscription[];
      const filtered = results.filter(
        (sub) => normalizeCpf(sub.donorCpf) === cleanCpf
      );
      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateRecurringSubscription(
  id: string,
  data: Partial<RecurringSubscription>
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.RECURRING_SUBSCRIPTIONS, 'readwrite');
    const store = tx.objectStore(DB_STORES.RECURRING_SUBSCRIPTIONS);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        reject(new Error('Assinatura não encontrada.'));
        return;
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteRecurringSubscription(id: string): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.RECURRING_SUBSCRIPTIONS, 'readwrite');
    const store = tx.objectStore(DB_STORES.RECURRING_SUBSCRIPTIONS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getTransparencyData(): Promise<TransparencyData> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.TRANSPARENCY_DATA, 'readonly');
    const store = tx.objectStore(DB_STORES.TRANSPARENCY_DATA);
    const request = store.get('active');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTransparencyData(
  data: TransparencyData
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.TRANSPARENCY_DATA, 'readwrite');
    const store = tx.objectStore(DB_STORES.TRANSPARENCY_DATA);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
