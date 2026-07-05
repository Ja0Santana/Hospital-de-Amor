import { useState } from 'react';

import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PasswordStrengthMeter } from '../../common/PasswordStrengthMeter';

interface PasswordChangeFormProps {
  loading: boolean;
  passwordSuccess: string;
  passwordError: string;
  onSavePassword: (currentPass: string, newPass: string, isNewPasswordValid: boolean, confirmNewPass: string) => Promise<void>;
}

export default function PasswordChangeForm({
  loading,
  passwordSuccess,
  passwordError,
  onSavePassword
}: PasswordChangeFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 text-left">
      <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <Lock className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Alterar Senha de Acesso</h2>
      </div>
      <CardContent className="p-6">
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!currentPassword || !newPassword || !confirmNewPassword) {
            return;
          }
          try {
            await onSavePassword(currentPassword, newPassword, isNewPasswordValid, confirmNewPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmNewPassword(false);
          } catch (err) {
            // Error logic
          }
        }} className="space-y-4">
          {passwordSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-955/20 border border-green-200/50 dark:border-green-800/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordSuccess}</span>
            </div>
          )}
          {passwordError && (
            <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Senha Atual</Label>
              <div className="relative">
                <Input id="currPass" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10 pr-10" />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                  aria-label={showCurrentPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nova Senha</Label>
              <div className="relative">
                <Input id="newPass" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10 pr-10" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                  aria-label={showNewPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confNewPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input id="confNewPass" type={showConfirmNewPassword ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary rounded-xl text-xs h-10 pr-10" />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                  aria-label={showConfirmNewPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {newPassword && (
            <div className="pt-2">
              <PasswordStrengthMeter password={newPassword} onValidityChange={setIsNewPasswordValid} />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading || !isNewPasswordValid} className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-6 rounded-xl shadow-md transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
