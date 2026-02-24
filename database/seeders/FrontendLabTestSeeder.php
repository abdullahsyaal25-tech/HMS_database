<?php

namespace Database\Seeders;

use App\Models\LabTest;
use Illuminate\Database\Seeder;

/**
 * Seeder for lab tests that match the frontend Create.tsx test templates.
 * 
 * This seeder ensures the following test codes exist with correct data:
 * - CBC (Complete Blood Count)
 * - BMP (Basic Metabolic Panel)
 * - Lipid (Lipid Profile)
 * - LFT (Liver Function Test)
 * - TSH (Thyroid Stimulating Hormone)
 * - HbA1c (Hemoglobin A1c)
 * 
 * Plus additional tests from LabTestReferenceRanges.php
 * 
 * Reference values are based on standard medical laboratory values.
 */
class FrontendLabTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $labTests = [
            // ==================== CBC - Complete Blood Count ====================
            // Reference: Standard adult reference ranges
            [
                'test_code' => 'CBC',
                'name' => 'Complete Blood Count (CBC)',
                'description' => 'Comprehensive blood test analyzing red blood cells, white blood cells, and platelets. Parameters: WBC, RBC, Hemoglobin, Hematocrit, Platelets, MCV, MCH, MCHC, RDW, MPV',
                'procedure' => 'Blood sample collection and automated analysis using hematology analyzer',
                'cost' => 80.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'wbc' => ['name' => 'WBC', 'fullName' => 'White Blood Cell Count', 'unit' => '10³/μL', 'referenceMin' => 4.5, 'referenceMax' => 11.0, 'isCriticalLow' => 2.0, 'isCriticalHigh' => 30.0, 'description' => 'Total white blood cell count'],
                    'rbc' => ['name' => 'RBC', 'fullName' => 'Red Blood Cell Count', 'unit' => '10⁶/μL', 'referenceMin' => 4.5, 'referenceMax' => 5.5, 'isCriticalLow' => 2.0, 'isCriticalHigh' => 8.0, 'description' => 'Total red blood cell count'],
                    'hemoglobin' => ['name' => 'Hemoglobin', 'fullName' => 'Hemoglobin Concentration', 'unit' => 'g/dL', 'referenceMinMale' => 13.5, 'referenceMaxMale' => 17.5, 'referenceMinFemale' => 12.0, 'referenceMaxFemale' => 16.0, 'isCriticalLow' => 7.0, 'isCriticalHigh' => 20.0, 'description' => 'Hemoglobin concentration in blood'],
                    'hematocrit' => ['name' => 'Hematocrit', 'fullName' => 'Packed Cell Volume', 'unit' => '%', 'referenceMinMale' => 38.0, 'referenceMaxMale' => 50.0, 'referenceMinFemale' => 36.0, 'referenceMaxFemale' => 46.0, 'isCriticalLow' => 20.0, 'isCriticalHigh' => 60.0, 'description' => 'Percentage of blood volume occupied by red cells'],
                    'platelets' => ['name' => 'Platelets', 'fullName' => 'Platelet Count', 'unit' => '10³/μL', 'referenceMin' => 150, 'referenceMax' => 400, 'isCriticalLow' => 50, 'isCriticalHigh' => 1000, 'description' => 'Total platelet count'],
                    'mcv' => ['name' => 'MCV', 'fullName' => 'Mean Corpuscular Volume', 'unit' => 'fL', 'referenceMin' => 80, 'referenceMax' => 100, 'description' => 'Average volume of red blood cells'],
                    'mch' => ['name' => 'MCH', 'fullName' => 'Mean Corpuscular Hemoglobin', 'unit' => 'pg', 'referenceMin' => 27, 'referenceMax' => 33, 'description' => 'Average hemoglobin content per red cell'],
                    'mchc' => ['name' => 'MCHC', 'fullName' => 'Mean Corpuscular Hemoglobin Concentration', 'unit' => 'g/dL', 'referenceMin' => 32, 'referenceMax' => 36, 'description' => 'Average hemoglobin concentration in red cells'],
                    'rdw' => ['name' => 'RDW', 'fullName' => 'Red Cell Distribution Width', 'unit' => '%', 'referenceMin' => 11.5, 'referenceMax' => 14.5, 'description' => 'Variation in red blood cell size'],
                    'mpv' => ['name' => 'MPV', 'fullName' => 'Mean Platelet Volume', 'unit' => 'fL', 'referenceMin' => 7.5, 'referenceMax' => 12.0, 'description' => 'Average platelet volume'],
                ]),
                'status' => 'active',
            ],

            // ==================== BMP - Basic Metabolic Panel ====================
            // Reference: Standard adult reference ranges
            [
                'test_code' => 'BMP',
                'name' => 'Basic Metabolic Panel (BMP)',
                'description' => 'Panel of tests including Glucose, BUN, Creatinine, Sodium, Potassium, Chloride, CO2, Calcium. Evaluates kidney function, blood sugar, and electrolyte balance.',
                'procedure' => 'Blood sample analysis using automated chemistry analyzer',
                'cost' => 150.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'glucose' => ['name' => 'Glucose', 'fullName' => 'Fasting Blood Glucose', 'unit' => 'mg/dL', 'referenceMin' => 70, 'referenceMax' => 100, 'isCriticalLow' => 40, 'isCriticalHigh' => 400, 'description' => 'Blood glucose level after fasting'],
                    'bun' => ['name' => 'BUN', 'fullName' => 'Blood Urea Nitrogen', 'unit' => 'mg/dL', 'referenceMin' => 7, 'referenceMax' => 20, 'isCriticalHigh' => 100, 'description' => 'Urea nitrogen concentration in blood'],
                    'creatinine' => ['name' => 'Creatinine', 'fullName' => 'Serum Creatinine', 'unit' => 'mg/dL', 'referenceMinMale' => 0.7, 'referenceMaxMale' => 1.3, 'referenceMinFemale' => 0.6, 'referenceMaxFemale' => 1.1, 'isCriticalHigh' => 10, 'description' => 'Creatinine concentration in blood'],
                    'sodium' => ['name' => 'Sodium', 'fullName' => 'Serum Sodium', 'unit' => 'mEq/L', 'referenceMin' => 135, 'referenceMax' => 145, 'isCriticalLow' => 120, 'isCriticalHigh' => 160, 'description' => 'Sodium concentration in blood'],
                    'potassium' => ['name' => 'Potassium', 'fullName' => 'Serum Potassium', 'unit' => 'mEq/L', 'referenceMin' => 3.5, 'referenceMax' => 5.0, 'isCriticalLow' => 2.5, 'isCriticalHigh' => 6.5, 'description' => 'Potassium concentration in blood'],
                    'chloride' => ['name' => 'Chloride', 'fullName' => 'Serum Chloride', 'unit' => 'mEq/L', 'referenceMin' => 98, 'referenceMax' => 106, 'isCriticalLow' => 80, 'isCriticalHigh' => 115, 'description' => 'Chloride concentration in blood'],
                    'co2' => ['name' => 'CO2', 'fullName' => 'Carbon Dioxide', 'unit' => 'mEq/L', 'referenceMin' => 23, 'referenceMax' => 29, 'isCriticalLow' => 15, 'isCriticalHigh' => 35, 'description' => 'Bicarbonate and CO2 content'],
                    'calcium' => ['name' => 'Calcium', 'fullName' => 'Serum Calcium', 'unit' => 'mg/dL', 'referenceMin' => 8.5, 'referenceMax' => 10.5, 'isCriticalLow' => 7.0, 'isCriticalHigh' => 14.0, 'description' => 'Total calcium concentration in blood'],
                ]),
                'status' => 'active',
            ],

            // ==================== Lipid - Lipid Profile ====================
            // Reference: NCEP/ATP III Guidelines
            [
                'test_code' => 'Lipid',
                'name' => 'Lipid Profile',
                'description' => 'Comprehensive test including Total Cholesterol, LDL Cholesterol, HDL Cholesterol, Triglycerides, and VLDL. Used to assess cardiovascular risk.',
                'procedure' => 'Blood sample analysis for lipid fractions after 9-12 hour fast',
                'cost' => 250.00,
                'turnaround_time' => 8,
                'unit' => 'mg/dL',
                'normal_values' => json_encode([
                    'total_cholesterol' => ['name' => 'Total Cholesterol', 'fullName' => 'Serum Total Cholesterol', 'unit' => 'mg/dL', 'referenceMax' => 200, 'borderlineMin' => 200, 'borderlineMax' => 239, 'highMin' => 240, 'isCriticalHigh' => 300, 'description' => 'Total cholesterol concentration'],
                    'ldl' => ['name' => 'LDL Cholesterol', 'fullName' => 'Low-Density Lipoprotein Cholesterol', 'unit' => 'mg/dL', 'optimalMax' => 100, 'nearOptimalMin' => 100, 'nearOptimalMax' => 129, 'borderlineMin' => 130, 'borderlineMax' => 159, 'highMin' => 160, 'veryHighMin' => 190, 'isCriticalHigh' => 220, 'description' => 'LDL cholesterol ("bad" cholesterol)'],
                    'hdl' => ['name' => 'HDL Cholesterol', 'fullName' => 'High-Density Lipoprotein Cholesterol', 'unit' => 'mg/dL', 'referenceMinMale' => 40, 'referenceMaxMale' => 200, 'referenceMinFemale' => 50, 'referenceMaxFemale' => 200, 'lowRiskMax' => 40, 'isCriticalLow' => 20, 'description' => 'HDL cholesterol ("good" cholesterol)'],
                    'triglycerides' => ['name' => 'Triglycerides', 'fullName' => 'Serum Triglycerides', 'unit' => 'mg/dL', 'referenceMax' => 150, 'borderlineMin' => 150, 'borderlineMax' => 199, 'highMin' => 200, 'highMax' => 499, 'veryHighMin' => 500, 'isCriticalHigh' => 1000, 'description' => 'Triglyceride concentration in blood'],
                    'vldl' => ['name' => 'VLDL', 'fullName' => 'Very Low-Density Lipoprotein', 'unit' => 'mg/dL', 'referenceMin' => 5, 'referenceMax' => 40, 'description' => 'VLDL cholesterol (calculated)'],
                ]),
                'status' => 'active',
            ],

            // ==================== LFT - Liver Function Test ====================
            // Reference: Standard adult reference ranges
            [
                'test_code' => 'LFT',
                'name' => 'Liver Function Test (LFT)',
                'description' => 'Comprehensive liver function tests including ALT, AST, ALP, Total Bilirubin, Direct Bilirubin, Indirect Bilirubin, Albumin, Total Protein, Globulin, and A/G Ratio.',
                'procedure' => 'Blood sample analysis for liver enzymes and proteins',
                'cost' => 350.00,
                'turnaround_time' => 8,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'alt' => ['name' => 'ALT', 'fullName' => 'Alanine Aminotransferase (SGPT)', 'unit' => 'U/L', 'referenceMinMale' => 10, 'referenceMaxMale' => 40, 'referenceMinFemale' => 7, 'referenceMaxFemale' => 56, 'isCriticalHigh' => 500, 'description' => 'Liver enzyme - specific marker for liver cell injury'],
                    'ast' => ['name' => 'AST', 'fullName' => 'Aspartate Aminotransferase (SGOT)', 'unit' => 'U/L', 'referenceMinMale' => 10, 'referenceMaxMale' => 40, 'referenceMinFemale' => 9, 'referenceMaxFemale' => 32, 'isCriticalHigh' => 500, 'description' => 'Liver enzyme - elevated in liver and heart disease'],
                    'alp' => ['name' => 'ALP', 'fullName' => 'Alkaline Phosphatase', 'unit' => 'U/L', 'referenceMin' => 44, 'referenceMax' => 147, 'isCriticalHigh' => 500, 'description' => 'Enzyme elevated in liver and bone disease'],
                    'bilirubin_total' => ['name' => 'Total Bilirubin', 'fullName' => 'Total Bilirubin', 'unit' => 'mg/dL', 'referenceMin' => 0.1, 'referenceMax' => 1.2, 'isCriticalHigh' => 15, 'description' => 'Total bilirubin (direct + indirect)'],
                    'bilirubin_direct' => ['name' => 'Direct Bilirubin', 'fullName' => 'Conjugated Bilirubin', 'unit' => 'mg/dL', 'referenceMin' => 0.0, 'referenceMax' => 0.3, 'isCriticalHigh' => 5.0, 'description' => 'Direct (conjugated) bilirubin'],
                    'bilirubin_indirect' => ['name' => 'Indirect Bilirubin', 'fullName' => 'Unconjugated Bilirubin', 'unit' => 'mg/dL', 'referenceMin' => 0.1, 'referenceMax' => 1.0, 'description' => 'Indirect (unconjugated) bilirubin - calculated'],
                    'albumin' => ['name' => 'Albumin', 'fullName' => 'Serum Albumin', 'unit' => 'g/dL', 'referenceMin' => 3.5, 'referenceMax' => 5.0, 'isCriticalLow' => 2.0, 'description' => 'Protein made by the liver'],
                    'total_protein' => ['name' => 'Total Protein', 'fullName' => 'Serum Total Protein', 'unit' => 'g/dL', 'referenceMin' => 6.0, 'referenceMax' => 8.3, 'isCriticalLow' => 4.0, 'description' => 'Total protein (albumin + globulin)'],
                    'globulin' => ['name' => 'Globulin', 'fullName' => 'Serum Globulin', 'unit' => 'g/dL', 'referenceMin' => 2.0, 'referenceMax' => 3.5, 'description' => 'Globulin concentration - calculated'],
                    'ag_ratio' => ['name' => 'A/G Ratio', 'fullName' => 'Albumin/Globulin Ratio', 'unit' => 'ratio', 'referenceMin' => 1.0, 'referenceMax' => 2.0, 'description' => 'Ratio of albumin to globulin'],
                ]),
                'status' => 'active',
            ],

            // ==================== TSH - Thyroid Stimulating Hormone ====================
            // Reference: ATA/AACE Guidelines (normal range typically 0.4-4.0 or 0.5-5.0 mIU/L)
            [
                'test_code' => 'TSH',
                'name' => 'Thyroid Stimulating Hormone (TSH)',
                'description' => 'Primary screening test for thyroid function. Measures the level of TSH produced by the pituitary gland.',
                'procedure' => 'Chemiluminescent immunoassay (CLIA)',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'μIU/mL',
                'normal_values' => json_encode([
                    'tsh' => ['name' => 'TSH', 'fullName' => 'Thyroid Stimulating Hormone', 'unit' => 'μIU/mL', 'referenceMin' => 0.4, 'referenceMax' => 4.0, 'isCriticalLow' => 0.01, 'isCriticalHigh' => 50.0, 'description' => 'Primary screening test for thyroid function'],
                ]),
                'status' => 'active',
            ],

            // ==================== HbA1c - Hemoglobin A1c ====================
            // Reference: ADA Guidelines - Normal <5.7%, Prediabetes 5.7-6.4%, Diabetes ≥6.5%
            [
                'test_code' => 'HbA1c',
                'name' => 'Hemoglobin A1c (HbA1c)',
                'description' => 'Glycated hemoglobin test reflecting average blood glucose levels over the past 2-3 months. Used for diabetes screening and management.',
                'procedure' => 'HPLC or immunoturbidimetric method',
                'cost' => 250.00,
                'turnaround_time' => 24,
                'unit' => '%',
                'normal_values' => json_encode([
                    'hba1c' => ['name' => 'HbA1c', 'fullName' => 'Glycated Hemoglobin', 'unit' => '%', 'referenceMax' => 5.6, 'prediabetesMin' => 5.7, 'prediabetesMax' => 6.4, 'diabetesMin' => 6.5, 'description' => 'Average blood glucose over 2-3 months'],
                ]),
                'status' => 'active',
            ],

            // ==================== KFT - Kidney Function Test ====================
            [
                'test_code' => 'KFT',
                'name' => 'Kidney Function Test (KFT)',
                'description' => 'Comprehensive kidney function tests including Creatinine, Urea, BUN, Uric Acid, Sodium, Potassium, Chloride, and CO2.',
                'procedure' => 'Blood and urine analysis for kidney markers',
                'cost' => 350.00,
                'turnaround_time' => 8,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'creatinine' => ['name' => 'Creatinine', 'fullName' => 'Serum Creatinine', 'unit' => 'mg/dL', 'referenceMinMale' => 0.7, 'referenceMaxMale' => 1.3, 'referenceMinFemale' => 0.6, 'referenceMaxFemale' => 1.1, 'isCriticalHigh' => 10.0, 'description' => 'Kidney function marker'],
                    'urea' => ['name' => 'Urea', 'fullName' => 'Blood Urea', 'unit' => 'mg/dL', 'referenceMin' => 7, 'referenceMax' => 20, 'isCriticalHigh' => 100, 'description' => 'Waste product filtered by kidneys'],
                    'bun' => ['name' => 'BUN', 'fullName' => 'Blood Urea Nitrogen', 'unit' => 'mg/dL', 'referenceMin' => 7, 'referenceMax' => 20, 'isCriticalHigh' => 100, 'description' => 'Nitrogen portion of urea'],
                    'uric_acid' => ['name' => 'Uric Acid', 'fullName' => 'Serum Uric Acid', 'unit' => 'mg/dL', 'referenceMinMale' => 3.4, 'referenceMaxMale' => 7.0, 'referenceMinFemale' => 2.4, 'referenceMaxFemale' => 6.0, 'isCriticalHigh' => 12.0, 'description' => 'Product of purine metabolism'],
                    'sodium' => ['name' => 'Sodium', 'fullName' => 'Serum Sodium', 'unit' => 'mEq/L', 'referenceMin' => 135, 'referenceMax' => 145, 'isCriticalLow' => 120, 'isCriticalHigh' => 160, 'description' => 'Electrolyte balance indicator'],
                    'potassium' => ['name' => 'Potassium', 'fullName' => 'Serum Potassium', 'unit' => 'mEq/L', 'referenceMin' => 3.5, 'referenceMax' => 5.0, 'isCriticalLow' => 2.5, 'isCriticalHigh' => 6.5, 'description' => 'Critical electrolyte for heart function'],
                    'chloride' => ['name' => 'Chloride', 'fullName' => 'Serum Chloride', 'unit' => 'mEq/L', 'referenceMin' => 98, 'referenceMax' => 106, 'description' => 'Electrolyte balance'],
                    'co2' => ['name' => 'CO2', 'fullName' => 'Carbon Dioxide', 'unit' => 'mEq/L', 'referenceMin' => 23, 'referenceMax' => 29, 'description' => 'Acid-base balance indicator'],
                ]),
                'status' => 'active',
            ],

            // ==================== T3 - Triiodothyronine ====================
            [
                'test_code' => 'T3',
                'name' => 'Triiodothyronine (T3)',
                'description' => 'Measures the level of T3, the active thyroid hormone, in the blood.',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'ng/dL',
                'normal_values' => json_encode([
                    't3' => ['name' => 'T3', 'fullName' => 'Triiodothyronine (Total)', 'unit' => 'ng/dL', 'referenceMin' => 80, 'referenceMax' => 200, 'isCriticalLow' => 40, 'isCriticalHigh' => 400, 'description' => 'Active thyroid hormone'],
                ]),
                'status' => 'active',
            ],

            // ==================== T4 - Thyroxine ====================
            [
                'test_code' => 'T4',
                'name' => 'Thyroxine (T4)',
                'description' => 'Measures the level of T4, the primary thyroid hormone, in the blood.',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'μg/dL',
                'normal_values' => json_encode([
                    't4' => ['name' => 'T4', 'fullName' => 'Thyroxine (Total)', 'unit' => 'μg/dL', 'referenceMin' => 5.0, 'referenceMax' => 12.0, 'isCriticalLow' => 2.0, 'isCriticalHigh' => 20.0, 'description' => 'Primary thyroid hormone'],
                    'ft4' => ['name' => 'Free T4', 'fullName' => 'Free Thyroxine', 'unit' => 'ng/dL', 'referenceMin' => 0.8, 'referenceMax' => 1.8, 'isCriticalLow' => 0.3, 'isCriticalHigh' => 3.0, 'description' => 'Active form of T4'],
                ]),
                'status' => 'active',
            ],

            // ==================== ELECTROLYTES - Electrolyte Panel ====================
            [
                'test_code' => 'ELECTROLYTES',
                'name' => 'Electrolyte Panel',
                'description' => 'Comprehensive electrolyte panel including Sodium, Potassium, Chloride, Bicarbonate, Magnesium, and Phosphorus.',
                'procedure' => 'Blood sample analysis using ion-selective electrodes',
                'cost' => 200.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'sodium' => ['name' => 'Sodium', 'fullName' => 'Serum Sodium', 'unit' => 'mEq/L', 'referenceMin' => 135, 'referenceMax' => 145, 'isCriticalLow' => 120, 'isCriticalHigh' => 160, 'description' => 'Major extracellular cation'],
                    'potassium' => ['name' => 'Potassium', 'fullName' => 'Serum Potassium', 'unit' => 'mEq/L', 'referenceMin' => 3.5, 'referenceMax' => 5.0, 'isCriticalLow' => 2.5, 'isCriticalHigh' => 6.5, 'description' => 'Major intracellular cation'],
                    'chloride' => ['name' => 'Chloride', 'fullName' => 'Serum Chloride', 'unit' => 'mEq/L', 'referenceMin' => 98, 'referenceMax' => 106, 'isCriticalLow' => 80, 'isCriticalHigh' => 115, 'description' => 'Major extracellular anion'],
                    'bicarbonate' => ['name' => 'Bicarbonate', 'fullName' => 'Serum Bicarbonate (CO2)', 'unit' => 'mEq/L', 'referenceMin' => 23, 'referenceMax' => 29, 'isCriticalLow' => 15, 'isCriticalHigh' => 35, 'description' => 'Primary buffer in blood'],
                    'magnesium' => ['name' => 'Magnesium', 'fullName' => 'Serum Magnesium', 'unit' => 'mg/dL', 'referenceMin' => 1.5, 'referenceMax' => 2.5, 'isCriticalLow' => 1.0, 'isCriticalHigh' => 4.0, 'description' => 'Important for muscle and nerve function'],
                    'phosphorus' => ['name' => 'Phosphorus', 'fullName' => 'Serum Phosphorus/Phosphate', 'unit' => 'mg/dL', 'referenceMin' => 2.5, 'referenceMax' => 4.5, 'isCriticalLow' => 1.0, 'isCriticalHigh' => 7.0, 'description' => 'Important for bone metabolism'],
                ]),
                'status' => 'active',
            ],

            // ==================== IRON - Iron Studies ====================
            [
                'test_code' => 'IRON',
                'name' => 'Iron Studies',
                'description' => 'Comprehensive iron assessment including Serum Iron, Ferritin, TIBC, Transferrin, and Transferrin Saturation.',
                'procedure' => 'Colorimetric and chemiluminescent methods',
                'cost' => 500.00,
                'turnaround_time' => 8,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'iron' => ['name' => 'Serum Iron', 'fullName' => 'Serum Iron', 'unit' => 'μg/dL', 'referenceMinMale' => 65, 'referenceMaxMale' => 175, 'referenceMinFemale' => 50, 'referenceMaxFemale' => 170, 'description' => 'Iron concentration in blood'],
                    'ferritin' => ['name' => 'Ferritin', 'fullName' => 'Serum Ferritin', 'unit' => 'ng/mL', 'referenceMinMale' => 20, 'referenceMaxMale' => 250, 'referenceMinFemale' => 10, 'referenceMaxFemale' => 120, 'isCriticalLow' => 10, 'description' => 'Stored iron protein'],
                    'tibc' => ['name' => 'TIBC', 'fullName' => 'Total Iron Binding Capacity', 'unit' => 'μg/dL', 'referenceMin' => 250, 'referenceMax' => 450, 'description' => 'Maximum iron that can be bound'],
                    'transferrin' => ['name' => 'Transferrin', 'fullName' => 'Serum Transferrin', 'unit' => 'mg/dL', 'referenceMin' => 200, 'referenceMax' => 400, 'description' => 'Iron transport protein'],
                    'transferrin_saturation' => ['name' => 'Transferrin Saturation', 'fullName' => 'Transferrin Saturation', 'unit' => '%', 'referenceMin' => 20, 'referenceMax' => 50, 'description' => 'Percentage of transferrin bound to iron'],
                ]),
                'status' => 'active',
            ],

            // ==================== CRP - C-Reactive Protein ====================
            [
                'test_code' => 'CRP',
                'name' => 'C-Reactive Protein (CRP)',
                'description' => 'Acute phase inflammatory marker used to detect inflammation and infection.',
                'procedure' => 'Immunoturbidimetric method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mg/L',
                'normal_values' => json_encode([
                    'crp' => ['name' => 'CRP', 'fullName' => 'C-Reactive Protein', 'unit' => 'mg/L', 'referenceMax' => 3.0, 'highMin' => 3.0, 'highMax' => 10.0, 'veryHighMin' => 10.0, 'description' => 'Acute phase inflammatory marker'],
                    'hs_crp' => ['name' => 'High-Sensitivity CRP', 'fullName' => 'High-Sensitivity C-Reactive Protein', 'unit' => 'mg/L', 'lowRiskMax' => 1.0, 'moderateRiskMin' => 1.0, 'moderateRiskMax' => 3.0, 'highRiskMin' => 3.0, 'description' => 'Cardiovascular risk assessment'],
                ]),
                'status' => 'active',
            ],

            // ==================== COAG - Coagulation Profile ====================
            [
                'test_code' => 'COAG',
                'name' => 'Coagulation Profile',
                'description' => 'Comprehensive coagulation tests including PT, APTT, INR, and Fibrinogen.',
                'procedure' => 'Clotting method using coagulation analyzer',
                'cost' => 300.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'pt' => ['name' => 'PT', 'fullName' => 'Prothrombin Time', 'unit' => 'seconds', 'referenceMin' => 11, 'referenceMax' => 13.5, 'inr_target' => 2.0, 'inr_range' => '2.0-3.0', 'description' => 'External coagulation pathway test'],
                    'aptt' => ['name' => 'APTT', 'fullName' => 'Activated Partial Thromboplastin Time', 'unit' => 'seconds', 'referenceMin' => 25, 'referenceMax' => 35, 'isCriticalHigh' => 70, 'description' => 'Internal coagulation pathway test'],
                    'inr' => ['name' => 'INR', 'fullName' => 'International Normalized Ratio', 'unit' => 'ratio', 'referenceMax' => 1.1, 'therapeuticMin' => 2.0, 'therapeuticMax' => 3.0, 'description' => 'Standardized coagulation measure'],
                    'fibrinogen' => ['name' => 'Fibrinogen', 'fullName' => 'Plasma Fibrinogen', 'unit' => 'mg/dL', 'referenceMin' => 200, 'referenceMax' => 400, 'isCriticalLow' => 100, 'description' => 'Clotting factor and acute phase protein'],
                ]),
                'status' => 'active',
            ],

            // ==================== URINE - Urinalysis ====================
            [
                'test_code' => 'URINE',
                'name' => 'Urinalysis (Urine R/E)',
                'description' => 'Comprehensive urine examination including physical, chemical, and microscopic analysis.',
                'procedure' => 'Urine sample analysis using dipstick and microscopy',
                'cost' => 50.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'specific_gravity' => ['name' => 'Specific Gravity', 'fullName' => 'Urine Specific Gravity', 'unit' => 'ratio', 'referenceMin' => 1.005, 'referenceMax' => 1.030, 'description' => 'Concentration of urine'],
                    'ph' => ['name' => 'pH', 'fullName' => 'Urine pH', 'unit' => 'pH', 'referenceMin' => 4.5, 'referenceMax' => 8.0, 'description' => 'Acidity/alkalinity of urine'],
                    'protein' => ['name' => 'Protein', 'fullName' => 'Urine Protein', 'unit' => 'mg/dL', 'referenceMax' => 'Negative', 'normalValue' => 'Negative', 'description' => 'Protein in urine (normally absent)'],
                    'glucose' => ['name' => 'Glucose', 'fullName' => 'Urine Glucose', 'unit' => 'mg/dL', 'referenceMax' => 'Negative', 'normalValue' => 'Negative', 'description' => 'Glucose in urine (normally absent)'],
                    'ketones' => ['name' => 'Ketones', 'fullName' => 'Urine Ketones', 'unit' => 'mg/dL', 'referenceMax' => 'Negative', 'normalValue' => 'Negative', 'description' => 'Ketones in urine'],
                    'blood' => ['name' => 'Blood', 'fullName' => 'Urine Blood', 'unit' => 'N/A', 'referenceMax' => 'Negative', 'normalValue' => 'Negative', 'description' => 'Blood in urine (normally absent)'],
                    'bilirubin' => ['name' => 'Bilirubin', 'fullName' => 'Urine Bilirubin', 'unit' => 'N/A', 'referenceMax' => 'Negative', 'normalValue' => 'Negative', 'description' => 'Bilirubin in urine (normally absent)'],
                    'urobilinogen' => ['name' => 'Urobilinogen', 'fullName' => 'Urine Urobilinogen', 'unit' => 'mg/dL', 'referenceMax' => 1.0, 'description' => 'Normal urobilinogen in urine'],
                    'nitrite' => ['name' => 'Nitrite', 'fullName' => 'Urine Nitrite', 'unit' => 'N/A', 'referenceMax' => 'Negative', 'normalValue' => 'Negative', 'description' => 'Bacterial infection indicator'],
                    'leukocyte_esterase' => ['name' => 'Leukocyte Esterase', 'fullName' => 'Urine Leukocyte Esterase', 'unit' => 'N/A', 'referenceMax' => 'Negative', 'normalValue' => 'Negative', 'description' => 'White blood cell indicator'],
                ]),
                'status' => 'active',
            ],

            // ==================== CARDIAC - Cardiac Markers ====================
            [
                'test_code' => 'CARDIAC',
                'name' => 'Cardiac Markers Panel',
                'description' => 'Cardiac biomarkers including Troponin I, Troponin T, CK-MB, and BNP for heart muscle damage assessment.',
                'procedure' => 'Chemiluminescent immunoassay',
                'cost' => 500.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'troponin_i' => ['name' => 'Troponin I', 'fullName' => 'Cardiac Troponin I', 'unit' => 'ng/mL', 'referenceMax' => 0.04, 'isCriticalHigh' => 0.5, 'description' => 'Heart muscle damage marker'],
                    'troponin_t' => ['name' => 'Troponin T', 'fullName' => 'Cardiac Troponin T', 'unit' => 'ng/mL', 'referenceMax' => 0.1, 'isCriticalHigh' => 0.2, 'description' => 'Heart muscle damage marker'],
                    'ck_mb' => ['name' => 'CK-MB', 'fullName' => 'Creatine Kinase MB', 'unit' => 'ng/mL', 'referenceMax' => 5.0, 'isCriticalHigh' => 10.0, 'description' => 'Heart-specific enzyme'],
                    'bnp' => ['name' => 'BNP', 'fullName' => 'B-type Natriuretic Peptide', 'unit' => 'pg/mL', 'referenceMax' => 100, 'heartFailureMin' => 100, 'description' => 'Heart failure indicator'],
                ]),
                'status' => 'active',
            ],

            // ==================== GLU - Blood Glucose ====================
            [
                'test_code' => 'GLU',
                'name' => 'Blood Glucose Panel',
                'description' => 'Blood glucose tests including Fasting, Random, and Postprandial glucose measurements.',
                'procedure' => 'Glucose oxidase method',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'mg/dL',
                'normal_values' => json_encode([
                    'fasting_glucose' => ['name' => 'Fasting Blood Glucose', 'fullName' => 'Fasting Blood Glucose', 'unit' => 'mg/dL', 'referenceMin' => 70, 'referenceMax' => 100, 'prediabetesMin' => 100, 'prediabetesMax' => 125, 'diabetesMin' => 126, 'isCriticalLow' => 40, 'isCriticalHigh' => 400, 'description' => 'Blood glucose after overnight fasting'],
                    'random_glucose' => ['name' => 'Random Blood Glucose', 'fullName' => 'Random Blood Glucose', 'unit' => 'mg/dL', 'referenceMax' => 140, 'prediabetesMax' => 199, 'diabetesMin' => 200, 'description' => 'Blood glucose at any time of day'],
                    'post_prandial' => ['name' => 'Postprandial Blood Glucose', 'fullName' => 'Postprandial Blood Glucose', 'unit' => 'mg/dL', 'referenceMax' => 140, 'prediabetesMin' => 140, 'prediabetesMax' => 199, 'diabetesMin' => 200, 'description' => 'Blood glucose 2 hours after meal'],
                ]),
                'status' => 'active',
            ],

            // ==================== ESR - Erythrocyte Sedimentation Rate ====================
            [
                'test_code' => 'ESR',
                'name' => 'Erythrocyte Sedimentation Rate (ESR)',
                'description' => 'Test for inflammation in the body. Measures how quickly red blood cells settle at the bottom of a test tube.',
                'procedure' => 'Westergren method',
                'cost' => 100.00,
                'turnaround_time' => 4,
                'unit' => 'mm/hr',
                'normal_values' => json_encode([
                    'esr' => ['name' => 'ESR', 'fullName' => 'Erythrocyte Sedimentation Rate', 'unit' => 'mm/hr', 'referenceMaxMale' => 15, 'referenceMaxFemale' => 20, 'isCriticalHigh' => 100, 'description' => 'Rate at which red blood cells settle in a tube'],
                ]),
                'status' => 'active',
            ],

            // ==================== DLC - Differential Leukocyte Count ====================
            [
                'test_code' => 'DLC',
                'name' => 'Differential Leukocyte Count (DLC)',
                'description' => 'Count of different types of white blood cells (Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils).',
                'procedure' => 'Automated analyzer or manual differential count',
                'cost' => 80.00,
                'turnaround_time' => 4,
                'unit' => '% or 10⁹/L',
                'normal_values' => json_encode([
                    'neutrophils' => ['name' => 'Neutrophils', 'fullName' => 'Neutrophils (Polymorphonuclear Leukocytes)', 'unit' => '%', 'referenceMin' => 50, 'referenceMax' => 70, 'referenceMinAbs' => 2.0, 'referenceMaxAbs' => 7.0, 'unitAbs' => '10⁹/L', 'description' => 'Neutrophil percentage and absolute count'],
                    'lymphocytes' => ['name' => 'Lymphocytes', 'fullName' => 'Lymphocytes', 'unit' => '%', 'referenceMin' => 20, 'referenceMax' => 40, 'referenceMinAbs' => 1.0, 'referenceMaxAbs' => 4.0, 'unitAbs' => '10⁹/L', 'description' => 'Lymphocyte percentage and absolute count'],
                    'monocytes' => ['name' => 'Monocytes', 'fullName' => 'Monocytes', 'unit' => '%', 'referenceMin' => 2, 'referenceMax' => 10, 'referenceMinAbs' => 0.1, 'referenceMaxAbs' => 1.0, 'unitAbs' => '10⁹/L', 'description' => 'Monocyte percentage and absolute count'],
                    'eosinophils' => ['name' => 'Eosinophils', 'fullName' => 'Eosinophils (Eosinophilic Leukocytes)', 'unit' => '%', 'referenceMin' => 1, 'referenceMax' => 6, 'referenceMinAbs' => 0.02, 'referenceMaxAbs' => 0.5, 'unitAbs' => '10⁹/L', 'description' => 'Eosinophil percentage and absolute count'],
                    'basophils' => ['name' => 'Basophils', 'fullName' => 'Basophils (Basophilic Leukocytes)', 'unit' => '%', 'referenceMin' => 0, 'referenceMax' => 1, 'referenceMinAbs' => 0.0, 'referenceMaxAbs' => 0.1, 'unitAbs' => '10⁹/L', 'description' => 'Basophil percentage and absolute count'],
                ]),
                'status' => 'active',
            ],

            // ==================== BG - Blood Group & Rh Factor ====================
            [
                'test_code' => 'BG',
                'name' => 'Blood Group & Rh Factor',
                'description' => 'Determination of ABO blood group and Rh factor (Positive/Negative).',
                'procedure' => 'Serological testing using antisera',
                'cost' => 50.00,
                'turnaround_time' => 2,
                'unit' => 'N/A',
                'normal_values' => json_encode([
                    'abo_group' => ['name' => 'ABO Group', 'fullName' => 'ABO Blood Group', 'unit' => 'N/A', 'referenceValues' => ['A', 'B', 'AB', 'O'], 'description' => 'ABO blood group determination'],
                    'rh_factor' => ['name' => 'Rh Factor', 'fullName' => 'Rhesus Factor', 'unit' => 'N/A', 'referenceValues' => ['Rh Positive', 'Rh Negative'], 'description' => 'Rh factor determination'],
                ]),
                'status' => 'active',
            ],

            // ==================== BONE - Bone Metabolism ====================
            [
                'test_code' => 'BONE',
                'name' => 'Bone Metabolism Panel',
                'description' => 'Bone metabolism tests including Calcium, Phosphorus, Vitamin D, and PTH.',
                'procedure' => 'Blood sample analysis using various methods',
                'cost' => 400.00,
                'turnaround_time' => 24,
                'unit' => 'Various',
                'normal_values' => json_encode([
                    'calcium' => ['name' => 'Calcium', 'fullName' => 'Serum Calcium', 'unit' => 'mg/dL', 'referenceMin' => 8.5, 'referenceMax' => 10.5, 'isCriticalLow' => 7.0, 'isCriticalHigh' => 14.0, 'description' => 'Total calcium in blood'],
                    'phosphorus' => ['name' => 'Phosphorus', 'fullName' => 'Serum Phosphorus', 'unit' => 'mg/dL', 'referenceMin' => 2.5, 'referenceMax' => 4.5, 'isCriticalLow' => 1.0, 'isCriticalHigh' => 7.0, 'description' => 'Phosphate in blood'],
                    'vitamin_d' => ['name' => 'Vitamin D', 'fullName' => '25-Hydroxy Vitamin D', 'unit' => 'ng/mL', 'deficiencyMax' => 20, 'insufficiencyMin' => 20, 'insufficiencyMax' => 30, 'sufficiencyMin' => 30, 'optimalMin' => 30, 'optimalMax' => 100, 'description' => 'Vitamin D status'],
                    'pth' => ['name' => 'PTH', 'fullName' => 'Parathyroid Hormone', 'unit' => 'pg/mL', 'referenceMin' => 15, 'referenceMax' => 65, 'description' => 'Calcium regulation hormone'],
                ]),
                'status' => 'active',
            ],

            // ==================== PANCREAS - Pancreatic Tests ====================
            [
                'test_code' => 'PANCREAS',
                'name' => 'Pancreatic Enzymes Panel',
                'description' => 'Pancreatic enzyme tests including Amylase and Lipase for pancreatic function assessment.',
                'procedure' => 'Enzymatic colorimetric method',
                'cost' => 200.00,
                'turnaround_time' => 8,
                'unit' => 'U/L',
                'normal_values' => json_encode([
                    'amylase' => ['name' => 'Amylase', 'fullName' => 'Serum Amylase', 'unit' => 'U/L', 'referenceMin' => 25, 'referenceMax' => 125, 'isCriticalHigh' => 500, 'description' => 'Pancreatic enzyme'],
                    'lipase' => ['name' => 'Lipase', 'fullName' => 'Serum Lipase', 'unit' => 'U/L', 'referenceMin' => 10, 'referenceMax' => 140, 'isCriticalHigh' => 400, 'description' => 'Pancreatic enzyme'],
                ]),
                'status' => 'active',
            ],
        ];

        // Insert or update tests using updateOrCreate to avoid duplicates
        foreach ($labTests as $test) {
            LabTest::updateOrCreate(
                ['test_code' => $test['test_code']],
                $test
            );
        }

        $this->command->info('Frontend lab tests seeded successfully!');
        $this->command->info('Tests created/updated: CBC, BMP, Lipid, LFT, TSH, HbA1c, KFT, T3, T4, ELECTROLYTES, IRON, CRP, COAG, URINE, CARDIAC, GLU, ESR, DLC, BG, BONE, PANCREAS');
    }
}
