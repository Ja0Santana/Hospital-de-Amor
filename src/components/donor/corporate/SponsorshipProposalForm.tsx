import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { formatCnpj } from '../../../lib/sanitizer';
import { Building2, Send, Plus, Trash2 } from 'lucide-react';

interface SponsorshipProposalFormProps {
  formError: string;
  setFormError: (err: string) => void;
  onSubmit: (data: {
    razaoSocial: string;
    cnpj: string;
    contactName: string;
    email: string;
    phone: string;
    intentAmount: number;
    logo: string | null;
    representatives: any[];
  }) => void;
}

export default function SponsorshipProposalForm({
  formError,
  setFormError,
  onSubmit
}: SponsorshipProposalFormProps) {
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [intentAmount, setIntentAmount] = useState('');
  const [logo, setLogo] = useState<string | null>(null);

  const [repName, setRepName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repRole, setRepRole] = useState('');
  const [repPermission, setRepPermission] = useState<'Administrador' | 'Visualizador'>('Visualizador');
  const [tempRepresentatives, setTempRepresentatives] = useState<any[]>([]);

  const handleCnpjChange = (val: string) => {
    setCnpj(formatCnpj(val));
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert('O tamanho do logo não deve exceder 1MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddRepresentative = () => {
    if (!repName.trim()) {
      alert('Informe o nome do representante.');
      return;
    }
    if (!repEmail.trim() || !repEmail.includes('@')) {
      alert('Informe um e-mail válido para o representante.');
      return;
    }
    if (!repRole.trim()) {
      alert('Informe o cargo ou setor do representante.');
      return;
    }
    const newRep = {
      name: repName,
      email: repEmail,
      role: repRole,
      permission: repPermission
    };
    setTempRepresentatives([...tempRepresentatives, newRep]);
    setRepName('');
    setRepEmail('');
    setRepRole('');
    setRepPermission('Visualizador');
  };

  const handleRemoveRepresentative = (index: number) => {
    setTempRepresentatives(tempRepresentatives.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!razaoSocial.trim()) {
      setFormError('Por favor, informe a Razão Social.');
      return;
    }

    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      setFormError('O CNPJ deve possuir exatamente 14 dígitos.');
      return;
    }

    if (!contactName.trim()) {
      setFormError('Por favor, informe o nome do responsável.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Por favor, informe um e-mail corporativo válido.');
      return;
    }

    const domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
    const publicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com'];
    if (publicDomains.includes(domain)) {
      setFormError('Por favor, informe um e-mail com domínio corporativo específico (evite Gmail, Hotmail, etc.).');
      return;
    }

    if (!phone.trim()) {
      setFormError('Por favor, informe um telefone de contato.');
      return;
    }

    const parsedIntent = parseFloat(intentAmount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(parsedIntent) || parsedIntent <= 0) {
      setFormError('Por favor, informe um valor de intenção de patrocínio válido.');
      return;
    }

    onSubmit({
      razaoSocial,
      cnpj,
      contactName,
      email,
      phone,
      intentAmount: parsedIntent,
      logo,
      representatives: tempRepresentatives
    });
  };

  return (
    <Card className="p-6 border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-4 shadow-sm text-left">
      <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
        <Building2 className="w-4 h-4 text-brand-pink" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Proposta de Patrocínio PJ</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="space-y-1.5">
          <Label htmlFor="razaoSocial" className="font-semibold text-zinc-700 dark:text-zinc-300">Razão Social</Label>
          <Input
            id="razaoSocial"
            type="text"
            placeholder="Nome Comercial da Empresa"
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            className="h-9 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:ring-brand-pink rounded-xl text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cnpj" className="font-semibold text-zinc-700 dark:text-zinc-300">CNPJ</Label>
          <Input
            id="cnpj"
            type="text"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={(e) => handleCnpjChange(e.target.value)}
            className="h-9 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:ring-brand-pink rounded-xl text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contactName" className="font-semibold text-zinc-700 dark:text-zinc-300">Responsável de Contato</Label>
          <Input
            id="contactName"
            type="text"
            placeholder="Nome Completo"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="h-9 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:ring-brand-pink rounded-xl text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-semibold text-zinc-700 dark:text-zinc-300">E-mail Corporativo</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:ring-brand-pink rounded-xl text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="font-semibold text-zinc-700 dark:text-zinc-300">Telefone</Label>
            <Input
              id="phone"
              type="text"
              placeholder="(79) 3000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:ring-brand-pink rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="intentAmount" className="font-semibold text-zinc-700 dark:text-zinc-300">Valor Intencionado de Patrocínio</Label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-zinc-400 font-bold text-xs">R$</span>
            <Input
              id="intentAmount"
              type="text"
              placeholder="0,00"
              value={intentAmount}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                if (!digits) { setIntentAmount(''); return; }
                const formatted = (parseInt(digits, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                setIntentAmount(formatted);
              }}
              className="pl-8 h-9 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:ring-brand-pink rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-3.5">
          <Label htmlFor="logo" className="font-semibold text-zinc-700 dark:text-zinc-300">Logo da Empresa (.png, .jpg)</Label>
          <div className="flex items-center gap-3">
            <Input
              id="logo"
              type="file"
              accept=".png, .jpg, .jpeg"
              onChange={handleLogoUpload}
              className="h-9 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:ring-brand-pink rounded-xl text-xs flex-1 file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
            {logo && (
              <img src={logo} alt="Preview Logo" className="w-9 h-9 rounded-lg border border-zinc-200 object-contain bg-white shrink-0 animate-in fade-in" />
            )}
          </div>
        </div>

        <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-3.5">
          <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider block">Representantes Autorizados (PJ)</span>
          
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="text"
              placeholder="Nome"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              className="h-8 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 rounded-lg text-[11px]"
            />
            <Input
              type="email"
              placeholder="E-mail"
              value={repEmail}
              onChange={(e) => setRepEmail(e.target.value)}
              className="h-8 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 rounded-lg text-[11px]"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <Input
              type="text"
              placeholder="Cargo/Setor"
              value={repRole}
              onChange={(e) => setRepRole(e.target.value)}
              className="h-8 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 rounded-lg text-[11px] col-span-2"
            />
            <select
              value={repPermission}
              onChange={(e) => setRepPermission(e.target.value as any)}
              className="h-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-[10px] px-2 focus-visible:outline-none dark:text-zinc-100"
            >
              <option value="Visualizador">Visualizador</option>
              <option value="Administrador">Admin</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={handleAddRepresentative}
            className="w-full h-8 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:text-zinc-300 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Representante
          </Button>

          {tempRepresentatives.length > 0 && (
            <div className="space-y-1 max-h-[100px] overflow-y-auto pt-1 border-t border-zinc-50 dark:border-zinc-900">
              {tempRepresentatives.map((rep, idx) => (
                <div key={idx} className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 text-[10px]">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate leading-none">{rep.name}</span>
                    <span className="text-[9px] text-zinc-400 font-medium block truncate mt-0.5">{rep.role} · {rep.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-1 py-0.5 text-[8px] font-bold rounded ${rep.permission === 'Administrador' ? 'bg-brand-pink/10 text-brand-pink' : 'bg-zinc-100 text-zinc-500'}`}>{rep.permission}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRepresentative(idx)}
                      className="h-5 w-5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-red-500 rounded-md shrink-0 animate-in fade-in"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {formError && (
          <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-[11px] font-bold rounded-xl mt-2 animate-in fade-in">
            {formError}
          </div>
        )}

        <Button type="submit" className="w-full h-10 bg-brand-pink hover:bg-brand-pink/95 text-white font-bold rounded-xl text-xs mt-2 flex items-center justify-center gap-1.5 shadow-md shadow-brand-pink/15">
          <Send className="w-3.5 h-3.5" />
          Registrar Interesse
        </Button>
      </form>
    </Card>
  );
}
