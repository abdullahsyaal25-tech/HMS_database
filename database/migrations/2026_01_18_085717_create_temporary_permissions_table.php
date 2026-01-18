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
        Schema::create('temporary_permissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('granted_by');
            $table->timestamp('granted_at');
            $table->timestamp('expires_at')->nullable();
            $table->text('reason');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->foreign('granted_by')->references('id')->on('users')->onDelete('cascade');

            // Indexes for performance
            $table->index(['user_id', 'permission_id']);
            $table->index('expires_at');
            $table->index('is_active');
            $table->index(['user_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('temporary_permissions');
    }
};
