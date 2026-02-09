import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserPlus, 
  Calendar, 
  Stethoscope, 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Package,
  FlaskConical,
  Clock,
  Users,
  CreditCard,
  AlertTriangle,
  Activity as ActivityIcon
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useState, useMemo } from 'react';
import type { DashboardData, Activity, DepartmentStat } from '@/types/dashboard';

// ============================================================================
// Constants
// ============================================================================
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1'];

// ============================================================================
// Utility Functions
// ============================================================================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// ============================================================================
// Components
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  bgColor: string;
  iconColor: string;
}

const StatCard = ({ title, value, icon, trend, bgColor }: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full ${bgColor}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center text-xs mt-1">
            {trend.value >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={trend.value >= 0 ? 'text-green-600' : 'text-red-600'}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const SectionCard = ({ title, description, children, className = '' }: SectionCardProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

interface DashboardProps extends DashboardData {
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function Dashboard({
  summary,
  patients,
  appointments,
  financial,
  pharmacy,
  laboratory,
  departments,
  recent_activities,
  trends,
  period,
  last_updated,
  error,
  flash
}: DashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>((period as 'today' | 'week' | 'month' | 'year') || 'today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle period change
  const handlePeriodChange = (newPeriod: 'today' | 'week' | 'month' | 'year') => {
    setSelectedPeriod(newPeriod);
    router.get('/dashboard', { period: newPeriod }, {
      preserveState: true,
      preserveScroll: true,
      onStart: () => setIsRefreshing(true),
      onFinish: () => setIsRefreshing(false),
    });
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.reload({
      only: ['summary', 'patients', 'appointments', 'financial', 'pharmacy', 'laboratory', 'departments', 'recent_activities', 'trends', 'last_updated'],
      onFinish: () => setIsRefreshing(false),
    });
  };

  // Memoized chart data
  const patientDemographicsData = useMemo(() => {
    if (!patients?.gender_distribution) return [];
    return Object.entries(patients.gender_distribution).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
    }));
  }, [patients?.gender_distribution]);

  const appointmentStatusData = useMemo(() => {
    if (!appointments?.by_status) return [];
    return Object.entries(appointments.by_status).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
    }));
  }, [appointments?.by_status]);

  const departmentData = useMemo(() => {
    if (!departments?.departments) return [];
    return departments.departments.slice(0, 5).map((dept: DepartmentStat) => ({
      name: dept.name,
      appointments: dept.appointments_count,
      revenue: dept.revenue,
    }));
  }, [departments?.departments]);

  const agingData = useMemo(() => {
    if (!financial?.aging) return [];
    return [
      { name: 'Current', value: financial.aging.current || 0 },
      { name: '30-60 Days', value: financial.aging['30_60'] || 0 },
      { name: '60-90 Days', value: financial.aging['60_90'] || 0 },
      { name: '90+ Days', value: financial.aging['90_plus'] || 0 },
    ];
  }, [financial?.aging]);

  return (
    <HospitalLayout>
      <Head title="Hospital Dashboard" />

      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Flash Messages */}
          {flash?.success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{flash.success}</AlertDescription>
            </Alert>
          )}

          {flash?.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{flash.error}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hospital Management Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Last updated: {last_updated ? new Date(last_updated).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={(value) => handlePeriodChange(value as 'today' | 'week' | 'month' | 'year')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Patients"
              value={formatNumber(summary?.total_patients || 0)}
              icon={<Users className="h-5 w-5 text-blue-600" />}
              bgColor="bg-blue-100"
              iconColor="text-blue-600"
              trend={{ value: summary?.new_patients || 0, label: 'new this period' }}
            />
            <StatCard
              title="Total Doctors"
              value={formatNumber(summary?.total_doctors || 0)}
              icon={<Stethoscope className="h-5 w-5 text-green-600" />}
              bgColor="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              title="Appointments"
              value={formatNumber(summary?.total_appointments || 0)}
              icon={<Calendar className="h-5 w-5 text-yellow-600" />}
              bgColor="bg-yellow-100"
              iconColor="text-yellow-600"
              trend={{ value: summary?.completed_appointments || 0, label: 'completed' }}
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(summary?.total_revenue || 0)}
              icon={<DollarSign className="h-5 w-5 text-purple-600" />}
              bgColor="bg-purple-100"
              iconColor="text-purple-600"
              trend={{ value: summary?.appointment_revenue || 0, label: 'from appointments' }}
            />
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Revenue Breakdown" className="lg:col-span-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends?.daily || []}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Bill Aging">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {agingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding Bills:</span>
                  <span className="font-medium">{formatNumber(financial?.outstanding_bills || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Outstanding Amount:</span>
                  <span className="font-medium text-red-600">{formatCurrency(financial?.outstanding_amount || 0)}</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Appointments & Patients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Appointment Status">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {appointmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {appointments?.today_schedule && appointments.today_schedule.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Today's Schedule</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {appointments.today_schedule.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{apt.time}</span>
                          <span className="mx-2">-</span>
                          <span>{apt.patient_name}</span>
                        </div>
                        <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Patient Demographics">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={patientDemographicsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {patientDemographicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {patients?.age_distribution && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Age Distribution</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(patients.age_distribution).map(([age, count]) => (
                      <div key={age} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="text-muted-foreground">{age}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Departments & Pharmacy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Department Performance" className="lg:col-span-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="appointments" fill="#8884d8" name="Appointments" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Pharmacy Alerts">
              <div className="space-y-4">
                {(pharmacy?.low_stock_count || 0) > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Low Stock Alert</p>
                      <p className="text-sm text-yellow-600">{pharmacy?.low_stock_count} medicines below reorder level</p>
                    </div>
                  </div>
                )}
                {(pharmacy?.expiring_count || 0) > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">Expiring Soon</p>
                      <p className="text-sm text-orange-600">{pharmacy?.expiring_count} medicines expiring in 30 days</p>
                    </div>
                  </div>
                )}
                {(pharmacy?.expired_count || 0) > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Expired Medicines</p>
                      <p className="text-sm text-red-600">{pharmacy?.expired_count} medicines expired</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{formatNumber(pharmacy?.today_sales || 0)}</p>
                    <p className="text-xs text-blue-600">Today's Sales</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(pharmacy?.today_revenue || 0)}</p>
                    <p className="text-xs text-green-600">Today's Revenue</p>
                  </div>
                </div>
                {(pharmacy?.pending_prescriptions || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-800">Pending Prescriptions</span>
                    <Badge variant="secondary">{pharmacy?.pending_prescriptions}</Badge>
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* Laboratory & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Laboratory Status">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(laboratory?.total_today || 0)}</p>
                  <p className="text-sm text-blue-600">Tests Today</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{formatNumber(laboratory?.completed_today || 0)}</p>
                  <p className="text-sm text-green-600">Completed</p>
                </div>
              </div>
              {(laboratory?.pending_count || 0) > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Pending Tests</span>
                    <Badge variant="secondary">{laboratory?.pending_count}</Badge>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {laboratory?.pending_tests?.slice(0, 3).map((test) => (
                      <div key={test.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{test.test_type}</span>
                          <span className="text-muted-foreground mx-1">-</span>
                          <span>{test.patient_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{test.requested_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Monthly Trends">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends?.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#8884d8" 
                      name="Appointments"
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="patients" 
                      stroke="#82ca9d" 
                      name="New Patients"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* Recent Activities */}
          <SectionCard title="Recent Activities" description="Latest activities across all modules">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recent_activities && recent_activities.length > 0 ? (
                recent_activities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${
                      activity.type === 'patient' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'appointment' ? 'bg-yellow-100 text-yellow-600' :
                      activity.type === 'billing' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'pharmacy' ? 'bg-green-100 text-green-600' :
                      activity.type === 'laboratory' ? 'bg-cyan-100 text-cyan-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'patient' && <UserPlus className="h-4 w-4" />}
                      {activity.type === 'appointment' && <Calendar className="h-4 w-4" />}
                      {activity.type === 'billing' && <CreditCard className="h-4 w-4" />}
                      {activity.type === 'pharmacy' && <Package className="h-4 w-4" />}
                      {activity.type === 'laboratory' && <FlaskConical className="h-4 w-4" />}
                      {activity.type === 'doctor' && <Stethoscope className="h-4 w-4" />}
                      {activity.type === 'system' && <ActivityIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent activities</p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </HospitalLayout>
  );
}