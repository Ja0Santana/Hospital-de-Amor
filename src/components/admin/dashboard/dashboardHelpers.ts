import type { Appointment, City } from '../../../types';

export function getSlaStatus(createdAt: string): 'ok' | 'warning' | 'critical' {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  if (days > 50) return 'critical';
  if (days >= 30) return 'warning';
  return 'ok';
}

export function filterAppointments(
  appointments: Appointment[],
  searchQuery: string,
  selectedCityId: string,
  selectedSpecialtyId: string,
  statusFilter: string,
  showColdStorage: boolean,
  cities: City[],
  startDateFilter: string,
  endDateFilter: string
): Appointment[] {
  return appointments.filter((app) => {
    const matchesSearch =
      app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.patientCpf.includes(searchQuery);

    const matchesCity =
      !selectedCityId ||
      app.city.toLowerCase() ===
        cities.find((c) => c.id === selectedCityId)?.name.toLowerCase();

    const matchesSpecialty =
      !selectedSpecialtyId || app.specialtyId === selectedSpecialtyId;

    const matchesStatus = statusFilter === 'Todos' || app.status === statusFilter;

    const matchesColdStorage = showColdStorage || !app.isColdStorage;

    const matchesDate = (() => {
      if (!startDateFilter && !endDateFilter) return true;
      if (!app.rescheduledDate) return false;
      const appDateStr = app.rescheduledDate;
      if (startDateFilter && appDateStr < startDateFilter) return false;
      if (endDateFilter && appDateStr > endDateFilter) return false;
      return true;
    })();

    return (
      matchesSearch &&
      matchesCity &&
      matchesSpecialty &&
      matchesStatus &&
      matchesColdStorage &&
      matchesDate
    );
  });
}

export function sortAppointments(
  appointments: Appointment[],
  sortKey: string,
  sortOrder: 'asc' | 'desc'
): Appointment[] {
  return [...appointments].sort((a, b) => {
    if (sortKey === 'fila_priorizada') {
      const weightA = a.isLegalPriority ? 1 : 0;
      const weightB = b.isLegalPriority ? 1 : 0;
      if (weightA !== weightB) {
        return sortOrder === 'asc' ? weightB - weightA : weightA - weightB;
      }

      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) {
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      const pWeight = { Alta: 3, Média: 2, Baixa: 1 };
      const pA = pWeight[a.priority as 'Alta' | 'Média' | 'Baixa'] || 1;
      const pB = pWeight[b.priority as 'Alta' | 'Média' | 'Baixa'] || 1;
      return sortOrder === 'asc' ? pB - pA : pA - pB;
    }

    if (sortKey === 'priority') {
      const weight = { Alta: 3, Média: 2, Baixa: 1 };
      const valA = weight[a.priority as 'Alta' | 'Média' | 'Baixa'] || 1;
      const valB = weight[b.priority as 'Alta' | 'Média' | 'Baixa'] || 1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    if (sortKey === 'createdAt') {
      const valA = new Date(a.createdAt).getTime();
      const valB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    if (sortKey === 'changedAt') {
      const getLatestStatusChange = (app: Appointment) => {
        if (app.statusHistory && app.statusHistory.length > 0) {
          const dates = app.statusHistory.map((h) =>
            new Date(h.changedAt).getTime()
          );
          return Math.max(...dates);
        }
        return new Date(app.createdAt).getTime();
      };
      const valA = getLatestStatusChange(a);
      const valB = getLatestStatusChange(b);
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    if (sortKey === 'assignedTo') {
      const valA = a.assignedTo || '';
      const valB = b.assignedTo || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    const valA = (a[sortKey as keyof Appointment] || '') as string;
    const valB = (b[sortKey as keyof Appointment] || '') as string;
    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });
}
