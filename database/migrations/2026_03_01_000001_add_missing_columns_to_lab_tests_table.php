<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add missing columns to lab_tests table that are used by LabReportMasterSeeder:
     * - sample_volume: Amount of sample required (e.g., '2 mL', '3 mL')
     * - requires_fasting: Whether patient needs to fast before test
     * - is_panel: Whether this is a panel test with multiple parameters
     * - gender_specific: If test has gender-specific reference ranges
     * - age_specific: If test has age-specific reference ranges
     */
    public function up(): void
    {
        Schema::table('lab_tests', function (Blueprint $table) {
            // Sample volume - e.g., '2 mL', '3 mL', '5 mL'
            $table->string('sample_volume')->nullable()->after('sample_type')
                ->comment('Amount of sample required (e.g., 2 mL, 3 mL)');

            // Fasting requirement
            $table->boolean('requires_fasting')->default(false)->after('parameters')
                ->comment('Whether patient needs to fast before test');

            // Panel test indicator
            $table->boolean('is_panel')->default(false)->after('requires_fasting')
                ->comment('Whether this is a panel test with multiple parameters');

            // Gender specific test
            $table->string('gender_specific')->nullable()->after('is_panel')
                ->comment('Gender-specific ranges: male, female, both');

            // Age specific test
            $table->string('age_specific')->nullable()->after('gender_specific')
                ->comment('Age-specific ranges: children, adult, etc.');

            // Vaccine indicator
            $table->boolean('is_vaccine')->default(false)->after('age_specific')
                ->comment('Whether this is a vaccine entry rather than a lab test');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_tests', function (Blueprint $table) {
            $table->dropColumn([
                'sample_volume',
                'requires_fasting',
                'is_panel',
                'gender_specific',
                'age_specific',
                'is_vaccine',
            ]);
        });
    }
};
