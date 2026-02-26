import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Wallet as WalletIcon,
    TrendingUp,
    Calendar,
    DollarSign,
    Activity,
    RefreshCw,
    FlaskConical,
    Pill,
    Stethoscope,
    ArrowUpRight,
    Clock,
    PieChart,
    BarChart3,
    Target,
    Zap,
    Calculator
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import RefreshAllDataButton from '@/components/RefreshAllDataButton';
import { DayStatusBanner } from '@/components/DayStatusBanner';
import { useDayStatus } from '@/hooks/useDayStatus';

interface Wallet {
    id: number;
    name: string;
    balance: number;
    created_at: string;
    updated_at: string;
}

interface RevenueData {
    today: {
        appointments: number;
        departments: number;
        pharmacy: number;
        laboratory: number;
        total: number;
    };
    this_week: {
        appointments: number;
        departments: number;
        pharmacy: number;
        laboratory: number;
        total: number;
    };
    this_month: {
        appointments: number;
        departments: number;
        pharmacy: number;
        laboratory: number;
        total: number;
    };
    this_year: {
        appointments: number;
        departments: number;
        pharmacy: number;
        laboratory: number;
        total: number;
    };
}

// Default revenue data structure to prevent null errors
const defaultRevenueData: RevenueData = {
    today: { appointments: 0, departments: 0, pharmacy: 0, laboratory: 0, total: 0 },
    this_week: { appointments: 0, departments: 0, pharmacy: 0, laboratory: 0, total: 0 },
    this_month: { appointments: 0, departments: 0, pharmacy: 0, laboratory: 0, total: 0 },
    this_year: { appointments: 0, departments: 0, pharmacy: 0, laboratory: 0, total: 0 },
};

// Helper function to ensure revenue data is never null
const ensureRevenueData = (data: RevenueData | null | undefined): RevenueData => {
    if (!data) {
        console.warn('[Wallet/Index] Revenue data is null/undefined, using default data');
        return defaultRevenueData;
    }
    
    // Validate that all required properties exist
    const safeData: RevenueData = {
        today: data.today || defaultRevenueData.today,
        this_week: data.this_week || defaultRevenueData.this_week,
        this_month: data.this_month || defaultRevenueData.this_month,
        this_year: data.this_year || defaultRevenueData.this_year,
    };
    
    // Ensure all nested objects have required properties
    Object.keys(safeData).forEach(period => {
        const periodData = safeData[period as keyof RevenueData];
        if (!periodData) {
            safeData[period as keyof RevenueData] = defaultRevenueData[period as keyof RevenueData];
        } else {
            safeData[period as keyof RevenueData] = {
                appointments: periodData.appointments ?? 0,
                departments: periodData.departments ?? 0,
                pharmacy: periodData.pharmacy ?? 0,
                laboratory: periodData.laboratory ?? 0,
                total: periodData.total ?? 0,
            };
        }
    });
    
    return safeData;
};

interface Props {
    wallet: Wallet;
    displayBalance?: number;
    revenueData?: RevenueData;
}

