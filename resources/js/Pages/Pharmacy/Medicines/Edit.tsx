import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import { ArrowLeft, Save, Pill, Calendar as CalendarIcon, DollarSign } from 'lucide-react';

interface MedicineCategory {
    id: number;
    name: string;
}

interface Medicine {
    id: number;
    medicine_id: string;
    name: string;
    category_id: number;
    category: MedicineCategory;
    manufacturer: string;
    batch_number: string;
    expiry_date: string;
    price: number;
    stock_quantity: number;
    description: string;
    created_at: string;
    updated_at: string;
}

interface MedicineEditProps {
    medicine: Medicine;
    categories: MedicineCategory[];
}

export default function MedicineEdit({ medicine, categories }: MedicineEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: medicine.name,
        category_id: medicine.category_id.toString(),
        manufacturer: medicine.manufacturer,
        batch_number: medicine.batch_number,
        expiry_date: medicine.expiry_date,
        price: medicine.price,
        stock_quantity: medicine.stock_quantity,
        description: medicine.description || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/pharmacy/medicines/${medicine.id}`);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, name === 'price' || name === 'stock_quantity' ? parseFloat(value) || 0 : value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    return (
        <>
            <Head title={`Edit Medicine - ${medicine.medicine_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Editing Medicine: ${medicine.medicine_id}`} />
                    
                    <Link href={`/pharmacy/medicines/${medicine.id}`}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Details
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Medicine Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Medicine Name *</Label>
                                    <div className="relative">
                                        <Pill className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={handleChange}
                                            placeholder="Enter medicine name"
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="category_id">Category *</Label>
                                    <Select 
                                        value={data.category_id} 
                                        onValueChange={(value) => handleSelectChange('category_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(category => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_id && (
                                        <p className="text-sm text-red-600">{errors.category_id}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="manufacturer">Manufacturer *</Label>
                                    <Input
                                        id="manufacturer"
                                        name="manufacturer"
                                        value={data.manufacturer}
                                        onChange={handleChange}
                                        placeholder="Enter manufacturer name"
                                    />
                                    {errors.manufacturer && (
                                        <p className="text-sm text-red-600">{errors.manufacturer}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="batch_number">Batch Number *</Label>
                                    <Input
                                        id="batch_number"
                                        name="batch_number"
                                        value={data.batch_number}
                                        onChange={handleChange}
                                        placeholder="Enter batch number"
                                    />
                                    {errors.batch_number && (
                                        <p className="text-sm text-red-600">{errors.batch_number}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="expiry_date"
                                            name="expiry_date"
                                            type="date"
                                            value={data.expiry_date}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.expiry_date && (
                                        <p className="text-sm text-red-600">{errors.expiry_date}</p>
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
                                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                                    <Input
                                        id="stock_quantity"
                                        name="stock_quantity"
                                        type="number"
                                        min="0"
                                        value={data.stock_quantity}
                                        onChange={handleChange}
                                        placeholder="Enter stock quantity"
                                    />
                                    {errors.stock_quantity && (
                                        <p className="text-sm text-red-600">{errors.stock_quantity}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        onChange={handleChange}
                                        placeholder="Enter medicine description"
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <Link href="/pharmacy/medicines">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Update Medicine'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}