import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import type { PatientUser, CustomRole } from '../../../types';

interface CollaboratorFormPanelProps {
  userToEdit: PatientUser | null;
  customRoles: CustomRole[];
  onSubmit: (
    userData: Omit<PatientUser, 'createdAt'> & { password?: string },
    isEditing: boolean
  ) => Promise<void>;
  onCancel: () => void;
}

export default function CollaboratorFormPanel({
  userToEdit,
  customRoles,
  onSubmit,
  onCancel,
}: CollaboratorFormPanelProps) {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('recepcionista');

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setCpf(userToEdit.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone || '');
      setPassword('');
      setRole(userToEdit.role || 'recepcionista');
    } else {
      setName('');
      setCpf('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('recepcionista');
    }
  }, [userToEdit]);

  const formatInputCpf = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    let formatted = numeric;
    if (numeric.length > 3) {
      formatted = numeric.slice(0, 3) + '.' + numeric.slice(3);
    }
    if (numeric.length > 6) {
      formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
    }
    if (numeric.length > 9) {
      formatted = formatted.slice(0, 11) + '-' + formatted.slice(11, 13);
    }
    return formatted.slice(0, 14);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    const isEditing = !!userToEdit;

    const payload: Omit<PatientUser, 'createdAt'> & { password?: string } = {
      cpf: cleanCpf,
      name: name.trim(),
      birthDate: userToEdit?.birthDate || '1990-01-01',
      email: email.trim(),
      phone: phone.trim() || '(79) 99999-9999',
      passwordHash: isEditing ? userToEdit.passwordHash : password,
      role: role as any,
      isActive: userToEdit ? userToEdit.isActive !== false : true,
    };

    if (!isEditing) {
      payload.password = password;
    }

    await onSubmit(payload, isEditing);
  };

  const isEditing = !!userToEdit;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm animate-in slide-in-from-top-3">
      <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-pink-600" />
        {isEditing ? 'Editar Colaborador' : 'Informações do Novo Colaborador'}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="add-name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Nome Completo
          </label>
          <input
            id="add-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Mariana Lemos"
            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="add-cpf" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            CPF
          </label>
          <input
            id="add-cpf"
            type="text"
            value={cpf}
            onChange={(e) => setCpf(formatInputCpf(e.target.value))}
            placeholder="000.000.000-00"
            disabled={isEditing}
            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 disabled:opacity-50"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="add-email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            E-mail
          </label>
          <input
            id="add-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@hospitalamor.org.br"
            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="add-phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Telefone
          </label>
          <input
            id="add-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(79) 99999-9999"
            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
          />
        </div>

        {!isEditing && (
          <div className="space-y-1.5">
            <label htmlFor="add-pass" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Senha Provisória
            </label>
            <input
              id="add-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
              required
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="add-role" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Perfil Funcional
          </label>
          <select
            id="add-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
          >
            <option value="recepcionista">Recepcionista</option>
            <option value="gestor">Gestor Geral</option>
            <option value="auditor">Auditor</option>
            {customRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-955 dark:text-zinc-300 text-zinc-700 rounded-xl text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-10 px-5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-green-600/15"
          >
            Salvar Colaborador
          </button>
        </div>
      </form>
    </div>
  );
}
