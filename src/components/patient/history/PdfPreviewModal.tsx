import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { FileText, X } from 'lucide-react';
import type { ClinicalRecord } from '../../../types';

interface PdfPreviewModalProps {
  record: ClinicalRecord;
  onClose: () => void;
}

export default function PdfPreviewModal({ record, onClose }: PdfPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="max-w-3xl w-full h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
      >
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 p-5 flex flex-row items-center justify-between shrink-0">
          <div>
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {record.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {record.type} • {new Date(record.date + 'T12:00:00').toLocaleDateString('pt-BR')} • {record.specialtyName}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <div className="flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-955">
          <iframe src={record.fileAttachment.base64} title={record.title} className="w-full h-full border-0" />
        </div>
      </Card>
    </div>,
    document.body
  );
}
