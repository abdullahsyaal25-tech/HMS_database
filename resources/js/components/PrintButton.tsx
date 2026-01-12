import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'ghost' | 'link' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

const PrintButton: React.FC<PrintButtonProps> = ({ 
  className = '', 
  variant = 'default', 
  size = 'default' 
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button
      onClick={handlePrint}
      variant={variant}
      size={size}
      className={className}
    >
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
};

export default PrintButton;