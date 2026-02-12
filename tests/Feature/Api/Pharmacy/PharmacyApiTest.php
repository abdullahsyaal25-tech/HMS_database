<?php

use App\Models\User;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'pharmacy']);
    $this->category = MedicineCategory::factory()->create();
    Sanctum::actingAs($this->user);
});

describe('GET /api/v1/medicines', function () {
    it('should return paginated medicines', function () {
        Medicine::factory()->count(30)->create();

        $response = $this->getJson('/api/v1/medicines');

        $response->assertStatus(200)->assertJsonStructure(['data', 'links', 'meta']);
    });

    it('should filter medicines by category', function () {
        Medicine::factory()->count(5)->create(['category_id' => $this->category->id]);

        $response = $this->getJson("/api/v1/medicines?category_id={$this->category->id}");

        $response->assertStatus(200);
        collect($response->json('data'))->each(fn($med) => expect($med['category_id'])->toBe($this->category->id));
    });
});

describe('POST /api/v1/medicines', function () {
    it('should create new medicine', function () {
        $medicineData = [
            'name' => 'Amoxicillin 500mg',
            'category_id' => $this->category->id,
            'price' => 25.00,
            'stock_quantity' => 100,
            'unit' => 'capsules',
        ];

        $response = $this->postJson('/api/v1/medicines', $medicineData);

        $response->assertStatus(201);
        expect(Medicine::where('name', 'Amoxicillin 500mg')->exists())->toBeTrue();
    });

    it('should validate required fields', function () {
        $response = $this->postJson('/api/v1/medicines', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['name', 'category_id', 'price', 'stock_quantity']);
    });
});

describe('PUT /api/v1/medicines/{id}/stock', function () {
    it('should update stock quantity', function () {
        $medicine = Medicine::factory()->create(['stock_quantity' => 100]);

        $response = $this->putJson("/api/v1/medicines/{$medicine->id}/stock", [
            'quantity' => 50,
            'type' => 'add',
        ]);

        $response->assertStatus(200);
        expect($medicine->fresh()->stock_quantity)->toBe(150);
    });

    it('should not deduct more than available stock', function () {
        $medicine = Medicine::factory()->create(['stock_quantity' => 50]);

        $response = $this->putJson("/api/v1/medicines/{$medicine->id}/stock", [
            'quantity' => 100,
            'type' => 'deduct',
        ]);

        $response->assertStatus(422);
    });
});
