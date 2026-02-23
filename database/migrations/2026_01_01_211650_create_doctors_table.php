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
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->string('doctor_id', 191)->unique();
            $table->string('full_name');
            $table->string('father_name')->nullable();
            $table->integer('age')->nullable();
            $table->string('specialization');
            $table->string('phone_number')->nullable();
            $table->text('address')->nullable();
            $table->text('bio')->nullable();
            $table->decimal('fees', 8, 2)->default(0.00);
            $table->decimal('salary', 10, 2)->default(0.00);
            $table->decimal('bonus', 10, 2)->default(0.00);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('department_id')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // Index for performance (added by performance indexes migration)
            // Foreign key constraint is added separately to ensure proper migration order
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