export default function Index({ wallet: initialWallet, displayBalance: initialDisplayBalance, revenueData: initialRevenueData }: Props) {
    // DIAGNOSTIC LOG: Track initial prop values
    console.log('[Wallet/Index] Initial props received:', { 
        hasWallet: !!initialWallet, 
        hasRevenueData: !!initialRevenueData,
        revenueDataKeys: initialRevenueData ? Object.keys(initialRevenueData) : 'N/A'
    });
    
    const [wallet, setWallet] = useState(initialWallet);
    // Use ensureRevenueData helper to guarantee safe data structure
    const safeRevenueData = ensureRevenueData(initialRevenueData);
    
    // DIAGNOSTIC LOG: Track safeRevenueData
    console.log('[Wallet/Index] safeRevenueData:', { 
        isDefault: !initialRevenueData,
        hasToday: !!safeRevenueData?.today,
        hasThisMonth: !!safeRevenueData?.this_month
    });
    
    const [revenueData, setRevenueData] = useState<RevenueData>(safeRevenueData);
    const [displayBalance, setDisplayBalance] = useState<number | undefined>(initialDisplayBalance);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [activeTab, setActiveTab] = useState('overview');
    const [todayRevenueCalculated, setTodayRevenueCalculated] = useState(false);
    const [calculatedTodayRevenue, setCalculatedTodayRevenue] = useState<number | null>(null);

    // Smart Day Detection
    const { dayStatus, yesterdaySummary, isLoading: isDayStatusLoading, archiveDay } = useDayStatus();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'today': return 'Today';
            case 'this_week': return 'This Week';
            case 'this_month': return 'This Month';
            case 'this_year': return 'This Year';
            default: return period;
        }
    };

    // Calculate percentage for progress bars
    const calculatePercentage = (value: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    };

    // Fetch real-time data
    const fetchRealtimeData = async () => {
        try {
            setIsLoading(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/api/v1/wallet/realtime', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                setWallet(data.wallet);
                setDisplayBalance(data.displayBalance);
                // Ensure revenueData is not null before setting
                if (data.revenueData) {
                    setRevenueData(data.revenueData);
                }
                setLastUpdated(new Date());
            } else {
                console.error('Failed to fetch real-time data:', response.statusText);
            }
        } catch (error) {
            console.error('Failed to fetch real-time data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Manual refresh
    const handleRefresh = () => {
        fetchRealtimeData();
    };

    // State for today's services breakdown
    const [todayServicesData, setTodayServicesData] = useState({
        appointments: 0,
        departments: 0,
        pharmacy: 0,
        laboratory: 0,
    });

    // Calculate Today's Revenue from all sources
    const calculateTodayRevenue = async () => {
        try {
            setIsLoading(true);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            const response = await fetch('/api/v1/wallet/today-revenue', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                
                // Handle null revenue data gracefully
                if (!data.revenue) {
                    console.error('API response missing revenue data:', data);
                    setTodayRevenueCalculated(true);
                    setIsLoading(false);
                    return;
                }
                
                const todayTotal = data.revenue.total;
                setCalculatedTodayRevenue(todayTotal);
                setTodayRevenueCalculated(true);
                setTodayServicesData({
                    appointments: data.revenue.appointments,
                    departments: data.revenue.departments,
                    pharmacy: data.revenue.pharmacy,
                    laboratory: data.revenue.laboratory,
                });
                
                // Update the main revenueData.today values as well
                setRevenueData(prev => {
                    // Ensure we have valid data to work with
                    const currentData = prev || defaultRevenueData;
                    return {
                        ...currentData,
                        today: {
                            appointments: data.revenue.appointments ?? 0,
                            departments: data.revenue.departments ?? 0,
                            pharmacy: data.revenue.pharmacy ?? 0,
                            laboratory: data.revenue.laboratory ?? 0,
                            total: todayTotal ?? 0,
                        }
                    };
                });
                
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to calculate today\'s revenue:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Current period data - with null safety
    // DIAGNOSTIC LOG: Check revenueData before accessing
    console.log('[Wallet/Index] Before accessing currentData:', {
        revenueDataNull: revenueData === null,
        revenueDataUndefined: revenueData === undefined,
        revenueDataThisMonth: revenueData?.this_month
    });
    
    // Ensure revenueData is never null - use default if needed
    const safeCurrentData = revenueData || defaultRevenueData;
    const currentData = safeCurrentData.this_month;

    return (
        <HospitalLayout>
            <Head title="Wallet & Revenue Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 pt-6 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Heading 
                            title="Revenue Dashboard" 
                            description="Comprehensive overview of hospital revenue streams"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white px-3 py-2 rounded-lg shadow-sm border">
                            <Clock className="h-4 w-4" />
                            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
                        </div>
                        <RefreshAllDataButton />

                    </div>
                </div>

                {/* Smart Day Detection Banner */}
                <DayStatusBanner 
                    dayStatus={dayStatus} 
                    yesterdaySummary={yesterdaySummary} 
                    onArchiveDay={archiveDay} 
                    isLoading={isDayStatusLoading} 
                />

                {/* Main Stats Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {/* Wallet Balance */}
                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-100">Total Wallet Balance</CardTitle>
                            <div className="bg-white/20 p-2 rounded-full">
                                <WalletIcon className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">
                                {formatCurrency(displayBalance ?? wallet.balance)}
                            </div>
                            <p className="text-xs text-indigo-200 mt-1 flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Hospital Main Account
                            </p>
                        </CardContent>
                    </Card>

                    {/* Today's Revenue */}
                    <Card className={`bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-xl ${todayRevenueCalculated ? 'ring-4 ring-emerald-300' : ''}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-100">
                                {todayRevenueCalculated ? "Today's Revenue (Calculated)" : "Today's Revenue"}
                            </CardTitle>
                            <div className="bg-white/20 p-2 rounded-full">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">
                                {todayRevenueCalculated && calculatedTodayRevenue !== null
                                    ? formatCurrency(calculatedTodayRevenue)
                                    : formatCurrency(safeCurrentData.today.total)}
                            </div>
                            <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                {todayRevenueCalculated
                                    ? 'All sources included - Lab, Dept, Pharmacy, Appointments'
                                    : 'From all sources'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* This Month Revenue */}
                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-100">This Month</CardTitle>
                            <div className="bg-white/20 p-2 rounded-full">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">
                                {formatCurrency(safeCurrentData.this_month.total)}
                            </div>
                            <p className="text-xs text-blue-200 mt-1 flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                Monthly Performance
                            </p>
                        </CardContent>
                    </Card>

                    {/* This Year Revenue */}
                    <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-100">This Year</CardTitle>
                            <div className="bg-white/20 p-2 rounded-full">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">
                                {formatCurrency(safeCurrentData.this_year.total)}
                            </div>
                            <p className="text-xs text-amber-200 mt-1 flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Annual Total
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue Breakdown by Source */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                    {/* Revenue Source Cards */}
                    <Card className="border-0 shadow-xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <PieChart className="h-5 w-5 text-blue-600" />
                                Revenue by Department
                            </CardTitle>
                            <CardDescription>Current month breakdown</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                {/* Appointments */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <Stethoscope className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Appointments</p>
                                                <p className="text-xs text-muted-foreground">Doctor consultations</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-900">{formatCurrency(currentData.appointments)}</p>
                                            <p className="text-xs text-muted-foreground">{calculatePercentage(currentData.appointments, currentData.total)}% of total</p>
                                        </div>
                                    </div>
                                    <Progress value={calculatePercentage(currentData.appointments, currentData.total)} className="h-2 bg-blue-100" />
                                </div>

                                {/* Department Services */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                <Activity className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Department Services</p>
                                                <p className="text-xs text-muted-foreground">Medical services</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-900">{formatCurrency(currentData.departments)}</p>
                                            <p className="text-xs text-muted-foreground">{calculatePercentage(currentData.departments, currentData.total)}% of total</p>
                                        </div>
                                    </div>
                                    <Progress value={calculatePercentage(currentData.departments, currentData.total)} className="h-2 bg-emerald-100" />
                                </div>

                                {/* Pharmacy */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                                <Pill className="h-5 w-5 text-violet-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Pharmacy</p>
                                                <p className="text-xs text-muted-foreground">Medicine sales</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-900">{formatCurrency(currentData.pharmacy)}</p>
                                            <p className="text-xs text-muted-foreground">{calculatePercentage(currentData.pharmacy, currentData.total)}% of total</p>
                                        </div>
                                    </div>
                                    <Progress value={calculatePercentage(currentData.pharmacy, currentData.total)} className="h-2 bg-violet-100" />
                                </div>

                                {/* Laboratory */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                                <FlaskConical className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Laboratory</p>
                                                <p className="text-xs text-muted-foreground">Lab tests</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-900">{formatCurrency(currentData.laboratory)}</p>
                                            <p className="text-xs text-muted-foreground">{calculatePercentage(currentData.laboratory, currentData.total)}% of total</p>
                                        </div>
                                    </div>
                                    <Progress value={calculatePercentage(currentData.laboratory, currentData.total)} className="h-2 bg-amber-100" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Period Comparison */}
                    <Card className="border-0 shadow-xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5 text-indigo-600" />
                                Revenue Over Time
                            </CardTitle>
                            <CardDescription>Compare revenue across periods</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {/* Today */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-transparent border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">D</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Today</p>
                                            <p className="text-xs text-muted-foreground">Daily revenue</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-blue-600">{formatCurrency(safeCurrentData.today.total)}</p>
                                    </div>
                                </div>

                                {/* This Week */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">W</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">This Week</p>
                                            <p className="text-xs text-muted-foreground">Weekly total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-emerald-600">{formatCurrency(safeCurrentData.this_week.total)}</p>
                                    </div>
                                </div>

                                {/* This Month */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-50 to-transparent border border-violet-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">M</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">This Month</p>
                                            <p className="text-xs text-muted-foreground">Monthly total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-violet-600">{formatCurrency(safeCurrentData.this_month.total)}</p>
                                    </div>
                                </div>

                                {/* This Year */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-transparent border border-amber-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">Y</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">This Year</p>
                                            <p className="text-xs text-muted-foreground">Annual total</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-amber-600">{formatCurrency(safeCurrentData.this_year.total)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Breakdown Tabs */}
                <Card className="border-0 shadow-xl">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <CardHeader className="border-b pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">Detailed Revenue Analysis</CardTitle>
                                <TabsList className="grid w-full max-w-md grid-cols-4 bg-slate-100">
                                    <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                                    <TabsTrigger value="today" className="text-xs md:text-sm">Today</TabsTrigger>
                                    <TabsTrigger value="week" className="text-xs md:text-sm">This Week</TabsTrigger>
                                    <TabsTrigger value="month" className="text-xs md:text-sm">This Month</TabsTrigger>
                                </TabsList>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <TabsContent value="overview" className="mt-0">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {Object.entries(revenueData).map(([period, data]) => (
                                        <div key={period} className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-blue-200 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-lg text-gray-900">{getPeriodLabel(period)}</h3>
                                                <Badge variant="outline" className="bg-white">
                                                    {formatCurrency(data.total)}
                                                </Badge>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <Stethoscope className="h-4 w-4 text-blue-500" /> Appointments
                                                    </span>
                                                    <span className="font-semibold">{formatCurrency(data.appointments)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <Activity className="h-4 w-4 text-emerald-500" /> Departments
                                                    </span>
                                                    <span className="font-semibold">{formatCurrency(data.departments)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <Pill className="h-4 w-4 text-violet-500" /> Pharmacy
                                                    </span>
                                                    <span className="font-semibold">{formatCurrency(data.pharmacy)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <FlaskConical className="h-4 w-4 text-amber-500" /> Laboratory
                                                    </span>
                                                    <span className="font-semibold">{formatCurrency(data.laboratory)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="today" className="mt-0">
                                <div className="text-center py-12">
                                    <h3 className="text-xl font-semibold mb-2">Today's Revenue</h3>
                                    <p className="text-5xl font-bold text-blue-600 mb-6">{formatCurrency(safeCurrentData.today.total)}</p>
                                    <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                                        <div className="p-4 rounded-xl bg-blue-50">
                                            <p className="text-blue-600 font-semibold">Appointments</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.today.appointments)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50">
                                            <p className="text-emerald-600 font-semibold">Departments</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.today.departments)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-violet-50">
                                            <p className="text-violet-600 font-semibold">Pharmacy</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.today.pharmacy)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-amber-50">
                                            <p className="text-amber-600 font-semibold">Laboratory</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.today.laboratory)}</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="week" className="mt-0">
                                <div className="text-center py-12">
                                    <h3 className="text-xl font-semibold mb-2">This Week Revenue</h3>
                                    <p className="text-5xl font-bold text-emerald-600 mb-6">{formatCurrency(safeCurrentData.this_week.total)}</p>
                                    <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                                        <div className="p-4 rounded-xl bg-blue-50">
                                            <p className="text-blue-600 font-semibold">Appointments</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.this_week.appointments)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50">
                                            <p className="text-emerald-600 font-semibold">Departments</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.this_week.departments)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-violet-50">
                                            <p className="text-violet-600 font-semibold">Pharmacy</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.this_week.pharmacy)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-amber-50">
                                            <p className="text-amber-600 font-semibold">Laboratory</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.this_week.laboratory)}</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="month" className="mt-0">
                                <div className="text-center py-12">
                                    <h3 className="text-xl font-semibold mb-2">This Month Revenue</h3>
                                    <p className="text-5xl font-bold text-violet-600 mb-6">{formatCurrency(safeCurrentData.this_month.total)}</p>
                                    <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                                        <div className="p-4 rounded-xl bg-blue-50">
                                            <p className="text-blue-600 font-semibold">Appointments</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.this_month.appointments)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50">
                                            <p className="text-emerald-600 font-semibold">Departments</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.this_month.departments)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-violet-50">
                                            <p className="text-violet-600 font-semibold">Pharmacy</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.this_month.pharmacy)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-amber-50">
                                            <p className="text-amber-600 font-semibold">Laboratory</p>
                                            <p className="text-2xl font-bold">{formatCurrency(safeCurrentData.this_month.laboratory)}</p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>

                {/* Today's Services Breakdown */}
                <Card className={`border-0 shadow-xl mt-8 ${todayRevenueCalculated ? 'ring-4 ring-emerald-300' : ''}`}>
                    <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Calculator className="h-5 w-5 text-emerald-600" />
                                    {todayRevenueCalculated ? "Today's Revenue Breakdown (Calculated)" : "Today's Revenue Breakdown"}
                                </CardTitle>
                                <CardDescription>
                                    {todayRevenueCalculated
                                        ? 'Click "Today\'s Revenue" button above to refresh data'
                                        : 'Click the "Today\'s Revenue" button above to calculate'}
                                </CardDescription>
                            </div>
                            {todayRevenueCalculated && (
                                <Badge variant="outline" className="text-sm bg-emerald-100 text-emerald-700 border-emerald-300">
                                    Total: {formatCurrency(calculatedTodayRevenue ?? 0)}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {todayRevenueCalculated ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {/* Appointments */}
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                                            <Stethoscope className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Appointments</p>
                                            <p className="text-xs text-blue-400">Doctor consultations</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(todayServicesData.appointments)}</p>
                                </div>

                                {/* Department Services */}
                                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                                            <Activity className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-emerald-600 font-medium">Department Services</p>
                                            <p className="text-xs text-emerald-400">Medical services</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(todayServicesData.departments)}</p>
                                </div>

                                {/* Pharmacy */}
                                <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
                                            <Pill className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-violet-600 font-medium">Pharmacy</p>
                                            <p className="text-xs text-violet-400">Medicine sales</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-violet-700">{formatCurrency(todayServicesData.pharmacy)}</p>
                                </div>

                                {/* Laboratory */}
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                                            <FlaskConical className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-amber-600 font-medium">Laboratory</p>
                                            <p className="text-xs text-amber-400">Lab tests & services</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-700">{formatCurrency(todayServicesData.laboratory)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <Calculator className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Data Calculated Yet</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Click the "Today's Revenue" button above to calculate and display today's revenue from all services.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
