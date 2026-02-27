<?php

namespace Database\Seeders;

use App\Models\LabTest;
use Illuminate\Database\Seeder;

/**
 * Master Lab Test Seeder - Based on Lab Report Files
 * 
 * This seeder contains all lab tests extracted from the lab report folder.
 * Tests are organized by category with proper reference ranges and parameters.
 * 
 * Categories:
 * 1. Hematology Tests
 * 2. Biochemistry Tests
 * 3. Serology/Immunology Tests
 * 4. Coagulation Tests
 * 5. Microbiology/Culture Tests
 * 6. Molecular/PCR Tests
 * 7. Urine Tests
 * 8. Stool Tests
 * 9. Semen Analysis
 * 10. Special Tests
 */
class LabReportMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $labTests = array_merge(
            $this->getHematologyTests(),
            $this->getBiochemistryTests(),
            $this->getSerologyTests(),
            $this->getCoagulationTests(),
            $this->getMicrobiologyTests(),
            $this->getMolecularTests(),
            $this->getUrineTests(),
            $this->getStoolTests(),
            $this->getSemenTests(),
            $this->getSpecialTests()
        );

        $count = 0;
        foreach ($labTests as $test) {
            LabTest::updateOrCreate(
                ['test_code' => $test['test_code']],
                $test
            );
            $count++;
        }

        $this->command->info("Lab Report Master Seeder completed successfully!");
        $this->command->info("Total tests seeded: {$count}");
    }

    /**
     * Hematology Tests
     */
    private function getHematologyTests(): array
    {
        return [
            [
                'test_code' => 'CBC',
                'name' => 'Complete Blood Count (CBC)',
                'category' => 'Hematology',
                'description' => 'Comprehensive blood test with 20+ parameters including RBC, WBC, Platelets, and differential counts',
                'procedure' => 'Blood sample collection and automated analysis using hematology analyzer',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'WBC: 4.5-11.0, RBC: 4.5-5.5, HGB: 13.5-17.5, HCT: 38-50%, Platelets: 150-400, MCV: 80-100, MCH: 27-33, MCHC: 32-36, RDW: 11.5-14.5, MPV: 7.5-11.5',
                'reference_ranges' => [
                    // White Blood Cells
                    'wbc' => ['min' => 4.5, 'max' => 11.0, 'unit' => 'x10³/μL'],
                    'neutrophils_percent' => ['min' => 40, 'max' => 70, 'unit' => '%'],
                    'lymphocytes_percent' => ['min' => 20, 'max' => 40, 'unit' => '%'],
                    'monocytes_percent' => ['min' => 2, 'max' => 8, 'unit' => '%'],
                    'eosinophils_percent' => ['min' => 1, 'max' => 4, 'unit' => '%'],
                    'basophils_percent' => ['min' => 0, 'max' => 1, 'unit' => '%'],
                    'neutrophils_absolute' => ['min' => 2.0, 'max' => 7.5, 'unit' => 'x10³/μL'],
                    'lymphocytes_absolute' => ['min' => 1.0, 'max' => 4.5, 'unit' => 'x10³/μL'],
                    'monocytes_absolute' => ['min' => 0.1, 'max' => 0.8, 'unit' => 'x10³/μL'],
                    'eosinophils_absolute' => ['min' => 0.0, 'max' => 0.5, 'unit' => 'x10³/μL'],
                    'basophils_absolute' => ['min' => 0.0, 'max' => 0.1, 'unit' => 'x10³/μL'],
                    // Red Blood Cells
                    'rbc' => ['min' => 4.5, 'max' => 5.5, 'unit' => 'x10⁶/μL'],
                    'hemoglobin' => ['min' => 13.5, 'max' => 17.5, 'unit' => 'g/dL'],
                    'hematocrit' => ['min' => 38, 'max' => 50, 'unit' => '%'],
                    'mcv' => ['min' => 80, 'max' => 100, 'unit' => 'fL'],
                    'mch' => ['min' => 27, 'max' => 33, 'unit' => 'pg'],
                    'mchc' => ['min' => 32, 'max' => 36, 'unit' => 'g/dL'],
                    'rdw_cv' => ['min' => 11.5, 'max' => 14.5, 'unit' => '%'],
                    // Platelets
                    'platelets' => ['min' => 150, 'max' => 400, 'unit' => 'x10³/μL'],
                    'mpv' => ['min' => 7.5, 'max' => 11.5, 'unit' => 'fL'],
                    'pdw' => ['min' => 10, 'max' => 18, 'unit' => '%'],
                ],
                'parameters' => [
                    // White Blood Cells
                    'wbc' => ['name' => 'White Blood Cells (WBC)', 'unit' => 'x10³/μL'],
                    'neutrophils_percent' => ['name' => 'Neutrophils %', 'unit' => '%'],
                    'lymphocytes_percent' => ['name' => 'Lymphocytes %', 'unit' => '%'],
                    'monocytes_percent' => ['name' => 'Monocytes %', 'unit' => '%'],
                    'eosinophils_percent' => ['name' => 'Eosinophils %', 'unit' => '%'],
                    'basophils_percent' => ['name' => 'Basophils %', 'unit' => '%'],
                    'neutrophils_absolute' => ['name' => 'Neutrophils (Absolute)', 'unit' => 'x10³/μL'],
                    'lymphocytes_absolute' => ['name' => 'Lymphocytes (Absolute)', 'unit' => 'x10³/μL'],
                    'monocytes_absolute' => ['name' => 'Monocytes (Absolute)', 'unit' => 'x10³/μL'],
                    'eosinophils_absolute' => ['name' => 'Eosinophils (Absolute)', 'unit' => 'x10³/μL'],
                    'basophils_absolute' => ['name' => 'Basophils (Absolute)', 'unit' => 'x10³/μL'],
                    // Red Blood Cells
                    'rbc' => ['name' => 'Red Blood Cells (RBC)', 'unit' => 'x10⁶/μL'],
                    'hemoglobin' => ['name' => 'Hemoglobin (HGB)', 'unit' => 'g/dL'],
                    'hematocrit' => ['name' => 'Hematocrit (HCT)', 'unit' => '%'],
                    'mcv' => ['name' => 'Mean Corpuscular Volume (MCV)', 'unit' => 'fL'],
                    'mch' => ['name' => 'Mean Corpuscular Hemoglobin (MCH)', 'unit' => 'pg'],
                    'mchc' => ['name' => 'Mean Corpuscular HGB Conc. (MCHC)', 'unit' => 'g/dL'],
                    'rdw_cv' => ['name' => 'Red Cell Distribution Width (RDW-CV)', 'unit' => '%'],
                    // Platelets
                    'platelets' => ['name' => 'Platelets (PLT)', 'unit' => 'x10³/μL'],
                    'mpv' => ['name' => 'Mean Platelet Volume (MPV)', 'unit' => 'fL'],
                    'pdw' => ['name' => 'Platelet Distribution Width (PDW)', 'unit' => '%'],
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CBC-BHA-M',
                'name' => 'CBC BHA 3000 (Adult Male)',
                'category' => 'Hematology',
                'description' => 'Complete Blood Count using BHA 3000 analyzer for adult males with full differential',
                'procedure' => 'Automated hematology analysis using BHA 3000 analyzer',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 120.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'WBC: 4.5-11.0, RBC: 4.5-5.5, HGB: 13.5-17.5, HCT: 40-50%, PLT: 150-400, MCV: 80-100, MCH: 27-33, MCHC: 32-36',
                'reference_ranges' => [
                    // White Blood Cells
                    'wbc' => ['min' => 4.5, 'max' => 11.0, 'unit' => 'x10³/μL'],
                    'neutrophils_percent' => ['min' => 40, 'max' => 70, 'unit' => '%'],
                    'lymphocytes_percent' => ['min' => 20, 'max' => 40, 'unit' => '%'],
                    'monocytes_percent' => ['min' => 2, 'max' => 8, 'unit' => '%'],
                    'eosinophils_percent' => ['min' => 1, 'max' => 4, 'unit' => '%'],
                    'basophils_percent' => ['min' => 0, 'max' => 1, 'unit' => '%'],
                    'neutrophils_absolute' => ['min' => 2.0, 'max' => 7.5, 'unit' => 'x10³/μL'],
                    'lymphocytes_absolute' => ['min' => 1.0, 'max' => 4.5, 'unit' => 'x10³/μL'],
                    'monocytes_absolute' => ['min' => 0.1, 'max' => 0.8, 'unit' => 'x10³/μL'],
                    'eosinophils_absolute' => ['min' => 0.0, 'max' => 0.5, 'unit' => 'x10³/μL'],
                    'basophils_absolute' => ['min' => 0.0, 'max' => 0.1, 'unit' => 'x10³/μL'],
                    // Red Blood Cells
                    'rbc' => ['min' => 4.5, 'max' => 5.5, 'unit' => 'x10⁶/μL'],
                    'hemoglobin' => ['min' => 13.5, 'max' => 17.5, 'unit' => 'g/dL'],
                    'hematocrit' => ['min' => 40, 'max' => 50, 'unit' => '%'],
                    'mcv' => ['min' => 80, 'max' => 100, 'unit' => 'fL'],
                    'mch' => ['min' => 27, 'max' => 33, 'unit' => 'pg'],
                    'mchc' => ['min' => 32, 'max' => 36, 'unit' => 'g/dL'],
                    'rdw_cv' => ['min' => 11.5, 'max' => 14.5, 'unit' => '%'],
                    // Platelets
                    'platelets' => ['min' => 150, 'max' => 400, 'unit' => 'x10³/μL'],
                    'mpv' => ['min' => 7.5, 'max' => 11.5, 'unit' => 'fL'],
                    'pdw' => ['min' => 10, 'max' => 18, 'unit' => '%'],
                ],
                'parameters' => [
                    // White Blood Cells
                    'wbc' => ['name' => 'White Blood Cells (WBC)', 'unit' => 'x10³/μL'],
                    'neutrophils_percent' => ['name' => 'Neutrophils %', 'unit' => '%'],
                    'lymphocytes_percent' => ['name' => 'Lymphocytes %', 'unit' => '%'],
                    'monocytes_percent' => ['name' => 'Monocytes %', 'unit' => '%'],
                    'eosinophils_percent' => ['name' => 'Eosinophils %', 'unit' => '%'],
                    'basophils_percent' => ['name' => 'Basophils %', 'unit' => '%'],
                    'neutrophils_absolute' => ['name' => 'Neutrophils (Absolute)', 'unit' => 'x10³/μL'],
                    'lymphocytes_absolute' => ['name' => 'Lymphocytes (Absolute)', 'unit' => 'x10³/μL'],
                    'monocytes_absolute' => ['name' => 'Monocytes (Absolute)', 'unit' => 'x10³/μL'],
                    'eosinophils_absolute' => ['name' => 'Eosinophils (Absolute)', 'unit' => 'x10³/μL'],
                    'basophils_absolute' => ['name' => 'Basophils (Absolute)', 'unit' => 'x10³/μL'],
                    // Red Blood Cells
                    'rbc' => ['name' => 'Red Blood Cells (RBC)', 'unit' => 'x10⁶/μL'],
                    'hemoglobin' => ['name' => 'Hemoglobin (HGB)', 'unit' => 'g/dL'],
                    'hematocrit' => ['name' => 'Hematocrit (HCT)', 'unit' => '%'],
                    'mcv' => ['name' => 'Mean Corpuscular Volume (MCV)', 'unit' => 'fL'],
                    'mch' => ['name' => 'Mean Corpuscular Hemoglobin (MCH)', 'unit' => 'pg'],
                    'mchc' => ['name' => 'Mean Corpuscular HGB Conc. (MCHC)', 'unit' => 'g/dL'],
                    'rdw_cv' => ['name' => 'Red Cell Distribution Width (RDW-CV)', 'unit' => '%'],
                    // Platelets
                    'platelets' => ['name' => 'Platelets (PLT)', 'unit' => 'x10³/μL'],
                    'mpv' => ['name' => 'Mean Platelet Volume (MPV)', 'unit' => 'fL'],
                    'pdw' => ['name' => 'Platelet Distribution Width (PDW)', 'unit' => '%'],
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CBC-BHA-F',
                'name' => 'CBC BHA 3000 (Adult Female)',
                'category' => 'Hematology',
                'description' => 'Complete Blood Count using BHA 3000 analyzer for adult females with full differential',
                'procedure' => 'Automated hematology analysis using BHA 3000 analyzer',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 120.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'WBC: 4.5-11.0, RBC: 4.0-5.0, HGB: 12.0-16.0, HCT: 36-46%, PLT: 150-400, MCV: 80-100, MCH: 27-33, MCHC: 32-36',
                'reference_ranges' => [
                    // White Blood Cells
                    'wbc' => ['min' => 4.5, 'max' => 11.0, 'unit' => 'x10³/μL'],
                    'neutrophils_percent' => ['min' => 40, 'max' => 70, 'unit' => '%'],
                    'lymphocytes_percent' => ['min' => 20, 'max' => 40, 'unit' => '%'],
                    'monocytes_percent' => ['min' => 2, 'max' => 8, 'unit' => '%'],
                    'eosinophils_percent' => ['min' => 1, 'max' => 4, 'unit' => '%'],
                    'basophils_percent' => ['min' => 0, 'max' => 1, 'unit' => '%'],
                    'neutrophils_absolute' => ['min' => 2.0, 'max' => 7.5, 'unit' => 'x10³/μL'],
                    'lymphocytes_absolute' => ['min' => 1.0, 'max' => 4.5, 'unit' => 'x10³/μL'],
                    'monocytes_absolute' => ['min' => 0.1, 'max' => 0.8, 'unit' => 'x10³/μL'],
                    'eosinophils_absolute' => ['min' => 0.0, 'max' => 0.5, 'unit' => 'x10³/μL'],
                    'basophils_absolute' => ['min' => 0.0, 'max' => 0.1, 'unit' => 'x10³/μL'],
                    // Red Blood Cells
                    'rbc' => ['min' => 4.0, 'max' => 5.0, 'unit' => 'x10⁶/μL'],
                    'hemoglobin' => ['min' => 12.0, 'max' => 16.0, 'unit' => 'g/dL'],
                    'hematocrit' => ['min' => 36, 'max' => 46, 'unit' => '%'],
                    'mcv' => ['min' => 80, 'max' => 100, 'unit' => 'fL'],
                    'mch' => ['min' => 27, 'max' => 33, 'unit' => 'pg'],
                    'mchc' => ['min' => 32, 'max' => 36, 'unit' => 'g/dL'],
                    'rdw_cv' => ['min' => 11.5, 'max' => 14.5, 'unit' => '%'],
                    // Platelets
                    'platelets' => ['min' => 150, 'max' => 400, 'unit' => 'x10³/μL'],
                    'mpv' => ['min' => 7.5, 'max' => 11.5, 'unit' => 'fL'],
                    'pdw' => ['min' => 10, 'max' => 18, 'unit' => '%'],
                ],
                'parameters' => [
                    // White Blood Cells
                    'wbc' => ['name' => 'White Blood Cells (WBC)', 'unit' => 'x10³/μL'],
                    'neutrophils_percent' => ['name' => 'Neutrophils %', 'unit' => '%'],
                    'lymphocytes_percent' => ['name' => 'Lymphocytes %', 'unit' => '%'],
                    'monocytes_percent' => ['name' => 'Monocytes %', 'unit' => '%'],
                    'eosinophils_percent' => ['name' => 'Eosinophils %', 'unit' => '%'],
                    'basophils_percent' => ['name' => 'Basophils %', 'unit' => '%'],
                    'neutrophils_absolute' => ['name' => 'Neutrophils (Absolute)', 'unit' => 'x10³/μL'],
                    'lymphocytes_absolute' => ['name' => 'Lymphocytes (Absolute)', 'unit' => 'x10³/μL'],
                    'monocytes_absolute' => ['name' => 'Monocytes (Absolute)', 'unit' => 'x10³/μL'],
                    'eosinophils_absolute' => ['name' => 'Eosinophils (Absolute)', 'unit' => 'x10³/μL'],
                    'basophils_absolute' => ['name' => 'Basophils (Absolute)', 'unit' => 'x10³/μL'],
                    // Red Blood Cells
                    'rbc' => ['name' => 'Red Blood Cells (RBC)', 'unit' => 'x10⁶/μL'],
                    'hemoglobin' => ['name' => 'Hemoglobin (HGB)', 'unit' => 'g/dL'],
                    'hematocrit' => ['name' => 'Hematocrit (HCT)', 'unit' => '%'],
                    'mcv' => ['name' => 'Mean Corpuscular Volume (MCV)', 'unit' => 'fL'],
                    'mch' => ['name' => 'Mean Corpuscular Hemoglobin (MCH)', 'unit' => 'pg'],
                    'mchc' => ['name' => 'Mean Corpuscular HGB Conc. (MCHC)', 'unit' => 'g/dL'],
                    'rdw_cv' => ['name' => 'Red Cell Distribution Width (RDW-CV)', 'unit' => '%'],
                    // Platelets
                    'platelets' => ['name' => 'Platelets (PLT)', 'unit' => 'x10³/μL'],
                    'mpv' => ['name' => 'Mean Platelet Volume (MPV)', 'unit' => 'fL'],
                    'pdw' => ['name' => 'Platelet Distribution Width (PDW)', 'unit' => '%'],
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CBC-BHA-C',
                'name' => 'CBC BHA 3000 (Children)',
                'category' => 'Hematology',
                'description' => 'Complete Blood Count using BHA 3000 analyzer for children with full differential',
                'procedure' => 'Automated hematology analysis using BHA 3000 analyzer',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 120.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'WBC: 5.0-15.0, RBC: 4.0-5.2, HGB: 11.0-16.0, HCT: 33-48%, PLT: 150-400, MCV: 75-95, MCH: 24-30, MCHC: 31-35',
                'reference_ranges' => [
                    // White Blood Cells
                    'wbc' => ['min' => 5.0, 'max' => 15.0, 'unit' => 'x10³/μL'],
                    'neutrophils_percent' => ['min' => 30, 'max' => 60, 'unit' => '%'],
                    'lymphocytes_percent' => ['min' => 25, 'max' => 55, 'unit' => '%'],
                    'monocytes_percent' => ['min' => 2, 'max' => 10, 'unit' => '%'],
                    'eosinophils_percent' => ['min' => 1, 'max' => 6, 'unit' => '%'],
                    'basophils_percent' => ['min' => 0, 'max' => 1, 'unit' => '%'],
                    'neutrophils_absolute' => ['min' => 1.5, 'max' => 9.0, 'unit' => 'x10³/μL'],
                    'lymphocytes_absolute' => ['min' => 1.5, 'max' => 8.0, 'unit' => 'x10³/μL'],
                    'monocytes_absolute' => ['min' => 0.1, 'max' => 1.5, 'unit' => 'x10³/μL'],
                    'eosinophils_absolute' => ['min' => 0.0, 'max' => 0.9, 'unit' => 'x10³/μL'],
                    'basophils_absolute' => ['min' => 0.0, 'max' => 0.15, 'unit' => 'x10³/μL'],
                    // Red Blood Cells
                    'rbc' => ['min' => 4.0, 'max' => 5.2, 'unit' => 'x10⁶/μL'],
                    'hemoglobin' => ['min' => 11.0, 'max' => 16.0, 'unit' => 'g/dL'],
                    'hematocrit' => ['min' => 33, 'max' => 48, 'unit' => '%'],
                    'mcv' => ['min' => 75, 'max' => 95, 'unit' => 'fL'],
                    'mch' => ['min' => 24, 'max' => 30, 'unit' => 'pg'],
                    'mchc' => ['min' => 31, 'max' => 35, 'unit' => 'g/dL'],
                    'rdw_cv' => ['min' => 11.5, 'max' => 15.5, 'unit' => '%'],
                    // Platelets
                    'platelets' => ['min' => 150, 'max' => 400, 'unit' => 'x10³/μL'],
                    'mpv' => ['min' => 7.0, 'max' => 11.0, 'unit' => 'fL'],
                    'pdw' => ['min' => 10, 'max' => 18, 'unit' => '%'],
                ],
                'parameters' => [
                    // White Blood Cells
                    'wbc' => ['name' => 'White Blood Cells (WBC)', 'unit' => 'x10³/μL'],
                    'neutrophils_percent' => ['name' => 'Neutrophils %', 'unit' => '%'],
                    'lymphocytes_percent' => ['name' => 'Lymphocytes %', 'unit' => '%'],
                    'monocytes_percent' => ['name' => 'Monocytes %', 'unit' => '%'],
                    'eosinophils_percent' => ['name' => 'Eosinophils %', 'unit' => '%'],
                    'basophils_percent' => ['name' => 'Basophils %', 'unit' => '%'],
                    'neutrophils_absolute' => ['name' => 'Neutrophils (Absolute)', 'unit' => 'x10³/μL'],
                    'lymphocytes_absolute' => ['name' => 'Lymphocytes (Absolute)', 'unit' => 'x10³/μL'],
                    'monocytes_absolute' => ['name' => 'Monocytes (Absolute)', 'unit' => 'x10³/μL'],
                    'eosinophils_absolute' => ['name' => 'Eosinophils (Absolute)', 'unit' => 'x10³/μL'],
                    'basophils_absolute' => ['name' => 'Basophils (Absolute)', 'unit' => 'x10³/μL'],
                    // Red Blood Cells
                    'rbc' => ['name' => 'Red Blood Cells (RBC)', 'unit' => 'x10⁶/μL'],
                    'hemoglobin' => ['name' => 'Hemoglobin (HGB)', 'unit' => 'g/dL'],
                    'hematocrit' => ['name' => 'Hematocrit (HCT)', 'unit' => '%'],
                    'mcv' => ['name' => 'Mean Corpuscular Volume (MCV)', 'unit' => 'fL'],
                    'mch' => ['name' => 'Mean Corpuscular Hemoglobin (MCH)', 'unit' => 'pg'],
                    'mchc' => ['name' => 'Mean Corpuscular HGB Conc. (MCHC)', 'unit' => 'g/dL'],
                    'rdw_cv' => ['name' => 'Red Cell Distribution Width (RDW-CV)', 'unit' => '%'],
                    // Platelets
                    'platelets' => ['name' => 'Platelets (PLT)', 'unit' => 'x10³/μL'],
                    'mpv' => ['name' => 'Mean Platelet Volume (MPV)', 'unit' => 'fL'],
                    'pdw' => ['name' => 'Platelet Distribution Width (PDW)', 'unit' => '%'],
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'BG',
                'name' => 'Blood Group & RH Typing',
                'category' => 'Hematology',
                'description' => 'Determination of ABO blood group and Rh factor',
                'procedure' => 'Serological testing using antisera',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'N/A',
                'normal_values' => 'A, B, AB, O with Rh +ve or -ve',
                'reference_ranges' => [
                    'abo' => ['values' => ['A', 'B', 'AB', 'O']],
                    'rh' => ['values' => ['Positive', 'Negative']]
                ],
                'parameters' => [
                    'abo' => ['name' => 'ABO Blood Group', 'unit' => ''],
                    'rh' => ['name' => 'Rh Factor', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'BG-CHILD',
                'name' => 'Blood Group & RH (Child)',
                'category' => 'Hematology',
                'description' => 'Blood group determination for pediatric patients',
                'procedure' => 'Serological testing using antisera',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'N/A',
                'normal_values' => 'A, B, AB, O with Rh +ve or -ve',
                'reference_ranges' => [
                    'abo' => ['values' => ['A', 'B', 'AB', 'O']],
                    'rh' => ['values' => ['Positive', 'Negative']]
                ],
                'parameters' => [
                    'abo' => ['name' => 'ABO Blood Group', 'unit' => ''],
                    'rh' => ['name' => 'Rh Factor', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'ESR',
                'name' => 'Erythrocyte Sedimentation Rate (ESR)',
                'category' => 'Hematology',
                'description' => 'Non-specific test for inflammation and tissue damage',
                'procedure' => 'Westergren method',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mm/hr',
                'normal_values' => 'Male: 0-15, Female: 0-20 mm/hr',
                'reference_ranges' => [
                    'esr' => [
                        'male' => ['min' => 0, 'max' => 15, 'unit' => 'mm/hr'],
                        'female' => ['min' => 0, 'max' => 20, 'unit' => 'mm/hr']
                    ]
                ],
                'parameters' => [
                    'esr' => ['name' => 'ESR', 'unit' => 'mm/hr']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HB',
                'name' => 'Hemoglobin (HB)',
                'category' => 'Hematology',
                'description' => 'Measurement of hemoglobin concentration in blood',
                'procedure' => 'Automated blood analyzer',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'g/dL',
                'normal_values' => 'Male: 13-18, Female: 12-16, Child: 11-16 g/dL',
                'reference_ranges' => [
                    'hemoglobin' => [
                        'male' => ['min' => 13, 'max' => 18, 'unit' => 'g/dL'],
                        'female' => ['min' => 12, 'max' => 16, 'unit' => 'g/dL'],
                        'child' => ['min' => 11, 'max' => 16, 'unit' => 'g/dL']
                    ]
                ],
                'parameters' => [
                    'hemoglobin' => ['name' => 'Hemoglobin', 'unit' => 'g/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TLC',
                'name' => 'Total Leukocyte Count (TLC)',
                'category' => 'Hematology',
                'description' => 'Total count of white blood cells',
                'procedure' => 'Automated hematology analyzer',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'x10³/μL',
                'normal_values' => '4.5-11.0 x10³/μL',
                'reference_ranges' => [
                    'tlc' => ['min' => 4.5, 'max' => 11.0, 'unit' => 'x10³/μL']
                ],
                'parameters' => [
                    'tlc' => ['name' => 'Total Leukocyte Count', 'unit' => 'x10³/μL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'DLC',
                'name' => 'Differential Leukocyte Count (DLC)',
                'category' => 'Hematology',
                'description' => 'Count of different types of white blood cells',
                'procedure' => 'Automated analyzer or manual differential count',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 80.00,
                'turnaround_time' => 4,
                'unit' => '%',
                'normal_values' => 'Neutrophils: 50-70%, Lymphocytes: 20-40%, Monocytes: 2-10%, Eosinophils: 1-6%, Basophils: 0-1%',
                'reference_ranges' => [
                    'neutrophils' => ['min' => 50, 'max' => 70, 'unit' => '%'],
                    'lymphocytes' => ['min' => 20, 'max' => 40, 'unit' => '%'],
                    'monocytes' => ['min' => 2, 'max' => 10, 'unit' => '%'],
                    'eosinophils' => ['min' => 1, 'max' => 6, 'unit' => '%'],
                    'basophils' => ['min' => 0, 'max' => 1, 'unit' => '%']
                ],
                'parameters' => [
                    'neutrophils' => ['name' => 'Neutrophils', 'unit' => '%'],
                    'lymphocytes' => ['name' => 'Lymphocytes', 'unit' => '%'],
                    'monocytes' => ['name' => 'Monocytes', 'unit' => '%'],
                    'eosinophils' => ['name' => 'Eosinophils', 'unit' => '%'],
                    'basophils' => ['name' => 'Basophils', 'unit' => '%']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'MP',
                'name' => 'Malarial Parasites (MP)',
                'category' => 'Hematology',
                'description' => 'Detection of malaria parasites in blood smear',
                'procedure' => 'Thin and thick blood smear examination with Giemsa stain',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 50.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'No parasites seen',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']],
                    'species' => ['values' => ['None', 'P. vivax', 'P. falciparum', 'P. ovale', 'P. malariae']]
                ],
                'parameters' => [
                    'result' => ['name' => 'Malarial Parasites', 'unit' => ''],
                    'species' => ['name' => 'Species', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'RET',
                'name' => 'Reticulocytes Count',
                'category' => 'Hematology',
                'description' => 'Count of immature red blood cells',
                'procedure' => 'Blood smear staining and microscopic examination',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 350.00,
                'turnaround_time' => 8,
                'unit' => '%',
                'normal_values' => '0.5-2.5%',
                'reference_ranges' => [
                    'reticulocytes' => ['min' => 0.5, 'max' => 2.5, 'unit' => '%']
                ],
                'parameters' => [
                    'reticulocytes' => ['name' => 'Reticulocytes', 'unit' => '%']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'SMR',
                'name' => 'Special Smear',
                'category' => 'Hematology',
                'description' => 'Detailed microscopic examination of blood cells',
                'procedure' => 'Blood smear preparation and microscopic examination',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Normal RBC, WBC morphology',
                'reference_ranges' => [
                    'rbc_morphology' => ['values' => ['Normal', 'Microcytic', 'Macrocytic', 'Hypochromic', 'Poikilocytosis']],
                    'wbc_morphology' => ['values' => ['Normal', 'Immature cells', 'Toxic granulation', 'Dohle bodies']],
                    'platelets' => ['values' => ['Adequate', 'Reduced', 'Increased']]
                ],
                'parameters' => [
                    'rbc_morphology' => ['name' => 'RBC Morphology', 'unit' => ''],
                    'wbc_morphology' => ['name' => 'WBC Morphology', 'unit' => ''],
                    'platelets' => ['name' => 'Platelets Assessment', 'unit' => '']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Biochemistry Tests
     */
    private function getBiochemistryTests(): array
    {
        return [
            [
                'test_code' => 'FBS',
                'name' => 'Fasting Blood Sugar (FBS)',
                'category' => 'Biochemistry',
                'description' => 'Measurement of blood glucose after 8-12 hours fasting',
                'procedure' => 'Glucose oxidase method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 100.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => '70-100 mg/dL',
                'reference_ranges' => [
                    'fbs' => ['min' => 70, 'max' => 100, 'unit' => 'mg/dL']
                ],
                'parameters' => [
                    'glucose' => ['name' => 'Fasting Glucose', 'unit' => 'mg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'RBS',
                'name' => 'Random Blood Sugar (RBS)',
                'category' => 'Biochemistry',
                'description' => 'Measurement of blood glucose at any time',
                'procedure' => 'Glucose oxidase method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 100.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => '<140 mg/dL',
                'reference_ranges' => [
                    'rbs' => ['min' => 70, 'max' => 140, 'unit' => 'mg/dL']
                ],
                'parameters' => [
                    'glucose' => ['name' => 'Random Glucose', 'unit' => 'mg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'GTT',
                'name' => 'Glucose Tolerance Test (GTT)',
                'category' => 'Biochemistry',
                'description' => 'Measures body response to sugar over 2 hours',
                'procedure' => 'Blood glucose measured fasting, then at 1hr and 2hr after glucose load',
                'sample_type' => 'Blood (Serum)',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => 'Fasting: <100, 1hr: <180, 2hr: <140 mg/dL',
                'reference_ranges' => [
                    'fasting' => ['min' => 70, 'max' => 100, 'unit' => 'mg/dL'],
                    '1hr' => ['min' => 70, 'max' => 180, 'unit' => 'mg/dL'],
                    '2hr' => ['min' => 70, 'max' => 140, 'unit' => 'mg/dL']
                ],
                'parameters' => [
                    'fasting' => ['name' => 'Fasting Glucose', 'unit' => 'mg/dL'],
                    '1hr' => ['name' => '1 Hour Glucose', 'unit' => 'mg/dL'],
                    '2hr' => ['name' => '2 Hour Glucose', 'unit' => 'mg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HBA1C',
                'name' => 'Hemoglobin A1C (HbA1C)',
                'category' => 'Biochemistry',
                'description' => 'Average blood glucose level over past 2-3 months',
                'procedure' => 'HPLC method',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 400.00,
                'turnaround_time' => 4,
                'unit' => '%',
                'normal_values' => '<5.7%',
                'reference_ranges' => [
                    'hba1c' => ['min' => 4.0, 'max' => 5.7, 'unit' => '%']
                ],
                'parameters' => [
                    'hba1c' => ['name' => 'Hemoglobin A1C', 'unit' => '%']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'LIPID',
                'name' => 'Lipid Profile',
                'category' => 'Biochemistry',
                'description' => 'Complete cholesterol panel with ratios and risk assessment',
                'procedure' => 'Enzymatic colorimetric method',
                'sample_type' => 'Blood (Serum) - 12 hours fasting',
                'cost' => 500.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => 'Total Chol: <200, TG: <150, HDL: >40, LDL: <100, VLDL: <30, Non-HDL: <130, TC/HDL: <3.5, LDL/HDL: <2.5',
                'reference_ranges' => [
                    'total_cholesterol' => ['min' => 0, 'max' => 200, 'unit' => 'mg/dL'],
                    'triglycerides' => ['min' => 0, 'max' => 150, 'unit' => 'mg/dL'],
                    'hdl' => ['min' => 40, 'max' => 100, 'unit' => 'mg/dL'],
                    'ldl' => ['min' => 0, 'max' => 100, 'unit' => 'mg/dL'],
                    'vldl' => ['min' => 0, 'max' => 30, 'unit' => 'mg/dL'],
                    'non_hdl' => ['min' => 0, 'max' => 130, 'unit' => 'mg/dL'],
                    'tc_hdl_ratio' => ['min' => 0, 'max' => 3.5, 'unit' => 'ratio'],
                    'ldl_hdl_ratio' => ['min' => 0, 'max' => 2.5, 'unit' => 'ratio'],
                    'atherogenic_index' => ['min' => 0, 'max' => 4.0, 'unit' => 'index']
                ],
                'parameters' => [
                    'total_cholesterol' => ['name' => 'Total Cholesterol', 'unit' => 'mg/dL'],
                    'triglycerides' => ['name' => 'Triglycerides', 'unit' => 'mg/dL'],
                    'hdl' => ['name' => 'HDL Cholesterol', 'unit' => 'mg/dL'],
                    'ldl' => ['name' => 'LDL Cholesterol', 'unit' => 'mg/dL'],
                    'vldl' => ['name' => 'VLDL Cholesterol', 'unit' => 'mg/dL'],
                    'non_hdl' => ['name' => 'Non-HDL Cholesterol', 'unit' => 'mg/dL'],
                    'tc_hdl_ratio' => ['name' => 'Total Chol/HDL Ratio', 'unit' => 'ratio'],
                    'ldl_hdl_ratio' => ['name' => 'LDL/HDL Ratio', 'unit' => 'ratio'],
                    'atherogenic_index' => ['name' => 'Atherogenic Index', 'unit' => 'index']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'LFT',
                'name' => 'Liver Function Test (LFT)',
                'category' => 'Biochemistry',
                'description' => 'Comprehensive liver panel with enzymes, bilirubin, and proteins',
                'procedure' => 'Colorimetric and enzymatic methods',
                'sample_type' => 'Blood (Serum)',
                'cost' => 600.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'SGPT: 7-56, SGOT: 5-40, ALP: 44-147, Total Bil: 0.1-1.2, Direct Bil: 0-0.3, Indirect Bil: 0.1-0.9, TP: 6.0-8.3, Albumin: 3.5-5.0, GGT: 9-48',
                'reference_ranges' => [
                    'sgpt' => ['min' => 7, 'max' => 56, 'unit' => 'U/L'],
                    'sgot' => ['min' => 5, 'max' => 40, 'unit' => 'U/L'],
                    'alp' => ['min' => 44, 'max' => 147, 'unit' => 'U/L'],
                    'ggt' => ['min' => 9, 'max' => 48, 'unit' => 'U/L'],
                    'total_bilirubin' => ['min' => 0.1, 'max' => 1.2, 'unit' => 'mg/dL'],
                    'direct_bilirubin' => ['min' => 0, 'max' => 0.3, 'unit' => 'mg/dL'],
                    'indirect_bilirubin' => ['min' => 0.1, 'max' => 0.9, 'unit' => 'mg/dL'],
                    'total_protein' => ['min' => 6.0, 'max' => 8.3, 'unit' => 'g/dL'],
                    'albumin' => ['min' => 3.5, 'max' => 5.0, 'unit' => 'g/dL'],
                    'globulin' => ['min' => 2.3, 'max' => 3.5, 'unit' => 'g/dL'],
                    'ag_ratio' => ['min' => 1.0, 'max' => 2.2, 'unit' => 'ratio']
                ],
                'parameters' => [
                    'sgpt' => ['name' => 'SGPT (ALT)', 'unit' => 'U/L'],
                    'sgot' => ['name' => 'SGOT (AST)', 'unit' => 'U/L'],
                    'alp' => ['name' => 'Alkaline Phosphatase (ALP)', 'unit' => 'U/L'],
                    'ggt' => ['name' => 'Gamma GT (GGT)', 'unit' => 'U/L'],
                    'total_bilirubin' => ['name' => 'Total Bilirubin', 'unit' => 'mg/dL'],
                    'direct_bilirubin' => ['name' => 'Direct Bilirubin', 'unit' => 'mg/dL'],
                    'indirect_bilirubin' => ['name' => 'Indirect Bilirubin', 'unit' => 'mg/dL'],
                    'total_protein' => ['name' => 'Total Protein', 'unit' => 'g/dL'],
                    'albumin' => ['name' => 'Albumin', 'unit' => 'g/dL'],
                    'globulin' => ['name' => 'Globulin', 'unit' => 'g/dL'],
                    'ag_ratio' => ['name' => 'A/G Ratio', 'unit' => 'ratio']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'KFT',
                'name' => 'Kidney Function Test (RFT)',
                'category' => 'Biochemistry',
                'description' => 'Complete renal function panel with eGFR and electrolytes',
                'procedure' => 'Colorimetric and enzymatic methods',
                'sample_type' => 'Blood (Serum)',
                'cost' => 500.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'Creatinine: 0.7-1.3, Urea: 15-40, BUN: 7-20, Uric Acid: 3.5-7.2, eGFR: >90, Sodium: 135-145, Potassium: 3.5-5.5, Chloride: 95-105, Bicarbonate: 22-28',
                'reference_ranges' => [
                    'creatinine' => ['min' => 0.7, 'max' => 1.3, 'unit' => 'mg/dL'],
                    'urea' => ['min' => 15, 'max' => 40, 'unit' => 'mg/dL'],
                    'bun' => ['min' => 7, 'max' => 20, 'unit' => 'mg/dL'],
                    'uric_acid' => ['min' => 3.5, 'max' => 7.2, 'unit' => 'mg/dL'],
                    'bun_creatinine_ratio' => ['min' => 10, 'max' => 20, 'unit' => 'ratio'],
                    'egfr' => ['min' => 90, 'max' => 120, 'unit' => 'mL/min/1.73m²'],
                    'sodium' => ['min' => 135, 'max' => 145, 'unit' => 'mEq/L'],
                    'potassium' => ['min' => 3.5, 'max' => 5.5, 'unit' => 'mEq/L'],
                    'chloride' => ['min' => 95, 'max' => 105, 'unit' => 'mEq/L'],
                    'bicarbonate' => ['min' => 22, 'max' => 28, 'unit' => 'mEq/L'],
                    'anion_gap' => ['min' => 8, 'max' => 16, 'unit' => 'mEq/L']
                ],
                'parameters' => [
                    'creatinine' => ['name' => 'Serum Creatinine', 'unit' => 'mg/dL'],
                    'urea' => ['name' => 'Blood Urea', 'unit' => 'mg/dL'],
                    'bun' => ['name' => 'BUN', 'unit' => 'mg/dL'],
                    'uric_acid' => ['name' => 'Uric Acid', 'unit' => 'mg/dL'],
                    'bun_creatinine_ratio' => ['name' => 'BUN/Creatinine Ratio', 'unit' => 'ratio'],
                    'egfr' => ['name' => 'eGFR', 'unit' => 'mL/min/1.73m²'],
                    'sodium' => ['name' => 'Sodium', 'unit' => 'mEq/L'],
                    'potassium' => ['name' => 'Potassium', 'unit' => 'mEq/L'],
                    'chloride' => ['name' => 'Chloride', 'unit' => 'mEq/L'],
                    'bicarbonate' => ['name' => 'Bicarbonate (CO2)', 'unit' => 'mEq/L'],
                    'anion_gap' => ['name' => 'Anion Gap', 'unit' => 'mEq/L']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CREAT',
                'name' => 'Serum Creatinine',
                'category' => 'Biochemistry',
                'description' => 'Measurement of creatinine level for kidney function',
                'procedure' => 'Jaffe method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 150.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => 'Male: 0.7-1.3, Female: 0.6-1.1 mg/dL',
                'reference_ranges' => [
                    'male' => ['min' => 0.7, 'max' => 1.3, 'unit' => 'mg/dL'],
                    'female' => ['min' => 0.6, 'max' => 1.1, 'unit' => 'mg/dL']
                ],
                'parameters' => [
                    'creatinine' => ['name' => 'Serum Creatinine', 'unit' => 'mg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'UREA',
                'name' => 'Blood Urea',
                'category' => 'Biochemistry',
                'description' => 'Measurement of urea nitrogen in blood',
                'procedure' => 'Berthelot method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 150.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => '15-40 mg/dL',
                'reference_ranges' => [
                    'urea' => ['min' => 15, 'max' => 40, 'unit' => 'mg/dL']
                ],
                'parameters' => [
                    'urea' => ['name' => 'Blood Urea', 'unit' => 'mg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'UA',
                'name' => 'Uric Acid',
                'category' => 'Biochemistry',
                'description' => 'Measurement of uric acid for gout assessment',
                'procedure' => 'Uricase method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 150.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => 'Male: 3.5-7.2, Female: 2.6-6.0 mg/dL',
                'reference_ranges' => [
                    'male' => ['min' => 3.5, 'max' => 7.2, 'unit' => 'mg/dL'],
                    'female' => ['min' => 2.6, 'max' => 6.0, 'unit' => 'mg/dL']
                ],
                'parameters' => [
                    'uric_acid' => ['name' => 'Uric Acid', 'unit' => 'mg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CA',
                'name' => 'Serum Calcium',
                'category' => 'Biochemistry',
                'description' => 'Measurement of total calcium in blood',
                'procedure' => 'O-cresolphthalein complexone method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 200.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => '8.5-10.5 mg/dL',
                'reference_ranges' => [
                    'calcium' => ['min' => 8.5, 'max' => 10.5, 'unit' => 'mg/dL']
                ],
                'parameters' => [
                    'calcium' => ['name' => 'Total Calcium', 'unit' => 'mg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'ELECTRO',
                'name' => 'Electrolytes Panel',
                'category' => 'Biochemistry',
                'description' => 'Complete electrolyte panel with anion gap calculation',
                'procedure' => 'Ion selective electrode method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 2,
                'unit' => 'mEq/L',
                'normal_values' => 'Na: 135-145, K: 3.5-5.5, Cl: 95-105, CO2: 22-28, Anion Gap: 8-16 mEq/L',
                'reference_ranges' => [
                    'sodium' => ['min' => 135, 'max' => 145, 'unit' => 'mEq/L'],
                    'potassium' => ['min' => 3.5, 'max' => 5.5, 'unit' => 'mEq/L'],
                    'chloride' => ['min' => 95, 'max' => 105, 'unit' => 'mEq/L'],
                    'bicarbonate' => ['min' => 22, 'max' => 28, 'unit' => 'mEq/L'],
                    'anion_gap' => ['min' => 8, 'max' => 16, 'unit' => 'mEq/L'],
                    'sodium_potassium_ratio' => ['min' => 25, 'max' => 40, 'unit' => 'ratio']
                ],
                'parameters' => [
                    'sodium' => ['name' => 'Sodium (Na)', 'unit' => 'mEq/L'],
                    'potassium' => ['name' => 'Potassium (K)', 'unit' => 'mEq/L'],
                    'chloride' => ['name' => 'Chloride (Cl)', 'unit' => 'mEq/L'],
                    'bicarbonate' => ['name' => 'Bicarbonate (HCO3)', 'unit' => 'mEq/L'],
                    'anion_gap' => ['name' => 'Anion Gap', 'unit' => 'mEq/L'],
                    'sodium_potassium_ratio' => ['name' => 'Na/K Ratio', 'unit' => 'ratio']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CARDIAC',
                'name' => 'Cardiac Markers Panel',
                'category' => 'Biochemistry',
                'description' => 'Complete cardiac panel for myocardial infarction diagnosis',
                'procedure' => 'Chemiluminescent immunoassay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 1000.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'CK-MB: <25, Troponin I: <0.04, Troponin T: <0.01, LDH: 140-280, CK: 39-308',
                'reference_ranges' => [
                    'ck_total' => ['min' => 39, 'max' => 308, 'unit' => 'U/L'],
                    'ck_mb' => ['min' => 0, 'max' => 25, 'unit' => 'U/L'],
                    'ck_mb_index' => ['min' => 0, 'max' => 2.5, 'unit' => '%'],
                    'troponin_i' => ['min' => 0, 'max' => 0.04, 'unit' => 'ng/mL'],
                    'troponin_t' => ['min' => 0, 'max' => 0.01, 'unit' => 'ng/mL'],
                    'ldh' => ['min' => 140, 'max' => 280, 'unit' => 'U/L'],
                    'ldh1' => ['min' => 14, 'max' => 60, 'unit' => '%'],
                    'myoglobin' => ['min' => 0, 'max' => 70, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'ck_total' => ['name' => 'Total CK (Creatine Kinase)', 'unit' => 'U/L'],
                    'ck_mb' => ['name' => 'CK-MB', 'unit' => 'U/L'],
                    'ck_mb_index' => ['name' => 'CK-MB Index', 'unit' => '%'],
                    'troponin_i' => ['name' => 'Troponin I', 'unit' => 'ng/mL'],
                    'troponin_t' => ['name' => 'Troponin T', 'unit' => 'ng/mL'],
                    'ldh' => ['name' => 'LDH (Total)', 'unit' => 'U/L'],
                    'ldh1' => ['name' => 'LDH-1 Isoenzyme', 'unit' => '%'],
                    'myoglobin' => ['name' => 'Myoglobin', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TROP-I',
                'name' => 'Troponin I',
                'category' => 'Biochemistry',
                'description' => 'Highly specific marker for myocardial damage',
                'procedure' => 'Chemiluminescent immunoassay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 500.00,
                'turnaround_time' => 4,
                'unit' => 'ng/mL',
                'normal_values' => '<0.04 ng/mL',
                'reference_ranges' => [
                    'troponin_i' => ['min' => 0, 'max' => 0.04, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'troponin_i' => ['name' => 'Troponin I', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'AMYL',
                'name' => 'Serum Amylase',
                'category' => 'Biochemistry',
                'description' => 'Pancreatic enzyme for pancreatitis diagnosis',
                'procedure' => 'Enzymatic method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'U/L',
                'normal_values' => '30-110 U/L',
                'reference_ranges' => [
                    'amylase' => ['min' => 30, 'max' => 110, 'unit' => 'U/L']
                ],
                'parameters' => [
                    'amylase' => ['name' => 'Amylase', 'unit' => 'U/L']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'LIPASE',
                'name' => 'Serum Lipase',
                'category' => 'Biochemistry',
                'description' => 'More specific marker for pancreatitis',
                'procedure' => 'Enzymatic method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 4,
                'unit' => 'U/L',
                'normal_values' => '10-140 U/L',
                'reference_ranges' => [
                    'lipase' => ['min' => 10, 'max' => 140, 'unit' => 'U/L']
                ],
                'parameters' => [
                    'lipase' => ['name' => 'Lipase', 'unit' => 'U/L']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'SGPT',
                'name' => 'SGPT (ALT)',
                'category' => 'Biochemistry',
                'description' => 'Alanine aminotransferase for liver function',
                'procedure' => 'Kinetic method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 200.00,
                'turnaround_time' => 2,
                'unit' => 'U/L',
                'normal_values' => '7-56 U/L',
                'reference_ranges' => [
                    'sgpt' => ['min' => 7, 'max' => 56, 'unit' => 'U/L']
                ],
                'parameters' => [
                    'sgpt' => ['name' => 'SGPT (ALT)', 'unit' => 'U/L']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'SGOT',
                'name' => 'SGOT (AST)',
                'category' => 'Biochemistry',
                'description' => 'Aspartate aminotransferase for liver and heart',
                'procedure' => 'Kinetic method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 200.00,
                'turnaround_time' => 2,
                'unit' => 'U/L',
                'normal_values' => '5-40 U/L',
                'reference_ranges' => [
                    'sgot' => ['min' => 5, 'max' => 40, 'unit' => 'U/L']
                ],
                'parameters' => [
                    'sgot' => ['name' => 'SGOT (AST)', 'unit' => 'U/L']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'BIL-T',
                'name' => 'Total Bilirubin',
                'category' => 'Biochemistry',
                'description' => 'Measurement of total bilirubin for liver function',
                'procedure' => 'Diazo method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 150.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => '0.1-1.2 mg/dL',
                'reference_ranges' => [
                    'total_bilirubin' => ['min' => 0.1, 'max' => 1.2, 'unit' => 'mg/dL']
                ],
                'parameters' => [
                    'total_bilirubin' => ['name' => 'Total Bilirubin', 'unit' => 'mg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'IRON',
                'name' => 'Iron Studies',
                'category' => 'Biochemistry',
                'description' => 'Complete iron profile for anemia workup including transferrin saturation',
                'procedure' => 'Colorimetric and chemiluminescent methods',
                'sample_type' => 'Blood (Serum)',
                'cost' => 600.00,
                'turnaround_time' => 8,
                'unit' => 'Various',
                'normal_values' => 'Iron: 60-170, TIBC: 250-450, Transferrin Sat: 20-50%, Ferritin: 20-200',
                'reference_ranges' => [
                    'serum_iron' => ['min' => 60, 'max' => 170, 'unit' => 'μg/dL'],
                    'tibc' => ['min' => 250, 'max' => 450, 'unit' => 'μg/dL'],
                    'transferrin_saturation' => ['min' => 20, 'max' => 50, 'unit' => '%'],
                    'serum_transferrin' => ['min' => 200, 'max' => 360, 'unit' => 'mg/dL'],
                    'ferritin' => ['min' => 20, 'max' => 200, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'serum_iron' => ['name' => 'Serum Iron', 'unit' => 'μg/dL'],
                    'tibc' => ['name' => 'TIBC (Total Iron Binding Capacity)', 'unit' => 'μg/dL'],
                    'transferrin_saturation' => ['name' => 'Transferrin Saturation', 'unit' => '%'],
                    'serum_transferrin' => ['name' => 'Serum Transferrin', 'unit' => 'mg/dL'],
                    'ferritin' => ['name' => 'Ferritin', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'FERR',
                'name' => 'Ferritin',
                'category' => 'Biochemistry',
                'description' => 'Iron storage protein measurement',
                'procedure' => 'Chemiluminescent immunoassay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 8,
                'unit' => 'ng/mL',
                'normal_values' => 'Male: 20-250, Female: 10-120 ng/mL',
                'reference_ranges' => [
                    'male' => ['min' => 20, 'max' => 250, 'unit' => 'ng/mL'],
                    'female' => ['min' => 10, 'max' => 120, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'ferritin' => ['name' => 'Ferritin', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CPK',
                'name' => 'CPK (Creatine Phosphokinase)',
                'category' => 'Biochemistry',
                'description' => 'Enzyme marker for muscle and heart damage',
                'procedure' => 'Kinetic method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'U/L',
                'normal_values' => 'Male: 39-308, Female: 26-192 U/L',
                'reference_ranges' => [
                    'male' => ['min' => 39, 'max' => 308, 'unit' => 'U/L'],
                    'female' => ['min' => 26, 'max' => 192, 'unit' => 'U/L']
                ],
                'parameters' => [
                    'cpk' => ['name' => 'CPK', 'unit' => 'U/L']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TP-AG',
                'name' => 'Total Protein, Albumin, Globulin, A/G Ratio',
                'category' => 'Biochemistry',
                'description' => 'Comprehensive protein analysis for nutritional and liver status',
                'procedure' => 'Biuret method for total protein, BCG for albumin',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 4,
                'unit' => 'g/dL',
                'normal_values' => 'Total Protein: 6.0-8.3, Albumin: 3.5-5.0, Globulin: 2.3-3.5, A/G: 1.0-2.2',
                'reference_ranges' => [
                    'total_protein' => ['min' => 6.0, 'max' => 8.3, 'unit' => 'g/dL'],
                    'albumin' => ['min' => 3.5, 'max' => 5.0, 'unit' => 'g/dL'],
                    'globulin' => ['min' => 2.3, 'max' => 3.5, 'unit' => 'g/dL'],
                    'ag_ratio' => ['min' => 1.0, 'max' => 2.2, 'unit' => 'ratio']
                ],
                'parameters' => [
                    'total_protein' => ['name' => 'Total Protein', 'unit' => 'g/dL'],
                    'albumin' => ['name' => 'Albumin', 'unit' => 'g/dL'],
                    'globulin' => ['name' => 'Globulin', 'unit' => 'g/dL'],
                    'ag_ratio' => ['name' => 'A/G Ratio', 'unit' => 'ratio']
                ],
                'status' => 'active',
            ],
            // Hormone Tests
            [
                'test_code' => 'TSH',
                'name' => 'TSH (Thyroid Stimulating Hormone)',
                'category' => 'Biochemistry',
                'description' => 'Thyroid function test for hypothyroidism and hyperthyroidism',
                'procedure' => 'Chemiluminescent immunoassay (iChroma/Vidas)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 8,
                'unit' => 'μIU/mL',
                'normal_values' => '0.4-4.0 μIU/mL',
                'reference_ranges' => [
                    'tsh' => ['min' => 0.4, 'max' => 4.0, 'unit' => 'μIU/mL']
                ],
                'parameters' => [
                    'tsh' => ['name' => 'TSH', 'unit' => 'μIU/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TFT',
                'name' => 'Thyroid Function Tests (T3, T4, TSH)',
                'category' => 'Biochemistry',
                'description' => 'Complete thyroid panel including T3, T4, and TSH',
                'procedure' => 'Chemiluminescent immunoassay (Vidas)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 800.00,
                'turnaround_time' => 8,
                'unit' => 'Various',
                'normal_values' => 'T3: 0.8-2.0 ng/mL, T4: 5.0-12.0 μg/dL, TSH: 0.4-4.0 μIU/mL',
                'reference_ranges' => [
                    't3' => ['min' => 0.8, 'max' => 2.0, 'unit' => 'ng/mL'],
                    't4' => ['min' => 5.0, 'max' => 12.0, 'unit' => 'μg/dL'],
                    'tsh' => ['min' => 0.4, 'max' => 4.0, 'unit' => 'μIU/mL']
                ],
                'parameters' => [
                    't3' => ['name' => 'T3 (Triiodothyronine)', 'unit' => 'ng/mL'],
                    't4' => ['name' => 'T4 (Thyroxine)', 'unit' => 'μg/dL'],
                    'tsh' => ['name' => 'TSH', 'unit' => 'μIU/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'FHP',
                'name' => 'FSH, LH, Prolactin Panel',
                'category' => 'Biochemistry',
                'description' => 'Reproductive hormone panel for fertility assessment',
                'procedure' => 'Chemiluminescent immunoassay (iChroma)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 1200.00,
                'turnaround_time' => 8,
                'unit' => 'Various',
                'normal_values' => 'FSH: 1.5-12.4 (M), 4.7-21.5 (F), LH: 1.7-8.6 (M), 2.4-12.6 (F), Prolactin: 4.0-15.2 (M), 4.8-23.3 (F)',
                'reference_ranges' => [
                    'fsh_male' => ['min' => 1.5, 'max' => 12.4, 'unit' => 'mIU/mL'],
                    'fsh_female' => ['min' => 4.7, 'max' => 21.5, 'unit' => 'mIU/mL'],
                    'lh_male' => ['min' => 1.7, 'max' => 8.6, 'unit' => 'mIU/mL'],
                    'lh_female' => ['min' => 2.4, 'max' => 12.6, 'unit' => 'mIU/mL'],
                    'prolactin_male' => ['min' => 4.0, 'max' => 15.2, 'unit' => 'ng/mL'],
                    'prolactin_female' => ['min' => 4.8, 'max' => 23.3, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'fsh' => ['name' => 'FSH', 'unit' => 'mIU/mL'],
                    'lh' => ['name' => 'LH', 'unit' => 'mIU/mL'],
                    'prolactin' => ['name' => 'Prolactin', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TESTO',
                'name' => 'Testosterone',
                'category' => 'Biochemistry',
                'description' => 'Male sex hormone level measurement',
                'procedure' => 'Chemiluminescent immunoassay (iChroma)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 600.00,
                'turnaround_time' => 8,
                'unit' => 'ng/mL',
                'normal_values' => 'Male: 2.8-8.0, Female: 0.1-0.75 ng/mL',
                'reference_ranges' => [
                    'male' => ['min' => 2.8, 'max' => 8.0, 'unit' => 'ng/mL'],
                    'female' => ['min' => 0.1, 'max' => 0.75, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'testosterone' => ['name' => 'Testosterone', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'PROG',
                'name' => 'Progesterone',
                'category' => 'Biochemistry',
                'description' => 'Female hormone for pregnancy and menstrual cycle assessment',
                'procedure' => 'Chemiluminescent immunoassay (Vidas)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 600.00,
                'turnaround_time' => 8,
                'unit' => 'ng/mL',
                'normal_values' => 'Follicular: 0.1-0.8, Luteal: 1.5-22.0, Pregnancy: 9.5-75.0 ng/mL',
                'reference_ranges' => [
                    'progesterone' => ['min' => 0.1, 'max' => 75.0, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'progesterone' => ['name' => 'Progesterone', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'BHCG',
                'name' => 'Beta HCG (Pregnancy Test)',
                'category' => 'Biochemistry',
                'description' => 'Quantitative pregnancy hormone measurement',
                'procedure' => 'Chemiluminescent immunoassay (iChroma)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 500.00,
                'turnaround_time' => 4,
                'unit' => 'mIU/mL',
                'normal_values' => 'Non-pregnant: <5, Pregnant: >25 mIU/mL',
                'reference_ranges' => [
                    'beta_hcg' => ['min' => 0, 'max' => 5, 'unit' => 'mIU/mL']
                ],
                'parameters' => [
                    'beta_hcg' => ['name' => 'Beta HCG', 'unit' => 'mIU/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'AMH',
                'name' => 'AMH (Anti-Müllerian Hormone)',
                'category' => 'Biochemistry',
                'description' => 'Ovarian reserve marker for fertility assessment',
                'procedure' => 'Chemiluminescent immunoassay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 800.00,
                'turnaround_time' => 8,
                'unit' => 'ng/mL',
                'normal_values' => 'Female: 1.0-4.0 ng/mL (reproductive age)',
                'reference_ranges' => [
                    'amh' => ['min' => 1.0, 'max' => 4.0, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'amh' => ['name' => 'AMH', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CORT-AM',
                'name' => 'Cortisol (Morning)',
                'category' => 'Biochemistry',
                'description' => 'Morning cortisol level for adrenal function assessment',
                'procedure' => 'Chemiluminescent immunoassay (Vidas)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 600.00,
                'turnaround_time' => 8,
                'unit' => 'μg/dL',
                'normal_values' => '6.2-19.4 μg/dL (Morning)',
                'reference_ranges' => [
                    'cortisol' => ['min' => 6.2, 'max' => 19.4, 'unit' => 'μg/dL']
                ],
                'parameters' => [
                    'cortisol' => ['name' => 'Cortisol (Morning)', 'unit' => 'μg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CORT-PM',
                'name' => 'Cortisol (Evening)',
                'category' => 'Biochemistry',
                'description' => 'Evening cortisol level for adrenal function assessment',
                'procedure' => 'Chemiluminescent immunoassay (Vidas)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 600.00,
                'turnaround_time' => 8,
                'unit' => 'μg/dL',
                'normal_values' => '2.3-11.9 μg/dL (Evening)',
                'reference_ranges' => [
                    'cortisol' => ['min' => 2.3, 'max' => 11.9, 'unit' => 'μg/dL']
                ],
                'parameters' => [
                    'cortisol' => ['name' => 'Cortisol (Evening)', 'unit' => 'μg/dL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'GH',
                'name' => 'Growth Hormone',
                'category' => 'Biochemistry',
                'description' => 'Growth hormone level for pituitary function assessment',
                'procedure' => 'Chemiluminescent immunoassay (Vidas)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 700.00,
                'turnaround_time' => 8,
                'unit' => 'ng/mL',
                'normal_values' => 'Male: 0.4-10.0, Female: 1.0-14.0 ng/mL',
                'reference_ranges' => [
                    'male' => ['min' => 0.4, 'max' => 10.0, 'unit' => 'ng/mL'],
                    'female' => ['min' => 1.0, 'max' => 14.0, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'gh' => ['name' => 'Growth Hormone', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'PTH',
                'name' => 'Parathyroid Hormone (PTH)',
                'category' => 'Biochemistry',
                'description' => 'Parathyroid hormone for calcium metabolism assessment',
                'procedure' => 'Chemiluminescent immunoassay (Vidas)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 800.00,
                'turnaround_time' => 8,
                'unit' => 'pg/mL',
                'normal_values' => '15-65 pg/mL',
                'reference_ranges' => [
                    'pth' => ['min' => 15, 'max' => 65, 'unit' => 'pg/mL']
                ],
                'parameters' => [
                    'pth' => ['name' => 'PTH', 'unit' => 'pg/mL']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Serology/Immunology Tests
     */
    private function getSerologyTests(): array
    {
        return [
            [
                'test_code' => 'HBSAG',
                'name' => 'HBsAg (Hepatitis B Surface Antigen)',
                'category' => 'Serology',
                'description' => 'Screening test for Hepatitis B infection',
                'procedure' => 'Rapid chromatographic immunoassay or ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Non-reactive (Negative)',
                'reference_ranges' => [
                    'result' => ['values' => ['Non-reactive', 'Reactive']]
                ],
                'parameters' => [
                    'hbsag' => ['name' => 'HBsAg', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HCV-AB',
                'name' => 'HCV Antibody (Anti-HCV)',
                'category' => 'Serology',
                'description' => 'Screening test for Hepatitis C infection',
                'procedure' => 'Rapid immunoassay or ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Non-reactive (Negative)',
                'reference_ranges' => [
                    'result' => ['values' => ['Non-reactive', 'Reactive']]
                ],
                'parameters' => [
                    'hcv_ab' => ['name' => 'HCV Antibody', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HIV',
                'name' => 'HIV Screening',
                'category' => 'Serology',
                'description' => 'HIV-1 and HIV-2 antibody screening',
                'procedure' => 'Rapid immunoassay or ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 250.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Non-reactive (Negative)',
                'reference_ranges' => [
                    'result' => ['values' => ['Non-reactive', 'Reactive']]
                ],
                'parameters' => [
                    'hiv' => ['name' => 'HIV Antibody', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'VIRAL-PANEL',
                'name' => 'Viral Marker Panel (HBsAg, HCV, HIV)',
                'category' => 'Serology',
                'description' => 'Combined screening for Hepatitis B, C and HIV',
                'procedure' => 'Rapid immunoassays',
                'sample_type' => 'Blood (Serum)',
                'cost' => 500.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'All Non-reactive',
                'reference_ranges' => [
                    'hbsag' => ['values' => ['Non-reactive', 'Reactive']],
                    'hcv' => ['values' => ['Non-reactive', 'Reactive']],
                    'hiv' => ['values' => ['Non-reactive', 'Reactive']]
                ],
                'parameters' => [
                    'hbsag' => ['name' => 'HBsAg', 'unit' => ''],
                    'hcv' => ['name' => 'HCV Antibody', 'unit' => ''],
                    'hiv' => ['name' => 'HIV Antibody', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HPY-AG',
                'name' => 'H. pylori Antigen (Stool)',
                'category' => 'Serology',
                'description' => 'Detection of H. pylori antigen in stool',
                'procedure' => 'Rapid immunochromatographic assay',
                'sample_type' => 'Stool',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'h_pylori_ag' => ['name' => 'H. pylori Antigen', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HPY-AB',
                'name' => 'H. pylori Antibody (Serum)',
                'category' => 'Serology',
                'description' => 'Detection of H. pylori antibodies in blood',
                'procedure' => 'Rapid immunoassay or ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 250.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'h_pylori_ab' => ['name' => 'H. pylori Antibody', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TYPH',
                'name' => 'Typhidot (IgG & IgM)',
                'category' => 'Serology',
                'description' => 'Rapid test for typhoid fever antibodies',
                'procedure' => 'Immunochromatographic assay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 250.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Both Negative',
                'reference_ranges' => [
                    'igg' => ['values' => ['Negative', 'Positive']],
                    'igm' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'igg' => ['name' => 'Typhidot IgG', 'unit' => ''],
                    'igm' => ['name' => 'Typhidot IgM', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'WIDAL',
                'name' => 'Widal Test',
                'category' => 'Serology',
                'description' => 'Tube agglutination test for typhoid fever',
                'procedure' => 'Tube agglutination method',
                'sample_type' => 'Blood (Serum)',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'Titer',
                'normal_values' => '<1:80 for all antigens',
                'reference_ranges' => [
                    'o' => ['max' => 80, 'unit' => 'titer'],
                    'h' => ['max' => 80, 'unit' => 'titer'],
                    'ah' => ['max' => 80, 'unit' => 'titer'],
                    'bh' => ['max' => 80, 'unit' => 'titer']
                ],
                'parameters' => [
                    'o' => ['name' => 'S. typhi O', 'unit' => 'titer'],
                    'h' => ['name' => 'S. typhi H', 'unit' => 'titer'],
                    'ah' => ['name' => 'S. paratyphi AH', 'unit' => 'titer'],
                    'bh' => ['name' => 'S. paratyphi BH', 'unit' => 'titer']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'ASO',
                'name' => 'ASO (Anti-Streptolysin O)',
                'category' => 'Serology',
                'description' => 'Test for streptococcal infection',
                'procedure' => 'Latex agglutination or turbidimetry',
                'sample_type' => 'Blood (Serum)',
                'cost' => 250.00,
                'turnaround_time' => 4,
                'unit' => 'IU/mL',
                'normal_values' => '<200 IU/mL',
                'reference_ranges' => [
                    'aso' => ['min' => 0, 'max' => 200, 'unit' => 'IU/mL']
                ],
                'parameters' => [
                    'aso' => ['name' => 'ASO Titer', 'unit' => 'IU/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CRP',
                'name' => 'C-Reactive Protein (CRP)',
                'category' => 'Serology',
                'description' => 'Acute phase reactant for inflammation',
                'procedure' => 'Latex agglutination or immunoturbidimetry',
                'sample_type' => 'Blood (Serum)',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'mg/L',
                'normal_values' => '<6 mg/L',
                'reference_ranges' => [
                    'crp' => ['min' => 0, 'max' => 6, 'unit' => 'mg/L']
                ],
                'parameters' => [
                    'crp' => ['name' => 'CRP', 'unit' => 'mg/L']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'RF',
                'name' => 'Rheumatoid Factor (RF)',
                'category' => 'Serology',
                'description' => 'Test for rheumatoid arthritis',
                'procedure' => 'Latex agglutination or immunoturbidimetry',
                'sample_type' => 'Blood (Serum)',
                'cost' => 250.00,
                'turnaround_time' => 4,
                'unit' => 'IU/mL',
                'normal_values' => '<20 IU/mL',
                'reference_ranges' => [
                    'rf' => ['min' => 0, 'max' => 20, 'unit' => 'IU/mL']
                ],
                'parameters' => [
                    'rf' => ['name' => 'Rheumatoid Factor', 'unit' => 'IU/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CCP',
                'name' => 'Anti-CCP Antibodies',
                'category' => 'Serology',
                'description' => 'Specific test for rheumatoid arthritis',
                'procedure' => 'ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 800.00,
                'turnaround_time' => 24,
                'unit' => 'U/mL',
                'normal_values' => '<20 U/mL',
                'reference_ranges' => [
                    'anti_ccp' => ['min' => 0, 'max' => 20, 'unit' => 'U/mL']
                ],
                'parameters' => [
                    'anti_ccp' => ['name' => 'Anti-CCP', 'unit' => 'U/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'VDRL',
                'name' => 'VDRL',
                'category' => 'Serology',
                'description' => 'Screening test for syphilis',
                'procedure' => 'Flocculation test',
                'sample_type' => 'Blood (Serum)',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Non-reactive',
                'reference_ranges' => [
                    'result' => ['values' => ['Non-reactive', 'Reactive']]
                ],
                'parameters' => [
                    'vdrl' => ['name' => 'VDRL', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'BRU',
                'name' => 'Brucella IgG & IgM',
                'category' => 'Serology',
                'description' => 'Test for brucellosis',
                'procedure' => 'ELISA or Rapid test',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Both Negative',
                'reference_ranges' => [
                    'igg' => ['values' => ['Negative', 'Positive']],
                    'igm' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'igg' => ['name' => 'Brucella IgG', 'unit' => ''],
                    'igm' => ['name' => 'Brucella IgM', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TB-ICT',
                'name' => 'TB IgG & IgM (ICT)',
                'category' => 'Serology',
                'description' => 'Immunochromatographic test for tuberculosis antibodies',
                'procedure' => 'Rapid ICT',
                'sample_type' => 'Blood (Serum)',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Both Negative',
                'reference_ranges' => [
                    'igg' => ['values' => ['Negative', 'Positive']],
                    'igm' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'igg' => ['name' => 'TB IgG', 'unit' => ''],
                    'igm' => ['name' => 'TB IgM', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TOXO',
                'name' => 'Toxoplasma Test',
                'category' => 'Serology',
                'description' => 'Test for Toxoplasma gondii infection',
                'procedure' => 'ELISA or Rapid test',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'toxoplasma' => ['name' => 'Toxoplasma', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'TORCH',
                'name' => 'ToRCH Panel',
                'category' => 'Serology',
                'description' => 'Complete ToRCH panel for prenatal/pregnancy screening',
                'procedure' => 'ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 1500.00,
                'turnaround_time' => 24,
                'unit' => 'N/A',
                'normal_values' => 'All IgM Negative, IgG as per immune status',
                'reference_ranges' => [
                    'toxo_igm' => ['values' => ['Negative', 'Positive']],
                    'toxo_igg' => ['values' => ['Negative', 'Positive']],
                    'rub_igm' => ['values' => ['Negative', 'Positive']],
                    'rub_igg' => ['values' => ['Negative', 'Positive']],
                    'cmv_igm' => ['values' => ['Negative', 'Positive']],
                    'cmv_igg' => ['values' => ['Negative', 'Positive']],
                    'hsv_igm' => ['values' => ['Negative', 'Positive']],
                    'hsv_igg' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'toxo_igm' => ['name' => 'Toxoplasma IgM', 'unit' => ''],
                    'toxo_igg' => ['name' => 'Toxoplasma IgG', 'unit' => ''],
                    'toxo_igg_avidity' => ['name' => 'Toxoplasma IgG Avidity', 'unit' => ''],
                    'rub_igm' => ['name' => 'Rubella IgM', 'unit' => ''],
                    'rub_igg' => ['name' => 'Rubella IgG', 'unit' => ''],
                    'cmv_igm' => ['name' => 'CMV IgM', 'unit' => ''],
                    'cmv_igg' => ['name' => 'CMV IgG', 'unit' => ''],
                    'hsv_igm' => ['name' => 'HSV IgM', 'unit' => ''],
                    'hsv_igg' => ['name' => 'HSV IgG', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'LEISH',
                'name' => 'Leishmania Test',
                'category' => 'Serology',
                'description' => 'Test for Kala Azar (Visceral Leishmaniasis)',
                'procedure' => 'Rapid test or ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'leishmania' => ['name' => 'Leishmania', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HAV',
                'name' => 'HAV IgM (Hepatitis A)',
                'category' => 'Serology',
                'description' => 'Acute Hepatitis A infection marker',
                'procedure' => 'ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 300.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'hav_igm' => ['name' => 'HAV IgM', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'IGE',
                'name' => 'Total IgE',
                'category' => 'Serology',
                'description' => 'Total immunoglobulin E for allergy assessment',
                'procedure' => 'ELISA or nephelometry',
                'sample_type' => 'Blood (Serum)',
                'cost' => 400.00,
                'turnaround_time' => 8,
                'unit' => 'IU/mL',
                'normal_values' => '<100 IU/mL',
                'reference_ranges' => [
                    'ige' => ['min' => 0, 'max' => 100, 'unit' => 'IU/mL']
                ],
                'parameters' => [
                    'ige' => ['name' => 'Total IgE', 'unit' => 'IU/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'ANTI-CCP',
                'name' => 'Anti-CCP (Anti-Cyclic Citrullinated Peptide)',
                'category' => 'Serology',
                'description' => 'Specific marker for rheumatoid arthritis',
                'procedure' => 'ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 800.00,
                'turnaround_time' => 8,
                'unit' => 'U/mL',
                'normal_values' => '<20 U/mL (Negative), 20-39 (Weak Positive), >40 (Positive)',
                'reference_ranges' => [
                    'anti_ccp' => ['min' => 0, 'max' => 20, 'unit' => 'U/mL']
                ],
                'parameters' => [
                    'anti_ccp' => ['name' => 'Anti-CCP Antibodies', 'unit' => 'U/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HBV-P',
                'name' => 'HBV Profile (Hepatitis B Panel)',
                'category' => 'Serology',
                'description' => 'Complete Hepatitis B virus marker panel',
                'procedure' => 'ELISA',
                'sample_type' => 'Blood (Serum)',
                'cost' => 800.00,
                'turnaround_time' => 24,
                'unit' => 'N/A',
                'normal_values' => 'All markers negative (non-infected, non-immune) or HBsAb positive (immune)',
                'reference_ranges' => [
                    'hbsag' => ['values' => ['Negative', 'Positive']],
                    'hbsab' => ['values' => ['Negative', 'Positive']],
                    'hbcab' => ['values' => ['Negative', 'Positive']],
                    'hbeag' => ['values' => ['Negative', 'Positive']],
                    'hbeab' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'hbsag' => ['name' => 'HBsAg', 'unit' => ''],
                    'hbsab' => ['name' => 'HBsAb (Anti-HBs)', 'unit' => ''],
                    'hbcab' => ['name' => 'HBcAb (Anti-HBc)', 'unit' => ''],
                    'hbeag' => ['name' => 'HBeAg', 'unit' => ''],
                    'hbeab' => ['name' => 'HBeAb (Anti-HBe)', 'unit' => '']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Coagulation Tests
     */
    private function getCoagulationTests(): array
    {
        return [
            [
                'test_code' => 'PT-INR',
                'name' => 'PT & INR',
                'category' => 'Coagulation',
                'description' => 'Complete coagulation profile with PT, INR, and control values',
                'procedure' => 'Coagulometer using thromboplastin reagent',
                'sample_type' => 'Blood (Sodium Citrate)',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'Seconds/Ratio',
                'normal_values' => 'PT: 11-14 seconds, Control: 11-14 seconds, INR: 0.9-1.1, Ratio: 0.9-1.1',
                'reference_ranges' => [
                    'pt' => ['min' => 11, 'max' => 14, 'unit' => 'seconds'],
                    'pt_control' => ['min' => 11, 'max' => 14, 'unit' => 'seconds'],
                    'inr' => ['min' => 0.9, 'max' => 1.1, 'unit' => 'ratio'],
                    'pt_ratio' => ['min' => 0.9, 'max' => 1.1, 'unit' => 'ratio'],
                    'isi' => ['min' => 0.9, 'max' => 1.3, 'unit' => 'index']
                ],
                'parameters' => [
                    'pt' => ['name' => 'Prothrombin Time (Patient)', 'unit' => 'seconds'],
                    'pt_control' => ['name' => 'Prothrombin Time (Control)', 'unit' => 'seconds'],
                    'pt_ratio' => ['name' => 'PT Ratio', 'unit' => 'ratio'],
                    'inr' => ['name' => 'INR (International Normalized Ratio)', 'unit' => 'ratio'],
                    'isi' => ['name' => 'ISI (International Sensitivity Index)', 'unit' => 'index']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'APTT',
                'name' => 'APTT (Activated Partial Thromboplastin Time)',
                'category' => 'Coagulation',
                'description' => 'Complete APTT with patient and control values',
                'procedure' => 'Coagulometer using activated partial thromboplastin reagent',
                'sample_type' => 'Blood (Sodium Citrate)',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'Seconds',
                'normal_values' => 'Patient: 25-35 seconds, Control: 25-35 seconds, Ratio: 0.8-1.2',
                'reference_ranges' => [
                    'aptt' => ['min' => 25, 'max' => 35, 'unit' => 'seconds'],
                    'aptt_control' => ['min' => 25, 'max' => 35, 'unit' => 'seconds'],
                    'aptt_ratio' => ['min' => 0.8, 'max' => 1.2, 'unit' => 'ratio']
                ],
                'parameters' => [
                    'aptt' => ['name' => 'APTT (Patient)', 'unit' => 'seconds'],
                    'aptt_control' => ['name' => 'APTT (Control)', 'unit' => 'seconds'],
                    'aptt_ratio' => ['name' => 'APTT Ratio', 'unit' => 'ratio']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'BTCT',
                'name' => 'Bleeding Time & Clotting Time',
                'category' => 'Coagulation',
                'description' => 'Manual test for platelet function and coagulation',
                'procedure' => 'Duke method for BT, Capillary tube method for CT',
                'sample_type' => 'Blood (Capillary)',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'Minutes',
                'normal_values' => 'BT: 2-7, CT: 5-10 minutes',
                'reference_ranges' => [
                    'bt' => ['min' => 2, 'max' => 7, 'unit' => 'minutes'],
                    'ct' => ['min' => 5, 'max' => 10, 'unit' => 'minutes']
                ],
                'parameters' => [
                    'bt' => ['name' => 'Bleeding Time', 'unit' => 'minutes'],
                    'ct' => ['name' => 'Clotting Time', 'unit' => 'minutes']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'D-DIMER',
                'name' => 'D-Dimer',
                'category' => 'Coagulation',
                'description' => 'Fibrin degradation product for DVT/PE',
                'procedure' => 'Immunoturbidimetric assay',
                'sample_type' => 'Blood (Sodium Citrate)',
                'cost' => 500.00,
                'turnaround_time' => 4,
                'unit' => 'ng/mL',
                'normal_values' => '<500 ng/mL',
                'reference_ranges' => [
                    'd_dimer' => ['min' => 0, 'max' => 500, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'd_dimer' => ['name' => 'D-Dimer', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Microbiology Tests
     */
    private function getMicrobiologyTests(): array
    {
        return [
            [
                'test_code' => 'BLOOD-CULT',
                'name' => 'Blood Culture',
                'category' => 'Microbiology',
                'description' => 'Detection of bacteria/fungi in blood',
                'procedure' => 'Aerobic and anaerobic culture using automated system',
                'sample_type' => 'Blood (Aseptic)',
                'cost' => 600.00,
                'turnaround_time' => 72,
                'unit' => 'N/A',
                'normal_values' => 'No growth',
                'reference_ranges' => [
                    'result' => ['values' => ['No growth', 'Growth']]
                ],
                'parameters' => [
                    'organism' => ['name' => 'Organism', 'unit' => ''],
                    'sensitivity' => ['name' => 'Antibiotic Sensitivity', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'URINE-CULT',
                'name' => 'Urine Culture & Sensitivity',
                'category' => 'Microbiology',
                'description' => 'Detection of UTI causing organisms',
                'procedure' => 'Culture on CLED and blood agar',
                'sample_type' => 'Urine (Mid-stream clean catch)',
                'cost' => 400.00,
                'turnaround_time' => 48,
                'unit' => 'CFU/mL',
                'normal_values' => '<1000 CFU/mL or No growth',
                'reference_ranges' => [
                    'count' => ['max' => 1000, 'unit' => 'CFU/mL']
                ],
                'parameters' => [
                    'organism' => ['name' => 'Organism', 'unit' => ''],
                    'count' => ['name' => 'Colony Count', 'unit' => 'CFU/mL'],
                    'sensitivity' => ['name' => 'Antibiotic Sensitivity', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'WOUND-CULT',
                'name' => 'Wound/Pus Culture',
                'category' => 'Microbiology',
                'description' => 'Identification of wound infection organisms',
                'procedure' => 'Culture on various media',
                'sample_type' => 'Pus/Wound swab',
                'cost' => 400.00,
                'turnaround_time' => 48,
                'unit' => 'N/A',
                'normal_values' => 'No significant growth',
                'reference_ranges' => [
                    'result' => ['values' => ['No growth', 'Growth']]
                ],
                'parameters' => [
                    'organism' => ['name' => 'Organism', 'unit' => ''],
                    'sensitivity' => ['name' => 'Antibiotic Sensitivity', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'CSF-EX',
                'name' => 'CSF Examination',
                'category' => 'Microbiology',
                'description' => 'Complete cerebrospinal fluid analysis with biochemistry and cell count',
                'procedure' => 'Physical, chemical and microscopic examination',
                'sample_type' => 'CSF (Aseptic collection)',
                'cost' => 600.00,
                'turnaround_time' => 24,
                'unit' => 'Various',
                'normal_values' => 'Clear, Colorless, pH: 7.3-7.4, Glucose: 40-70, Protein: 15-45, Chloride: 115-130, WBC: 0-5, RBC: 0',
                'reference_ranges' => [
                    'glucose' => ['min' => 40, 'max' => 70, 'unit' => 'mg/dL'],
                    'protein' => ['min' => 15, 'max' => 45, 'unit' => 'mg/dL'],
                    'chloride' => ['min' => 115, 'max' => 130, 'unit' => 'mEq/L'],
                    'wbc' => ['min' => 0, 'max' => 5, 'unit' => '/mm3'],
                    'rbc' => ['min' => 0, 'max' => 0, 'unit' => '/mm3'],
                    'lymphocytes' => ['min' => 0, 'max' => 100, 'unit' => '%'],
                    'neutrophils' => ['min' => 0, 'max' => 0, 'unit' => '%']
                ],
                'parameters' => [
                    // Physical
                    'appearance' => ['name' => 'Appearance', 'unit' => ''],
                    'color' => ['name' => 'Color', 'unit' => ''],
                    'ph' => ['name' => 'pH', 'unit' => ''],
                    'specific_gravity' => ['name' => 'Specific Gravity', 'unit' => ''],
                    // Biochemistry
                    'glucose' => ['name' => 'Glucose (CSF)', 'unit' => 'mg/dL'],
                    'protein' => ['name' => 'Total Protein', 'unit' => 'mg/dL'],
                    'chloride' => ['name' => 'Chloride', 'unit' => 'mEq/L'],
                    'ldh' => ['name' => 'LDH', 'unit' => 'U/L'],
                    'ada' => ['name' => 'ADA (Adenosine Deaminase)', 'unit' => 'U/L'],
                    'glucose_ratio' => ['name' => 'CSF/Serum Glucose Ratio', 'unit' => 'ratio'],
                    // Cell Count
                    'total_cells' => ['name' => 'Total Cell Count', 'unit' => '/mm3'],
                    'wbc' => ['name' => 'White Blood Cells', 'unit' => '/mm3'],
                    'rbc' => ['name' => 'Red Blood Cells', 'unit' => '/mm3'],
                    'lymphocytes' => ['name' => 'Lymphocytes', 'unit' => '%'],
                    'neutrophils' => ['name' => 'Neutrophils', 'unit' => '%'],
                    'monocytes' => ['name' => 'Monocytes', 'unit' => '%'],
                    'mesothelial' => ['name' => 'Mesothelial Cells', 'unit' => '/mm3'],
                    // Microbiology
                    'gram_stain' => ['name' => 'Gram Stain', 'unit' => ''],
                    'culture' => ['name' => 'Culture', 'unit' => ''],
                    'afb_stain' => ['name' => 'AFB Stain', 'unit' => ''],
                    'india_ink' => ['name' => 'India Ink Preparation', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'PLEURAL',
                'name' => 'Pleural Fluid Examination',
                'category' => 'Microbiology',
                'description' => 'Complete pleural fluid analysis with Light criteria for exudate/transudate differentiation',
                'procedure' => 'Physical, chemical and microscopic examination',
                'sample_type' => 'Pleural fluid',
                'cost' => 500.00,
                'turnaround_time' => 24,
                'unit' => 'Various',
                'normal_values' => 'Transudate: Protein <3 g/dL, LDH <200, Glucose similar to serum',
                'reference_ranges' => [
                    'protein' => ['max' => 3, 'unit' => 'g/dL'],
                    'ldh' => ['max' => 200, 'unit' => 'U/L'],
                    'glucose' => ['min' => 60, 'max' => 100, 'unit' => 'mg/dL'],
                    'ph' => ['min' => 7.4, 'max' => 7.6, 'unit' => ''],
                    'wbc' => ['min' => 0, 'max' => 1000, 'unit' => '/mm3']
                ],
                'parameters' => [
                    // Physical
                    'appearance' => ['name' => 'Appearance', 'unit' => ''],
                    'color' => ['name' => 'Color', 'unit' => ''],
                    'ph' => ['name' => 'pH', 'unit' => ''],
                    'specific_gravity' => ['name' => 'Specific Gravity', 'unit' => ''],
                    // Biochemistry
                    'protein' => ['name' => 'Total Protein', 'unit' => 'g/dL'],
                    'protein_serum' => ['name' => 'Serum Protein', 'unit' => 'g/dL'],
                    'protein_ratio' => ['name' => 'Pleural/Serum Protein Ratio', 'unit' => 'ratio'],
                    'glucose' => ['name' => 'Glucose', 'unit' => 'mg/dL'],
                    'ldh' => ['name' => 'LDH (Fluid)', 'unit' => 'U/L'],
                    'ldh_serum' => ['name' => 'LDH (Serum)', 'unit' => 'U/L'],
                    'ldh_ratio' => ['name' => 'Pleural/Serum LDH Ratio', 'unit' => 'ratio'],
                    'ada' => ['name' => 'ADA (Adenosine Deaminase)', 'unit' => 'U/L'],
                    'amylase' => ['name' => 'Amylase', 'unit' => 'U/L'],
                    'triglycerides' => ['name' => 'Triglycerides (for chylothorax)', 'unit' => 'mg/dL'],
                    'cholesterol' => ['name' => 'Cholesterol', 'unit' => 'mg/dL'],
                    // Cell Count
                    'total_cells' => ['name' => 'Total Cell Count', 'unit' => '/mm3'],
                    'wbc' => ['name' => 'White Blood Cells', 'unit' => '/mm3'],
                    'rbc' => ['name' => 'Red Blood Cells', 'unit' => '/mm3'],
                    'lymphocytes' => ['name' => 'Lymphocytes', 'unit' => '%'],
                    'neutrophils' => ['name' => 'Neutrophils', 'unit' => '%'],
                    'mesothelial' => ['name' => 'Mesothelial Cells', 'unit' => '/mm3'],
                    // Light Criteria
                    'light_criteria' => ['name' => 'Light Criteria (Exudate if any positive)', 'unit' => ''],
                    // Microbiology
                    'gram_stain' => ['name' => 'Gram Stain', 'unit' => ''],
                    'culture' => ['name' => 'Culture', 'unit' => ''],
                    'afb_stain' => ['name' => 'AFB Stain', 'unit' => ''],
                    'cytology' => ['name' => 'Cytology', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'BC-GROWTH',
                'name' => 'Blood Culture Growth',
                'category' => 'Microbiology',
                'description' => 'Detection and identification of bacteria/fungi growth in blood culture',
                'procedure' => 'Automated blood culture system with subculture and identification',
                'sample_type' => 'Blood (Aseptic venipuncture)',
                'cost' => 500.00,
                'turnaround_time' => 72,
                'unit' => 'N/A',
                'normal_values' => 'No growth after 5-7 days',
                'reference_ranges' => [
                    'result' => ['values' => ['No Growth', 'Growth']]
                ],
                'parameters' => [
                    'growth' => ['name' => 'Culture Growth', 'unit' => ''],
                    'organism' => ['name' => 'Organism Identified', 'unit' => ''],
                    'gram_stain' => ['name' => 'Gram Stain', 'unit' => ''],
                    'sensitivity' => ['name' => 'Antibiotic Sensitivity', 'unit' => '']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Molecular/PCR Tests
     */
    private function getMolecularTests(): array
    {
        return [
            [
                'test_code' => 'COVID-PCR',
                'name' => 'COVID-19 RNA PCR',
                'category' => 'Molecular',
                'description' => 'Molecular detection of SARS-CoV-2 RNA',
                'procedure' => 'Real-time RT-PCR',
                'sample_type' => 'Nasopharyngeal swab',
                'cost' => 800.00,
                'turnaround_time' => 24,
                'unit' => 'N/A',
                'normal_values' => 'Not detected',
                'reference_ranges' => [
                    'result' => ['values' => ['Not Detected', 'Detected']]
                ],
                'parameters' => [
                    'result' => ['name' => 'SARS-CoV-2 RNA', 'unit' => ''],
                    'ct_value' => ['name' => 'Ct Value', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HBV-DNA',
                'name' => 'HBV DNA PCR (Quantitative)',
                'category' => 'Molecular',
                'description' => 'Viral load quantification for Hepatitis B',
                'procedure' => 'Real-time PCR',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 2500.00,
                'turnaround_time' => 48,
                'unit' => 'IU/mL',
                'normal_values' => '<20 IU/mL (Undetectable)',
                'reference_ranges' => [
                    'viral_load' => ['max' => 20, 'unit' => 'IU/mL']
                ],
                'parameters' => [
                    'viral_load' => ['name' => 'HBV Viral Load', 'unit' => 'IU/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'HCV-RNA',
                'name' => 'HCV RNA PCR (Quantitative)',
                'category' => 'Molecular',
                'description' => 'Viral load quantification for Hepatitis C',
                'procedure' => 'Real-time PCR',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 2500.00,
                'turnaround_time' => 48,
                'unit' => 'IU/mL',
                'normal_values' => '<15 IU/mL (Undetectable)',
                'reference_ranges' => [
                    'viral_load' => ['max' => 15, 'unit' => 'IU/mL'],
                    'genotype' => ['values' => ['1', '2', '3', '4', '5', '6']]
                ],
                'parameters' => [
                    'viral_load' => ['name' => 'HCV Viral Load', 'unit' => 'IU/mL'],
                    'genotype' => ['name' => 'Genotype', 'unit' => '']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Urine Tests
     */
    private function getUrineTests(): array
    {
        return [
            [
                'test_code' => 'URINE-R',
                'name' => 'Urine Routine Examination',
                'category' => 'Urine',
                'description' => 'Complete physical, chemical and microscopic analysis of urine',
                'procedure' => 'Dipstick analysis and microscopy',
                'sample_type' => 'Urine (Mid-stream)',
                'cost' => 150.00,
                'turnaround_time' => 2,
                'unit' => 'Various',
                'normal_values' => 'pH: 5-7, SG: 1.005-1.030, Negative for protein, glucose, ketones, bilirubin, blood, nitrite, leukocytes',
                'reference_ranges' => [
                    'ph' => ['min' => 5, 'max' => 7, 'unit' => ''],
                    'specific_gravity' => ['min' => 1.005, 'max' => 1.03, 'unit' => ''],
                    'rbc' => ['min' => 0, 'max' => 2, 'unit' => '/HPF'],
                    'pus_cells' => ['min' => 0, 'max' => 5, 'unit' => '/HPF'],
                    'epithelial_cells' => ['min' => 0, 'max' => 5, 'unit' => '/HPF']
                ],
                'parameters' => [
                    // Physical
                    'color' => ['name' => 'Color', 'unit' => ''],
                    'appearance' => ['name' => 'Appearance', 'unit' => ''],
                    // Chemical
                    'ph' => ['name' => 'pH', 'unit' => ''],
                    'specific_gravity' => ['name' => 'Specific Gravity', 'unit' => ''],
                    'protein' => ['name' => 'Protein (Albumin)', 'unit' => ''],
                    'glucose' => ['name' => 'Glucose (Sugar)', 'unit' => ''],
                    'ketones' => ['name' => 'Ketones', 'unit' => ''],
                    'bilirubin' => ['name' => 'Bilirubin', 'unit' => ''],
                    'urobilinogen' => ['name' => 'Urobilinogen', 'unit' => 'mg/dL'],
                    'blood' => ['name' => 'Blood (Hemoglobin)', 'unit' => ''],
                    'nitrite' => ['name' => 'Nitrite', 'unit' => ''],
                    'leukocyte_esterase' => ['name' => 'Leukocyte Esterase', 'unit' => ''],
                    // Microscopic
                    'rbc' => ['name' => 'Red Blood Cells (RBC)', 'unit' => '/HPF'],
                    'pus_cells' => ['name' => 'Pus Cells (WBC)', 'unit' => '/HPF'],
                    'epithelial_cells' => ['name' => 'Epithelial Cells', 'unit' => '/HPF'],
                    'casts' => ['name' => 'Casts', 'unit' => '/LPF'],
                    'crystals' => ['name' => 'Crystals', 'unit' => ''],
                    'bacteria' => ['name' => 'Bacteria', 'unit' => ''],
                    'yeast' => ['name' => 'Yeast Cells', 'unit' => ''],
                    'mucus' => ['name' => 'Mucus Threads', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'URINE-CS',
                'name' => 'Urine C/S',
                'category' => 'Urine',
                'description' => 'Urine culture and sensitivity',
                'procedure' => 'Culture on CLED agar',
                'sample_type' => 'Urine (Mid-stream clean catch)',
                'cost' => 400.00,
                'turnaround_time' => 48,
                'unit' => 'CFU/mL',
                'normal_values' => '<1000 CFU/mL',
                'reference_ranges' => [
                    'count' => ['max' => 1000, 'unit' => 'CFU/mL']
                ],
                'parameters' => [
                    'organism' => ['name' => 'Organism', 'unit' => ''],
                    'count' => ['name' => 'Colony Count', 'unit' => 'CFU/mL'],
                    'sensitivity' => ['name' => 'Antibiotic Sensitivity', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'UPT',
                'name' => 'Urine Pregnancy Test',
                'category' => 'Urine',
                'description' => 'Detection of hCG hormone in urine',
                'procedure' => 'Immunochromatographic assay',
                'sample_type' => 'Urine (First morning)',
                'cost' => 150.00,
                'turnaround_time' => 1,
                'unit' => 'N/A',
                'normal_values' => 'Negative (Non-pregnant)',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'result' => ['name' => 'Pregnancy Test', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'FOBT',
                'name' => 'Occult Blood (FOBT)',
                'category' => 'Urine',
                'description' => 'Detection of hidden blood in stool',
                'procedure' => 'Guaiac-based or immunochemical test',
                'sample_type' => 'Stool',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'result' => ['name' => 'Occult Blood', 'unit' => '']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Stool Tests
     */
    private function getStoolTests(): array
    {
        return [
            [
                'test_code' => 'STOOL-R',
                'name' => 'Stool Routine Examination',
                'category' => 'Stool',
                'description' => 'Complete physical, chemical and microscopic examination of stool',
                'procedure' => 'Direct microscopy and concentration techniques',
                'sample_type' => 'Stool (Fresh)',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Brown, formed stool, No blood/mucus, No ova/cysts/parasites, pH: 6.5-7.5',
                'reference_ranges' => [
                    'ph' => ['min' => 6.5, 'max' => 7.5, 'unit' => ''],
                    'color' => ['values' => ['Brown', 'Yellow', 'Green', 'Black', 'Red', 'Clay-colored']],
                    'consistency' => ['values' => ['Formed', 'Semi-formed', 'Soft', 'Loose', 'Watery', 'Hard']],
                    'amount' => ['values' => ['Normal', 'Small', 'Large']],
                    'odor' => ['values' => ['Normal', 'Foul', 'Offensive', 'Sweet']],
                    'blood' => ['values' => ['Absent', 'Present']],
                    'mucus' => ['values' => ['Absent', 'Present']],
                    'pus' => ['values' => ['Absent', 'Present']],
                    'undigested_food' => ['values' => ['Absent', 'Present']],
                    'ova' => ['values' => ['Not Seen', 'Seen']],
                    'cysts' => ['values' => ['Not Seen', 'Seen']],
                    'trophozoites' => ['values' => ['Not Seen', 'Seen']],
                    'parasites' => ['values' => ['Not Seen', 'Seen']],
                    'rbc' => ['values' => ['0-2/HPF', '3-5/HPF', '>5/HPF']],
                    'pus_cells' => ['values' => ['0-2/HPF', '3-5/HPF', '>5/HPF']],
                    'fat_globules' => ['values' => ['Few', 'Moderate', 'Many']],
                    'starch_granules' => ['values' => ['Few', 'Moderate', 'Many']],
                    'muscle_fibers' => ['values' => ['Few', 'Moderate', 'Many']],
                    'vegetable_cells' => ['values' => ['Few', 'Moderate', 'Many']],
                    'bacteria' => ['values' => ['Normal', 'Decreased', 'Increased']],
                    'yeast' => ['values' => ['Not Seen', 'Seen']],
                    'occult_blood' => ['values' => ['Negative', 'Positive']],
                    'reducing_substances' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'color' => ['name' => 'Color', 'unit' => ''],
                    'consistency' => ['name' => 'Consistency', 'unit' => ''],
                    'amount' => ['name' => 'Amount', 'unit' => ''],
                    'odor' => ['name' => 'Odor', 'unit' => ''],
                    'ph' => ['name' => 'pH', 'unit' => ''],
                    'blood' => ['name' => 'Blood (Gross)', 'unit' => ''],
                    'mucus' => ['name' => 'Mucus', 'unit' => ''],
                    'pus' => ['name' => 'Pus', 'unit' => ''],
                    'undigested_food' => ['name' => 'Undigested Food', 'unit' => ''],
                    'ova' => ['name' => 'Ova (Eggs)', 'unit' => ''],
                    'cysts' => ['name' => 'Cysts', 'unit' => ''],
                    'trophozoites' => ['name' => 'Trophozoites', 'unit' => ''],
                    'parasites' => ['name' => 'Parasites', 'unit' => ''],
                    'rbc' => ['name' => 'Red Blood Cells', 'unit' => '/HPF'],
                    'pus_cells' => ['name' => 'Pus Cells (WBC)', 'unit' => '/HPF'],
                    'fat_globules' => ['name' => 'Fat Globules', 'unit' => ''],
                    'starch_granules' => ['name' => 'Starch Granules', 'unit' => ''],
                    'muscle_fibers' => ['name' => 'Muscle Fibers', 'unit' => ''],
                    'vegetable_cells' => ['name' => 'Vegetable Cells', 'unit' => ''],
                    'bacteria' => ['name' => 'Bacterial Flora', 'unit' => ''],
                    'yeast' => ['name' => 'Yeast Cells', 'unit' => ''],
                    'occult_blood' => ['name' => 'Occult Blood', 'unit' => ''],
                    'reducing_substances' => ['name' => 'Reducing Substances', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'STOOL-OB',
                'name' => 'Stool Occult Blood',
                'category' => 'Stool',
                'description' => 'Detection of hidden blood in stool',
                'procedure' => 'Guaiac test or immunochemical test',
                'sample_type' => 'Stool',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'result' => ['name' => 'Occult Blood', 'unit' => '']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Semen Analysis
     */
    private function getSemenTests(): array
    {
        return [
            [
                'test_code' => 'SEMEN',
                'name' => 'Complete Semen Analysis',
                'category' => 'Semen',
                'description' => 'Comprehensive analysis of semen for fertility assessment (WHO 2021 standards)',
                'procedure' => 'Macroscopic and microscopic examination',
                'sample_type' => 'Semen (After 2-5 days abstinence)',
                'cost' => 600.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'Volume: >1.5mL, pH: >7.2, Count: >15 million/mL, Total Count: >39 million, Motility: >40%, Progressive: >32%, Morphology: >4%',
                'reference_ranges' => [
                    'volume' => ['min' => 1.5, 'max' => 5.0, 'unit' => 'mL'],
                    'ph' => ['min' => 7.2, 'max' => 8.0, 'unit' => ''],
                    'count' => ['min' => 15, 'unit' => 'million/mL'],
                    'total_count' => ['min' => 39, 'unit' => 'million'],
                    'motility' => ['min' => 40, 'max' => 100, 'unit' => '%'],
                    'progressive_motility' => ['min' => 32, 'max' => 100, 'unit' => '%'],
                    'non_progressive' => ['min' => 0, 'max' => 8, 'unit' => '%'],
                    'immotile' => ['min' => 0, 'max' => 48, 'unit' => '%'],
                    'morphology' => ['min' => 4, 'max' => 100, 'unit' => '%'],
                    'vitality' => ['min' => 58, 'max' => 100, 'unit' => '%']
                ],
                'parameters' => [
                    // Macroscopic
                    'volume' => ['name' => 'Semen Volume', 'unit' => 'mL'],
                    'color' => ['name' => 'Color', 'unit' => ''],
                    'appearance' => ['name' => 'Appearance', 'unit' => ''],
                    'viscosity' => ['name' => 'Viscosity/Liquefaction', 'unit' => ''],
                    'ph' => ['name' => 'pH', 'unit' => ''],
                    // Sperm Count
                    'count' => ['name' => 'Sperm Concentration', 'unit' => 'million/mL'],
                    'total_count' => ['name' => 'Total Sperm Count', 'unit' => 'million'],
                    // Motility
                    'motility' => ['name' => 'Total Motility (PR+NP)', 'unit' => '%'],
                    'progressive_motility' => ['name' => 'Progressive Motility (PR)', 'unit' => '%'],
                    'non_progressive' => ['name' => 'Non-Progressive Motility (NP)', 'unit' => '%'],
                    'immotile' => ['name' => 'Immotile Sperm', 'unit' => '%'],
                    // Morphology
                    'morphology' => ['name' => 'Normal Morphology', 'unit' => '%'],
                    'head_defects' => ['name' => 'Head Defects', 'unit' => '%'],
                    'neck_defects' => ['name' => 'Neck/Midpiece Defects', 'unit' => '%'],
                    'tail_defects' => ['name' => 'Tail Defects', 'unit' => '%'],
                    // Other
                    'vitality' => ['name' => 'Sperm Vitality', 'unit' => '%'],
                    'agglutination' => ['name' => 'Agglutination', 'unit' => ''],
                    'pus_cells' => ['name' => 'Pus Cells (WBC)', 'unit' => '/HPF'],
                    'rbc' => ['name' => 'Red Blood Cells', 'unit' => '/HPF'],
                    'bacteria' => ['name' => 'Bacteria', 'unit' => ''],
                    'epithelial_cells' => ['name' => 'Epithelial Cells', 'unit' => '/HPF']
                ],
                'status' => 'active',
            ],
        ];
    }

    /**
     * Special Tests
     */
    private function getSpecialTests(): array
    {
        return [
            [
                'test_code' => 'CROSS-MATCH',
                'name' => 'Cross Match (Blood Transfusion)',
                'category' => 'Special',
                'description' => 'Compatibility testing for blood transfusion',
                'procedure' => 'Major and minor crossmatch using donor and recipient blood',
                'sample_type' => 'Blood (EDTA and Serum)',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Compatible (No agglutination)',
                'reference_ranges' => [
                    'result' => ['values' => ['Compatible', 'Incompatible']]
                ],
                'parameters' => [
                    'major_crossmatch' => ['name' => 'Major Crossmatch', 'unit' => ''],
                    'minor_crossmatch' => ['name' => 'Minor Crossmatch', 'unit' => ''],
                    'donor_group' => ['name' => 'Donor Blood Group', 'unit' => ''],
                    'recipient_group' => ['name' => 'Recipient Blood Group', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'COOMBS-D',
                'name' => 'Direct Coombs Test',
                'category' => 'Special',
                'description' => 'Detection of antibodies on RBC surface',
                'procedure' => 'Direct antiglobulin test (DAT)',
                'sample_type' => 'Blood (EDTA)',
                'cost' => 350.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'result' => ['name' => 'Direct Coombs', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'COOMBS-I',
                'name' => 'Indirect Coombs Test',
                'category' => 'Special',
                'description' => 'Detection of antibodies in serum',
                'procedure' => 'Indirect antiglobulin test (IAT)',
                'sample_type' => 'Blood (Serum)',
                'cost' => 350.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'result' => ['name' => 'Indirect Coombs', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'MULTIDRUG',
                'name' => 'Multi-Drug Test (12 Panel)',
                'category' => 'Special',
                'description' => 'Screening for multiple drugs of abuse',
                'procedure' => 'Immunoassay',
                'sample_type' => 'Urine',
                'cost' => 800.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative for all drugs',
                'reference_ranges' => [
                    'result' => ['values' => ['Negative', 'Positive']]
                ],
                'parameters' => [
                    'amphetamine' => ['name' => 'Amphetamine', 'unit' => ''],
                    'cocaine' => ['name' => 'Cocaine', 'unit' => ''],
                    'opiates' => ['name' => 'Opiates', 'unit' => ''],
                    'thc' => ['name' => 'THC', 'unit' => ''],
                    'benzodiazepines' => ['name' => 'Benzodiazepines', 'unit' => '']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'PSA',
                'name' => 'PSA (Prostate Specific Antigen)',
                'category' => 'Special',
                'description' => 'Tumor marker for prostate cancer screening',
                'procedure' => 'Chemiluminescent immunoassay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 600.00,
                'turnaround_time' => 8,
                'unit' => 'ng/mL',
                'normal_values' => '<4.0 ng/mL',
                'reference_ranges' => [
                    'psa' => ['min' => 0, 'max' => 4, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'psa' => ['name' => 'Total PSA', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'AFP',
                'name' => 'Alpha Feto Protein (AFP)',
                'category' => 'Special',
                'description' => 'Tumor marker for liver cancer and fetal abnormalities',
                'procedure' => 'Chemiluminescent immunoassay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 600.00,
                'turnaround_time' => 8,
                'unit' => 'ng/mL',
                'normal_values' => '<10 ng/mL (Adult)',
                'reference_ranges' => [
                    'afp' => ['min' => 0, 'max' => 10, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'afp' => ['name' => 'Alpha Feto Protein', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'VIT-D',
                'name' => 'Vitamin D3 (25-OH Vitamin D)',
                'category' => 'Special',
                'description' => 'Measurement of vitamin D status',
                'procedure' => 'Chemiluminescent immunoassay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 800.00,
                'turnaround_time' => 8,
                'unit' => 'ng/mL',
                'normal_values' => '30-100 ng/mL (Sufficient)',
                'reference_ranges' => [
                    'vit_d' => ['min' => 30, 'max' => 100, 'unit' => 'ng/mL']
                ],
                'parameters' => [
                    'vit_d' => ['name' => '25-OH Vitamin D', 'unit' => 'ng/mL']
                ],
                'status' => 'active',
            ],
            [
                'test_code' => 'VIT-B12',
                'name' => 'Vitamin B12',
                'category' => 'Special',
                'description' => 'Measurement of vitamin B12 level',
                'procedure' => 'Chemiluminescent immunoassay',
                'sample_type' => 'Blood (Serum)',
                'cost' => 700.00,
                'turnaround_time' => 8,
                'unit' => 'pg/mL',
                'normal_values' => '200-900 pg/mL',
                'reference_ranges' => [
                    'vit_b12' => ['min' => 200, 'max' => 900, 'unit' => 'pg/mL']
                ],
                'parameters' => [
                    'vit_b12' => ['name' => 'Vitamin B12', 'unit' => 'pg/mL']
                ],
                'status' => 'active',
            ],
        ];
    }
}