/**
 * useInsuranceClaims Hook
 * 
 * A custom hook for managing insurance claim forms, including state management,
 * validation, submission, and status tracking.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ClaimStatus,
  type InsuranceClaim,
  type InsuranceClaimFormData,
} from '@/types/billing';

/**
 * Claim form submission status
 */
export type ClaimFormStatus = 
  | 'idle'
  | 'draft'
  | 'validating'
  | 'submitting'
  | 'processing'
  | 'success'
  | 'error';

/**
 * Insurance claim form state interface
 */
export interface InsuranceClaimFormState {
  bill_id: number | null;
  patient_insurance_id: number | null;
  claim_amount: number | null;
  deductible_amount: number | null;
  co_pay_amount: number | null;
  notes: string;
  documents: Record<string, unknown>[];
}

/**
 * Validation error type
 */
export interface ClaimFormErrors {
  bill_id?: string;
  patient_insurance_id?: string;
  claim_amount?: string;
  notes?: string;
  submit?: string;
}

/**
 * API response type for claim submission
 */
export interface ClaimSubmitResponse {
  success: boolean;
  claim?: InsuranceClaim;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Props for useInsuranceClaims hook
 */
export interface UseInsuranceClaimsProps {
  initialBillId?: number;
  onSubmit?: (data: InsuranceClaimFormData) => Promise<ClaimSubmitResponse>;
  onSuccess?: (claim: InsuranceClaim) => void;
  onError?: (error: Error) => void;
}

/**
 * Return type for useInsuranceClaims hook
 */
export interface UseInsuranceClaimsReturn {
  // Form state
  formState: InsuranceClaimFormState;
  setFormField: <K extends keyof InsuranceClaimFormState>(
    field: K,
    value: InsuranceClaimFormState[K]
  ) => void;
  resetForm: () => void;
  
  // Status
  status: ClaimFormStatus;
  setStatus: (status: ClaimFormStatus) => void;
  
  // Validation
  errors: ClaimFormErrors;
  isValid: boolean;
  validateForm: () => boolean;
  
  // Submission
  isSubmitting: boolean;
  submitClaim: () => Promise<void>;
  submitDraft: () => Promise<void>;
  
  // Current claim (if editing)
  currentClaim: InsuranceClaim | null;
  setCurrentClaim: (claim: InsuranceClaim | null) => void;
  
  // Status helpers
  isDraft: boolean;
  isSubmitted: boolean;
  isProcessing: boolean;
  isApproved: boolean;
  isRejected: boolean;
  canSubmit: boolean;
  
