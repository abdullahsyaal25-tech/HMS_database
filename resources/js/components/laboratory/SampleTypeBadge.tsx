import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Droplets,
  TestTube,
  Beaker,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';

export type SampleType = 
  | 'blood'
  | 'serum'
  | 'plasma'
  | 'urine'
  | 'stool'
  | 'csf'
  | 'saliva'
  | 'tissue'
  | 'semen'
  | 'sputum'
  | 'swab'
  | 'other';

export interface SampleTypeConfig {
  value: SampleType;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  description: string;
}

export const sampleTypes: SampleTypeConfig[] = [
  {
    value: 'blood',
    label: 'Whole Blood',
    icon: Droplets,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'EDTA or plain whole blood sample',
  },
  {
    value: 'serum',
    label: 'Serum',
    icon: TestTube,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Clotted blood, centrifuged for serum',
  },
  {
    value: 'plasma',
    label: 'Plasma',
    icon: TestTube,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'Anticoagulated blood plasma',
  },
  {
    value: 'urine',
    label: 'Urine',
    icon: Beaker,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Random or 24-hour urine sample',
  },
  {
    value: 'stool',
    label: 'Stool',
    icon: Beaker,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    description: 'Fresh stool sample',
  },
  {
    value: 'csf',
    label: 'CSF',
    icon: FlaskConical,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    description: 'Cerebrospinal fluid',
  },
  {
    value: 'saliva',
    label: 'Saliva',
    icon: Droplets,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    description: 'Saliva sample',
  },
  {
    value: 'tissue',
    label: 'Tissue',
    icon: FlaskConical,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    description: 'Biopsy or tissue sample',
  },
  {
    value: 'semen',
    label: 'Semen',
    icon: TestTube,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    description: 'Semen sample for analysis',
  },
  {
    value: 'sputum',
    label: 'Sputum',
    icon: Beaker,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Respiratory sputum sample',
  },
  {
    value: 'swab',
    label: 'Swab',
    icon: TestTube,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Throat, nasal, or wound swab',
  },
  {
    value: 'other',
    label: 'Other',
    icon: FlaskConical,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Other sample types',
  },
];

export interface SampleTypeBadgeProps {
  sampleType: SampleType | string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SampleTypeBadge({
  sampleType,
  size = 'md',
  showLabel = true,
  className,
}: SampleTypeBadgeProps) {
  const config = sampleTypes.find((s) => s.value === sampleType) || sampleTypes.find((s) => s.value === 'other')!;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-5 text-xs px-1.5 gap-1',
    md: 'h-6 text-sm px-2 gap-1.5',
    lg: 'h-7 text-base px-3 gap-2',
  };

  const iconSizes = {
    sm: 'size-3',
    md: 'size-3.5',
    lg: 'size-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-normal border-0',
        config.bgColor,
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}

export function SampleTypeSelect({
  value,
  onChange,
  className,
}: {
  value: SampleType | string;
  onChange: (value: SampleType) => void;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-2', className)}>
      {sampleTypes.map((sampleType) => {
        const Icon = sampleType.icon;
        const isSelected = value === sampleType.value;

        return (
          <button
            key={sampleType.value}
            type="button"
            onClick={() => onChange(sampleType.value)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg border text-left transition-all',
              isSelected
                ? cn(sampleType.bgColor, sampleType.color, 'border-current ring-1 ring-current')
                : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
            )}
          >
            <Icon className="size-4 shrink-0" />
            <div className="min-w-0">
              <div className={cn('text-sm font-medium', isSelected ? sampleType.color : 'text-foreground')}>
                {sampleType.label}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {sampleType.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default SampleTypeBadge;
