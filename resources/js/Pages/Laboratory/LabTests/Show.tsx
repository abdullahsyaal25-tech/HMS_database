import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Heading from '@/components/heading';
import { ArrowLeft, Edit } from 'lucide-react';

interface LabTest {
    id: number;
    test_id: string;
    name: string;
    description: string | null;
    procedure: string | null;
    cost: number;
    turnaround_time: number;
    unit: string | null;
    normal_values: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

interface LabTestShowProps {
    labTest: LabTest;
}

export default function LabTestShow({ labTest }: LabTestShowProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatTime = (hours: number) => {
        if (hours < 24) {
            return `${hours} hours`;
        }
        const days = Math.floor(hours / 24);
        return `${days} days`;
    };

    return (
        <>
            <Head title={`Lab Test - ${labTest.test_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Lab Test Details: ${labTest.test_id}`} />
                    
                    <div className="flex gap-2">
                        <Link href={`/laboratory/lab-tests/${labTest.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Test
                            </Button>
                        </Link>
                        <Link href="/laboratory/lab-tests">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Tests
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lab Test Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="test_id">Test ID</Label>
                                <Input
                                    id="test_id"
                                    value={labTest.test_id}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="name">Test Name</Label>
                                <Input
                                    id="name"
                                    value={labTest.name}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="cost">Cost</Label>
                                <Input
                                    id="cost"
                                    value={formatCurrency(labTest.cost)}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="turnaround_time">Turnaround Time</Label>
                                <Input
                                    id="turnaround_time"
                                    value={formatTime(labTest.turnaround_time)}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Input
                                    id="unit"
                                    value={labTest.unit || 'N/A'}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Input
                                    id="status"
                                    value={labTest.status}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
<div className="space-y-2 md:col-span-2">
    <Label htmlFor="description">Description</Label>
    <textarea
        id="description"
        value={labTest.description || 'N/A'}
        readOnly
        className="bg-muted/50 w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={3}
    />
</div>

<div className="space-y-2 md:col-span-2">
    <Label htmlFor="procedure">Procedure</Label>
    <textarea
        id="procedure"
        value={labTest.procedure || 'N/A'}
        readOnly
        className="bg-muted/50 w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={3}
    />
</div>

<div className="space-y-2 md:col-span-2">
    <Label htmlFor="normal_values">Normal Values</Label>
    <textarea
        id="normal_values"
        value={labTest.normal_values || 'N/A'}
        readOnly
        className="bg-muted/50 w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={3}
    />
</div>
                            
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="created_at">Date Created</Label>
                                <Input
                                    id="created_at"
                                    value={formatDate(labTest.created_at)}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="updated_at">Last Updated</Label>
                                <Input
                                    id="updated_at"
                                    value={formatDate(labTest.updated_at)}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}