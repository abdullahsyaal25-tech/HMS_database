<?php

namespace Database\Seeders;

use App\Models\LabTest;
use Illuminate\Database\Seeder;

/**
 * Comprehensive Lab Test Seeder
 * 
 * This seeder contains all lab tests with standardized test codes and reference values.
 * Test codes are designed to match frontend templates in Create.tsx.
 * 
 * Categories:
 * 1. Hematology Tests
 * 2. Lipid Profile
 * 3. Liver Function Tests
 * 4. Kidney Function Tests
 * 5. Glucose Profile
 * 6. Pancreatic Profile
 * 7. Cardiac Profile
 * 8. Thyroid Function Tests
 * 9. Hormones
 * 10. Urine Tests
 * 11. Stool Tests
 * 12. Serology Tests
 * 13. Coagulation Tests
 * 14. Microbiology/Culture Tests
 * 15. PCR Tests
 * 16. Other Tests
 */
class ComprehensiveLabTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $labTests = $this->getHematologyTests()
            + $this->getLipidProfileTests()
            + $this->getLiverFunctionTests()
            + $this->getKidneyFunctionTests()
            + $this->getGlucoseProfileTests()
            + $this->getPancreaticProfileTests()
            + $this->getCardiacProfileTests()
            + $this->getThyroidFunctionTests()
            + $this->getHormoneTests()
            + $this->getUrineTests()
            + $this->getStoolTests()
            + $this->getSerologyTests()
            + $this->getCoagulationTests()
            + $this->getMicrobiologyTests()
            + $this->getPcrTests()
            + $this->getOtherTests();

        foreach ($labTests as $test) {
            LabTest::updateOrCreate(
                ['test_code' => $test['test_code']],
                $test
            );
        }

        $this->command->info('Comprehensive lab tests seeded successfully!');
        $this->command->info('Total tests: ' . count($labTests));
    }

    /**
     * Hematology Tests
     */
    private function getHematologyTests(): array
    {
        return [
            // CBC - Complete Blood Count (matches frontend template)
            'CBC' => [
                'test_code' => 'CBC',
                'name' => 'Complete Blood Count (CBC)',
                'description' => 'Comprehensive blood test analyzing red blood cells, white blood cells, and platelets. Parameters: WBC, RBC, Hemoglobin, Hematocrit, Platelets, MCV, MCH, MCHC',
                'procedure' => 'Blood sample collection and automated analysis using hematology analyzer',
                'cost' => 80.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'WBC: 4.5-11.0 10³/μL, RBC: 4.5-5.5 10⁶/μL, Hemoglobin: 13.5-17.5 g/dL, Hematocrit: 38-50%, Platelets: 150-400 10³/μL, MCV: 80-100 fL, MCH: 27-33 pg, MCHC: 32-36 g/dL',
                'status' => 'active',
            ],
            // Blood Group & RH
            'BG' => [
                'test_code' => 'BG',
                'name' => 'Blood Group & RH',
                'description' => 'Determination of ABO blood group and Rh factor (Positive/Negative)',
                'procedure' => 'Serological testing using antisera',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'N/A',
                'normal_values' => 'A, B, AB, O with Rh +ve or -ve',
                'status' => 'active',
            ],
            // ESR
            'ESR' => [
                'test_code' => 'ESR',
                'name' => 'Erythrocyte Sedimentation Rate (ESR)',
                'description' => 'Test for inflammation in the body',
                'procedure' => 'Westergren method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mm/hr',
                'normal_values' => 'Male: 0-15 mm/hr, Female: 0-20 mm/hr',
                'status' => 'active',
            ],
            // Reticulocytes Count
            'RET' => [
                'test_code' => 'RET',
                'name' => 'Reticulocytes Count',
                'description' => 'Count of immature red blood cells',
                'procedure' => 'Blood smear examination',
                'cost' => 350.00,
                'turnaround_time' => 8,
                'unit' => '%',
                'normal_values' => '0.5-2.5%',
                'status' => 'active',
            ],
            // HB - Hemoglobin
            'HB' => [
                'test_code' => 'HB',
                'name' => 'Hemoglobin (HB/HGB)',
                'description' => 'Measurement of hemoglobin concentration in blood',
                'procedure' => 'Automated blood analyzer',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'g/dL',
                'normal_values' => 'Male: 13-18 g/dL, Female: 12-16 g/dL',
                'status' => 'active',
            ],
            // Peripheral Smear
            'PS' => [
                'test_code' => 'PS',
                'name' => 'Peripheral Smear',
                'description' => 'Microscopic examination of blood cells morphology',
                'procedure' => 'Blood smear staining and microscopic examination',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Normal RBCs, WBCs, and platelets morphology',
                'status' => 'active',
            ],
            // DLC - Differential Leukocyte Count
            'DLC' => [
                'test_code' => 'DLC',
                'name' => 'Differential Leukocyte Count (DLC)',
                'description' => 'Count of different types of white blood cells (Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils)',
                'procedure' => 'Automated analyzer or manual differential count',
                'cost' => 80.00,
                'turnaround_time' => 4,
                'unit' => '%',
                'normal_values' => 'Neutrophils: 50-70%, Lymphocytes: 20-40%, Monocytes: 2-10%, Eosinophils: 1-6%, Basophils: 0-1%',
                'status' => 'active',
            ],
            // Platelet Count
            'PLT' => [
                'test_code' => 'PLT',
                'name' => 'Platelet Count',
                'description' => 'Count of platelets in blood',
                'procedure' => 'Automated hematology analyzer',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => '10³/μL',
                'normal_values' => '150-400 10³/μL',
                'status' => 'active',
            ],
            // TLC - Total Leukocyte Count
            'TLC' => [
                'test_code' => 'TLC',
                'name' => 'Total Leukocyte Count (WBC)',
                'description' => 'Total count of white blood cells',
                'procedure' => 'Automated hematology analyzer',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => '10³/μL',
                'normal_values' => '4.5-11.0 10³/μL',
                'status' => 'active',
            ],
            // Malarial Parasites
            'MP' => [
                'test_code' => 'MP',
                'name' => 'Malarial Parasites (MP)',
                'description' => 'Detection of malaria parasites in blood',
                'procedure' => 'Blood smear examination for malaria parasites',
                'cost' => 50.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'No parasites seen',
                'status' => 'active',
            ],
            // MP ICT
            'MPICT' => [
                'test_code' => 'MPICT',
                'name' => 'Malaria ICT (Rapid Test)',
                'description' => 'Rapid immunochromatographic test for malaria',
                'procedure' => 'ICT kit test',
                'cost' => 50.00,
                'turnaround_time' => 1,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // G6PD
            'G6PD' => [
                'test_code' => 'G6PD',
                'name' => 'G6PD Deficiency Test',
                'description' => 'Test for Glucose-6-Phosphate Dehydrogenase deficiency',
                'procedure' => 'Quantitative enzyme assay',
                'cost' => 150.00,
                'turnaround_time' => 24,
                'unit' => 'U/gHb',
                'normal_values' => '4.6-13.5 U/gHb',
                'status' => 'active',
            ],
            // Coomb's Direct
            'COOMBD' => [
                'test_code' => 'COOMBD',
                'name' => "Coomb's Test (Direct)",
                'description' => 'Direct antiglobulin test to detect antibodies on red blood cells',
                'procedure' => 'Serological testing',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Coomb's Indirect
            'COOMBI' => [
                'test_code' => 'COOMBI',
                'name' => "Coomb's Test (Indirect)",
                'description' => 'Indirect antiglobulin test to detect antibodies in serum',
                'procedure' => 'Serological testing',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // RH Factor
            'RH' => [
                'test_code' => 'RH',
                'name' => 'RH Factor',
                'description' => 'Determination of Rh factor',
                'procedure' => 'Serological testing',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'N/A',
                'normal_values' => 'Rh Positive or Rh Negative',
                'status' => 'active',
            ],
            // RH Antibodies Titre
            'RHAT' => [
                'test_code' => 'RHAT',
                'name' => 'RH Antibodies Titre',
                'description' => 'Titer test for Rh antibodies',
                'procedure' => 'Serological testing',
                'cost' => 50.00,
                'turnaround_time' => 8,
                'unit' => 'Titer',
                'normal_values' => 'Negative or <1:4',
                'status' => 'active',
            ],
            // ABO Grouping
            'ABO' => [
                'test_code' => 'ABO',
                'name' => 'ABO Blood Grouping',
                'description' => 'Determination of ABO blood group',
                'procedure' => 'Serological testing',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'N/A',
                'normal_values' => 'A, B, AB, or O',
                'status' => 'active',
            ],
            // Cross Matching
            'XM' => [
                'test_code' => 'XM',
                'name' => 'Cross Matching',
                'description' => 'Compatibility testing between donor and recipient blood',
                'procedure' => 'Serological crossmatch',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Compatible',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Lipid Profile Tests
     */
    private function getLipidProfileTests(): array
    {
        return [
            // Lipid Profile (matches frontend template - test_code is 'Lipid' not 'LIPID')
            'Lipid' => [
                'test_code' => 'Lipid',
                'name' => 'Lipid Profile',
                'description' => 'Comprehensive test including Total Cholesterol, LDL, HDL, Triglycerides',
                'procedure' => 'Blood sample analysis for lipid fractions after 9-12 hour fast',
                'cost' => 250.00,
                'turnaround_time' => 8,
                'unit' => 'mg/dL',
                'normal_values' => 'Total Cholesterol: 0-200 mg/dL, LDL: 0-100 mg/dL, HDL: 40-200 mg/dL, Triglycerides: 0-150 mg/dL',
                'status' => 'active',
            ],
            // Cholesterol Total
            'CHOL' => [
                'test_code' => 'CHOL',
                'name' => 'Cholesterol (Total)',
                'description' => 'Total cholesterol measurement',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 50.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => 'Desirable: <200 mg/dL, Borderline: 200-239 mg/dL, High: >=240 mg/dL',
                'status' => 'active',
            ],
            // Triglycerides
            'TG' => [
                'test_code' => 'TG',
                'name' => 'Triglycerides',
                'description' => 'Measurement of triglycerides in blood',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 50.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => 'Normal: <150 mg/dL, Borderline: 150-199 mg/dL, High: 200-499 mg/dL',
                'status' => 'active',
            ],
            // HDL Cholesterol
            'HDL' => [
                'test_code' => 'HDL',
                'name' => 'HDL Cholesterol',
                'description' => 'High-Density Lipoprotein cholesterol measurement',
                'procedure' => 'Direct enzymatic method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => 'Male: >40 mg/dL, Female: >50 mg/dL',
                'status' => 'active',
            ],
            // LDL Cholesterol
            'LDL' => [
                'test_code' => 'LDL',
                'name' => 'LDL Cholesterol',
                'description' => 'Low-Density Lipoprotein cholesterol measurement',
                'procedure' => 'Direct enzymatic method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => 'Optimal: <100 mg/dL, Near Optimal: 100-129 mg/dL',
                'status' => 'active',
            ],
            // VLDL Cholesterol
            'VLDL' => [
                'test_code' => 'VLDL',
                'name' => 'VLDL Cholesterol',
                'description' => 'Very Low-Density Lipoprotein cholesterol measurement',
                'procedure' => 'Calculated or direct method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '5-40 mg/dL',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Liver Function Tests
     */
    private function getLiverFunctionTests(): array
    {
        return [
            // LFT - Liver Function Test (matches frontend template)
            'LFT' => [
                'test_code' => 'LFT',
                'name' => 'Liver Function Test (LFT)',
                'description' => 'Comprehensive liver function tests including ALT, AST, ALP, Total Bilirubin, Direct Bilirubin, Albumin, Total Protein',
                'procedure' => 'Blood sample analysis for liver enzymes and proteins',
                'cost' => 350.00,
                'turnaround_time' => 8,
                'unit' => 'Various',
                'normal_values' => 'ALT: 7-56 U/L, AST: 10-40 U/L, ALP: 44-147 U/L, Total Bilirubin: 0.1-1.2 mg/dL, Direct Bilirubin: 0-0.3 mg/dL, Albumin: 3.5-5.0 g/dL, Total Protein: 6.0-8.3 g/dL',
                'status' => 'active',
            ],
            // SGPT (ALT)
            'SGPT' => [
                'test_code' => 'SGPT',
                'name' => 'SGPT (ALT)',
                'description' => 'Serum Glutamic-Pyruvic Transaminase / Alanine Aminotransferase',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'U/L',
                'normal_values' => '7-56 U/L',
                'status' => 'active',
            ],
            // SGOT (AST)
            'SGOT' => [
                'test_code' => 'SGOT',
                'name' => 'SGOT (AST)',
                'description' => 'Serum Glutamic-Oxaloacetic Transaminase / Aspartate Aminotransferase',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'U/L',
                'normal_values' => '10-40 U/L',
                'status' => 'active',
            ],
            // ALP
            'ALP' => [
                'test_code' => 'ALP',
                'name' => 'Alkaline Phosphatase (ALP)',
                'description' => 'Enzyme test for liver and bone disorders',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'U/L',
                'normal_values' => '44-147 U/L',
                'status' => 'active',
            ],
            // Total Bilirubin
            'TBIL' => [
                'test_code' => 'TBIL',
                'name' => 'Bilirubin Total',
                'description' => 'Total bilirubin measurement',
                'procedure' => 'Colorimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '0.1-1.2 mg/dL',
                'status' => 'active',
            ],
            // Direct Bilirubin
            'DBIL' => [
                'test_code' => 'DBIL',
                'name' => 'Bilirubin Direct',
                'description' => 'Direct (conjugated) bilirubin measurement',
                'procedure' => 'Colorimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '0.0-0.3 mg/dL',
                'status' => 'active',
            ],
            // Indirect Bilirubin
            'IBIL' => [
                'test_code' => 'IBIL',
                'name' => 'Bilirubin Indirect',
                'description' => 'Indirect (unconjugated) bilirubin measurement',
                'procedure' => 'Calculated (Total - Direct)',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '0.1-1.0 mg/dL',
                'status' => 'active',
            ],
            // Total Protein
            'TP' => [
                'test_code' => 'TP',
                'name' => 'Total Protein',
                'description' => 'Measurement of total protein in serum',
                'procedure' => 'Biuret method',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'g/dL',
                'normal_values' => '6.0-8.3 g/dL',
                'status' => 'active',
            ],
            // Albumin
            'ALB' => [
                'test_code' => 'ALB',
                'name' => 'Albumin',
                'description' => 'Measurement of albumin in serum',
                'procedure' => 'Bromocresol green method',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'g/dL',
                'normal_values' => '3.5-5.0 g/dL',
                'status' => 'active',
            ],
            // Globulin
            'GLOB' => [
                'test_code' => 'GLOB',
                'name' => 'Globulin',
                'description' => 'Measurement of globulin in serum',
                'procedure' => 'Calculated (Total Protein - Albumin)',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'g/dL',
                'normal_values' => '2.0-3.5 g/dL',
                'status' => 'active',
            ],
            // A/G Ratio
            'AGR' => [
                'test_code' => 'AGR',
                'name' => 'A/G Ratio',
                'description' => 'Albumin to Globulin Ratio',
                'procedure' => 'Calculated',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'Ratio',
                'normal_values' => '1.0-2.0',
                'status' => 'active',
            ],
            // Bile Salt
            'BS' => [
                'test_code' => 'BS',
                'name' => 'Bile Salt',
                'description' => 'Test for bile salt in blood',
                'procedure' => 'Biochemical analysis',
                'cost' => 150.00,
                'turnaround_time' => 8,
                'unit' => 'μmol/L',
                'normal_values' => '0-10 μmol/L',
                'status' => 'active',
            ],
            // Bile Pigment
            'BP' => [
                'test_code' => 'BP',
                'name' => 'Bile Pigment',
                'description' => 'Test for bile pigment in blood/urine',
                'procedure' => 'Chemical analysis',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Kidney Function Tests
     */
    private function getKidneyFunctionTests(): array
    {
        return [
            // BMP - Basic Metabolic Panel (matches frontend template)
            'BMP' => [
                'test_code' => 'BMP',
                'name' => 'Basic Metabolic Panel (BMP)',
                'description' => 'Panel of tests including Glucose, BUN, Creatinine, Sodium, Potassium, Chloride, CO2, Calcium',
                'procedure' => 'Blood sample analysis using automated chemistry analyzer',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'Glucose: 70-100 mg/dL, BUN: 7-20 mg/dL, Creatinine: 0.6-1.2 mg/dL, Sodium: 135-145 mEq/L, Potassium: 3.5-5.0 mEq/L, Chloride: 98-106 mEq/L, CO2: 23-29 mEq/L, Calcium: 8.5-10.5 mg/dL',
                'status' => 'active',
            ],
            // KFT - Kidney Function Test
            'KFT' => [
                'test_code' => 'KFT',
                'name' => 'Kidney Function Test (KFT)',
                'description' => 'Comprehensive kidney function tests including Creatinine, Urea, BUN, Electrolytes',
                'procedure' => 'Blood and urine analysis for kidney markers',
                'cost' => 350.00,
                'turnaround_time' => 8,
                'unit' => 'Various',
                'normal_values' => 'Varies by parameter',
                'status' => 'active',
            ],
            // Serum Creatinine
            'CREA' => [
                'test_code' => 'CREA',
                'name' => 'Serum Creatinine',
                'description' => 'Measurement of creatinine in blood',
                'procedure' => 'Jaffe method or enzymatic',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '0.6-1.2 mg/dL',
                'status' => 'active',
            ],
            // Serum Urea
            'UREA' => [
                'test_code' => 'UREA',
                'name' => 'Serum Urea',
                'description' => 'Measurement of urea nitrogen in blood',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '7-20 mg/dL',
                'status' => 'active',
            ],
            // BUN
            'BUN' => [
                'test_code' => 'BUN',
                'name' => 'Blood Urea Nitrogen (BUN)',
                'description' => 'Measurement of urea nitrogen in blood',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '7-20 mg/dL',
                'status' => 'active',
            ],
            // Uric Acid
            'UA' => [
                'test_code' => 'UA',
                'name' => 'Uric Acid',
                'description' => 'Measurement of uric acid in blood',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => 'Male: 3.4-7.0 mg/dL, Female: 2.4-6.0 mg/dL',
                'status' => 'active',
            ],
            // Calcium
            'CA' => [
                'test_code' => 'CA',
                'name' => 'Calcium',
                'description' => 'Measurement of total calcium in blood',
                'procedure' => 'Arsenazo III method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '8.5-10.5 mg/dL',
                'status' => 'active',
            ],
            // Magnesium
            'MG' => [
                'test_code' => 'MG',
                'name' => 'Magnesium',
                'description' => 'Measurement of magnesium in blood',
                'procedure' => 'Colorimetric method',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '1.7-2.4 mg/dL',
                'status' => 'active',
            ],
            // Sodium
            'NA' => [
                'test_code' => 'NA',
                'name' => 'Sodium (Na)',
                'description' => 'Measurement of sodium in blood',
                'procedure' => 'Ion selective electrode',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'mEq/L',
                'normal_values' => '135-145 mEq/L',
                'status' => 'active',
            ],
            // Potassium
            'K' => [
                'test_code' => 'K',
                'name' => 'Potassium (K)',
                'description' => 'Measurement of potassium in blood',
                'procedure' => 'Ion selective electrode',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'mEq/L',
                'normal_values' => '3.5-5.0 mEq/L',
                'status' => 'active',
            ],
            // Chloride
            'CL' => [
                'test_code' => 'CL',
                'name' => 'Chloride (Cl)',
                'description' => 'Measurement of chloride in blood',
                'procedure' => 'Ion selective electrode',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'mEq/L',
                'normal_values' => '98-106 mEq/L',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Glucose Profile Tests
     */
    private function getGlucoseProfileTests(): array
    {
        return [
            // FBS
            'FBS' => [
                'test_code' => 'FBS',
                'name' => 'Fasting Blood Sugar (FBS)',
                'description' => 'Blood glucose measurement after fasting',
                'procedure' => 'Glucose oxidase method',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => '70-100 mg/dL',
                'status' => 'active',
            ],
            // RBS
            'RBS' => [
                'test_code' => 'RBS',
                'name' => 'Random Blood Sugar (RBS)',
                'description' => 'Blood glucose measurement at any time',
                'procedure' => 'Glucose oxidase method',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => '<140 mg/dL',
                'status' => 'active',
            ],
            // HbA1c (matches frontend template - test_code is 'HbA1c' not 'HBA1C')
            'HbA1c' => [
                'test_code' => 'HbA1c',
                'name' => 'Hemoglobin A1c (HbA1c)',
                'description' => 'Average blood glucose over past 2-3 months',
                'procedure' => 'HPLC or immunoturbidimetric method',
                'cost' => 250.00,
                'turnaround_time' => 24,
                'unit' => '%',
                'normal_values' => 'Normal: 4.0-5.7%, Prediabetes: 5.7-6.4%, Diabetes: >=6.5%',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Pancreatic Profile Tests
     */
    private function getPancreaticProfileTests(): array
    {
        return [
            // Amylase
            'AMY' => [
                'test_code' => 'AMY',
                'name' => 'Amylase',
                'description' => 'Enzyme test for pancreatic function',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 150.00,
                'turnaround_time' => 8,
                'unit' => 'U/L',
                'normal_values' => '28-100 U/L',
                'status' => 'active',
            ],
            // Lipase
            'LIP' => [
                'test_code' => 'LIP',
                'name' => 'Lipase',
                'description' => 'Enzyme test for pancreatic function',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 150.00,
                'turnaround_time' => 8,
                'unit' => 'U/L',
                'normal_values' => '13-60 U/L',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Cardiac Profile Tests
     */
    private function getCardiacProfileTests(): array
    {
        return [
            // CPK
            'CPK' => [
                'test_code' => 'CPK',
                'name' => 'Creatine Phosphokinase (CPK/CK)',
                'description' => 'Enzyme test for muscle damage including heart',
                'procedure' => 'Enzymatic kinetic method',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'U/L',
                'normal_values' => 'Male: 38-174 U/L, Female: 26-140 U/L',
                'status' => 'active',
            ],
            // CK-MB
            'CKMB' => [
                'test_code' => 'CKMB',
                'name' => 'CK-MB (Creatine Kinase-MB)',
                'description' => 'Cardiac-specific enzyme for heart damage',
                'procedure' => 'Immunoinhibition or immunoassay',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'U/L',
                'normal_values' => '0-25 U/L',
                'status' => 'active',
            ],
            // CK-NAC
            'CKNAC' => [
                'test_code' => 'CKNAC',
                'name' => 'CK-NAC',
                'description' => 'CK with N-acetylcysteine activation',
                'procedure' => 'Enzymatic method',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'U/L',
                'normal_values' => 'Male: 38-174 U/L, Female: 26-140 U/L',
                'status' => 'active',
            ],
            // LDH
            'LDH' => [
                'test_code' => 'LDH',
                'name' => 'Lactate Dehydrogenase (LDH)',
                'description' => 'Enzyme test for tissue damage',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 300.00,
                'turnaround_time' => 8,
                'unit' => 'U/L',
                'normal_values' => '140-280 U/L',
                'status' => 'active',
            ],
            // Troponin I
            'TROP' => [
                'test_code' => 'TROP',
                'name' => 'Troponin I',
                'description' => 'Cardiac biomarker for heart muscle damage',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 250.00,
                'turnaround_time' => 4,
                'unit' => 'ng/mL',
                'normal_values' => '<0.04 ng/mL',
                'status' => 'active',
            ],
            // Troponin T
            'TROPT' => [
                'test_code' => 'TROPT',
                'name' => 'Troponin T',
                'description' => 'Cardiac biomarker for heart muscle damage',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 4,
                'unit' => 'ng/mL',
                'normal_values' => '<0.01 ng/mL',
                'status' => 'active',
            ],
            // D-Dimer
            'DDIMER' => [
                'test_code' => 'DDIMER',
                'name' => 'D-Dimer',
                'description' => 'Test for blood clot formation and breakdown',
                'procedure' => 'Immunoturbidimetric method',
                'cost' => 300.00,
                'turnaround_time' => 8,
                'unit' => 'μg/mL',
                'normal_values' => '<0.5 μg/mL',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Thyroid Function Tests
     */
    private function getThyroidFunctionTests(): array
    {
        return [
            // TFT
            'TFT' => [
                'test_code' => 'TFT',
                'name' => 'Thyroid Function Test (TFT)',
                'description' => 'Comprehensive thyroid panel including TSH, T3, T4',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 600.00,
                'turnaround_time' => 24,
                'unit' => 'Various',
                'normal_values' => 'Varies by parameter',
                'status' => 'active',
            ],
            // TSH (matches frontend template)
            'TSH' => [
                'test_code' => 'TSH',
                'name' => 'Thyroid Stimulating Hormone (TSH)',
                'description' => 'Primary test for thyroid function',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'μIU/mL',
                'normal_values' => '0.4-4.0 μIU/mL',
                'status' => 'active',
            ],
            // T3
            'T3' => [
                'test_code' => 'T3',
                'name' => 'T3 (Triiodothyronine)',
                'description' => 'Active thyroid hormone measurement',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'ng/dL',
                'normal_values' => '80-200 ng/dL',
                'status' => 'active',
            ],
            // T4
            'T4' => [
                'test_code' => 'T4',
                'name' => 'T4 (Thyroxine)',
                'description' => 'Thyroid hormone measurement',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'μg/dL',
                'normal_values' => '5.0-12.0 μg/dL',
                'status' => 'active',
            ],
            // Free T3
            'FT3' => [
                'test_code' => 'FT3',
                'name' => 'Free T3 (Free Triiodothyronine)',
                'description' => 'Active free thyroid hormone measurement',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'pg/mL',
                'normal_values' => '2.3-4.2 pg/mL',
                'status' => 'active',
            ],
            // Free T4
            'FT4' => [
                'test_code' => 'FT4',
                'name' => 'Free T4 (Free Thyroxine)',
                'description' => 'Free thyroid hormone measurement',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'ng/dL',
                'normal_values' => '0.8-1.8 ng/dL',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Hormone Tests
     */
    private function getHormoneTests(): array
    {
        return [
            // LH
            'LH' => [
                'test_code' => 'LH',
                'name' => 'Luteinizing Hormone (LH)',
                'description' => 'Pituitary hormone for reproductive function',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'mIU/mL',
                'normal_values' => 'Male: 1.24-7.8 mIU/mL, Female: varies by phase',
                'status' => 'active',
            ],
            // FSH
            'FSH' => [
                'test_code' => 'FSH',
                'name' => 'Follicle Stimulating Hormone (FSH)',
                'description' => 'Pituitary hormone for reproductive function',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'mIU/mL',
                'normal_values' => 'Male: 1.27-19.3 mIU/mL, Female: varies by phase',
                'status' => 'active',
            ],
            // Prolactin
            'PRL' => [
                'test_code' => 'PRL',
                'name' => 'Prolactin (PRL)',
                'description' => 'Hormone for milk production',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'ng/mL',
                'normal_values' => 'Male: 2.64-13.13 ng/mL, Female: 3.79-23.3 ng/mL',
                'status' => 'active',
            ],
            // Progesterone
            'PROG' => [
                'test_code' => 'PROG',
                'name' => 'Progesterone',
                'description' => 'Hormone involved in menstrual cycle and pregnancy',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'ng/mL',
                'normal_values' => 'Male: 0.2-1.4 ng/mL, Female: varies by phase',
                'status' => 'active',
            ],
            // Estrogen
            'EST' => [
                'test_code' => 'EST',
                'name' => 'Estrogen',
                'description' => 'Female sex hormone',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'pg/mL',
                'normal_values' => 'Male: 20-80 pg/mL, Female: varies by phase',
                'status' => 'active',
            ],
            // Estradiol
            'E2' => [
                'test_code' => 'E2',
                'name' => 'Estradiol (E2)',
                'description' => 'Primary female estrogen hormone',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'pg/mL',
                'normal_values' => 'Male: 10-50 pg/mL, Female: varies by phase',
                'status' => 'active',
            ],
            // Testosterone
            'TESTO' => [
                'test_code' => 'TESTO',
                'name' => 'Testosterone',
                'description' => 'Male sex hormone',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'ng/dL',
                'normal_values' => 'Male: 300-1000 ng/dL, Female: 15-70 ng/dL',
                'status' => 'active',
            ],
            // Beta HCG
            'BHGC' => [
                'test_code' => 'BHGC',
                'name' => 'Beta HCG Level',
                'description' => 'Pregnancy hormone measurement',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 8,
                'unit' => 'mIU/mL',
                'normal_values' => 'Non-pregnant: <5 mIU/mL',
                'status' => 'active',
            ],
            // Vitamin D
            'VITD' => [
                'test_code' => 'VITD',
                'name' => 'Vitamin D3 (25-Hydroxy Vitamin D)',
                'description' => 'Vitamin D level measurement',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 350.00,
                'turnaround_time' => 24,
                'unit' => 'ng/mL',
                'normal_values' => 'Sufficient: >30 ng/mL, Insufficient: 20-30 ng/mL, Deficient: <20 ng/mL',
                'status' => 'active',
            ],
            // Vitamin B12
            'VITB12' => [
                'test_code' => 'VITB12',
                'name' => 'Vitamin B12',
                'description' => 'Cobalamin level measurement',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 750.00,
                'turnaround_time' => 24,
                'unit' => 'pg/mL',
                'normal_values' => '200-900 pg/mL',
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
            // Urinalysis
            'URINE' => [
                'test_code' => 'URINE',
                'name' => 'Urinalysis (Urine R/E)',
                'description' => 'Comprehensive urine examination including physical, chemical, and microscopic analysis',
                'procedure' => 'Urine sample analysis',
                'cost' => 50.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'Normal appearance, pH 4.5-8, specific gravity 1.005-1.030',
                'status' => 'active',
            ],
            // Urine Pregnancy Test
            'UPT' => [
                'test_code' => 'UPT',
                'name' => 'Urine Pregnancy Test',
                'description' => 'Detection of pregnancy in urine',
                'procedure' => 'Immunochromatographic test',
                'cost' => 50.00,
                'turnaround_time' => 1,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Urine Multi-Drug Test
            'URINEMULTI' => [
                'test_code' => 'URINEMULTI',
                'name' => 'Urine Multi-Drug Test',
                'description' => 'Screening for multiple drugs in urine',
                'procedure' => 'Immunoassay',
                'cost' => 600.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Urine Culture
            'URCULT' => [
                'test_code' => 'URCULT',
                'name' => 'Urine Culture & Sensitivity',
                'description' => 'Bacterial culture and antibiotic sensitivity of urine',
                'procedure' => 'Standard microbiological culture',
                'cost' => 300.00,
                'turnaround_time' => 72,
                'unit' => 'CFU/mL',
                'normal_values' => 'No growth or <10³ CFU/mL',
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
            // Stool Routine
            'STOOL' => [
                'test_code' => 'STOOL',
                'name' => 'Stool Routine Examination (Stool R/E)',
                'description' => 'Comprehensive stool examination',
                'procedure' => 'Macroscopic and microscopic examination',
                'cost' => 50.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Normal color, consistency, no occult blood, no parasites',
                'status' => 'active',
            ],
            // Stool Occult Blood
            'SOCCULT' => [
                'test_code' => 'SOCCULT',
                'name' => 'Stool Occult Blood',
                'description' => 'Detection of hidden blood in stool',
                'procedure' => 'Guaiac or immunochemical test',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Stool Typhidot
            'STYP' => [
                'test_code' => 'STYP',
                'name' => 'Stool Typhidot',
                'description' => 'Rapid test for Salmonella typhi',
                'procedure' => 'Immunochromatographic test',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Stool Culture
            'STOOLCULT' => [
                'test_code' => 'STOOLCULT',
                'name' => 'Stool Culture & Sensitivity',
                'description' => 'Bacterial culture and antibiotic sensitivity of stool',
                'procedure' => 'Standard microbiological culture',
                'cost' => 300.00,
                'turnaround_time' => 72,
                'unit' => 'N/A',
                'normal_values' => 'No pathogenic bacteria isolated',
                'status' => 'active',
            ],
            // H. Pylori Stool Antigen
            'HPYLSTOOL' => [
                'test_code' => 'HPYLSTOOL',
                'name' => 'H. Pylori Antigen (Stool)',
                'description' => 'Detection of H. pylori antigen in stool',
                'procedure' => 'Immunochromatographic test',
                'cost' => 150.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Serology Tests
     */
    private function getSerologyTests(): array
    {
        return [
            // Widal Test
            'WIDAL' => [
                'test_code' => 'WIDAL',
                'name' => 'Widal Test',
                'description' => 'Test for enteric fever (Typhoid)',
                'procedure' => 'Slide agglutination test',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'Titer',
                'normal_values' => 'O: <1:80, H: <1:80',
                'status' => 'active',
            ],
            // Brucella Test
            'BRUC' => [
                'test_code' => 'BRUC',
                'name' => 'Brucella Test',
                'description' => 'Test for Brucellosis',
                'procedure' => 'Tube agglutination test',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'Titer',
                'normal_values' => '<1:80',
                'status' => 'active',
            ],
            // CRP
            'CRP' => [
                'test_code' => 'CRP',
                'name' => 'C-Reactive Protein (CRP)',
                'description' => 'Inflammation marker',
                'procedure' => 'Immunoturbidimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/L',
                'normal_values' => '<3 mg/L',
                'status' => 'active',
            ],
            // Rheumatoid Factor
            'RA' => [
                'test_code' => 'RA',
                'name' => 'Rheumatoid Factor (RA)',
                'description' => 'Test for rheumatoid arthritis',
                'procedure' => 'Immunoturbidimetric method',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'IU/mL',
                'normal_values' => '<20 IU/mL',
                'status' => 'active',
            ],
            // ASO
            'ASO' => [
                'test_code' => 'ASO',
                'name' => 'Antistreptolysin O Titer (ASO)',
                'description' => 'Test for recent streptococcal infection',
                'procedure' => 'Latex agglutination test',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'IU/mL',
                'normal_values' => '<200 IU/mL',
                'status' => 'active',
            ],
            // ANA
            'ANA' => [
                'test_code' => 'ANA',
                'name' => 'Antinuclear Antibodies (ANA)',
                'description' => 'Screening test for autoimmune disorders',
                'procedure' => 'Immunofluorescence or ELISA',
                'cost' => 1000.00,
                'turnaround_time' => 48,
                'unit' => 'Titer',
                'normal_values' => 'Negative or <1:40',
                'status' => 'active',
            ],
            // HBs Ag
            'HBSAG' => [
                'test_code' => 'HBSAG',
                'name' => 'HBs Ag (Hepatitis B Surface Antigen)',
                'description' => 'Screening test for Hepatitis B infection',
                'procedure' => 'ELISA or Rapid test',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // HCV Antibody
            'HCVAB' => [
                'test_code' => 'HCVAB',
                'name' => 'HCV Ab (Hepatitis C Antibody)',
                'description' => 'Screening test for Hepatitis C infection',
                'procedure' => 'ELISA or Rapid test',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // HIV
            'HIV' => [
                'test_code' => 'HIV',
                'name' => 'HIV I & II (Antibody)',
                'description' => 'Screening test for HIV infection',
                'procedure' => 'ELISA or Rapid test',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // VDRL
            'VDRL' => [
                'test_code' => 'VDRL',
                'name' => 'VDRL/Syphilis',
                'description' => 'Test for Syphilis',
                'procedure' => 'RPR or VDRL test',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'N/A',
                'normal_values' => 'Non-reactive',
                'status' => 'active',
            ],
            // H. Pylori Antibody
            'HPYLORI' => [
                'test_code' => 'HPYLORI',
                'name' => 'H. Pylori Antibody',
                'description' => 'Test for H. pylori infection',
                'procedure' => 'ELISA or Rapid test',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Toxoplasmosis
            'TOXO' => [
                'test_code' => 'TOXO',
                'name' => 'Toxoplasmosis (IgM/IgG)',
                'description' => 'Test for Toxoplasma gondii infection',
                'procedure' => 'ELISA',
                'cost' => 100.00,
                'turnaround_time' => 24,
                'unit' => 'IU/mL',
                'normal_values' => 'Negative or <8 IU/mL',
                'status' => 'active',
            ],
            // CMV
            'CMV' => [
                'test_code' => 'CMV',
                'name' => 'CMV (IgM/IgG)',
                'description' => 'Test for Cytomegalovirus infection',
                'procedure' => 'ELISA',
                'cost' => 100.00,
                'turnaround_time' => 24,
                'unit' => 'IU/mL',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Rubella
            'RUBELLA' => [
                'test_code' => 'RUBELLA',
                'name' => 'Rubella (IgM/IgG)',
                'description' => 'Test for Rubella (German measles) infection',
                'procedure' => 'ELISA',
                'cost' => 100.00,
                'turnaround_time' => 24,
                'unit' => 'IU/mL',
                'normal_values' => 'Negative or >10 IU/mL (immune)',
                'status' => 'active',
            ],
            // HSV
            'HSV' => [
                'test_code' => 'HSV',
                'name' => 'HSV (Herpes Simplex Virus) IgM/IgG',
                'description' => 'Test for Herpes infection',
                'procedure' => 'ELISA',
                'cost' => 100.00,
                'turnaround_time' => 24,
                'unit' => 'IU/mL',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Brucella IgG/IgM
            'BRUCIGG' => [
                'test_code' => 'BRUCIGG',
                'name' => 'Brucella IgG/IgM',
                'description' => 'Serological test for Brucellosis',
                'procedure' => 'ELISA',
                'cost' => 1000.00,
                'turnaround_time' => 48,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // TB IgG/IgM
            'TBIG' => [
                'test_code' => 'TBIG',
                'name' => 'TB IgG/IgM',
                'description' => 'Rapid test for Tuberculosis',
                'procedure' => 'Immunochromatographic test',
                'cost' => 100.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
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
            // PT/INR
            'PT' => [
                'test_code' => 'PT',
                'name' => 'Prothrombin Time & INR (PT/INR)',
                'description' => 'Test for blood clotting function',
                'procedure' => 'Clotting method',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'seconds',
                'normal_values' => 'PT: 11-13.5 seconds, INR: 0.8-1.2',
                'status' => 'active',
            ],
            // APTT
            'APTT' => [
                'test_code' => 'APTT',
                'name' => 'Activated Partial Thromboplastin Time (APTT)',
                'description' => 'Test for intrinsic clotting pathway',
                'procedure' => 'Clotting method',
                'cost' => 250.00,
                'turnaround_time' => 4,
                'unit' => 'seconds',
                'normal_values' => '25-35 seconds',
                'status' => 'active',
            ],
            // INR
            'INR' => [
                'test_code' => 'INR',
                'name' => 'International Normalized Ratio (INR)',
                'description' => 'Standardized blood clotting test',
                'procedure' => 'Calculated from PT',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'Ratio',
                'normal_values' => '0.8-1.2 (without anticoagulant therapy)',
                'status' => 'active',
            ],
            // Bleeding Time & Clotting Time
            'BTCT' => [
                'test_code' => 'BTCT',
                'name' => 'Bleeding Time & Clotting Time',
                'description' => 'Tests for platelet function and clotting',
                'procedure' => 'Duke method or Ivy method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'minutes',
                'normal_values' => 'BT: 2-7 minutes, CT: 2-9 minutes',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Microbiology/Culture Tests
     */
    private function getMicrobiologyTests(): array
    {
        return [
            // Blood Culture
            'BCULT' => [
                'test_code' => 'BCULT',
                'name' => 'Blood Culture',
                'description' => 'Bacterial culture from blood sample',
                'procedure' => 'Standard microbiological culture',
                'cost' => 800.00,
                'turnaround_time' => 168,
                'unit' => 'N/A',
                'normal_values' => 'No growth',
                'status' => 'active',
            ],
            // Pus Culture
            'PCULT' => [
                'test_code' => 'PCULT',
                'name' => 'Pus Culture & Sensitivity',
                'description' => 'Bacterial culture and antibiotic sensitivity from pus sample',
                'procedure' => 'Standard microbiological culture',
                'cost' => 300.00,
                'turnaround_time' => 72,
                'unit' => 'CFU/mL',
                'normal_values' => 'No pathogenic bacteria or report based on sensitivity',
                'status' => 'active',
            ],
            // Wound Culture
            'WCULT' => [
                'test_code' => 'WCULT',
                'name' => 'Wound Culture & Sensitivity',
                'description' => 'Bacterial culture and antibiotic sensitivity from wound',
                'procedure' => 'Standard microbiological culture',
                'cost' => 400.00,
                'turnaround_time' => 72,
                'unit' => 'CFU/mL',
                'normal_values' => 'Report based on organism and sensitivity',
                'status' => 'active',
            ],
            // Throat Culture
            'TCULT' => [
                'test_code' => 'TCULT',
                'name' => 'Throat Culture & Sensitivity',
                'description' => 'Bacterial culture from throat swab',
                'procedure' => 'Standard microbiological culture',
                'cost' => 400.00,
                'turnaround_time' => 72,
                'unit' => 'N/A',
                'normal_values' => 'Normal flora or report pathogenic organism',
                'status' => 'active',
            ],
            // Ear Swab Culture
            'ECULT' => [
                'test_code' => 'ECULT',
                'name' => 'Ear Swab Culture & Sensitivity',
                'description' => 'Bacterial culture from ear swab',
                'procedure' => 'Standard microbiological culture',
                'cost' => 300.00,
                'turnaround_time' => 72,
                'unit' => 'N/A',
                'normal_values' => 'Normal flora or report pathogenic organism',
                'status' => 'active',
            ],
            // Vaginal Swab Culture
            'VCULT' => [
                'test_code' => 'VCULT',
                'name' => 'Vaginal Swab Culture & Sensitivity',
                'description' => 'Bacterial culture from vaginal swab',
                'procedure' => 'Standard microbiological culture',
                'cost' => 400.00,
                'turnaround_time' => 72,
                'unit' => 'N/A',
                'normal_values' => 'Normal flora or report pathogenic organism',
                'status' => 'active',
            ],
            // Semen Culture
            'SCULT' => [
                'test_code' => 'SCULT',
                'name' => 'Semen Culture & Sensitivity',
                'description' => 'Bacterial culture from semen sample',
                'procedure' => 'Standard microbiological culture',
                'cost' => 400.00,
                'turnaround_time' => 72,
                'unit' => 'CFU/mL',
                'normal_values' => 'No growth or <10³ CFU/mL',
                'status' => 'active',
            ],
            // CSF Culture
            'CSFCULT' => [
                'test_code' => 'CSFCULT',
                'name' => 'CSF (Cerebrospinal Fluid) Culture',
                'description' => 'Bacterial culture from CSF',
                'procedure' => 'Standard microbiological culture',
                'cost' => 700.00,
                'turnaround_time' => 72,
                'unit' => 'N/A',
                'normal_values' => 'No growth',
                'status' => 'active',
            ],
        ];
    }

    /**
     * PCR Tests
     */
    private function getPcrTests(): array
    {
        return [
            // HBV DNA PCR
            'HBVPCR' => [
                'test_code' => 'HBVPCR',
                'name' => 'HBV DNA PCR (Quantitative)',
                'description' => 'Quantitative detection of Hepatitis B virus DNA',
                'procedure' => 'Real-time PCR',
                'cost' => 1500.00,
                'turnaround_time' => 72,
                'unit' => 'IU/mL',
                'normal_values' => 'Not detected or <20 IU/mL',
                'status' => 'active',
            ],
            // HCV RNA PCR
            'HCVPCR' => [
                'test_code' => 'HCVPCR',
                'name' => 'HCV RNA PCR (Quantitative)',
                'description' => 'Quantitative detection of Hepatitis C virus RNA',
                'procedure' => 'Real-time PCR',
                'cost' => 1500.00,
                'turnaround_time' => 72,
                'unit' => 'IU/mL',
                'normal_values' => 'Not detected or <15 IU/mL',
                'status' => 'active',
            ],
            // HIV PCR
            'HIVPCR' => [
                'test_code' => 'HIVPCR',
                'name' => 'HIV PCR (Quantitative)',
                'description' => 'Quantitative detection of HIV RNA',
                'procedure' => 'Real-time PCR',
                'cost' => 2000.00,
                'turnaround_time' => 72,
                'unit' => 'copies/mL',
                'normal_values' => 'Not detected',
                'status' => 'active',
            ],
            // TB PCR
            'TBPCR' => [
                'test_code' => 'TBPCR',
                'name' => 'TB PCR',
                'description' => 'Molecular detection of Mycobacterium tuberculosis',
                'procedure' => 'PCR technique',
                'cost' => 1500.00,
                'turnaround_time' => 48,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
        ];
    }

    /**
     * Other Tests
     */
    private function getOtherTests(): array
    {
        return [
            // Semen Analysis
            'SEMEN' => [
                'test_code' => 'SEMEN',
                'name' => 'Semen Analysis',
                'description' => 'Comprehensive examination of semen including count, motility, morphology',
                'procedure' => 'Macroscopic and microscopic examination',
                'cost' => 500.00,
                'turnaround_time' => 24,
                'unit' => 'Various',
                'normal_values' => 'Volume: 2-5 mL, Count: 60-150 Million/mL, Motility: >80%, Morphology: >70%',
                'status' => 'active',
            ],
            // ECG
            'ECG' => [
                'test_code' => 'ECG',
                'name' => 'Electrocardiogram (ECG)',
                'description' => 'Heart electrical activity test',
                'procedure' => 'ECG machine recording',
                'cost' => 500.00,
                'turnaround_time' => 1,
                'unit' => 'N/A',
                'normal_values' => 'Normal sinus rhythm',
                'status' => 'active',
            ],
            // Total IgE
            'IGE' => [
                'test_code' => 'IGE',
                'name' => 'Total IgE Level',
                'description' => 'Measurement of Immunoglobulin E',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'IU/mL',
                'normal_values' => 'Adults: <100 IU/mL',
                'status' => 'active',
            ],
            // Alpha Feto Protein
            'AFP' => [
                'test_code' => 'AFP',
                'name' => 'Alpha Feto Protein (AFP)',
                'description' => 'Tumor marker for liver cancer and fetal neural tube defects',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 600.00,
                'turnaround_time' => 24,
                'unit' => 'ng/mL',
                'normal_values' => '<10 ng/mL (non-pregnant adults)',
                'status' => 'active',
            ],
            // Anti-Mullerian Hormone
            'AMH' => [
                'test_code' => 'AMH',
                'name' => 'Anti-Mullerian Hormone (AMH)',
                'description' => 'Marker for ovarian reserve and fertility assessment',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 800.00,
                'turnaround_time' => 24,
                'unit' => 'ng/mL',
                'normal_values' => 'Female: 1.5-4.0 ng/mL (reproductive age)',
                'status' => 'active',
            ],
            // Covid-19 Antibody
            'COVID' => [
                'test_code' => 'COVID',
                'name' => 'Covid-19 IgG/IgM Antibody',
                'description' => 'Detection of IgG and IgM antibodies against SARS-CoV-2',
                'procedure' => 'Chemiluminescent immunoassay or Rapid test',
                'cost' => 300.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Covid-19 PCR
            'COVIDPCR' => [
                'test_code' => 'COVIDPCR',
                'name' => 'Covid-19 RNA PCR',
                'description' => 'Molecular detection of SARS-CoV-2 RNA',
                'procedure' => 'Real-time RT-PCR',
                'cost' => 800.00,
                'turnaround_time' => 24,
                'unit' => 'N/A',
                'normal_values' => 'Not detected',
                'status' => 'active',
            ],
            // Growth Hormone
            'GH' => [
                'test_code' => 'GH',
                'name' => 'Growth Hormone (GH)',
                'description' => 'Measurement of human growth hormone',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 800.00,
                'turnaround_time' => 24,
                'unit' => 'ng/mL',
                'normal_values' => 'Adults: <5 ng/mL',
                'status' => 'active',
            ],
            // Leishmania
            'LEISH' => [
                'test_code' => 'LEISH',
                'name' => 'Leishmania Test',
                'description' => 'Test for Leishmaniasis (Kala Azar)',
                'procedure' => 'Rapid test or ELISA',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Multi-Drug Test
            'MULTIDRUG' => [
                'test_code' => 'MULTIDRUG',
                'name' => 'Multi-Drug Test (12 Panel)',
                'description' => 'Screening for multiple drugs of abuse',
                'procedure' => 'Immunoassay',
                'cost' => 800.00,
                'turnaround_time' => 8,
                'unit' => 'N/A',
                'normal_values' => 'Negative',
                'status' => 'active',
            ],
            // Parathyroid Hormone
            'PTH' => [
                'test_code' => 'PTH',
                'name' => 'Parathyroid Hormone (PTH)',
                'description' => 'Measurement of parathyroid hormone for calcium metabolism',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 800.00,
                'turnaround_time' => 24,
                'unit' => 'pg/mL',
                'normal_values' => '15-65 pg/mL',
                'status' => 'active',
            ],
            // Pleural Fluid
            'PLEURAL' => [
                'test_code' => 'PLEURAL',
                'name' => 'Pleural Fluid Examination',
                'description' => 'Analysis of fluid from pleural cavity',
                'procedure' => 'Macroscopic and microscopic examination',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'Various',
                'normal_values' => 'Transudate or Exudate based on analysis',
                'status' => 'active',
            ],
            // Iron Studies
            'IRON' => [
                'test_code' => 'IRON',
                'name' => 'Iron Studies (Serum Iron, TIBC, Ferritin)',
                'description' => 'Comprehensive iron assessment including Ferritin, TIBC, Transferrin Saturation',
                'procedure' => 'Colorimetric and chemiluminescent methods',
                'cost' => 500.00,
                'turnaround_time' => 8,
                'unit' => 'μg/dL, ng/mL',
                'normal_values' => 'Iron: 60-170 μg/dL, Ferritin: 20-200 ng/mL, TIBC: 250-450 μg/dL',
                'status' => 'active',
            ],
        ];
    }
}
