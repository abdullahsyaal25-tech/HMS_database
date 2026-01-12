import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, X } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: ReactNode;
  printTitle?: string;
}

const PrintModal: React.FC<PrintModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  printTitle = 'Print Document' 
}) => {
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${printTitle}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.4;
                color: #000;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .info-section {
                margin: 15px 0;
              }
              .info-row {
                display: flex;
                margin: 5px 0;
              }
              .info-label {
                font-weight: bold;
                min-width: 150px;
              }
              .info-value {
                flex: 1;
              }
              @media print {
                body {
                  margin: 0;
                  padding: 10px;
                }
                @page {
                  margin: 1cm;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${printTitle}</h1>
              <p>Printed on: ${new Date().toLocaleString()}</p>
            </div>
            <div id="print-content">
              ${content instanceof HTMLElement ? content.innerHTML : content}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="print-container p-4 bg-white border rounded">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintModal;