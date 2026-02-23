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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_id', 191)->unique();
            $table->string('first_name')->nullable(); // Name
            $table->string('father_name')->nullable(); // Father's name
            $table->unsignedTinyInteger('age')->nullable(); // Patient age
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('phone')->nullable(); // Phone number
            $table->text('address')->nullable(); // Address
            $table->string('blood_group')->nullable(); // Blood group
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};