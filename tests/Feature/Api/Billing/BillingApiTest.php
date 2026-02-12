<?php

use App\Models\User;
use App\Models\Patient;
use App\Models\Bill;
use App\Models\BillItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'admin']);
    $this->patient = Patient::factory()->create();
    Sanctum::actingAs($this->user);
});

describe('GET /api/v1/bills', function () {
    it('should return paginated bills', function () {
        Bill::factory()->count(25)->create();

        $response = $this->getJson('/api/v1/bills');

        $response->assertStatus(200)->assertJsonStructure(['data', 'links', 'meta']);
    });

    it('should filter bills by status', function () {
        Bill::factory()->create(['status' => 'pending']);
        Bill::factory()->create(['status' => 'paid']);

        $response = $this->getJson('/api/v1/bills?status=pending');

        $response->assertStatus(200);
        collect($response->json('data'))->each(fn($bill) => expect($bill['status'])->toBe('pending'));
    });
});

describe('POST /api/v1/bills', function () {
    it('should create new bill', function () {
        $billData = [
            'patient_id' => $this->patient->id,
            'billing_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
        ];

        $response = $this->postJson('/api/v1/bills', $billData);

        $response->assertStatus(201);
        expect(Bill::where('patient_id', $this->patient->id)->exists())->toBeTrue();
    });

    it('should validate required fields', function () {
        $response = $this->postJson('/api/v1/bills', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['patient_id', 'billing_date']);
    });
});

describe('POST /api/v1/bills/{id}/payment', function () {
    it('should add payment to bill', function () {
        $bill = Bill::factory()->create([
            'patient_id' => $this->patient->id,
            'total_amount' => 500.00,
            'paid_amount' => 0,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/v1/bills/{$bill->id}/payment", [
            'amount' => 200.00,
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(201);
        expect($bill->fresh()->paid_amount)->toBe(200.00);
    });

    it('should mark bill as paid when full amount paid', function () {
        $bill = Bill::factory()->create([
            'total_amount' => 500.00,
            'paid_amount' => 0,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/v1/bills/{$bill->id}/payment", [
            'amount' => 500.00,
            'payment_method' => 'credit_card',
        ]);

        $response->assertStatus(201);
        expect($bill->fresh()->status)->toBe('paid');
    });
});

describe('POST /api/v1/bills/{id}/void', function () {
    it('should void draft bill', function () {
        $bill = Bill::factory()->create(['status' => 'draft']);

        $response = $this->postJson("/api/v1/bills/{$bill->id}/void", ['reason' => 'Incorrect billing']);

        $response->assertStatus(200);
        expect($bill->fresh()->status)->toBe('void');
    });

    it('should not void bill with payments', function () {
        $bill = Bill::factory()->create(['status' => 'partial', 'paid_amount' => 100.00]);

        $response = $this->postJson("/api/v1/bills/{$bill->id}/void", ['reason' => 'Test']);

        $response->assertStatus(422);
    });
});
