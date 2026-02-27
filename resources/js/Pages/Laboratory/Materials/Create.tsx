import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  Plus,
  ArrowLeft,
  Save,
  Package,
  Search,
  Tag,
  Database,
  DollarSign,
  AlertTriangle,
  Calendar,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LabTest } from '@/types/lab-test';

interface LabMaterialCreateProps {
  labTests: LabTest[];
}

export default function LabMaterialCreate({ labTests = [] }: LabMaterialCreateProps) {
  const [labTestSearch, setLabTestSearch] = useState('');
  const [showLabTestDropdown, setShowLabTestDropdown] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    quantity: 0,
    lab_test_id: '',
    description: '',
    status: 'active' as 'active' | 'low_stock' | 'out_of_stock',
    reorder_level: 10,
    unit: 'units',
    cost_per_unit: 0,
    supplier: '',
    expiry_date: '',
  });

  // Filter lab tests based on search
  const filteredLabTests = useMemo(() => {
    if (!labTestSearch) return labTests.slice(0, 10);
    const search = labTestSearch.toLowerCase();
    return labTests.filter(test => 
      test.name.toLowerCase().includes(search) ||
      test.test_code.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [labTests, labTestSearch]);

  // Get selected lab test
  const selectedLabTest = labTests.find(test => test.id.toString() === data.lab_test_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/laboratory/materials');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    setData(name as keyof typeof data, newValue);
  };

  const handleLabTestSelect = (labTestId: string, labTestName: string) => {
    setData('lab_test_id', labTestId);
    setLabTestSearch(labTestName);
    setShowLabTestDropdown(false);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts[parts.length - 1]?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const getStatusOptions = [
    { value: 'active', label: 'Active', icon: CheckCircle, color: 'text-green-600' },
    { value: 'low_stock', label: 'Low Stock', icon: AlertTriangle, color: 'text-orange-600' },
    { value: 'out_of_stock', label: 'Out of Stock', icon: XCircle, color: 'text-red-600' },
  ];

  const getUnitOptions = [
    'units', 'ml', 'mg', 'g', 'L', 'kg', 'pcs', 'bottles', 'tubes', 'vials'
  ];

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title="Create Laboratory Material" />
          <p className="text-muted-foreground mt-1">
            Add a new laboratory material or supply to inventory
          </p>
        </div>
      }
    >
      <Head title="Create Laboratory Material" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Create Laboratory Material" />
            <p className="text-muted-foreground mt-1">
              Add a new laboratory material or supply to inventory
            </p>
          </div>

          <Link href="/laboratory/materials">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Materials
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Material Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Material Information</CardTitle>
                      <CardDescription>Basic information about the material</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Material Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Material Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={handleChange}
                      placeholder="e.g., Test Tubes, Reagents, Gloves..."
                      className={cn(errors.name && "border-destructive")}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Associated Lab Test */}
                  <div className="space-y-2">
                    <Label htmlFor="lab_test_search">Associated Lab Test</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lab_test_search"
                        value={labTestSearch}
                        onChange={(e) => {
                          setLabTestSearch(e.target.value);
                          setShowLabTestDropdown(true);
                          if (!e.target.value) {
                            setData('lab_test_id', '');
                          }
                        }}
                        onFocus={() => setShowLabTestDropdown(true)}
                        placeholder="Search by test name or code..."
                        className={cn("pl-9", errors.lab_test_id && "border-destructive")}
                      />
                    </div>
                    
                    {/* Lab Test Dropdown */}
                    {showLabTestDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowLabTestDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredLabTests.length > 0 ? (
                            filteredLabTests.map((test) => (
                              <button
                                key={test.id}
                                type="button"
                                onClick={() => handleLabTestSelect(
                                  test.id.toString(),
                                  `${test.name} (${test.test_code})`
                                )}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-blue-500/10 text-blue-600 text-xs">
                                    {getInitials(test.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{test.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Code: {test.test_code}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                              No lab tests found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {errors.lab_test_id && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.lab_test_id}
                      </p>
                    )}
                  </div>

                  {/* Selected Lab Test Display */}
                  {selectedLabTest && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-500/10 text-blue-600">
                          {getInitials(selectedLabTest.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedLabTest.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Test Code: {selectedLabTest.test_code}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={data.description}
                      onChange={handleChange}
                      placeholder="Enter a detailed description of this material..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Database className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Inventory Management</CardTitle>
                      <CardDescription>Stock and reorder settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Current Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Current Quantity *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="0"
                          value={data.quantity}
                          onChange={handleChange}
                          className={cn(errors.quantity && "border-destructive")}
                        />
                        <Select
                          value={data.unit}
                          onValueChange={(value) => setData('unit', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {getUnitOptions.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.quantity && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.quantity}
                        </p>
                      )}
                    </div>

                    {/* Reorder Level */}
                    <div className="space-y-2">
                      <Label htmlFor="reorder_level">Reorder Level *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="reorder_level"
                          name="reorder_level"
                          type="number"
                          min="0"
                          value={data.reorder_level}
                          onChange={handleChange}
                          className={cn(errors.reorder_level && "border-destructive")}
                        />
                        <span className="self-end text-sm text-muted-foreground">
                          {data.unit}
                        </span>
                      </div>
                      {errors.reorder_level && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.reorder_level}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {getStatusOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = data.status === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setData('status', option.value as any)}
                            className={cn(
                              'relative flex flex-col items-center p-4 border-2 rounded-lg transition-all',
                              isSelected ? 'border-green-500 bg-green-50' : 'border-muted bg-background hover:bg-muted/50',
                            )}
                          >
                            <Icon className={cn(
                              'h-6 w-6 mb-2',
                              isSelected ? 'text-green-600' : 'text-muted-foreground'
                            )} />
                            <span className="font-semibold">{option.label}</span>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {errors.status && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.status}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Supplier Information</CardTitle>
                      <CardDescription>Cost and supplier details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cost per Unit */}
                    <div className="space-y-2">
                      <Label htmlFor="cost_per_unit">Cost per Unit *</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center border rounded-md px-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                          <Input
                            id="cost_per_unit"
                            name="cost_per_unit"
                            type="number"
                            min="0"
                            step="0.01"
                            value={data.cost_per_unit}
                            onChange={handleChange}
                            className={cn("border-0 focus:ring-0", errors.cost_per_unit && "border-destructive")}
                          />
                        </div>
                      </div>
                      {errors.cost_per_unit && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.cost_per_unit}
                        </p>
                      )}
                    </div>

                    {/* Supplier */}
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        name="supplier"
                        value={data.supplier}
                        onChange={handleChange}
                        placeholder="e.g., LabCorp, Sigma-Aldrich..."
                      />
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="expiry_date"
                        name="expiry_date"
                        type="date"
                        value={data.expiry_date}
                        onChange={handleChange}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">Material Preview</CardTitle>
                  <CardDescription>Review before creating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Material Name */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Material Name</p>
                    <p className="font-medium">{data.name || 'Not specified'}</p>
                  </div>

                  {/* Associated Test */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Associated Test</p>
                    {selectedLabTest ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-blue-500/10 text-blue-600 text-xs">
                            {getInitials(selectedLabTest.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{selectedLabTest.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No test selected</span>
                    )}
                  </div>

                  {/* Current Stock */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Stock</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{data.quantity} {data.unit}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        data.status === 'active' && "bg-green-100 text-green-800",
                        data.status === 'low_stock' && "bg-orange-100 text-orange-800",
                        data.status === 'out_of_stock' && "bg-red-100 text-red-800"
                      )}>
                        {getStatusOptions.find(opt => opt.value === data.status)?.label}
                      </span>
                    </div>
                  </div>

                  {/* Reorder Level */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Reorder Level</p>
                    <p className="font-medium">{data.reorder_level} {data.unit}</p>
                  </div>

                  {/* Cost Information */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Cost Information</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${data.cost_per_unit}
                      </span>
                      {data.supplier && (
                        <>
                          <span>•</span>
                          <span className="text-muted-foreground">{data.supplier}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expiry Date */}
                  {data.expiry_date && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Expiry Date</p>
                      <p className="text-sm">
                        {new Date(data.expiry_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>Material will be auto-assigned ID upon creation</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 space-y-2">
                    <Button
                      type="submit"
                      disabled={processing}
                      className="w-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {processing ? 'Creating...' : 'Create Material'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => reset()}
                      disabled={processing}
                      className="w-full"
                    >
                      Reset Form
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-medium">
                      ${(data.quantity * data.cost_per_unit).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={cn(
                      "font-medium",
                      data.status === 'active' && "text-green-600",
                      data.status === 'low_stock' && "text-orange-600",
                      data.status === 'out_of_stock' && "text-red-600"
                    )}>
                      {getStatusOptions.find(opt => opt.value === data.status)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Low Stock Alert:</span>
                    <span className={cn(
                      "font-medium",
                      data.quantity <= data.reorder_level ? "text-orange-600" : "text-green-600"
                    )}>
                      {data.quantity <= data.reorder_level ? 'Yes' : 'No'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </LaboratoryLayout>
  );
}