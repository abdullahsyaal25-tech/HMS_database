import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  ArrowLeft,
  Package,
  Tag,
  Database,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  PlusCircle,
  MinusCircle,
  History,
  Settings,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LabMaterial } from '@/types/lab-material';
import type { LabTest } from '@/types/lab-test';
import type { User } from '@/types/index.d';

interface LabMaterialShowProps {
  labMaterial: LabMaterial & {
    labTest: LabTest;
    createdBy: User;
    updatedBy?: User;
  };
  recentMovements: Array<{
    id: number;
    type: 'add' | 'remove';
    quantity: number;
    reason: string;
    created_at: string;
    performed_by: {
      name: string;
      email: string;
    };
  }>;
  stockHistory: Array<{
    date: string;
    quantity: number;
    type: 'add' | 'remove';
    reason: string;
  }>;
}

export default function LabMaterialShow({ 
  labMaterial, 
  recentMovements = [],
  stockHistory = []
}: LabMaterialShowProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'history'>('overview');

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts[parts.length - 1]?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Low Stock
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  const getStockLevelColor = () => {
    if (labMaterial.status === 'out_of_stock') {
      return 'text-red-600';
    } else if (labMaterial.status === 'low_stock') {
      return 'text-orange-600';
    }
    return 'text-green-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotalValue = () => {
    return labMaterial.quantity * labMaterial.cost_per_unit;
  };

  const getStockTrend = () => {
    if (stockHistory.length < 2) return 'neutral';
    
    const latest = stockHistory[0];
    const previous = stockHistory[1];
    
    if (latest.quantity > previous.quantity) return 'up';
    if (latest.quantity < previous.quantity) return 'down';
    return 'neutral';
  };

  const trendIcon = useMemo(() => {
    const trend = getStockTrend();
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title="Material Details" />
          <p className="text-muted-foreground mt-1">
            View and manage laboratory material information
          </p>
        </div>
      }
    >
      <Head title={`Material: ${labMaterial.name}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Material Details" />
            <p className="text-muted-foreground mt-1">
              View and manage laboratory material information
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/laboratory/materials">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Materials
              </Button>
            </Link>
            <Link href={`/laboratory/materials/${labMaterial.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Material
              </Button>
            </Link>
          </div>
        </div>

        {/* Material Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Material Card */}
            <Card className={cn(
              'group transition-all duration-200 hover:shadow-medium border-l-4',
              labMaterial.status === 'out_of_stock' && 'border-l-red-500',
              labMaterial.status === 'low_stock' && 'border-l-orange-500',
              labMaterial.status === 'active' && 'border-l-green-500',
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(labMaterial.status)}
                      <span className="text-xs font-mono text-muted-foreground">
                        {labMaterial.material_id}
                      </span>
                    </div>
                    <CardTitle className="text-2xl mt-2">{labMaterial.name}</CardTitle>
                    <CardDescription>
                      {labMaterial.labTest ? `${labMaterial.labTest.name} (${labMaterial.labTest.test_code})` : 'No associated test'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/laboratory/materials/${labMaterial.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stock Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Current Stock
                    </div>
                    <p className={cn("text-2xl font-bold mt-1", getStockLevelColor())}>
                      {labMaterial.quantity} {labMaterial.unit}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      Reorder Level
                    </div>
                    <p className="text-2xl font-bold mt-1 text-orange-600">
                      {labMaterial.reorder_level} {labMaterial.unit}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Total Value
                    </div>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {formatCurrency(calculateTotalValue())}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Stock
                  </Button>
                  <Button variant="outline" size="sm">
                    <MinusCircle className="h-4 w-4 mr-1" />
                    Remove Stock
                  </Button>
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-1" />
                    View History
                  </Button>
                </div>

                {/* Description */}
                {labMaterial.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                    <p className="text-sm">{labMaterial.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-b mb-4">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: 'overview', label: 'Overview', icon: Eye },
                      { id: 'movements', label: 'Recent Movements', icon: History },
                      { id: 'history', label: 'Stock History', icon: TrendingUp },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={cn(
                            'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
                            activeTab === tab.id
                              ? 'border-primary text-primary'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Material Information</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Material Code:</span>
                            <span>{labMaterial.material_code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Unit:</span>
                            <span>{labMaterial.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cost per Unit:</span>
                            <span>{formatCurrency(labMaterial.cost_per_unit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supplier:</span>
                            <span>{labMaterial.supplier || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Status & Tracking</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span>{getStatusBadge(labMaterial.status)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{formatDate(labMaterial.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Updated:</span>
                            <span>{labMaterial.updated_at ? formatDate(labMaterial.updated_at) : 'Never'}</span>
                          </div>
                          {labMaterial.expiry_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expiry Date:</span>
                              <span className="text-red-600 font-medium">{formatDate(labMaterial.expiry_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Movements Tab */}
                {activeTab === 'movements' && (
                  <div className="space-y-4">
                    {recentMovements.length > 0 ? (
                      <div className="space-y-3">
                        {recentMovements.map((movement) => (
                          <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center",
                                movement.type === 'add' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                              )}>
                                {movement.type === 'add' ? (
                                  <PlusCircle className="h-4 w-4" />
                                ) : (
                                  <MinusCircle className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {movement.type === 'add' ? 'Added' : 'Removed'} {movement.quantity} {labMaterial.unit}
                                </div>
                                <div className="text-sm text-muted-foreground">{movement.reason}</div>
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div>{movement.performed_by.name}</div>
                              <div>{formatDate(movement.created_at)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No recent movements recorded
                      </div>
                    )}
                  </div>
                )}

                {/* Stock History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    {stockHistory.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {trendIcon}
                          <span>Stock trend: {getStockTrend()}</span>
                        </div>
                        <div className="space-y-2">
                          {stockHistory.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  {entry.type === 'add' ? (
                                    <PlusCircle className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <MinusCircle className="h-3 w-3 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{entry.type === 'add' ? 'Added' : 'Removed'} {entry.quantity} {labMaterial.unit}</div>
                                  <div className="text-xs text-muted-foreground">{entry.reason}</div>
                                </div>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No stock history available
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Material Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Material Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Material ID:</span>
                    <span className="font-mono">{labMaterial.material_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Material Code:</span>
                    <span className="font-mono">{labMaterial.material_code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit:</span>
                    <span>{labMaterial.unit}</span>
                  </div>
                </div>
                
                <div className="border-t pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Stock:</span>
                    <span className={cn(getStockLevelColor(), "font-medium")}>
                      {labMaterial.quantity} {labMaterial.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reorder Level:</span>
                    <span className="text-orange-600 font-medium">
                      {labMaterial.reorder_level} {labMaterial.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span>{getStatusBadge(labMaterial.status)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost per Unit:</span>
                  <span>{formatCurrency(labMaterial.cost_per_unit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-medium">{formatCurrency(calculateTotalValue())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supplier:</span>
                  <span>{labMaterial.supplier || 'Not specified'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Associated Test */}
            {labMaterial.labTest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Associated Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-500/10 text-blue-600 text-xs">
                        {getInitials(labMaterial.labTest.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{labMaterial.labTest.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Code: {labMaterial.labTest.test_code}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Created By */}
            {labMaterial.createdBy && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Created By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-500/10 text-gray-600 text-xs">
                        {getInitials(labMaterial.createdBy.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{labMaterial.createdBy.name}</p>
                      <p className="text-sm text-muted-foreground">{labMaterial.createdBy.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(labMaterial.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </LaboratoryLayout>
  );
}