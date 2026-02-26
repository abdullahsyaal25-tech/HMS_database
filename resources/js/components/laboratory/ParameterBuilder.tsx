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
  Plus,
  Trash2,
  GripVertical,
  Activity,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import type { TestParameters, TestParameter } from '@/types/lab-test';

interface ParameterBuilderProps {
  parameters: TestParameters | null;
  onChange: (parameters: TestParameters) => void;
}

export function ParameterBuilder({ parameters, onChange }: ParameterBuilderProps) {
  const [newParamName, setNewParamName] = React.useState('');
  const [newParamUnit, setNewParamUnit] = React.useState('');
  const [newParamDescription, setNewParamDescription] = React.useState('');
  const [editingParam, setEditingParam] = React.useState<string | null>(null);
  const [editValues, setEditValues] = React.useState<Partial<TestParameter>>({});
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const params = parameters || {};
  const paramEntries = Object.entries(params);

  const generateParamId = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9#%]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleAddParameter = () => {
    if (!newParamName.trim()) return;

    const paramId = generateParamId(newParamName);
    const newParam: TestParameter = {
      name: newParamName.trim(),
      unit: newParamUnit.trim(),
      description: newParamDescription.trim() || undefined,
    };

    onChange({
      ...params,
      [paramId]: newParam,
    });

    setNewParamName('');
    setNewParamUnit('');
    setNewParamDescription('');
  };

  const handleRemoveParameter = (paramId: string) => {
    const newParams = { ...params };
    delete newParams[paramId];
    onChange(newParams);
    if (editingParam === paramId) {
      setEditingParam(null);
    }
  };

  const handleStartEdit = (paramId: string, param: TestParameter) => {
    setEditingParam(paramId);
    setEditValues({ ...param });
  };

  const handleSaveEdit = (paramId: string) => {
    if (!editValues.name?.trim()) return;

    const newParams = { ...params };
    newParams[paramId] = {
      name: editValues.name.trim(),
      unit: editValues.unit?.trim() || '',
      description: editValues.description?.trim() || undefined,
    };

    onChange(newParams);
    setEditingParam(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingParam(null);
    setEditValues({});
  };

  const toggleItem = (paramId: string) => {
    setOpenItems(prev => 
      prev.includes(paramId) 
        ? prev.filter(id => id !== paramId)
        : [...prev, paramId]
    );
  };

  const commonUnits = [
    'g/dL', 'mg/dL', 'mmol/L', 'μmol/L', 'IU/L', 'U/L', 
    'fL', 'pg', '10^9/L', '10^12/L', '%', 'ratio', 
    'mEq/L', 'mm/hr', 'seconds', 'minutes', 'mL', 'cells/μL'
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <CardTitle>Test Parameters</CardTitle>
            <CardDescription>
              Define measurable parameters for this test ({paramEntries.length} defined)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Parameter */}
        <div className="p-4 rounded-lg bg-muted/50 border border-dashed space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Parameter
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="param-name">Parameter Name *</Label>
              <Input
                id="param-name"
                value={newParamName}
                onChange={(e) => setNewParamName(e.target.value)}
                placeholder="e.g., Hemoglobin, Glucose, WBC"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParameter();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="param-unit">Unit</Label>
              <div className="flex gap-2">
                <Input
                  id="param-unit"
                  value={newParamUnit}
                  onChange={(e) => setNewParamUnit(e.target.value)}
                  placeholder="e.g., g/dL, mmol/L"
                  list="common-units"
                  className="flex-1"
                />
                <datalist id="common-units">
                  {commonUnits.map((unit) => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="param-description">Description (Optional)</Label>
            <Input
              id="param-description"
              value={newParamDescription}
              onChange={(e) => setNewParamDescription(e.target.value)}
              placeholder="Brief description of this parameter..."
            />
          </div>
          
          <Button
            type="button"
            onClick={handleAddParameter}
            disabled={!newParamName.trim()}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Parameter
          </Button>
        </div>

        {/* Parameters List */}
        {paramEntries.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Defined Parameters
            </h4>
            
            <div className="space-y-2">
              {paramEntries.map(([paramId, param], index) => (
                <Collapsible
                  key={paramId}
                  open={openItems.includes(paramId)}
                  onOpenChange={() => toggleItem(paramId)}
                  className="border rounded-lg px-4 data-[state=open]:border-primary/50"
                >
                  <CollapsibleTrigger className="flex items-center gap-3 w-full py-3 hover:no-underline">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono text-xs">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 text-left">
                      <span className="font-medium">{param.name}</span>
                      {param.unit && (
                        <span className="text-muted-foreground ml-2">
                          ({param.unit})
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    {editingParam === paramId ? (
                      <div className="space-y-4 pt-2 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Parameter Name</Label>
                            <Input
                              value={editValues.name || ''}
                              onChange={(e) =>
                                setEditValues({ ...editValues, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit</Label>
                            <Input
                              value={editValues.unit || ''}
                              onChange={(e) =>
                                setEditValues({ ...editValues, unit: e.target.value })
                              }
                              list="common-units-edit"
                            />
                            <datalist id="common-units-edit">
                              {commonUnits.map((unit) => (
                                <option key={unit} value={unit} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={editValues.description || ''}
                            onChange={(e) =>
                              setEditValues({ ...editValues, description: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSaveEdit(paramId)}
                          >
                            Save Changes
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2 pb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">ID:</span>
                            <code className="ml-2 bg-muted px-1.5 py-0.5 rounded text-xs">
                              {paramId}
                            </code>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Unit:</span>
                            <span className="ml-2 font-medium">
                              {param.unit || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {param.description && (
                          <p className="text-sm text-muted-foreground">
                            {param.description}
                          </p>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(paramId, param)}
                          >
                            <Settings2 className="mr-2 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveParameter(paramId)}
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No parameters defined yet</p>
            <p className="text-sm">
              Add parameters to define what values will be measured in test results
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ParameterBuilder;
