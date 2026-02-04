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
            $table->string('doctor_id')->unique();
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
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->onDelete('set null');
            $table->timestamps();
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
