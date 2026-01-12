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
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('medicine_code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('chemical_name')->nullable();
            $table->string('category')->nullable();
            $table->string('form')->nullable(); // e.g., tablet, syrup, injection
            $table->string('strength')->nullable(); // e.g., 500mg
            $table->decimal('cost_price', 8, 2);
            $table->decimal('sale_price', 8, 2);
            $table->integer('quantity')->default(0);
            $table->date('expiry_date')->nullable();
            $table->string('batch_number')->nullable();
            $table->enum('status', ['active', 'inactive', 'expired'])->default('active');
            $table->text('side_effects')->nullable();
            $table->text('instructions')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
