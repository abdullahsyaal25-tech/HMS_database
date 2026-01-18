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
        Schema::create('permission_change_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // User whose permissions are being changed
            $table->unsignedBigInteger('requested_by'); // User who made the request
            $table->json('permissions_to_add')->nullable(); // Array of permission IDs to add
            $table->json('permissions_to_remove')->nullable(); // Array of permission IDs to remove
            $table->text('reason'); // Reason for the request
            $table->enum('status', ['pending', 'approved', 'rejected', 'expired'])->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable(); // User who approved/rejected
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('expires_at')->nullable(); // When the request expires
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');

            // Indexes for performance
            $table->index('status');
            $table->index('user_id');
            $table->index('requested_by');
            $table->index('approved_by');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_change_requests');
    }
};
