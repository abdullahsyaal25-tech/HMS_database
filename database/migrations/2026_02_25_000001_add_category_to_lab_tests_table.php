<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add category, sample_type, reference_ranges, and parameters columns
     * to lab_tests table for better test organization and structured data.
     */
    public function up(): void
    {
        Schema::table('lab_tests', function (Blueprint $table) {
            // Add category column for test categorization
            $table->string('category')->nullable()->after('status')
                ->comment('Test category: Hematology, Biochemistry, Serology, Microbiology, PCR, etc.');

            // Add sample type column
            $table->string('sample_type')->nullable()->after('procedure')
                ->comment('Type of sample required: Blood, Urine, Stool, CSF, etc.');

            // Add structured reference ranges as JSON
            $table->json('reference_ranges')->nullable()->after('normal_values')
                ->comment('Structured reference ranges with min/max values per parameter');

            // Add parameters as JSON for detailed test parameters
            $table->json('parameters')->nullable()->after('reference_ranges')
                ->comment('Detailed test parameters with units and descriptions');

            // Add index on category for faster filtering
            $table->index('category', 'lab_tests_category_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_tests', function (Blueprint $table) {
            // Drop index first
            $table->dropIndex('lab_tests_category_idx');

            // Drop columns in reverse order
            $table->dropColumn('parameters');
            $table->dropColumn('reference_ranges');
            $table->dropColumn('sample_type');
            $table->dropColumn('category');
        });
    }
};