  // Status update
  updateClaimStatus: (claimId: number, status: ClaimStatus) => Promise<void>;
}

function parseAmount(value: string | number | null): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get initial form state
 */
function getInitialFormState(billId?: number): InsuranceClaimFormState {
  return {
    bill_id: billId ?? null,
    patient_insurance_id: null,
    claim_amount: null,
    deductible_amount: null,
    co_pay_amount: null,
    notes: '',
    documents: [],
  };
}

/**
 * Hook for managing insurance claims
 * 
 * @param props - Insurance claim management parameters
 * @returns Form state, validation, submission handlers, and claim status helpers
 */
export function useInsuranceClaims({
  initialBillId,
  onSubmit,
  onSuccess,
  onError,
}: UseInsuranceClaimsProps = {}): UseInsuranceClaimsReturn {
  // Form state
  const [formState, setFormState] = useState<InsuranceClaimFormState>(
    () => getInitialFormState(initialBillId)
  );
  
  // Submission status
  const [status, setStatus] = useState<ClaimFormStatus>('idle');
  
  // Validation errors
  const [errors, setErrors] = useState<ClaimFormErrors>({});
  
  // Current claim being edited (if any)
  const [currentClaim, setCurrentClaim] = useState<InsuranceClaim | null>(null);

  /**
   * Set a form field value
   */
  const setFormField = useCallback(<K extends keyof InsuranceClaimFormState>(
    field: K,
    value: InsuranceClaimFormState[K]
  ): void => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when it changes
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as keyof ClaimFormErrors];
      return newErrors;
    });
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback((): void => {
    setFormState(getInitialFormState(initialBillId));
    setErrors({});
    setStatus('idle');
    setCurrentClaim(null);
  }, [initialBillId]);

  /**
   * Validate the form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: ClaimFormErrors = {};

    // Bill ID validation
    if (!formState.bill_id) {
      newErrors.bill_id = 'Please select a bill';
    }

    // Patient insurance validation
    if (!formState.patient_insurance_id) {
      newErrors.patient_insurance_id = 'Please select insurance provider';
    }

    // Claim amount validation
    const claimAmount = parseAmount(formState.claim_amount);
    if (!claimAmount || claimAmount <= 0) {
      newErrors.claim_amount = 'Claim amount must be greater than zero';
    }

    // Notes validation (optional, max length check)
    if (formState.notes && formState.notes.length > 1000) {
      newErrors.notes = 'Notes cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Check if form is valid
   */
  const isValid = useMemo((): boolean => {
    const hasRequiredFields = 
      formState.bill_id !== null &&
      formState.patient_insurance_id !== null &&
      formState.claim_amount !== null &&
      parseAmount(formState.claim_amount) > 0;
    
    return hasRequiredFields && Object.keys(errors).length === 0;
  }, [formState, errors]);

  /**
   * Convert form state to form data for API submission
   */
  const getFormData = useCallback((): InsuranceClaimFormData => {
    return {
      bill_id: formState.bill_id!,
      patient_insurance_id: formState.patient_insurance_id!,
      claim_amount: parseAmount(formState.claim_amount),
      deductible_amount: parseAmount(formState.deductible_amount) || undefined,
      co_pay_amount: parseAmount(formState.co_pay_amount) || undefined,
      notes: formState.notes || undefined,
      documents: formState.documents.length > 0 ? formState.documents : undefined,
    };
  }, [formState]);

  /**
   * Submit the claim
   */
  const submitClaim = useCallback(async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setStatus('validating');

    try {
      setStatus('submitting');
      
      const response = await onSubmit?.(getFormData());
      
      if (response?.success && response.claim) {
        setStatus('success');
        setCurrentClaim(response.claim);
        onSuccess?.(response.claim);
      } else {
        setStatus('error');
        setErrors((prev) => ({
          ...prev,
          submit: response?.message || 'Failed to submit claim',
        }));
        onError?.(new Error(response?.message || 'Failed to submit claim'));
      }
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors((prev) => ({
        ...prev,
        submit: errorMessage,
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [validateForm, onSubmit, getFormData, onSuccess, onError]);

  /**
   * Save as draft
   */
  const submitDraft = useCallback(async (): Promise<void> => {
    setStatus('draft');
    
    try {
      const draftData: InsuranceClaimFormData = {
        bill_id: formState.bill_id ?? 0,
        patient_insurance_id: formState.patient_insurance_id ?? 0,
        claim_amount: parseAmount(formState.claim_amount) || 0,
        deductible_amount: parseAmount(formState.deductible_amount) || undefined,
        co_pay_amount: parseAmount(formState.co_pay_amount) || undefined,
        notes: formState.notes || undefined,
        documents: formState.documents.length > 0 ? formState.documents : undefined,
      };

      const response = await onSubmit?.(draftData);
      
      if (response?.success && response.claim) {
        setStatus('draft');
        setCurrentClaim(response.claim);
      } else {
        setStatus('error');
        setErrors((prev) => ({
          ...prev,
          submit: response?.message || 'Failed to save draft',
        }));
      }
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft';
      setErrors((prev) => ({
        ...prev,
        submit: errorMessage,
      }));
    }
  }, [formState, onSubmit]);

  /**
   * Update claim status
   */
  const updateClaimStatus = useCallback(async (
    claimId: number,
    newStatus: ClaimStatus
  ): Promise<void> => {
    setStatus('processing');
    
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate the status update
      if (currentClaim && currentClaim.id === claimId) {
        setCurrentClaim((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      setStatus('success');
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      setErrors((prev) => ({
        ...prev,
        submit: errorMessage,
      }));
    }
  }, [currentClaim]);

  // Status helpers
  const isSubmitting = status === 'submitting' || status === 'validating' || status === 'processing';
  const isDraft = status === 'draft' || (currentClaim?.status === ClaimStatus.DRAFT);
  const isSubmitted = status === 'success' || (currentClaim?.status === ClaimStatus.SUBMITTED);
  const isProcessing = status === 'processing' || (currentClaim?.status === ClaimStatus.PENDING);
  const isApproved = currentClaim?.status === ClaimStatus.APPROVED || currentClaim?.status === ClaimStatus.PARTIAL;
  const isRejected = currentClaim?.status === ClaimStatus.REJECTED;
  const canSubmit = isValid && !isSubmitting;

  return {
    // Form state
    formState,
    setFormField,
    resetForm,
    
    // Status
    status,
    setStatus,
    
    // Validation
    errors,
    isValid,
    validateForm,
    
    // Submission
    isSubmitting,
    submitClaim,
    submitDraft,
    
    // Current claim
    currentClaim,
    setCurrentClaim,
    
    // Status helpers
    isDraft,
    isSubmitted,
    isProcessing,
    isApproved,
    isRejected,
    canSubmit,
    
    // Status update
    updateClaimStatus,
  };
}

/**
 * Hook for loading an existing claim for editing
 */
export function useInsuranceClaimEdit(
  claim: InsuranceClaim | null
): Partial<UseInsuranceClaimsReturn> {
  const hook = useInsuranceClaims();

  // Load claim data when claim is provided
  if (claim) {
    hook.setFormField('bill_id', claim.bill_id);
    hook.setFormField('patient_insurance_id', claim.patient_insurance_id);
    hook.setFormField('claim_amount', claim.claim_amount);
    hook.setFormField('deductible_amount', claim.deductible_amount ?? null);
    hook.setFormField('co_pay_amount', claim.co_pay_amount ?? null);
    hook.setFormField('notes', claim.notes ?? '');
    hook.setFormField('documents', claim.documents ?? []);
    hook.setCurrentClaim(claim);
  }

  return hook;
}

export default useInsuranceClaims;
