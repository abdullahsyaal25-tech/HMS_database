<?php

use Tests\TestCase;
use App\Models\Patient;
use App\Models\Bill;
use App\Services\Billing\BillCalculationService;
use App\Services\AuditLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Mock the AuditLogService dependency
    $auditLogService = Mockery::mock(AuditLogService::class);
    $this->calculationService = new BillCalculationService($auditLogService);
    $this->patient = Patient::factory()->create();
});

describe('calculateSubtotal', function () {
    it('should calculate subtotal for single item', function () {
        $items = [
            ['quantity' => 2, 'unit_price' => 50.00],
        ];

        $subtotal = $this->calculationService->calculateSubtotal($items);

        expect($subtotal)->toBe(100.00);
    });

    it('should calculate subtotal for multiple items', function () {
        $items = [
            ['quantity' => 2, 'unit_price' => 50.00],
            ['quantity' => 3, 'unit_price' => 25.00],
            ['quantity' => 1, 'unit_price' => 100.00],
        ];

        $subtotal = $this->calculationService->calculateSubtotal($items);

        expect($subtotal)->toBe(275.00);
    });

    it('should handle zero quantity items', function () {
        $items = [
            ['quantity' => 0, 'unit_price' => 50.00],
        ];

        $subtotal = $this->calculationService->calculateSubtotal($items);

        expect($subtotal)->toBe(0.00);
    });

    it('should return zero for empty items array', function () {
        $subtotal = $this->calculationService->calculateSubtotal([]);

        expect($subtotal)->toBe(0.00);
    });
});

describe('calculateTax', function () {
    it('should calculate tax at default rate', function () {
        $tax = $this->calculationService->calculateTax(100.00);

        expect($tax)->toBe(10.00);
    });

    it('should calculate tax at custom rate', function () {
        $tax = $this->calculationService->calculateTax(100.00, 5);

        expect($tax)->toBe(5.00);
    });

    it('should calculate tax at zero rate', function () {
        $tax = $this->calculationService->calculateTax(100.00, 0);

        expect($tax)->toBe(0.00);
    });
});

describe('calculateDiscount', function () {
    it('should calculate fixed discount', function () {
        $discount = $this->calculationService->calculateDiscount(100.00, 20.00, 'fixed');

        expect($discount)->toBe(20.00);
    });

    it('should calculate percentage discount', function () {
        $discount = $this->calculationService->calculateDiscount(100.00, 15, 'percentage');

        expect($discount)->toBe(15.00);
    });

    it('should not exceed amount for fixed discount', function () {
        $discount = $this->calculationService->calculateDiscount(50.00, 100.00, 'fixed');

        expect($discount)->toBe(50.00);
    });
});

describe('calculateOutstandingBalance', function () {
    it('should calculate outstanding balance correctly', function () {
        $bill = Bill::factory()->create([
            'total_amount' => 500.00,
            'paid_amount' => 200.00,
        ]);

        $balance = $this->calculationService->calculateOutstandingBalance($bill);

        expect($balance)->toBe(300.00);
    });

    it('should return zero for fully paid bill', function () {
        $bill = Bill::factory()->create([
            'total_amount' => 500.00,
            'paid_amount' => 500.00,
        ]);

        $balance = $this->calculationService->calculateOutstandingBalance($bill);

        expect($balance)->toBe(0.00);
    });
});

describe('isPaymentValid', function () {
    it('should accept payment within balance', function () {
        $bill = Bill::factory()->create([
            'total_amount' => 500.00,
            'paid_amount' => 200.00,
        ]);

        $isValid = $this->calculationService->isPaymentValid($bill, 100.00);

        expect($isValid)->toBeTrue();
    });

    it('should reject payment exceeding balance', function () {
        $bill = Bill::factory()->create([
            'total_amount' => 500.00,
            'paid_amount' => 200.00,
        ]);

        $isValid = $this->calculationService->isPaymentValid($bill, 400.00);

        expect($isValid)->toBeFalse();
    });

    it('should reject zero payment', function () {
        $bill = Bill::factory()->create();

        $isValid = $this->calculationService->isPaymentValid($bill, 0);

        expect($isValid)->toBeFalse();
    });
});

describe('calculateRefundAmount', function () {
    it('should calculate full refund amount', function () {
        $bill = Bill::factory()->create([
            'total_amount' => 500.00,
            'paid_amount' => 500.00,
        ]);

        $refund = $this->calculationService->calculateRefundAmount($bill, 500.00);

        expect($refund)->toBe(500.00);
    });

    it('should not exceed paid amount', function () {
        $bill = Bill::factory()->create([
            'total_amount' => 500.00,
            'paid_amount' => 300.00,
        ]);

        $refund = $this->calculationService->calculateRefundAmount($bill, 400.00);

        expect($refund)->toBe(300.00);
    });
});
