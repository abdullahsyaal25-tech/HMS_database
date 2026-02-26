import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Scale,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { ReferenceRanges, ReferenceRange, TestParameters } from '@/types/lab-test';

interface ReferenceRangeBuilderProps {
  referenceRanges: ReferenceRanges | null;
  parameters: TestParameters | null;
  onChange: (ranges: ReferenceRanges) => void;
}

type RangeType = 'numeric' | 'text' | 'boolean';

export function ReferenceRangeBuilder({
  referenceRanges,
  parameters,
  onChange,
}: ReferenceRangeBuilderProps) {
  const [selectedParam, setSelectedParam] = React.useState<string>('');
  const [rangeType, setRangeType] = React.useState<RangeType>('numeric');
  const [minValue, setMinValue] = React.useState<string>('');
  const [maxValue, setMaxValue] = React.useState<string>('');
  const [textValues, setTextValues] = React.useState<string>('');
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const ranges = referenceRanges || {};
  const params = parameters || {};
  const paramEntries = Object.entries(params);
  const rangeEntries = Object.entries(ranges);

  const toggleItem = (rangeId: string) => {
    setOpenItems((prev) =>
      prev.includes(rangeId)
        ? prev.filter((id) => id !== rangeId)
        : [...prev, rangeId]
    );
  };

  const handleAddRange = () => {
    if (!selectedParam) return;

    const param = params[selectedParam];
    if (!param) return;

    let newRange: ReferenceRange;

    if (rangeType === 'numeric') {
      newRange = {
        min: minValue ? parseFloat(minValue) : undefined,
        max: maxValue ? parseFloat(maxValue) : undefined,
        unit: param.unit,
      };
    } else if (rangeType === 'text') {
      newRange = {
        values: textValues
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        unit: param.unit,
      };
    } else {
      newRange = {
        values: ['Positive', 'Negative'],
        unit: param.unit,
      };
    }

    onChange({
      ...ranges,
      [selectedParam]: newRange,
    });

    // Reset form
    setSelectedParam('');
    setMinValue('');
    setMaxValue('');
    setTextValues('');
    setRangeType('numeric');
  };

  const handleRemoveRange = (paramId: string) => {
    const newRanges = { ...ranges };
    delete newRanges[paramId];
    onChange(newRanges);
  };

  const getRangeDisplay = (range: ReferenceRange): string => {
    if (range.min !== undefined && range.max !== undefined) {
      return `${range.min} - ${range.max} ${range.unit || ''}`;
    }
    if (range.min !== undefined) {
      return `> ${range.min} ${range.unit || ''}`;
    }
    if (range.max !== undefined) {
      return `< ${range.max} ${range.unit || ''}`;
    }
    if (range.values && range.values.length > 0) {
      return range.values.join(', ');
    }
    return 'No range defined';
  };

  const getRangeType = (range: ReferenceRange): RangeType => {
    if (range.values && range.values.length > 0) {
      if (range.values.length === 2 && 
          range.values.includes('Positive') && 
          range.values.includes('Negative')) {
        return 'boolean';
      }
      return 'text';
    }
    return 'numeric';
  };

  const availableParams = paramEntries.filter(([paramId]) => !ranges[paramId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Scale className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <CardTitle>Reference Ranges</CardTitle>
            <CardDescription>
              Define normal reference ranges for each parameter ({rangeEntries.length} defined)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Range */}
        {availableParams.length > 0 && (
          <div className="p-4 rounded-lg bg-muted/50 border border-dashed space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Reference Range
            </h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Parameter</Label>
                <Select value={selectedParam} onValueChange={setSelectedParam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParams.map(([paramId, param]) => (
                      <SelectItem key={paramId} value={paramId}>
                        {param.name} {param.unit && `(${param.unit})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedParam && (
                <>
                  <div className="space-y-2">
                    <Label>Range Type</Label>
                    <Select
                      value={rangeType}
                      onValueChange={(v) => setRangeType(v as RangeType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numeric">Numeric Range (Min - Max)</SelectItem>
                        <SelectItem value="text">Text Values (comma separated)</SelectItem>
                        <SelectItem value="boolean">Positive/Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {rangeType === 'numeric' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Value</Label>
                        <Input
                          type="number"
                          step="any"
                          value={minValue}
                          onChange={(e) => setMinValue(e.target.value)}
                          placeholder="e.g., 13.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Value</Label>
                        <Input
                          type="number"
                          step="any"
                          value={maxValue}
                          onChange={(e) => setMaxValue(e.target.value)}
                          placeholder="e.g., 17.5"
                        />
                      </div>
                    </div>
                  )}

                  {rangeType === 'text' && (
                    <div className="space-y-2">
                      <Label>Valid Values (comma separated)</Label>
                      <Input
                        value={textValues}
                        onChange={(e) => setTextValues(e.target.value)}
                        placeholder="e.g., Normal, Abnormal, Borderline"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter possible values separated by commas
                      </p>
                    </div>
                  )}

                  {rangeType === 'boolean' && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Info className="h-4 w-4" />
                        <span className="text-sm">
                          This will create a Positive/Negative reference range
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleAddRange}
                    disabled={
                      rangeType === 'numeric'
                        ? !minValue && !maxValue
                        : rangeType === 'text'
                        ? !textValues.trim()
                        : false
                    }
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Range
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {availableParams.length === 0 && paramEntries.length > 0 && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">
                All parameters have reference ranges defined
              </span>
            </div>
          </div>
        )}

        {paramEntries.length === 0 && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Define parameters first before adding reference ranges
              </span>
            </div>
          </div>
        )}

        {/* Ranges List */}
        {rangeEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Defined Reference Ranges
            </h4>

            <div className="space-y-2">
              {rangeEntries.map(([paramId, range]) => {
                const param = params[paramId];
                const type = getRangeType(range);

                return (
                  <Collapsible
                    key={paramId}
                    open={openItems.includes(paramId)}
                    onOpenChange={() => toggleItem(paramId)}
                    className="border rounded-lg px-4 data-[state=open]:border-primary/50"
                  >
                    <CollapsibleTrigger className="flex items-center gap-3 w-full py-3 hover:no-underline">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 text-left">
                        <span className="font-medium">
                          {param?.name || paramId}
                        </span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          {getRangeDisplay(range)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {type === 'numeric'
                          ? 'Numeric'
                          : type === 'boolean'
                          ? 'Boolean'
                          : 'Text'}
                      </Badge>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="space-y-3 pt-2 pb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Parameter ID:</span>
                            <code className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs">
                              {paramId}
                            </code>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <span className="ml-2 font-medium capitalize">{type}</span>
                          </div>
                        </div>

                        {type === 'numeric' && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Range:</span>
                              <span className="ml-2 font-medium">
                                {range.min !== undefined ? range.min : '—'} {' to '}{' '}
                                {range.max !== undefined ? range.max : '—'}{' '}
                                {range.unit}
                              </span>
                            </div>
                          </div>
                        )}

                        {type === 'text' && range.values && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Valid values:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {range.values.map((v) => (
                                  <Badge key={v} variant="secondary" className="text-xs">
                                    {v}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {type === 'boolean' && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Valid values:</span>
                              <div className="flex gap-2 mt-1">
                                <Badge
                                  variant="default"
                                  className="bg-green-500 text-xs"
                                >
                                  Positive
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  Negative
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveRange(paramId)}
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Remove Range
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReferenceRangeBuilder;
