<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('lab_materials', function (Blueprint $table) {
            $table->id();
            $table->string('material_id')->unique()->comment('Unique material identifier');
            $table->string('name')->comment('Material name');
            $table->integer('quantity')->default(0)->comment('Current stock quantity');
            $table->foreignId('lab_test_id')->nullable()->constrained('lab_tests')->onDelete('set null')->comment('Associated lab test');
            $table->text('description')->nullable()->comment('Material description');
            $table->string('status')->default('active')->comment('Material status: active, low_stock, out_of_stock');
            $table->integer('reorder_level')->default(10)->comment('Minimum quantity before reorder');
            $table->string('unit')->default('units')->comment('Unit of measurement');
            $table->decimal('cost_per_unit', 10, 2)->default(0)->comment('Cost per unit');
            $table->string('supplier')->nullable()->comment('Supplier information');
            $table->date('expiry_date')->nullable()->comment('Expiry date if applicable');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for better performance
            $table->index(['lab_test_id']);
            $table->index(['status']);
            $table->index(['quantity']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_materials');
    }
};
