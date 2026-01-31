import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Plus, Search, Filter, FlaskConical } from 'lucide-react';
import { useForm } from '@inertiajs/react';

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

interface LabTestIndexProps {
    labTests: {
        data: LabTest[];
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
    query?: string;
}

export default function LabTestIndex({ labTests, query }: LabTestIndexProps) {
    const { data, setData, get } = useForm({
        query: query || '',
        status: '',
        category: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        get('/laboratory/lab-tests', {
            preserveState: false,
        });
    };

    const handleFilter = (name: keyof typeof data, value: string) => {
        setData(name, value);
        get('/laboratory/lab-tests', {
            preserveState: false,
        });
    };

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
            <Head title="Lab Tests" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Lab Tests" />
                    
                    <div className="flex gap-2">
                        <Link href="/laboratory/lab-tests/create">
                            <Button variant="outline">
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

                <Card>
                    <CardHeader>
                        <CardTitle>Search and Filter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="query">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="query"
                                            name="query"
                                            value={data.query}
                                            onChange={(e) => setData('query', e.target.value)}
                                            placeholder="Search by test name, category, or description..."
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select 
                                        value={data.status} 
                                        onValueChange={(value) => handleFilter('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select 
                                        value={data.category} 
                                        onValueChange={(value) => handleFilter('category', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Categories" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hematology">Hematology</SelectItem>
                                            <SelectItem value="chemistry">Chemistry</SelectItem>
                                            <SelectItem value="microbiology">Microbiology</SelectItem>
                                            <SelectItem value="immunology">Immunology</SelectItem>
                                            <SelectItem value="urinalysis">Urinalysis</SelectItem>
                                            <SelectItem value="serology">Serology</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <Button type="submit" variant="outline">
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>
                                <Button type="button" variant="outline" onClick={() => {
                                    setData('query', '');
                                    setData('status', '');
                                    setData('category', '');
                                    get('/laboratory/lab-tests', {
                                        preserveState: false,
                                    });
                                }}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Lab Tests List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Test ID</Th>
                                    <Th>Test Name</Th>
                                    <Th>Category</Th>
                                    <Th>Cost</Th>
                                    <Th>Turnaround Time</Th>
                                    <Th>Status</Th>
                                    <Th>Created At</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {labTests.data.map((labTest) => (
                                    <Tr key={labTest.id}>
                                        <Td className="font-medium">{labTest.test_id}</Td>
                                        <Td className="font-medium">{labTest.name}</Td>
                                        <Td>{labTest.description || 'N/A'}</Td>
                                        <Td>{formatCurrency(labTest.cost)}</Td>
                                        <Td>{formatTime(labTest.turnaround_time)}</Td>
                                        <Td>
                                            <Badge variant={labTest.status === 'active' ? 'default' : 'secondary'}>
                                                {labTest.status}
                                            </Badge>
                                        </Td>
                                        <Td>{formatDate(labTest.created_at)}</Td>
                                        <Td>
                                            <div className="flex gap-2">
                                                <Link href={`/laboratory/lab-tests/${labTest.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link href={`/laboratory/lab-tests/${labTest.id}/edit`}>
                                                    <Button size="sm" variant="outline">
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}