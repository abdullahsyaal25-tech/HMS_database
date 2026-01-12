import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ReactNode } from 'react';

interface FormFieldProps {
    id: string;
    name: string;
    label: string;
    type?: 'input' | 'textarea' | 'select';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    children?: ReactNode; // For select options
    rows?: number;
}

export default function FormField({
    id,
    name,
    label,
    type = 'input',
    value,
    onChange,
    placeholder,
    required = false,
    error,
    children,
    rows = 3
}: FormFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value);
    };

    const handleSelectChange = (value: string) => {
        onChange(value);
    };

    const renderField = () => {
        switch (type) {
            case 'textarea':
                return (
                    <Textarea
                        id={id}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        rows={rows}
                    />
                );
            case 'select':
                return (
                    <Select value={value} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {children}
                        </SelectContent>
                    </Select>
                );
            case 'input':
            default:
                return (
                    <Input
                        id={id}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                    />
                );
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {renderField()}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}