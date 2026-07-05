import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Download, Check, FileText, Sparkles } from 'lucide-react';
import DownloadPortal from './DownloadPortal';

export interface Booklet {
  id: string;
  title: string;
  category: 'preparo' | 'tratamento' | 'direitos';
  size: string;
  description: string;
  content: string;
}

export const BOOKLETS: Booklet[] = [
  {
    id: 'b1',
    title: 'Guia de Preparo para Mamografia',
    category: 'preparo',
    size: '1.2 MB',
    description: 'Instruções essenciais sobre o que fazer e evitar no dia do seu exame de mamografia.',
    content: 'ORIENTAÇÕES OFICIAIS DO HOSPITAL DE AMOR\n\nEXAME: Mamografia Bilateral\n\nINSTRUÇÕES DE PREPARO:\n1. Não use desodorante, talco, creme ou perfume nas mamas e axilas no dia do exame, pois estes produtos podem conter partículas metálicas que interferem no resultado.\n2. Vista roupas de duas peças (ex: blusa e saia ou calça), pois será necessário retirar a parte de cima da vestimenta.\n3. Se possuir exames de mamografia anteriores, traga-os no dia do atendimento. Eles são fundamentais para comparação.'
  },
  {
    id: 'b2',
    title: 'Direitos Sociais do Paciente Oncológico',
    category: 'direitos',
    size: '2.4 MB',
    description: 'Cartilha completa sobre isenção de impostos, saques do FGTS/PIS e outros benefícios.',
    content: 'GUIA DE DIREITOS SOCIAIS DO PACIENTE - HOSPITAL DE AMOR\n\nBenefícios previstos em lei para pacientes em tratamento oncológico:\n\n1. Saque do FGTS e PIS/PASEP: O paciente ou trabalhador que possua dependente com câncer pode realizar o saque integral.\n2. Auxílio-Doença (Benefício por Incapacidade Temporária): Pago pelo INSS caso o paciente fique temporariamente impossibilitado de trabalhar.\n3. Isenção de IPI e IPVA: Válido para a compra de veículos novos adaptados por portadores de limitações decorrentes da enfermidade.\n4. Quitação da Casa Própria: Caso exista cláusula de invalidez por doença no contrato de financiamento habitacional.'
  },
  {
    id: 'b3',
    title: 'Alimentação Saudável na Quimioterapia',
    category: 'tratamento',
    size: '1.8 MB',
    description: 'Recomendações de nutricionistas para reduzir enjoos e manter a imunidade alta.',
    content: 'MANUAL DE NUTRIÇÃO CLÍNICA - HOSPITAL DE AMOR\n\nComo gerenciar efeitos colaterais da quimioterapia por meio da alimentação:\n\n1. Para combater a Náusea:\n   - Coma em pequenas porções várias vezes ao dia (a cada 2 ou 3 horas).\n   - Evite alimentos muito quentes, prefira os frios ou em temperatura ambiente.\n   - Consuma alimentos com gengibre ou gotas de limão para atenuar o enjoo.\n2. Para a Fadiga e Imunidade:\n   - Mantenha-se hidratado (mínimo de 2 litros de água/líquidos por dia).\n   - Consuma frutas ricas em Vitamina C (laranja, acerola, limão).\n   - Evite alimentos crus fora de casa para prevenir infecções intestinais.'
  },
  {
    id: 'b4',
    title: 'Preparo Geral para Tomografia e Ressonância',
    category: 'preparo',
    size: '1.5 MB',
    description: 'Orientações sobre jejum, uso de contrastes e cuidados com objetos metálicos.',
    content: 'ORIENTAÇÕES OFICIAIS DO HOSPITAL DE AMOR\n\nEXAMES: Tomografia Computadorizada / Ressonância Magnética\n\nREGRAS GERAIS:\n1. Jejum absoluto de 4 horas (inclusive de água) para exames realizados com contraste iodado ou de gadolínio.\n2. Para Ressonância: É obrigatório retirar qualquer objeto metálico do corpo (brincos, anéis, piercings, relógios, grampos de cabelo).\n3. Caso possua marcapasso cardíaco ou implantes metálicos, informe a recepção imediatamente antes do exame.'
  }
];

interface BookletsListProps {
  readBooklets: string[];
  onMarkAsRead: (id: string) => void;
  recommendedBooklet: Booklet | null;
}

