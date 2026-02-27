import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Calendar, 
    CalendarDays, 
    DollarSign, 
    RefreshCw, 
    AlertTriangle,
    CheckCircle,
    Clock
} from 'lucide-react';
// Simple currency formatting function
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'AFN',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface DayStatusBannerProps {
    dayStatus: {
        status: string;
        message: string;
        current_date: string;
        last_archived_date: string | null;
        new_day_available: boolean;
        days_behind?: number;
    } | null;
    yesterdaySummary: {
        date: string;
        date_formatted?: string;
        time_range?: string;
        business_day_start?: string;
        business_day_end?: string;
        appointments_count: number;
        total_revenue: number;
        appointments_revenue: number;
        pharmacy_revenue: number;
        laboratory_revenue: number;
        departments_revenue: number;
        source: string;
        is_current_business_day?: boolean;
    } | null;
    onArchiveDay: () => Promise<boolean> | void;
    isLoading: boolean;
    showActionButton?: boolean;
    moduleType?: 'all' | 'appointments' | 'pharmacy' | 'laboratory';
}

export function DayStatusBanner({ 
    dayStatus, 
    yesterdaySummary, 
    onArchiveDay, 
    isLoading,
    showActionButton = false,
    moduleType = 'all'
}: DayStatusBannerProps) {
    
    if (!dayStatus || !dayStatus.new_day_available) {
        return null;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getBannerVariant = () => {
        switch (dayStatus.status) {
            case 'new_day_available':
                return {
                    className: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
                    icon: AlertTriangle,
                    title: 'New Day Detected',
                    description: 'Previous day needs to be archived before starting fresh'
                };
            case 'processing':
                return {
                    className: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200',
                    icon: Clock,
                    title: 'Processing Day Transition',
                    description: 'Archiving previous day and starting new day...'
                };
            default:
                return {
                    className: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200',
                    icon: AlertTriangle,
                    title: 'System Alert',
                    description: dayStatus.message
                };
        }
    };

    const variant = getBannerVariant();
    const IconComponent = variant.icon;

    // Get module-specific labels
    const getModuleLabels = () => {
        const isCurrentBusinessDay = yesterdaySummary?.is_current_business_day;
        const dayLabel = isCurrentBusinessDay ? "Current Business Day" : "Yesterday's Summary";
        
        switch (moduleType) {
            case 'appointments':
                return { title: 'Appointments', revenueLabel: 'Appointments Revenue' };
            case 'pharmacy':
                return { title: 'Pharmacy Sales', revenueLabel: 'Pharmacy Revenue' };
            case 'laboratory':
                return { title: 'Laboratory', revenueLabel: 'Lab Revenue' };
            default:
                return { title: dayLabel, revenueLabel: 'Total Revenue' };
        }
    };

    const moduleLabels = getModuleLabels();

    // Get the appropriate revenue based on module type
    const getDisplayRevenue = () => {
        if (!yesterdaySummary) return 0;
        
        switch (moduleType) {
            case 'appointments':
                return yesterdaySummary.appointments_revenue;
            case 'pharmacy':
                return yesterdaySummary.pharmacy_revenue;
            case 'laboratory':
                return yesterdaySummary.laboratory_revenue;
            case 'all':
            default:
                return yesterdaySummary.total_revenue;
        }
    };

    // Render detailed breakdown for moduleType 'all' (Wallet page)
    const renderDetailedBreakdown = () => {
        if (!yesterdaySummary || moduleType !== 'all') return null;

        const isCurrentBusinessDay = yesterdaySummary?.is_current_business_day;

        return (
            <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                        {isCurrentBusinessDay ? "Current Business Day" : "Revenue Breakdown"}
                    </span>
                </div>
                
                {/* Time Range Display */}
                {yesterdaySummary.time_range && (
                    <div className="bg-amber-100/50 rounded px-2 py-1 mb-3 text-xs text-amber-700 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>From {yesterdaySummary.time_range}</span>
                    </div>
                )}
                
                <div className="space-y-2 text-sm">
                    {/* Appointments */}
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            <span className="text-amber-700">Appointments:</span>
                        </div>
                        <div className="text-right">
                            <span className="font-medium text-blue-600 mr-2">{yesterdaySummary.appointments_count}</span>
                            <span className="font-semibold text-emerald-600">
                                {formatCurrency(yesterdaySummary.appointments_revenue)}
                            </span>
                        </div>
                    </div>
                    {/* Pharmacy */}
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-purple-500" />
                            <span className="text-amber-700">Pharmacy:</span>
                        </div>
                        <span className="font-semibold text-emerald-600">
                            {formatCurrency(yesterdaySummary.pharmacy_revenue)}
                        </span>
                    </div>
                    {/* Laboratory */}
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span className="text-amber-700">Laboratory:</span>
                        </div>
                        <span className="font-semibold text-emerald-600">
                            {formatCurrency(yesterdaySummary.laboratory_revenue)}
                        </span>
                    </div>
                    {/* Departments */}
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-orange-500" />
                            <span className="text-amber-700">Departments:</span>
                        </div>
                        <span className="font-semibold text-emerald-600">
                            {formatCurrency(yesterdaySummary.departments_revenue)}
                        </span>
                    </div>
                    {/* Total */}
                    <div className="flex justify-between items-center py-2 bg-amber-100/50 rounded mt-2 px-2">
                        <span className="font-bold text-amber-800">Total:</span>
                        <span className="font-bold text-emerald-700 text-lg">
                            {formatCurrency(yesterdaySummary.total_revenue)}
                        </span>
                    </div>
                </div>
                <div className="text-xs text-amber-500 mt-2">
                    Source: {yesterdaySummary.source}
                </div>
            </div>
        );
    };

    const displayRevenue = getDisplayRevenue();

    return (
        <Alert className={`border-2 ${variant.className} shadow-lg mb-6 animate-in slide-in-from-top-2 duration-300`}>
            <IconComponent className="h-5 w-5 text-amber-600" />
            <AlertTitle className="flex items-center gap-2">
                <span className="font-semibold text-amber-800">{variant.title}</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    Action Required
                </Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
                <div className={`grid grid-cols-1 ${moduleType === 'all' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                    {/* Yesterday's Summary - Detailed breakdown for 'all' moduleType */}
                    {moduleType === 'all' ? (
                        renderDetailedBreakdown()
                    ) : (
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">{moduleLabels.title}</span>
                        </div>
                        {yesterdaySummary?.time_range && (
                            <div className="bg-amber-100/50 rounded px-2 py-1 mb-2 text-xs text-amber-700 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>From {yesterdaySummary.time_range}</span>
                            </div>
                        )}
                        {yesterdaySummary ? (
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-amber-600">Date:</span>
                                    <span className="font-medium">{yesterdaySummary.date_formatted ? formatDate(yesterdaySummary.date_formatted) : formatDate(yesterdaySummary.date)}</span>
                                </div>
                                {moduleType === 'appointments' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-amber-600">Appointments:</span>
                                        <span className="font-medium">{yesterdaySummary.appointments_count}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-amber-600">{moduleLabels.revenueLabel}:</span>
                                    <span className="font-medium text-emerald-600">
                                        {formatCurrency(displayRevenue)}
                                    </span>
                                </div>
                                <div className="text-xs text-amber-500 mt-1">
                                    Source: {yesterdaySummary.source}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-amber-600">
                                Summary data not available
                            </div>
                        )}
                    </div>
                    )}

                    {/* Current Status */}
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">Current Status</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-amber-600">Today:</span>
                                <span className="font-medium">{formatDate(dayStatus.current_date)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-amber-600">Last Archived:</span>
                                <span className="font-medium">
                                    {dayStatus.last_archived_date ? formatDate(dayStatus.last_archived_date) : 'Never'}
                                </span>
                            </div>
                            {dayStatus.days_behind && dayStatus.days_behind > 1 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-amber-600">Days Behind:</span>
                                    <span className="font-medium text-red-600">{dayStatus.days_behind} days</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action - Only show if showActionButton is true */}
                    {showActionButton && (
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">Ready to Start New Day</span>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-amber-600">
                                Click below to archive yesterday's data and start fresh for today.
                            </p>
                            <Button 
                                onClick={onArchiveDay}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Start New Day
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    );
}