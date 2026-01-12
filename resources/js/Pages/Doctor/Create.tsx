import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import { ArrowLeft, Save } from 'lucide-react';

export default function DoctorCreate() {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        specialization: '',
        phone: '',
        address: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/doctors');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    return (
        <>
            <Head title="Add New Doctor" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Add New Doctor" />
                    
                    <Link href="/doctors">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Doctors
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Doctor Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name *</Label>
                                    <Input
                                        id="first_name"
                                        name="first_name"
                                        value={data.first_name}
                                        onChange={handleChange}
                                        placeholder="Enter first name"
                                    />
                                    {errors.first_name && (
                                        <p className="text-sm text-red-600">{errors.first_name}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name *</Label>
                                    <Input
                                        id="last_name"
                                        name="last_name"
                                        value={data.last_name}
                                        onChange={handleChange}
                                        placeholder="Enter last name"
                                    />
                                    {errors.last_name && (
                                        <p className="text-sm text-red-600">{errors.last_name}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="specialization">Specialization *</Label>
                                    <Select 
                                        value={data.specialization} 
                                        onValueChange={(value) => handleSelectChange('specialization', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select specialization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cardiology">Cardiology</SelectItem>
                                            <SelectItem value="neurology">Neurology</SelectItem>
                                            <SelectItem value="orthopedics">Orthopedics</SelectItem>
                                            <SelectItem value="pediatrics">Pediatrics</SelectItem>
                                            <SelectItem value="dermatology">Dermatology</SelectItem>
                                            <SelectItem value="general-medicine">General Medicine</SelectItem>
                                            <SelectItem value="surgery">Surgery</SelectItem>
                                            <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                                            <SelectItem value="psychiatry">Psychiatry</SelectItem>
                                            <SelectItem value="radiology">Radiology</SelectItem>
                                            <SelectItem value="emergency-medicine">Emergency Medicine</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.specialization && (
                                        <p className="text-sm text-red-600">{errors.specialization}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={data.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-600">{errors.phone}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        value={data.address}
                                        onChange={handleChange}
                                        placeholder="Enter address"
                                        rows={3}
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-red-600">{errors.address}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <Link href="/doctors">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Doctor'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}