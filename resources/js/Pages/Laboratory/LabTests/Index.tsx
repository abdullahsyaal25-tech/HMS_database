import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LabTestCard } from '@/components/laboratory/LabTestCard';
import { FilterBar, type FilterConfig, type FilterState } from '@/components/laboratory/FilterBar';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  Plus,
  FlaskConical,
  Droplets,
  Microscope,
  Activity,
  Beaker,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LabTest } from '@/types/lab-test';

interface LabTestIndexProps {
  labTests: {
    data: LabTest[];
    links?: {
      first: string;
      last: string;
      prev: string | null;
      next: string | null;
    };
    meta?: {
      current_page: number;
      from: number;
      last_page: number;
      links?: {
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
  query?: string;
  status?: string;
  category?: string;
}

// Category icon mapping
const categoryIcons: Record<string, React.ElementType> = {
  hematology: Droplets,
  biochemistry: FlaskConical,
  microbiology: Microscope,
  immunology: Activity,
  urinalysis: Beaker,
};

// Category color mapping for badges
const categoryColors: Record<string, string> = {
  hematology: 'bg-lab-hematology/10 text-lab-hematology border-lab-hematology/30',
  biochemistry: 'bg-lab-biochemistry/10 text-lab-biochemistry border-lab-biochemistry/30',
  microbiology: 'bg-lab-microbiology/10 text-lab-microbiology border-lab-microbiology/30',
  immunology: 'bg-lab-immunology/10 text-lab-immunology border-lab-immunology/30',
  urinalysis: 'bg-lab-urinalysis/10 text-lab-urinalysis border-lab-urinalysis/30',
};

export default function LabTestIndex({ labTests, query = '', status = '', category = '' }: LabTestIndexProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    query,
    status,
    category,
  });

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'Hematology', value: 'hematology', icon: Droplets },
        { label: 'Biochemistry', value: 'biochemistry', icon: FlaskConical },
        { label: 'Microbiology', value: 'microbiology', icon: Microscope },
        { label: 'Immunology', value: 'immunology', icon: Activity },
        { label: 'Urinalysis', value: 'urinalysis', icon: Beaker },
      ],
    },
  ], []);

  // Get meta with fallback values
  const meta = labTests.meta || {
    current_page: 1,
    from: 0,
    to: 0,
    last_page: 1,
    total: 0,
    per_page: 10
  };

  // Statistics
  const stats = useMemo(() => {
    const total = meta.total || 0;
    const active = labTests.data?.filter(t => t.status === 'active').length || 0;
    const inactive = labTests.data?.filter(t => t.status === 'inactive').length || 0;
    return { total, active, inactive };
  }, [labTests, meta]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    router.get('/laboratory/lab-tests', newFilters, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReset = () => {
    setFilters({});
    router.get('/laboratory/lab-tests', {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (page: number) => {
    router.get('/laboratory/lab-tests', { ...filters, page }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AFN',
    }).format(amount);
  };

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours} hours`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${days}d ${remainingHours}h`;
  };

  // Transform LabTest to LabTestCard format
  const transformToCardTest = (test: LabTest) => {
    // Map database category (lowercase) to display category (proper case)
    const categoryMap: Record<string, 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Immunology' | 'Urine' | 'Serology' | 'Coagulation' | 'Molecular' | 'Stool' | 'Semen' | 'Special'> = {
      'hematology': 'Hematology',
      'biochemistry': 'Biochemistry',
      'microbiology': 'Microbiology',
      'immunology': 'Immunology',
      'urinalysis': 'Urine',
      'serology': 'Serology',
      'coagulation': 'Coagulation',
      'molecular': 'Molecular',
      'stool': 'Stool',
      'semen': 'Semen',
      'special': 'Special',
    };

    // Safely handle category - check if it exists and convert to lowercase
    const categoryKey = test.category ? test.category.toLowerCase() : 'hematology';
    const displayCategory = categoryMap[categoryKey] || 'Hematology';

    return {
      id: test.id,
      name: test.name,
      code: test.test_code,
      category: displayCategory,
      status: test.status as 'active' | 'inactive',
      cost: test.cost,
      turnaroundTime: formatTime(test.turnaround_time),
      description: test.description || undefined,
      parameters: test.parameters || undefined,
    };
  };

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title="Lab Tests" />
          <p className="text-muted-foreground mt-1">
            Manage laboratory tests and procedures
          </p>
        </div>
      }
    >
      <Head title="Lab Tests" />
      
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <Link href="/laboratory/lab-tests/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add New Test
              </Button>
            </Link>
            <Link href="/laboratory/lab-test-results">
              <Button variant="outline">
                <FlaskConical className="mr-2 h-4 w-4" />
                View Results
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tests</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <FlaskConical className="h-5 w-5 text-primary" />
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
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.inactive}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Beaker className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filterConfigs}
          value={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          onSearch={(query) => handleFilterChange({ ...filters, query })}
          searchPlaceholder="Search tests by name, code, or description..."
          showFilterChips={true}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {labTests.data?.length || 0} of {meta.total || 0} tests
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

        {/* Main Content Card with Pagination */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="p-0">
            {/* Empty State */}
            {(labTests.data?.length || 0) === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FlaskConical className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No lab tests found</h3>
                <p className="text-muted-foreground max-w-sm mb-4">
                  {filters.query || filters.status || filters.category
                    ? 'Try adjusting your filters to see more results.'
                    : 'Get started by adding your first lab test.'}
                </p>
                {(filters.query || filters.status || filters.category) && (
                  <Button variant="outline" onClick={handleReset}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Tests Grid/List */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {labTests.data.map((test) => (
                      <LabTestCard
                        key={test.id}
                        test={transformToCardTest(test)}
                        type="test"
                        onView={() => router.visit(`/laboratory/lab-tests/${test.id}`)}
                        onEdit={() => router.visit(`/laboratory/lab-tests/${test.id}/edit`)}
                        onDuplicate={() => {
                          router.post(`/laboratory/lab-tests/${test.id}/duplicate`);
                        }}
                        onDeactivate={() => {
                          const newStatus = test.status === 'active' ? 'inactive' : 'active';
                          router.visit(`/laboratory/lab-tests/${test.id}/status`, {
                            method: 'post',
                            data: {
                              status: newStatus,
                              _method: 'PATCH',
                            },
                            preserveScroll: true,
                          });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {labTests.data.map((test) => {
                      const categoryKey = (typeof filters.category === 'string' ? filters.category : 'hematology') as keyof typeof categoryIcons;
                      const CategoryIcon = categoryIcons[categoryKey] || FlaskConical;
                      return (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center',
                              categoryColors[categoryKey] || categoryColors.hematology
                            )}>
                              <CategoryIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{test.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{test.test_code}</span>
                                <span>•</span>
                                <span>{formatCurrency(test.cost)}</span>
                                <span>•</span>
                                <span>{formatTime(test.turnaround_time)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                              {test.status}
                            </Badge>
                            <Link href={`/laboratory/lab-tests/${test.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link href={`/laboratory/lab-tests/${test.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination - always visible */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {meta?.from || 0} to {meta?.to || 0} of {meta?.total || 0} results
                  </p>
                  <div className="flex items-center gap-1">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={meta?.current_page === 1}
                      onClick={() => handlePageChange(1)}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={!labTests.links?.prev}
                      onClick={() => handlePageChange((meta?.current_page || 1) - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Page Numbers */}
                    {(() => {
                      const current = meta?.current_page || 1;
                      const last = meta?.last_page || 1;
                      const pages: (number | string)[] = [];
                      
                      if (last <= 7) {
                        for (let i = 1; i <= last; i++) pages.push(i);
                      } else {
                        if (current <= 4) {
                          for (let i = 1; i <= 5; i++) pages.push(i);
                          pages.push('...');
                          pages.push(last);
                        } else if (current >= last - 3) {
                          pages.push(1);
                          pages.push('...');
                          for (let i = last - 4; i <= last; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push('...');
                          for (let i = current - 1; i <= current + 1; i++) pages.push(i);
                          pages.push('...');
                          pages.push(last);
                        }
                      }
                      
                      return pages.map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={current === page ? 'default' : 'outline'}
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handlePageChange(page as number)}
                          >
                            {page}
                          </Button>
                        )
                      ));
                    })()}
                    
                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={!labTests.links?.next}
                      onClick={() => handlePageChange((meta?.current_page || 1) + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={meta?.current_page === meta?.last_page}
                      onClick={() => handlePageChange(meta?.last_page || 1)}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </LaboratoryLayout>
  );
}
