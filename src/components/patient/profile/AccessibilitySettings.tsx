import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { Type } from 'lucide-react';

interface AccessibilitySettingsProps {
  fontSize: string;
  setFontSize: (size: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

export default function AccessibilitySettings({
  fontSize,
  setFontSize,
  theme,
  setTheme
}: AccessibilitySettingsProps) {
  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 text-left">
      <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <Type className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Acessibilidade Visual</h2>
      </div>
      <CardContent className="p-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-zinc-500">Tamanho da Fonte</Label>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
            Ajuste a escala das fontes do portal:
          </p>
          <div className="flex flex-wrap gap-1 p-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/30 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFontSize('small')}
              className={`h-9 px-0 text-[10px] font-bold rounded-lg transition-colors flex-1 min-w-[50px] ${fontSize === 'small' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Menor
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFontSize('default')}
              className={`h-9 px-0 text-xs font-bold rounded-lg transition-colors flex-1 min-w-[50px] ${fontSize === 'default' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Padrão
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFontSize('medium')}
              className={`h-9 px-0 text-sm font-bold rounded-lg transition-colors flex-1 min-w-[50px] ${fontSize === 'medium' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Médio
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFontSize('large')}
              className={`h-9 px-0 text-base font-bold rounded-lg transition-colors flex-1 min-w-[50px] ${fontSize === 'large' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Grande
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFontSize('xlarge')}
              className={`h-9 px-0 text-lg font-bold rounded-lg transition-colors flex-1 min-w-[50px] ${fontSize === 'xlarge' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              G+
            </Button>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Label className="text-xs font-semibold text-zinc-500">Contraste e Tema</Label>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
            Escolha o tema de cores de sua preferência:
          </p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/30 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTheme('light')}
              className={`h-9 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${theme === 'light' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Claro
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTheme('dark')}
              className={`h-9 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${theme === 'dark' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Escuro
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTheme('contrast')}
              className={`h-9 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${theme === 'contrast' ? 'bg-white dark:bg-zinc-800 shadow-sm text-primary font-extrabold' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              Contraste
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
