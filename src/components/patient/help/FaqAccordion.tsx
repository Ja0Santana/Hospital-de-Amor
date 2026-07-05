import { useState } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { Search, ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Como funciona o preparo para exames de mama?',
    a: 'Para mamografias e biópsias mamárias, a regra de ouro é não aplicar nenhum produto (desodorante, talco, loções, cremes ou perfumes) na região das mamas e axilas no dia do procedimento. Esses produtos possuem substâncias que imitam microcalcificações na imagem, comprometendo a precisão diagnóstica.',
    cat: 'Preparo'
  },
  {
    q: 'O que devo fazer se apresentar febre após a quimioterapia?',
    a: 'Febre (temperatura axilar a partir de 37.8°C) após sessões de quimioterapia é uma urgência oncológica (sinal de possível neutropenia febril). Não tome antitérmicos por conta própria. Entre em contato imediatamente com o plantão de enfermagem do hospital pelo telefone fornecido no seu cartão de tratamento ou dirija-se ao pronto-socorro mais próximo.',
    cat: 'Tratamento'
  },
  {
    q: 'Como solicito o transporte da prefeitura para as consultas?',
    a: 'O transporte sanitário eletivo é fornecido pela Secretaria de Saúde do seu município (TFD - Tratamento Fora de Domicílio). Para solicitar, você precisará apresentar na prefeitura a Guia de Agendamento emitida pelo Hospital de Amor constando a data e o horário da sua consulta. Faça o requerimento com pelo menos 7 dias de antecedência.',
    cat: 'Funcionamento'
  },
  {
    q: 'Posso ir acompanhado no dia do meu exame?',
    a: 'Sim. Todo paciente tem direito a um acompanhante. Recomendamos dar preferência a acompanhantes maiores de 18 anos e menores de 60 anos. Em alguns setores específicos (como salas de exames radiológicos), o acompanhante precisará aguardar na sala de espera por motivos de segurança radiológica.',
    cat: 'Funcionamento'
  },
  {
    q: 'Como faço para redefinir ou alterar minha senha de acesso?',
    a: 'Você pode alterar sua senha dentro da plataforma acessando o menu "Configurações" no painel lateral e preenchendo o formulário de alteração de senha. Caso tenha esquecido a senha antes de logar, clique em "Esqueci a Senha" na tela de login e siga as instruções enviadas para o seu e-mail simulado.',
    cat: 'Segurança'
  }
];

export default function FaqAccordion() {
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.cat.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 text-left">
      <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
        <CardContent className="p-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Busque por termos como: preparo, febre, FGTS..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-10 h-11 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider">Perguntas Respondidas</h3>
        {filteredFaqs.length === 0 ? (
          <Card className="border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-500 rounded-2xl">
            Nenhuma dúvida correspondente à busca foi encontrada. Tente outra palavra-chave.
          </Card>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <Card
                key={idx}
                className="border-zinc-200/60 dark:border-zinc-800 hover:border-primary/20 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-wider bg-primary/5 text-primary dark:bg-zinc-900 dark:text-zinc-400">
                      {faq.cat}
                    </Badge>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 border-t border-zinc-50 dark:border-zinc-900/50 leading-relaxed bg-zinc-50/20 dark:bg-zinc-900/5 animate-in slide-in-from-top-1 duration-200">
                    {faq.a}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
