import { useState, useCallback } from 'react';

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
}

export interface ValidationRules {
    [key: string]: ValidationRule;
}

/**
 * Common validation patterns
 */
export const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    name: /^[a-zA-Z\s]{2,50}$/,
    numeric: /^\d+$/,
    decimal: /^\d+(\.\d{1,2})?$/,
    alphanumeric: /^[a-zA-Z0-9\s]+$/,
    date: /^\d{4}-\d{2}-\d{2}$/,
    time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
};

/**
 * Common validation messages
 */
export const MESSAGES = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    name: 'Please enter a valid name (2-50 characters, letters and spaces only)',
    numeric: 'Please enter a valid number',
    decimal: 'Please enter a valid number with up to 2 decimal places',
    minLength: (min: number) => `Must be at least ${min} characters long`,
    maxLength: (max: number) => `Must be no more than ${max} characters long`,
    pattern: 'Invalid format',
    custom: 'Invalid value',
};

/**
 * Validate a single field value
 */
export function validateSingleField(
    value: unknown,
    rules: ValidationRule,
    fieldName: string = 'Field'
): string | null {
    // Handle empty values for required fields
    if (rules.required && (value === null || value === undefined || value === '')) {
        return MESSAGES.required;
    }

    // Skip other validations if value is empty and not required
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const stringValue = String(value);

    // Min length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
        return MESSAGES.minLength(rules.minLength);
    }

    // Max length validation
    if (rules.maxLength && stringValue.length > rules.maxLength) {
        return MESSAGES.maxLength(rules.maxLength);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
        return MESSAGES.pattern;
    }

    // Custom validation
    if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) {
            return customError;
        }
    }

    return null;
}

/**
 * Validate an entire form object
 */
