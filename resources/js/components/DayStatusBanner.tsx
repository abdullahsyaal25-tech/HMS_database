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
    // New props for current day data consistency
    currentDayData?: {
        appointments_count: number;
        total_revenue: number;
        appointments_revenue: number;
        pharmacy_revenue: number;
        laboratory_revenue: number;
        departments_revenue: number;
        source: string;
    } | null;
    onArchiveDay: () => Promise<boolean> | void;
    isLoading: boolean;
    moduleType?: 'all' | 'appointments' | 'pharmacy' | 'laboratory' | 'departments';
    showActionButton?: boolean;
    isAdmin?: boolean;
    hidePharmacy?: boolean;
}

export function DayStatusBanner({
    dayStatus,
    yesterdaySummary,
    currentDayData,
    onArchiveDay,
    isLoading,
    moduleType = 'all',
    showActionButton = true,
    isAdmin = false,
    hidePharmacy = false
}: DayStatusBannerProps) {
    
    // Always render the banner if dayStatus is available
    // The "Start New Day" button is now a permanent manual control
    if (!dayStatus) {
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

    // Check if we're in "current business day" mode (no pending new day)
    const isCurrentDayActive = !dayStatus.new_day_available;

    const getBannerVariant = () => {
        // When new_day_available is false, show "Current Business Day Started"
        if (isCurrentDayActive) {
            return {
                className: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
                icon: CheckCircle,
                title: 'Current Business Day Active',
                description: 'The current business day is active. Use the button below to start a new day when ready.'
            };
        }
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
            case 'departments':
                return { title: 'Departments', revenueLabel: 'Departments Revenue' };
            default:
                return { title: dayLabel, revenueLabel: 'Total Revenue' };
        }
    };

    const moduleLabels = getModuleLabels();

    // DIAGNOSTIC LOG: Track revenue calculation
    console.log('[DayStatusBanner] Revenue Calculation Debug:', {
        moduleType,
        isCurrentDayActive,
        hasCurrentDayData: !!currentDayData,
        currentDayDataRevenues: currentDayData ? {
            total: currentDayData.total_revenue,
            appointments: currentDayData.appointments_revenue,
            pharmacy: currentDayData.pharmacy_revenue,
            laboratory: currentDayData.laboratory_revenue,
            departments: currentDayData.departments_revenue,
        } : null,
        hasYesterdaySummary: !!yesterdaySummary,
        yesterdaySummaryRevenues: yesterdaySummary ? {
            total: yesterdaySummary.total_revenue,
            appointments: yesterdaySummary.appointments_revenue,
            pharmacy: yesterdaySummary.pharmacy_revenue,
            laboratory: yesterdaySummary.laboratory_revenue,
            departments: yesterdaySummary.departments_revenue,
        } : null,
    });

    // Get the appropriate revenue based on module type and current state
    const getDisplayRevenue = () => {
        // For current business day active state, prefer current day data if available
        if (isCurrentDayActive && currentDayData) {
            console.log('[DayStatusBanner] Using currentDayData for module:', moduleType);
            switch (moduleType) {
                case 'appointments':
                    return currentDayData.appointments_revenue;
                case 'pharmacy':
                    return currentDayData.pharmacy_revenue;
                case 'laboratory':
                    return currentDayData.laboratory_revenue;
                case 'departments':
                    return currentDayData.departments_revenue;
                case 'all':
                default:
                    return currentDayData.total_revenue;
            }
        }
        
        // Fall back to yesterday summary for other states
        if (!yesterdaySummary) {
            console.log('[DayStatusBanner] yesterdaySummary is null, returning 0');
            return 0;
        }
        
        console.log('[DayStatusBanner] Using yesterdaySummary for module:', moduleType);
        switch (moduleType) {
            case 'appointments':
                return yesterdaySummary.appointments_revenue;
            case 'pharmacy':
                return yesterdaySummary.pharmacy_revenue;
            case 'laboratory':
                return yesterdaySummary.laboratory_revenue;
            case 'departments':
                return yesterdaySummary.departments_revenue;
            case 'all':
            default:
                return yesterdaySummary.total_revenue;
        }
    };

    // Helper to get the border and text colors based on mode
    const getThemeColors = () => {
        if (isCurrentDayActive) {
            return {
                border: 'border-green-200',
                text: 'text-green-700',
                textMuted: 'text-green-600',
                bg: 'bg-green-100',
                icon: 'text-green-600'
            };
        }
        return {
            border: 'border-amber-200',
            text: 'text-amber-700',
            textMuted: 'text-amber-600',
            bg: 'bg-amber-100',
            icon: 'text-amber-600'
        };
    };

    // Render detailed breakdown for moduleType 'all' (Wallet page)
    const renderDetailedBreakdown = () => {
        if (moduleType !== 'all') return null;

        const theme = getThemeColors();
        
        // Always use current day data when available for comprehensive display
        // Fall back to yesterday summary only if current day data is not available
        const displayData = currentDayData 
            ? {
                appointments_count: currentDayData.appointments_count,
                appointments_revenue: currentDayData.appointments_revenue,
                pharmacy_revenue: currentDayData.pharmacy_revenue,
                laboratory_revenue: currentDayData.laboratory_revenue,
                departments_revenue: currentDayData.departments_revenue,
                total_revenue: currentDayData.total_revenue,
                source: currentDayData.source,
                label: "Current Business Day"
              }
            : yesterdaySummary && {
                appointments_count: yesterdaySummary.appointments_count,
                appointments_revenue: yesterdaySummary.appointments_revenue,
                pharmacy_revenue: yesterdaySummary.pharmacy_revenue,
                laboratory_revenue: yesterdaySummary.laboratory_revenue,
                departments_revenue: yesterdaySummary.departments_revenue,
                total_revenue: yesterdaySummary.total_revenue,
                source: yesterdaySummary.source,
                label: yesterdaySummary.is_current_business_day ? "Current Business Day" : "Revenue Breakdown"
              };

        if (!displayData) return null;

        return (
            <div className={`bg-white/50 rounded-lg p-3 border ${theme.border}`}>
                <div className="flex items-center gap-2 mb-3">
                    <DollarSign className={`h-4 w-4 ${theme.icon}`} />
                    <span className={`text-sm font-medium ${theme.text}`}>
                        {displayData.label}
                    </span>
                </div>
                
                {/* Time Range Display - only show for yesterday summary */}
                {!currentDayData && yesterdaySummary?.time_range && (
                    <div className={`${theme.bg}/50 rounded px-2 py-1 mb-3 text-xs ${theme.textMuted} flex items-center gap-1`}>
                        <Clock className="h-3 w-3" />
                        <span>From {yesterdaySummary.time_range}</span>
                    </div>
                )}
                
                <div className="space-y-2 text-sm">
                    {/* Appointments */}
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            <span className={theme.textMuted}>Appointments:</span>
                        </div>
                        <div className="text-right">
                            <span className="font-medium text-blue-600 mr-2">{displayData.appointments_count}</span>
                            <span className="font-semibold text-emerald-600">
                                {formatCurrency(displayData.appointments_revenue)}
                            </span>
                        </div>
                    </div>
                    {/* Pharmacy - hidden when hidePharmacy is true */}
                    {!hidePharmacy && (
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-purple-500" />
                            <span className={theme.textMuted}>Pharmacy:</span>
                        </div>
                        <span className="font-semibold text-emerald-600">
                            {formatCurrency(displayData.pharmacy_revenue)}
                        </span>
                    </div>
                    )}
                    {/* Laboratory */}
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span className={theme.textMuted}>Laboratory:</span>
                        </div>
                        <span className="font-semibold text-emerald-600">
                            {formatCurrency(displayData.laboratory_revenue)}
                        </span>
                    </div>
                    {/* Departments */}
                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-orange-500" />
                            <span className={theme.textMuted}>Departments:</span>
                        </div>
                        <span className="font-semibold text-emerald-600">
                            {formatCurrency(displayData.departments_revenue)}
                        </span>
                    </div>
                    {/* Total */}
                    <div className={`flex justify-between items-center py-2 ${theme.bg}/50 rounded mt-2 px-2`}>
                        <span className={`font-bold ${currentDayData ? 'text-green-800' : 'text-amber-800'}`}>Total:</span>
                        <span className="font-bold text-emerald-700 text-lg">
                            {formatCurrency(displayData.total_revenue)}
                        </span>
                    </div>
                </div>
                <div className={`text-xs ${currentDayData ? 'text-green-500' : 'text-amber-500'} mt-2`}>
                    Source: {displayData.source}
                </div>
            </div>
        );
    };

    const displayRevenue = getDisplayRevenue();
    const theme = getThemeColors();

    return (
        <Alert className={`border-2 ${variant.className} shadow-lg mb-6 animate-in slide-in-from-top-2 duration-300`}>
            <IconComponent className={`h-5 w-5 ${isCurrentDayActive ? 'text-green-600' : 'text-amber-600'}`} />
            <AlertTitle className="flex items-center gap-2">
                <span className={`font-semibold ${isCurrentDayActive ? 'text-green-800' : 'text-amber-800'}`}>{variant.title}</span>
                {dayStatus.new_day_available ? (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        Action Required
                    </Badge>
                ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                    </Badge>
                )}
            </AlertTitle>
            <AlertDescription className="mt-2">
                <div className={`grid grid-cols-1 ${moduleType === 'all' ? 'md:grid-cols-2' : showActionButton ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 pointer-events-auto`}>
                    {/* Yesterday's Summary - Detailed breakdown for 'all' moduleType */}
                    {moduleType === 'all' ? (
                        renderDetailedBreakdown()
                    ) : (
                    <div className={`bg-white/50 rounded-lg p-3 border ${theme.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className={`h-4 w-4 ${theme.icon}`} />
                            <span className={`text-sm font-medium ${theme.text}`}>{moduleLabels.title}</span>
                        </div>
                        {yesterdaySummary?.time_range && (
                            <div className={`${theme.bg}/50 rounded px-2 py-1 mb-2 text-xs ${theme.textMuted} flex items-center gap-1`}>
                                <Clock className="h-3 w-3" />
                                <span>From {yesterdaySummary.time_range}</span>
                            </div>
                        )}
                        {yesterdaySummary ? (
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className={theme.textMuted}>Date:</span>
                                    <span className="font-medium">{yesterdaySummary.date_formatted ? formatDate(yesterdaySummary.date_formatted) : formatDate(yesterdaySummary.date)}</span>
                                </div>
                                {moduleType === 'appointments' && (
                                    <div className="flex justify-between text-sm">
                                        <span className={theme.textMuted}>Appointments:</span>
                                        <span className="font-medium">{yesterdaySummary.appointments_count}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className={theme.textMuted}>{moduleLabels.revenueLabel}:</span>
                                    <span className="font-medium text-emerald-600">
                                        {formatCurrency(displayRevenue)}
                                    </span>
                                </div>
                                <div className={`text-xs ${isCurrentDayActive ? 'text-green-500' : 'text-amber-500'} mt-1`}>
                                    Source: {yesterdaySummary.source}
                                </div>
                            </div>
                        ) : (
                            <div className={`text-sm ${theme.textMuted}`}>
                                Summary data not available
                            </div>
                        )}
                    </div>
                    )}

                    {/* Current Status */}
                    <div className={`bg-white/50 rounded-lg p-3 border ${theme.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className={`h-4 w-4 ${theme.icon}`} />
                            <span className={`text-sm font-medium ${theme.text}`}>Current Status</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className={theme.textMuted}>Today:</span>
                                <span className="font-medium">{formatDate(dayStatus.current_date)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className={theme.textMuted}>Last Archived:</span>
                                <span className="font-medium">
                                    {dayStatus.last_archived_date ? formatDate(dayStatus.last_archived_date) : 'Never'}
                                </span>
                            </div>
                            {dayStatus.days_behind && dayStatus.days_behind > 1 && (
                                <div className="flex justify-between text-sm">
                                    <span className={theme.textMuted}>Days Behind:</span>
                                    <span className="font-medium text-red-600">{dayStatus.days_behind} days</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action - Only show when showActionButton is true */}
                    {showActionButton && (
                    <div className={`bg-white/50 rounded-lg p-3 border ${theme.border} pointer-events-auto`}>
                        <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className={`h-4 w-4 ${theme.icon}`} />
                            <span className={`text-sm font-medium ${theme.text}`}>
                                {dayStatus.new_day_available ? 'Ready to Start New Day' : 'Start New Day Manually'}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <p className={`text-sm ${theme.textMuted}`}>
                                {dayStatus.new_day_available
                                    ? "Click below to archive yesterday's data and start fresh for today."
                                    : "Click below to manually start a new business day."}
                            </p>
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onArchiveDay();
                                }}
                                disabled={isLoading}
                                type="button"
                                className={`w-full font-semibold shadow-md hover:shadow-lg transition-all duration-200 pointer-events-auto ${
                                    dayStatus.new_day_available
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                                }`}
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
