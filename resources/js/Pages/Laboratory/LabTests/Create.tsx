import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import { ArrowLeft, Save, FlaskConical, DollarSign } from 'lucide-react';

export default function LabTestCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        category: '',
        price: 0,
        duration: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/laboratory/lab-tests');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, name === 'price' ? parseFloat(value) || 0 : value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    return (
        <>
            <Head title="Add New Lab Test" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Add New Lab Test" />
                    
                    <Link href="/laboratory/lab-tests">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Tests
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lab Test Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Test Name *</Label>
                                    <div className="relative">
                                        <FlaskConical className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={handleChange}
                                            placeholder="Enter test name"
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select 
                                        value={data.category} 
                                        onValueChange={(value) => handleSelectChange('category', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hematology">Hematology</SelectItem>
                                            <SelectItem value="biochemistry">Biochemistry</SelectItem>
                                            <SelectItem value="microbiology">Microbiology</SelectItem>
                                            <SelectItem value="immunology">Immunology</SelectItem>
                                            <SelectItem value="urinalysis">Urinalysis</SelectItem>
                                            <SelectItem value="coagulation">Coagulation</SelectItem>
                                            <SelectItem value="blood-gas">Blood Gas</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-red-600">{errors.category}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price *</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.price}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.price && (
                                        <p className="text-sm text-red-600">{errors.price}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration *</Label>
                                    <Input
                                        id="duration"
                                        name="duration"
                                        value={data.duration}
                                        onChange={handleChange}
                                        placeholder="e.g., 24 hours, 1 week"
                                    />
                                    {errors.duration && (
                                        <p className="text-sm text-red-600">{errors.duration}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        onChange={handleChange}
                                        placeholder="Enter test description"
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <Link href="/laboratory/lab-tests">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Lab Test'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}