export default function BookletsList({
  readBooklets,
  onMarkAsRead,
  recommendedBooklet
}: BookletsListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  const isDownloadingRef = useRef(false);
  const downloadIntervalRef = useRef<any>(null);
  const downloadTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDownloadingId(null);
      }
    };
    if (downloadingId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [downloadingId]);

  useEffect(() => {
    if (!downloadingId) {
      if (downloadIntervalRef.current) {
        clearInterval(downloadIntervalRef.current);
        downloadIntervalRef.current = null;
      }
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
        downloadTimeoutRef.current = null;
      }
      isDownloadingRef.current = false;
    }
  }, [downloadingId]);

  const handleDownload = (booklet: Booklet) => {
    if (downloadingId || isDownloadingRef.current) return;
    isDownloadingRef.current = true;

    setDownloadingId(booklet.id);
    setDownloadProgress(0);
    setDownloadSuccessId(null);

    let localProgress = 0;

    const interval = setInterval(() => {
      localProgress += 20;
      if (localProgress >= 100) {
        setDownloadProgress(100);
        clearInterval(interval);
        downloadIntervalRef.current = null;

        const timeout = setTimeout(() => {
          const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const marginLeft = 20;
          const marginRight = pageWidth - 20;
          const contentWidth = marginRight - marginLeft;
          let currentPage = 1;

          const drawHeader = () => {
            doc.setFillColor(227, 20, 99);
            doc.rect(0, 0, pageWidth, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('HOSPITAL DE AMOR — BIBLIOTECA DE ORIENTAÇÕES', marginLeft, 7.5);
            doc.text('CARTILHA INFORMATIVA', marginRight, 7.5, { align: 'right' });
          };

          const drawFooter = (pageNum: number) => {
            doc.setFillColor(245, 245, 248);
            doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(160, 160, 160);
            doc.text(
              `Hospital de Amor — Fundação Pio XII | www.hospitaldeamor.org.br | Página ${pageNum}`,
              pageWidth / 2,
              pageHeight - 4,
              { align: 'center' }
            );
          };

          drawHeader();

          let cursorY = 22;

          doc.setTextColor(30, 30, 30);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(booklet.title, marginLeft, cursorY);

          cursorY += 6;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 120, 120);
          const categoryLabel = booklet.category === 'preparo' ? 'Preparo de Exames' : booklet.category === 'direitos' ? 'Direitos Sociais' : 'Tratamento';
          doc.text(`Categoria: ${categoryLabel} | ID: ${booklet.id}`, marginLeft, cursorY);

          cursorY += 4;
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(marginLeft, cursorY, marginRight, cursorY);

          cursorY += 8;

          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);

          const paragraphs = booklet.content.split('\n');

          for (const paragraph of paragraphs) {
            if (paragraph.trim() === '') {
              cursorY += 4;
              continue;
            }

            const lines = doc.splitTextToSize(paragraph, contentWidth);
            for (const line of lines) {
              if (cursorY > pageHeight - 20) {
                drawFooter(currentPage);
                doc.addPage();
                currentPage++;
                drawHeader();
                cursorY = 22;
                doc.setFontSize(9.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
              }
              doc.text(line, marginLeft, cursorY);
              cursorY += 5.5;
            }
            cursorY += 2.5;
          }

          drawFooter(currentPage);

          const fileName = `${booklet.title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
          doc.save(fileName);

          setDownloadingId(null);
          setDownloadSuccessId(booklet.id);
          onMarkAsRead(booklet.id);
          isDownloadingRef.current = false;
          downloadTimeoutRef.current = null;
          setTimeout(() => setDownloadSuccessId(null), 3000);
        }, 400);

        downloadTimeoutRef.current = timeout;
      } else {
        setDownloadProgress(localProgress);
      }
    }, 250);

    downloadIntervalRef.current = interval;
  };

  return (
    <div className="space-y-8 text-left">
      {recommendedBooklet && (
        <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-r from-primary/5 via-white to-secondary/5 rounded-3xl overflow-hidden p-6 relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-primary" />
          </div>
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between relative z-10">
            <div className="space-y-2">
              <Badge className="bg-primary text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-secondary fill-secondary animate-pulse" />
                <span>Recomendado para o preparo do seu próximo exame</span>
              </Badge>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 font-sans">
                {recommendedBooklet.title}
              </h3>
              <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
                {recommendedBooklet.description}
              </p>
            </div>
            <Button 
              onClick={() => {
                handleDownload(recommendedBooklet);
              }}
              className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-5 rounded-xl text-xs gap-2 shrink-0 shadow-lg shadow-primary/15"
            >
              <Download className="w-4 h-4" />
              Baixar Guia Recomendado
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BOOKLETS.map((booklet) => {
          const isDownloading = downloadingId === booklet.id;
          const isSuccess = downloadSuccessId === booklet.id;
          return (
            <Card
              key={booklet.id}
              className="border-zinc-200/60 dark:border-zinc-800 hover:border-primary/20 shadow-sm rounded-3xl bg-white dark:bg-zinc-950 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3 flex flex-row items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 dark:bg-zinc-900 border border-secondary/20 dark:border-zinc-800 flex items-center justify-center text-secondary shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="px-2 py-0.5 text-[8px] font-bold rounded-lg uppercase tracking-wider border-zinc-200 text-zinc-400 dark:border-zinc-800">
                      {booklet.category} • {booklet.size}
                    </Badge>
                    {readBooklets.includes(booklet.id) && (
                      <Badge variant="secondary" className="px-2 py-0.5 text-[8px] font-bold rounded-lg uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-none flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>Lido</span>
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 font-sans">
                    {booklet.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {booklet.description}
                </p>
                
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
                  <Button
                    onClick={() => {
                      handleDownload(booklet);
                    }}
                    disabled={downloadingId !== null}
                    className={`flex-1 font-bold h-10 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${
                      isSuccess
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-primary hover:bg-primary/95 text-white'
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Baixando ({downloadProgress}%)</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Download Concluído</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {downloadingId && createPortal(
        <DownloadPortal
          downloadProgress={downloadProgress}
          onClose={() => setDownloadingId(null)}
        />,
        document.body
      )}
    </div>
  );
}
