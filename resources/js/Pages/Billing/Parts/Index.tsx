/**
 * Bill Parts Index Page
 *
 * Displays all bill parts from all bills with filtering and search capabilities.
 */

import * as React from 'react';
import { Head } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { BillPartsDisplay } from '@/components/billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, RefreshCw } from 'lucide-react';


export default function BillPartsIndex() {
    const [selectedBillId, setSelectedBillId] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleRefresh = () => {
        setIsLoading(true);
        // Trigger a page reload to refresh data
        window.location.reload();
    };

    return (
        <HospitalLayout header="Bill Parts">
            <Head title="Bill Parts - Hospital Management System" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bill Parts</h1>
                        <p className="text-muted-foreground">
                            View and manage all bill items across the system
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Filters Section */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="bill-id">Bill ID</Label>
                                <Input
                                    id="bill-id"
                                    placeholder="Enter bill ID..."
                                    value={selectedBillId}
                                    onChange={(e) => setSelectedBillId(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select defaultValue="all">
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date-range">Date Range</Label>
                                <Select defaultValue="all">
                                    <SelectTrigger id="date-range">
                                        <SelectValue placeholder="Select date range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">This Week</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                        <SelectItem value="year">This Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bill Parts Display */}
                <BillPartsDisplay
                    billId={selectedBillId || 'all'}
                    showSummary={true}
                    className="w-full"
                />
            </div>
        </HospitalLayout>
    );
}
