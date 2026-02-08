import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import route from '@/routes';

/**
 * API client for React Query
 * 
 * SECURITY FIX: Added credentials inclusion for Sanctum cookie-based auth
 * PERFORMANCE FIX: Added timeout and abort signal support
 */
async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
        const response = await fetch(endpoint, {
            ...options,
            credentials: 'include', // Important: Include cookies for Sanctum auth
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...options?.headers,
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            
            // Handle session expiration
            if (response.status === 401) {
                window.location.href = '/login?reason=session_expired';
                throw new Error('Session expired. Please log in again.');
            }
            
            throw new Error(error.message || `Request failed with status ${response.status}`);
        }

        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout. Please try again.');
        }
        
        throw error;
    }
}

/**
 * Hook for GET requests with caching
 * 
 * PERFORMANCE FIX: Added staleTime default to reduce unnecessary requests
 */
export function useApiQuery<T>(
    key: string | string[],
    endpoint: string,
    options?: {
        enabled?: boolean;
        staleTime?: number;
        refetchInterval?: number;
        retry?: number | boolean;
    },
) {
    const queryKey = Array.isArray(key) ? key : [key];

    return useQuery({
        queryKey,
        queryFn: () => apiClient<T>(endpoint),
        staleTime: 5 * 60 * 1000, // 5 minutes default
        retry: (failureCount, error) => {
            // Don't retry on 401/403 errors
            if (error instanceof Error && 
                (error.message.includes('Session expired') || 
                 error.message.includes('Forbidden'))) {
                return false;
            }
            return failureCount < 3;
        },
        ...options,
    });
}

/**
 * Hook for POST/PUT/DELETE mutations
 * 
 * IMPROVEMENT: Added automatic cache invalidation and error handling
 */
export function useApiMutation<T, R = unknown>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options?: {
        onSuccess?: (data: R) => void;
        onError?: (error: Error) => void;
        invalidates?: string | string[];
        showSuccessToast?: boolean;
        showErrorToast?: boolean;
    },
) {
    const queryClient = useQueryClient();

    return useMutation<R, Error, T>({
        mutationFn: (data) =>
            apiClient<R>(endpoint, {
                method,
                body: JSON.stringify(data),
            }),
        onSuccess: (data) => {
            if (options?.onSuccess) {
                options.onSuccess(data);
            }
            if (options?.invalidates) {
                const keys = Array.isArray(options.invalidates) ? options.invalidates : [options.invalidates];
                keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
            }
        },
        onError: (error) => {
            if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.error(`Mutation error (${method} ${endpoint}):`, error);
            }
            
            if (options?.onError) {
                options.onError(error);
            }
        },
    });
}

// ============================================================================
// Pre-configured hooks for common operations
// ============================================================================

// Define proper types for domain entities
interface Patient {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

interface Medicine {
    id: number;
    name: string;
    category?: string;
    stock?: number;
    price?: number;
    [key: string]: unknown;
}

interface LabTest {
    id: number;
    name: string;
    status?: string;
    patient_id?: number;
    [key: string]: unknown;
}

interface Appointment {
    id: number;
    patient_id: number;
    doctor_id?: number;
    scheduled_at?: string;
    status?: string;
    [key: string]: unknown;
}

export function usePatients(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<Patient[]>('patients', route('patients.index'), options);
}

export function usePatient(id: number) {
    return useApiQuery<Patient>(`patient-${id}`, route('patients.show', { patient: id }), {
        enabled: id > 0,
    });
}

export function useMedicines(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<Medicine[]>('medicines', route('pharmacy.medicines.index'), options);
}

export function useLabTests(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<LabTest[]>('lab-tests', route('laboratory.lab-tests.index'), options);
}

export function useAppointments(options?: { enabled?: boolean; staleTime?: number }) {
    return useApiQuery<Appointment[]>('appointments', route('appointments.index'), options);
}

// ============================================================================
// Mutation hooks
// ============================================================================

export function useCreatePatient() {
    return useApiMutation('POST', route('patients.store'), {
        invalidates: 'patients',
    });
}

export function useUpdatePatient(id: number) {
    return useApiMutation('PUT', route('patients.update', { patient: id }), {
        invalidates: ['patients', `patient-${id}`],
    });
}

export function useDeletePatient(id: number) {
    return useApiMutation('DELETE', route('patients.destroy', { patient: id }), {
        invalidates: 'patients',
    });
}
