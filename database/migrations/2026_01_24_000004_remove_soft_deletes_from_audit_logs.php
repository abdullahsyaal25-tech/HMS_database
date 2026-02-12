<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove soft deletes from audit_logs to ensure audit integrity.
     */
    public function up(): void
    {
        // Remove deleted_at column if exists (from SoftDeletes)
        if (Schema::hasColumn('audit_logs', 'deleted_at')) {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        // Add index for faster audit log queries
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!$this->indexExists('audit_logs', 'idx_audit_logs_module_severity')) {
                $table->index(['module', 'severity', 'logged_at'], 'idx_audit_logs_module_severity');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_logs', 'deleted_at')) {
                $table->softDeletes();
            }
            $table->dropIndex('idx_audit_logs_module_severity');
        });
    }

    /**
     * Check if an index exists.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        return Schema::hasIndex($table, $indexName);
    }
};
