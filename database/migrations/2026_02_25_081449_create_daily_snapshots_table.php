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
        Schema::create('daily_snapshots', function (Blueprint $table) {
            $table->id();
            $table->date('snapshot_date')->index();
            $table->integer('appointments_count')->default(0);
            $table->decimal('appointments_revenue', 12, 2)->default(0);
            $table->integer('pharmacy_sales_count')->default(0);
            $table->decimal('pharmacy_revenue', 12, 2)->default(0);
            $table->integer('laboratory_count')->default(0);
            $table->decimal('laboratory_revenue', 12, 2)->default(0);
            $table->integer('patients_count')->default(0);
            $table->decimal('total_revenue', 12, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_snapshots');
    }
};
