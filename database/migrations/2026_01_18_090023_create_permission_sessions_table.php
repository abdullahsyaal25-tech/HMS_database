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
        Schema::create('permission_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Admin user who started the session
            $table->string('session_token', 64)->unique(); // Unique token for the session
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable(); // Additional session data
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Indexes for performance
            $table->index('user_id');
            $table->index('started_at');
            $table->index('ended_at');
            $table->index('session_token');
        });

        // Create permission_session_actions table to log individual actions
        Schema::create('permission_session_actions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->string('action_type'); // e.g., 'grant_temp_permission', 'revoke_temp_permission', 'approve_request', etc.
            $table->json('action_data'); // Details of the action
            $table->text('description')->nullable();
            $table->timestamp('performed_at');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('session_id')->references('id')->on('permission_sessions')->onDelete('cascade');

            // Indexes for performance
            $table->index('session_id');
            $table->index('action_type');
            $table->index('performed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_session_actions');
        Schema::dropIfExists('permission_sessions');
    }
};
