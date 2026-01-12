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
        Schema::create('lab_tests', function (Blueprint $table) {
            $table->id();
            $table->string('test_code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('procedure')->nullable();
            $table->decimal('cost', 8, 2);
            $table->integer('turnaround_time'); // in hours
            $table->string('unit')->nullable(); // measurement unit
            $table->text('normal_values')->nullable(); // normal range for the test
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_tests');
    }
};
