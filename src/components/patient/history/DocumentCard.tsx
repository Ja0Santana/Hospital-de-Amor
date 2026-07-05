import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { FileText, Calendar, Eye, Trash2 } from 'lucide-react';
import type { ClinicalRecord } from '../../../types';

interface DocumentCardProps {
  record: ClinicalRecord;
  onPreview: (record: ClinicalRecord) => void;
  onDelete: (id: number) => void;
}

export default function DocumentCard({ record, onPreview, onDelete }: DocumentCardProps) {
  const getBadgeStyle = (t: 'Exame' | 'Laudo' | 'Receituário') => {
    const styles = {
      Exame: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      Laudo: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
      Receituário:
        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return styles[t];
  };

  return (
    <Card
      className="border-zinc-200/80 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-800 transition-all rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-xs"
      role="listitem"
    >
      <CardContent className="p-4 flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl text-zinc-500 shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className="font-bold text-zinc-800 dark:text-zinc-200 text-sm truncate max-w-[200px] sm:max-w-[300px]"
                title={record.title}
              >
                {record.title}
              </h4>
              <Badge className={`${getBadgeStyle(record.type)} text-[9px] font-bold px-1.5 py-0.5`}>
                {record.type}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-550 flex-wrap">
              <span className="flex items-center gap-1 text-zinc-500">
                <Calendar className="w-3 h-3 text-zinc-400" />
                <time dateTime={record.date}>
                  {new Date(record.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </time>
              </span>
              <span>•</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-400">{record.specialtyName}</span>
              <span>•</span>
              <span className="text-zinc-500">{(record.fileAttachment.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onPreview(record)}
            className="h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => record.id && onDelete(record.id)}
            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
