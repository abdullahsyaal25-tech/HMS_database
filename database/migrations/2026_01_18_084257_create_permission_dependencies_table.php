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
        Schema::create('permission_dependencies', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('depends_on_permission_id');
            $table->timestamps();
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->foreign('depends_on_permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->unique(['permission_id', 'depends_on_permission_id'], 'perm_dep_perm_id_dep_on_perm_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_dependencies');
    }
};
