import { Head, router, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  Plus,
  ArrowLeft,
  Package,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  TrendingUp,
  PackagePlus,
  PackageMinus,
  Database,
  Tag,
  Calendar,
  DollarSign,
  Users,
  Settings,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LabMaterial } from '@/types/lab-material';
import type { LabTest } from '@/types/lab-test';
import type { User } from '@/types/index.d';

interface LabMaterialWithRelations extends LabMaterial {
  labTest: LabTest;
  createdBy: User;
}

interface LabMaterialIndexProps {
  labMaterials: {
    data: LabMaterialWithRelations[];
    links: {
      first: string;
      last: string;
      prev: string | null;
      next: string | null;
    };
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      links: {
        url: string | null;
        label: string;
        active: boolean;
      }[];
      path: string;
      per_page: number;
      to: number;
      total: number;
    };
  };
  filters: {
    status?: string;
    lab_test_id?: string;
    stock_status?: string;
    query?: string;
  };
  labTests: LabTest[];
}

export default function LabMaterialIndex({ 
  labMaterials, 
  filters,
  labTests = [],
}: LabMaterialIndexProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilters, setActiveFilters] = useState({
    query: filters.query || '',
    status: filters.status || '',
    lab_test_id: filters.lab_test_id || '',
    stock_status: filters.stock_status || '',
  });

  // Filter configurations
  const filterConfigs = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active', icon: CheckCircle },
        { label: 'Low Stock', value: 'low_stock', icon: AlertTriangle },
        { label: 'Out of Stock', value: 'out_of_stock', icon: XCircle },
      ],
    },
    {
      id: 'stock_status',
      label: 'Stock Status',
      type: 'select',
      options: [
        { label: 'Low Stock', value: 'low_stock', icon: AlertTriangle },
        { label: 'Out of Stock', value: 'out_of_stock', icon: XCircle },
      ],
    },
    ...(labTests.length > 0 ? [{
      id: 'lab_test_id',
      label: 'Associated Test',
      type: 'select',
      options: labTests.map(test => ({
        label: `${test.name} (${test.test_code})`,
        value: test.id.toString(),
      })),
    }] : []),
  ], [labTests]);

  // Statistics
  const stats = useMemo(() => {
    const data = labMaterials.data || [];
    const total = labMaterials.meta?.total || 0;
    const active = data.filter(m => m.status === 'active').length || 0;
    const lowStock = data.filter(m => m.status === 'low_stock').length || 0;
    const outOfStock = data.filter(m => m.status === 'out_of_stock').length || 0;
    const totalValue = data.reduce((sum, m) => sum + (m.quantity * m.cost_per_unit), 0);
    return { total, active, lowStock, outOfStock, totalValue };
  }, [labMaterials]);

  const handleFilterChange = (newFilters: any) => {
    setActiveFilters(newFilters);
    router.get('/laboratory/materials', newFilters, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReset = () => {
    setActiveFilters({});
    router.get('/laboratory/materials', {}, {
      preserveState: true,
      preserveScroll: true,
    });
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

  const getInitials = (name: string) => {
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

  const getStockLevelColor = (material: LabMaterialWithRelations) => {
    if (material.status === 'out_of_stock') {
      return 'text-red-600';
    } else if (material.status === 'low_stock') {
      return 'text-orange-600';
    }
    return 'text-green-600';
  };

  const MaterialCard = ({ material }: { material: LabMaterialWithRelations }) => {
    const actions = [
      {
        label: 'View',
        icon: Eye,
        href: `/laboratory/materials/${material.id}`,
        variant: 'default' as const,
      },
      {
        label: 'Edit',
        icon: Edit,
        href: `/laboratory/materials/${material.id}/edit`,
        variant: 'outline' as const,
      },
    ];

    return (
      <Card className={cn(
        'group transition-all duration-200 hover:shadow-medium border-l-4',
        material.status === 'out_of_stock' && 'border-l-red-500',
        material.status === 'low_stock' && 'border-l-orange-500',
        material.status === 'active' && 'border-l-green-500',
      )}>
        <CardContent className="p-5">
          {/* Header with Status and Material ID */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {getStatusBadge(material.status)}
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {material.material_id}
            </span>
          </div>

          {/* Material Name */}
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {material.name}
          </h3>

          {/* Associated Test */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Tag className="h-3.5 w-3.5" />
            <span>
              {material.labTest ? `${material.labTest.name} (${material.labTest.test_code})` : 'No associated test'}
            </span>
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Package className="h-4 w-4" />
                Current Stock
              </div>
              <p className={cn("text-lg font-bold mt-1", getStockLevelColor(material))}>
                {material.quantity} {material.unit}
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                Reorder Level
              </div>
              <p className="text-lg font-bold mt-1 text-orange-600">
                {material.reorder_level} {material.unit}
              </p>
            </div>
          </div>

          {/* Cost Information */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Cost: ${material.cost_per_unit}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <span>Created by: {material.createdBy?.name || 'Unknown'}</span>
            </div>
          </div>

          {/* Description */}
          {material.description && (
            <div className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {material.description}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t">
            {actions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <Link key={idx} href={action.href}>
                  <Button
                    variant={action.variant}
                    size="sm"
                    className="gap-1.5"
                  >
                    <ActionIcon className="h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title="Laboratory Materials" />
          <p className="text-muted-foreground mt-1">
            Manage laboratory materials and supplies inventory
          </p>
        </div>
      }
    >
      <Head title="Laboratory Materials" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <Link href="/laboratory/materials/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </Link>
            <Link href="/laboratory">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lab
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Materials</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Value Card */}
        <Card className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search materials..."
                value={activeFilters.query}
                onChange={(e) => handleFilterChange({ ...activeFilters, query: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Button variant="outline" onClick={() => handleReset()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-2">
            <select
              value={activeFilters.status}
              onChange={(e) => handleFilterChange({ ...activeFilters, status: e.target.value })}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            <select
              value={activeFilters.stock_status}
              onChange={(e) => handleFilterChange({ ...activeFilters, stock_status: e.target.value })}
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Stock Status</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {labTests.length > 0 && (
              <select
                value={activeFilters.lab_test_id}
                onChange={(e) => handleFilterChange({ ...activeFilters, lab_test_id: e.target.value })}
                className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Tests</option>
                {labTests.map(test => (
                  <option key={test.id} value={test.id}>
                    {test.name} ({test.test_code})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {labMaterials.data?.length || 0} of {labMaterials.meta?.total || 0} materials
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Materials Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labMaterials.data.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {labMaterials.data.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'h-12 w-12 rounded-lg flex items-center justify-center',
                        material.status === 'out_of_stock' && 'bg-red-100 text-red-600',
                        material.status === 'low_stock' && 'bg-orange-100 text-orange-600',
                        material.status === 'active' && 'bg-green-100 text-green-600',
                      )}>
                        <Package className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{material.name}</h3>
                          <span className="text-xs font-mono text-muted-foreground">
                            {material.material_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {material.labTest ? `${material.labTest.name} (${material.labTest.test_code})` : 'No test'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            {material.quantity} {material.unit}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            ${material.cost_per_unit}
                          </span>
                        </div>
                        {material.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {material.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(material.status)}
                      <Link href={`/laboratory/materials/${material.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/laboratory/materials/${material.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(labMaterials.data?.length || 0) === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No materials found</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                {activeFilters.query || activeFilters.status || activeFilters.lab_test_id
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first laboratory material.'}
              </p>
              <Link href="/laboratory/materials/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {(labMaterials.meta?.last_page || 0) > 1 && (
          <div className="flex items-center justify-between py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 font-medium">
              Showing {labMaterials.meta?.from || 0} to {labMaterials.meta?.to || 0} of {labMaterials.meta?.total || 0} results
            </p>
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <Link
                href={labMaterials.links.prev || '#'}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'h-10 px-4 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  'shadow-sm hover:shadow-md',
                  !labMaterials.links.prev && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Link>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {labMaterials.meta.links
                  .filter(link => !link.label.includes('Previous') && !link.label.includes('Next'))
                  .map((link, index) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={cn(
                        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 w-10',
                        link.active
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                        !link.url && 'opacity-50 cursor-not-allowed pointer-events-none'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
              </div>
              
              {/* Next Button */}
              <Link
                href={labMaterials.links.next || '#'}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'h-10 px-4 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  'shadow-sm hover:shadow-md',
                  !labMaterials.links.next && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </LaboratoryLayout>
  );
}