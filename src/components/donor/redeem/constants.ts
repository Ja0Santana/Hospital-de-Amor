export interface BadgeCatalogItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  levelReq: string;
  color: string;
}

export interface BadgeStyle {
  color: string;
  bg: string;
}

export const BADGE_STYLES: Record<string, BadgeStyle> = {
  apoiador: { color: 'text-amber-700 dark:text-amber-505', bg: 'from-amber-600/20 to-amber-700/10 border-amber-600/30' },
  anjo: { color: 'text-zinc-500 dark:text-zinc-400', bg: 'from-zinc-400/20 to-zinc-500/10 border-zinc-400/30' },
  defensor: { color: 'text-yellow-600 dark:text-yellow-500', bg: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30' },
  guardiao: { color: 'text-cyan-650 dark:text-cyan-500', bg: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
  pilar: { color: 'text-brand-pink', bg: 'from-pink-500/20 to-indigo-650/20 border-pink-500/30' }
};

export const CATALOG_BADGES: BadgeCatalogItem[] = [
  { id: 'apoiador', name: 'Apoiador da Esperança', desc: 'Concedido a todos os doadores iniciantes que apoiam a causa.', cost: 0, levelReq: 'Bronze', color: 'from-amber-600/20 to-amber-700/10 border-amber-600/30 text-amber-750' },
  { id: 'anjo', name: 'Anjo da Saúde', desc: 'Dedicado aos doadores que viabilizam insumos hospitalares essenciais.', cost: 1000, levelReq: 'Prata', color: 'from-zinc-400/20 to-zinc-500/10 border-zinc-400/30 text-zinc-500' },
  { id: 'defensor', name: 'Defensor da Vida', desc: 'Reconhecimento pela contribuição contínua à manutenção de leitos.', cost: 3000, levelReq: 'Ouro', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-600' },
  { id: 'guardiao', name: 'Guardião da Esperança', desc: 'Homenagem aos que sustentam campanhas de exames móveis.', cost: 5000, levelReq: 'Platina', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-600' },
  { id: 'pilar', name: 'Pilar da Solidariedade', desc: 'A maior distinção para doadores que transformam o cenário oncológico.', cost: 10000, levelReq: 'Diamante', color: 'from-pink-500/20 to-indigo-650/20 border-pink-500/30 text-brand-pink' }
];
