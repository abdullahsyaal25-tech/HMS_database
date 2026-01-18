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
        Schema::create('permission_ip_restrictions', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address'); // IPv4 or IPv6 address, or CIDR notation
            $table->enum('type', ['allow', 'deny'])->default('allow'); // Allow or deny list
            $table->text('description')->nullable();
            $table->unsignedBigInteger('created_by')->nullable(); // User who added this restriction
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('ip_address');
            $table->index('type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_ip_restrictions');
    }
};