export function validateForm(
    data: Record<string, unknown>,
    rules: ValidationRules
): ValidationResult {
    const errors: Record<string, string> = {};

    Object.keys(rules).forEach(fieldName => {
        const rule = rules[fieldName];
        const value = data[fieldName];
        const error = validateSingleField(value, rule, fieldName);

        if (error) {
            errors[fieldName] = error;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Common validation rule sets
 */
export const VALIDATION_RULES = {
    patient: {
        first_name: {
            required: true,
            pattern: PATTERNS.name,
        },
        father_name: {
            pattern: PATTERNS.name,
        },
        gender: {
            required: true,
            custom: (value: string) => {
                const validGenders = ['male', 'female', 'other'];
                if (!validGenders.includes(value)) {
                    return 'Please select a valid gender';
                }
                return null;
            },
        },
        phone: {
            pattern: PATTERNS.phone,
        },
        age: {
            pattern: PATTERNS.numeric,
            custom: (value: string) => {
                const num = parseInt(value, 10);
                if (num < 0 || num > 150) {
                    return 'Age must be between 0 and 150';
                }
                return null;
            },
        },
        blood_group: {
            custom: (value: string) => {
                const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                if (value && !validBloodGroups.includes(value)) {
                    return 'Please select a valid blood group';
                }
                return null;
            },
        },
    },

    doctor: {
        full_name: {
            required: true,
            pattern: PATTERNS.name,
        },
        father_name: {
            pattern: PATTERNS.name,
        },
        age: {
            pattern: PATTERNS.numeric,
            custom: (value: string) => {
                const num = parseInt(value, 10);
                if (num < 25 || num > 80) {
                    return 'Age must be between 25 and 80';
                }
                return null;
            },
        },
        phone_number: {
            required: true,
            pattern: PATTERNS.phone,
        },
        specialization: {
            required: true,
            minLength: 2,
            maxLength: 100,
        },
        department_id: {
            required: true,
            pattern: PATTERNS.numeric,
        },
        fees: {
            pattern: PATTERNS.decimal,
            custom: (value: string) => {
                const num = parseFloat(value);
                if (num < 0) {
                    return 'Fees cannot be negative';
                }
                return null;
            },
        },
        salary: {
            pattern: PATTERNS.decimal,
            custom: (value: string) => {
                const num = parseFloat(value);
                if (num < 0) {
                    return 'Salary cannot be negative';
                }
                return null;
            },
        },
        bonus: {
            pattern: PATTERNS.decimal,
            custom: (value: string) => {
                const num = parseFloat(value);
                if (num < 0) {
                    return 'Bonus cannot be negative';
                }
                return null;
            },
        },
    },

    appointment: {
        patient_id: {
            required: true,
            pattern: PATTERNS.numeric,
        },
        doctor_id: {
            required: true,
            pattern: PATTERNS.numeric,
        },
        department_id: {
            required: true,
            pattern: PATTERNS.numeric,
        },
        appointment_date: {
            required: true,
            pattern: PATTERNS.date,
            custom: (value: string) => {
                const date = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (date < today) {
                    return 'Appointment date cannot be in the past';
                }
                return null;
            },
        },
        status: {
            required: true,
            custom: (value: string) => {
                const validStatuses = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'];
                if (!validStatuses.includes(value)) {
                    return 'Please select a valid status';
                }
                return null;
            },
        },
        fee: {
            pattern: PATTERNS.decimal,
            custom: (value: string) => {
                const num = parseFloat(value);
                if (num < 0) {
                    return 'Fee cannot be negative';
                }
                return null;
            },
        },
    },

    medicine: {
        name: {
            required: true,
            minLength: 2,
            maxLength: 100,
        },
        category_id: {
            required: true,
            pattern: PATTERNS.numeric,
        },
        stock_quantity: {
            required: true,
            pattern: PATTERNS.numeric,
            custom: (value: string) => {
                const num = parseInt(value, 10);
                if (num < 0) {
                    return 'Stock quantity cannot be negative';
                }
                return null;
            },
        },
        reorder_level: {
            required: true,
            pattern: PATTERNS.numeric,
            custom: (value: string) => {
                const num = parseInt(value, 10);
                if (num < 0) {
                    return 'Reorder level cannot be negative';
                }
                return null;
            },
        },
        sale_price: {
            required: true,
            pattern: PATTERNS.decimal,
            custom: (value: string) => {
                const num = parseFloat(value);
                if (num < 0) {
                    return 'Unit price cannot be negative';
                }
                return null;
            },
        },
        expiry_date: {
            pattern: PATTERNS.date,
            custom: (value: string) => {
                if (!value) return null;
                
                const date = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (date < today) {
                    return 'Expiry date cannot be in the past';
                }
                return null;
            },
        },
    },

    labTest: {
        name: {
            required: true,
            minLength: 2,
            maxLength: 100,
        },
        department_id: {
            required: true,
            pattern: PATTERNS.numeric,
        },
        cost: {
            required: true,
            pattern: PATTERNS.decimal,
            custom: (value: string) => {
                const num = parseFloat(value);
                if (num < 0) {
                    return 'Cost cannot be negative';
                }
                return null;
            },
        },
    },

    bill: {
        patient_id: {
            required: true,
            pattern: PATTERNS.numeric,
        },
        status: {
            required: true,
            custom: (value: string) => {
                const validStatuses = ['pending', 'paid', 'partial', 'cancelled'];
                if (!validStatuses.includes(value)) {
                    return 'Please select a valid status';
                }
                return null;
            },
        },
        payment_method: {
            custom: (value: string) => {
                if (value && value.length > 50) {
                    return 'Payment method cannot exceed 50 characters';
                }
                return null;
            },
        },
    },
};

/**
 * Hook for form validation
 */
export function useFormValidation<T extends Record<string, any>>(
    initialData: T,
    rules: ValidationRules
) {
    const [data, setData] = useState<T>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState<Record<string, boolean>>({});

    const validate = useCallback((fieldName?: string): ValidationResult => {
        let validationRules = rules;
        
        if (fieldName) {
            validationRules = { [fieldName]: rules[fieldName] };
        }

        const result = validateForm(data, validationRules);
        setErrors(result.errors);
        
        return result;
    }, [data, rules]);

    const validateField = useCallback((fieldName: string): string | null => {
        const error = validateSingleField(data[fieldName], rules[fieldName], fieldName);
        setErrors(prev => ({
            ...prev,
            [fieldName]: error || '',
        }));
        return error;
    }, [data, rules]);

    const updateField = useCallback((fieldName: string, value: unknown) => {
        setData(prev => ({
            ...prev,
            [fieldName]: value,
        }));
        setIsDirty(prev => ({
            ...prev,
            [fieldName]: true,
        }));
        
        // Validate field if it's been touched
        if (isDirty[fieldName]) {
            validateField(fieldName);
        }
    }, [validateField, isDirty]);

    const reset = useCallback((newData?: T) => {
        setData(newData || initialData);
        setErrors({});
        setIsDirty({});
    }, [initialData]);

    const isValid = Object.keys(errors).length === 0;

    return {
        data,
        errors,
        isValid,
        isDirty,
        setData,
        updateField,
        validate,
        validateField,
        reset,
    };
}