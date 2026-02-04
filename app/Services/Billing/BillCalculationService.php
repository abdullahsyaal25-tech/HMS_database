<?php

namespace App\Services\Billing;

use App\Models\Bill;
use App\Models\PatientInsurance;
use App\Models\BillingSetting;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class BillCalculationService
{
    /**
     * @var AuditLogService
     */
    protected $auditLogService;

    /**
     * Constructor with dependency injection
     */
    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Calculate all bill totals including subtotal, discount, tax, total, and balance
     *
     * @param Bill $bill
     * @return array
     * @throws Exception
     */
    public function calculateTotals(Bill $bill): array
    {
        return DB::transaction(function () use ($bill) {
            // Load bill items if not already loaded
            if (!$bill->relationLoaded('items')) {
                $bill->load('items');
            }

            // Calculate subtotal from all bill items
            $subtotal = $bill->items->sum('total_price');

            // Get billing settings for default tax rate
            $settings = BillingSetting::getAllSettings();
            $defaultTaxRate = $settings['default_tax_rate'] ?? 0;

            // Calculate total discount
            $totalDiscount = $bill->items->sum(function ($item) {
                $percentageDiscount = $item->unit_price * $item->quantity * ($item->discount_percentage / 100);
                return $item->discount_amount + $percentageDiscount;
            });

            // Calculate tax on the amount after discount
            $taxableAmount = $subtotal - $totalDiscount;
            $taxAmount = $this->calculateTaxAmount($taxableAmount, $defaultTaxRate);

            // Calculate total amount
            $totalAmount = $taxableAmount + $taxAmount;

            // Calculate balance due
            $amountPaid = $bill->payments->where('status', 'completed')->sum('amount');
            $balanceDue = $totalAmount - $amountPaid;

            // Update bill with calculated values
            $bill->update([
                'sub_total' => $subtotal,
                'discount' => $totalDiscount,
                'total_discount' => $totalDiscount,
                'tax' => $taxAmount,
                'total_tax' => $taxAmount,
                'total_amount' => $totalAmount,
                'amount_paid' => $amountPaid,
                'amount_due' => $balanceDue,
                'balance_due' => $balanceDue,
            ]);

            // Update payment status based on balance
            $this->updatePaymentStatus($bill);

            // Log without sensitive data
            $this->auditLogService->logActivity(
                'Bill Totals Calculated',
                'Billing',
                "Bill #{$bill->bill_number} totals calculated successfully",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'subtotal' => $subtotal,
                    'discount' => $totalDiscount,
                    'tax' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'amount_paid' => $amountPaid,
                    'balance_due' => $balanceDue,
                ],
                'message' => 'Bill totals calculated successfully',
            ];
        });
    }

    /**
     * Apply discount to a bill
     *
     * @param Bill $bill
     * @param float $amount
     * @param string $type 'fixed' or 'percentage'
     * @return array
     * @throws Exception
     */
    public function applyDiscount(Bill $bill, float $amount, string $type): array
    {
        return DB::transaction(function () use ($bill, $amount, $type) {
            if (!in_array($type, ['fixed', 'percentage'])) {
                throw new Exception('Invalid discount type. Must be "fixed" or "percentage".');
            }

            if ($amount < 0) {
                throw new Exception('Discount amount cannot be negative.');
            }

            if ($type === 'percentage' && $amount > 100) {
                throw new Exception('Percentage discount cannot exceed 100%.');
            }

            // Calculate discount amount
            if ($type === 'percentage') {
                $discountAmount = $bill->sub_total * ($amount / 100);
            } else {
                $discountAmount = $amount;
            }

            // Ensure discount doesn't exceed subtotal
            if ($discountAmount > $bill->sub_total) {
                throw new Exception('Discount amount cannot exceed the bill subtotal.');
            }

            // Update bill discount
            $bill->update([
                'discount' => $discountAmount,
                'total_discount' => $discountAmount,
            ]);

            // Recalculate totals
            $this->calculateTotals($bill);

            // Log without sensitive data
            $this->auditLogService->logActivity(
                'Discount Applied',
                'Billing',
                "Discount applied to bill #{$bill->bill_number}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'discount_type' => $type,
                    'discount_value' => $amount,
                    'discount_amount' => $discountAmount,
                ],
                'message' => 'Discount applied successfully',
            ];
        });
    }

    /**
     * Calculate tax amount for a bill
     *
     * @param Bill $bill
     * @param float $rate Tax rate as percentage
     * @return float
     * @throws Exception
     */
    public function calculateTax(Bill $bill, float $rate): float
    {
        return DB::transaction(function () use ($bill, $rate) {
            if ($rate < 0) {
                throw new Exception('Tax rate cannot be negative.');
            }

            $taxableAmount = $bill->sub_total - $bill->total_discount;
            $taxAmount = $this->calculateTaxAmount($taxableAmount, $rate);

            // Update bill tax
            $bill->update([
                'tax' => $taxAmount,
                'total_tax' => $taxAmount,
            ]);

            // Recalculate totals
            $this->calculateTotals($bill);

            // Log without sensitive data
            $this->auditLogService->logActivity(
                'Tax Calculated',
                'Billing',
                "Tax calculated for bill #{$bill->bill_number}",
                'info'
            );

            return $taxAmount;
        });
    }

    /**
     * Update balance due after payments
     *
     * @param Bill $bill
     * @return array
     * @throws Exception
     */
    public function updateBalanceDue(Bill $bill): array
    {
        return DB::transaction(function () use ($bill) {
            // Load payments if not already loaded
            if (!$bill->relationLoaded('payments')) {
                $bill->load('payments');
            }

            // Calculate total paid amount
            $amountPaid = $bill->payments->where('status', 'completed')->sum('amount');

            // Calculate balance due
            $balanceDue = $bill->total_amount - $amountPaid;

            // Ensure balance doesn't go negative
            if ($balanceDue < 0) {
                $balanceDue = 0;
            }

            // Update bill
            $bill->update([
                'amount_paid' => $amountPaid,
                'amount_due' => $balanceDue,
                'balance_due' => $balanceDue,
            ]);

            // Update payment status
            $this->updatePaymentStatus($bill);

            // Log without sensitive data
            $this->auditLogService->logActivity(
                'Balance Updated',
                'Billing',
                "Balance updated for bill #{$bill->bill_number}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'amount_paid' => $amountPaid,
                    'balance_due' => $balanceDue,
                    'payment_status' => $bill->payment_status,
                ],
                'message' => 'Balance updated successfully',
            ];
        });
    }

    /**
     * Calculate insurance coverage for a bill
     *
     * @param Bill $bill
     * @param PatientInsurance $insurance
     * @return array
     * @throws Exception
     */
    public function calculateInsuranceCoverage(Bill $bill, PatientInsurance $insurance): array
    {
        return DB::transaction(function () use ($bill, $insurance) {
            // Verify insurance is active and valid
            if (!$insurance->is_active) {
                throw new Exception('Insurance policy is not active.');
            }

            if ($insurance->coverage_end_date && $insurance->coverage_end_date->isPast()) {
                throw new Exception('Insurance coverage has expired.');
            }

            // Get insurance provider details
            $provider = $insurance->insuranceProvider;
            if (!$provider || !$provider->is_active) {
                throw new Exception('Insurance provider is not active.');
            }

            // Calculate covered amount
            $totalAmount = $bill->total_amount;
            $deductibleRemaining = $insurance->deductible_amount - $insurance->deductible_met;

            // Apply deductible first
            $amountAfterDeductible = max(0, $totalAmount - $deductibleRemaining);
            $deductibleApplied = $totalAmount - $amountAfterDeductible;

            // Calculate co-pay
            $coPayAmount = 0;
            if ($insurance->co_pay_amount > 0) {
                $coPayAmount = $insurance->co_pay_amount;
            } elseif ($insurance->co_pay_percentage > 0) {
                $coPayAmount = $amountAfterDeductible * ($insurance->co_pay_percentage / 100);
            }

            // Calculate insurance coverage
            $insuranceCoverage = max(0, $amountAfterDeductible - $coPayAmount);

            // Check annual maximum coverage
            $annualRemaining = $insurance->annual_max_coverage - $insurance->annual_used_amount;
            if ($insuranceCoverage > $annualRemaining) {
                $insuranceCoverage = $annualRemaining;
            }

            // Calculate patient responsibility
            $patientResponsibility = $totalAmount - $insuranceCoverage;

            // Update bill with insurance information
            $bill->update([
                'primary_insurance_id' => $insurance->id,
                'insurance_claim_amount' => $insuranceCoverage,
                'patient_responsibility' => $patientResponsibility,
            ]);

            // Log without sensitive data
            $this->auditLogService->logActivity(
                'Insurance Coverage Calculated',
                'Billing',
                "Insurance coverage calculated for bill #{$bill->bill_number}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'total_amount' => $totalAmount,
                    'deductible_applied' => $deductibleApplied,
                    'co_pay_amount' => $coPayAmount,
                    'insurance_coverage' => $insuranceCoverage,
                    'patient_responsibility' => $patientResponsibility,
                    'annual_remaining' => $annualRemaining - $insuranceCoverage,
                ],
                'message' => 'Insurance coverage calculated successfully',
            ];
        });
    }

    /**
     * Calculate tax amount based on taxable amount and rate
     *
     * @param float $taxableAmount
     * @param float $rate
     * @return float
     */
    protected function calculateTaxAmount(float $taxableAmount, float $rate): float
    {
        return round($taxableAmount * ($rate / 100), 2);
    }

    /**
     * Update payment status based on balance
     *
     * @param Bill $bill
     * @return void
     */
    protected function updatePaymentStatus(Bill $bill): void
    {
        if ($bill->balance_due <= 0) {
            $status = 'paid';
        } elseif ($bill->amount_paid > 0) {
            $status = 'partial';
        } else {
            $status = 'pending';
        }

        $bill->update(['payment_status' => $status]);
    }
}
