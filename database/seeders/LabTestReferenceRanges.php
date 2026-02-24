<?php

/**
 * Lab Test Reference Ranges
 *
 * This file contains comprehensive medical reference ranges for all lab tests.
 * Reference ranges are based on standard clinical laboratory guidelines and may vary
 * by laboratory methodology and patient population.
 *
 * @author MiniMax Agent
 * @date 2026-02-24
 */

namespace App\Helpers;

/**
 * LabTestReferenceRanges
 *
 * Provides comprehensive reference ranges for all laboratory tests.
 * Values are based on standard medical laboratory reference ranges for adult populations.
 */
class LabTestReferenceRanges
{
    /**
     * Complete reference range data for all lab tests
     *
     * @return array
     */
    public static function getAllReferenceRanges(): array
    {
        return [
            // ==================== HEMATOLOGY TESTS ====================
            'CBC' => [
                'name' => 'Complete Blood Count',
                'category' => 'Hematology',
                'parameters' => [
                    'wbc' => [
                        'name' => 'White Blood Cell Count',
                        'fullName' => 'Leukocyte Count',
                        'unit' => '10³/μL',
                        'referenceMin' => 4.5,
                        'referenceMax' => 11.0,
                        'criticalLow' => 2.0,
                        'criticalHigh' => 30.0,
                        'description' => 'Total white blood cell count',
                    ],
                    'rbc' => [
                        'name' => 'Red Blood Cell Count',
                        'fullName' => 'Erythrocyte Count',
                        'unit' => '10⁶/μL',
                        'referenceMin' => 4.5,
                        'referenceMax' => 5.5,
                        'criticalLow' => 2.0,
                        'criticalHigh' => 8.0,
                        'description' => 'Total red blood cell count',
                    ],
                    'hemoglobin' => [
                        'name' => 'Hemoglobin',
                        'fullName' => 'Hemoglobin Concentration',
                        'unit' => 'g/dL',
                        'referenceMinMale' => 13.5,
                        'referenceMaxMale' => 17.5,
                        'referenceMinFemale' => 12.0,
                        'referenceMaxFemale' => 16.0,
                        'criticalLow' => 7.0,
                        'criticalHigh' => 20.0,
                        'description' => 'Hemoglobin concentration in blood',
                    ],
                    'hematocrit' => [
                        'name' => 'Hematocrit',
                        'fullName' => 'Packed Cell Volume',
                        'unit' => '%',
                        'referenceMinMale' => 38.0,
                        'referenceMaxMale' => 50.0,
                        'referenceMinFemale' => 36.0,
                        'referenceMaxFemale' => 46.0,
                        'criticalLow' => 20.0,
                        'criticalHigh' => 60.0,
                        'description' => 'Percentage of blood volume occupied by red cells',
                    ],
                    'platelets' => [
                        'name' => 'Platelet Count',
                        'fullName' => 'Thrombocyte Count',
                        'unit' => '10³/μL',
                        'referenceMin' => 150,
                        'referenceMax' => 400,
                        'criticalLow' => 50,
                        'criticalHigh' => 1000,
                        'description' => 'Total platelet count',
                    ],
                    'mcv' => [
                        'name' => 'MCV',
                        'fullName' => 'Mean Corpuscular Volume',
                        'unit' => 'fL',
                        'referenceMin' => 80,
                        'referenceMax' => 100,
                        'description' => 'Average volume of red blood cells',
                    ],
                    'mch' => [
                        'name' => 'MCH',
                        'fullName' => 'Mean Corpuscular Hemoglobin',
                        'unit' => 'pg',
                        'referenceMin' => 27,
                        'referenceMax' => 33,
                        'description' => 'Average hemoglobin content per red cell',
                    ],
                    'mchc' => [
                        'name' => 'MCHC',
                        'fullName' => 'Mean Corpuscular Hemoglobin Concentration',
                        'unit' => 'g/dL',
                        'referenceMin' => 32,
                        'referenceMax' => 36,
                        'description' => 'Average hemoglobin concentration in red cells',
                    ],
                    'rdw' => [
                        'name' => 'RDW',
                        'fullName' => 'Red Cell Distribution Width',
                        'unit' => '%',
                        'referenceMin' => 11.5,
                        'referenceMax' => 14.5,
                        'description' => 'Variation in red blood cell size',
                    ],
                    'mpv' => [
                        'name' => 'MPV',
                        'fullName' => 'Mean Platelet Volume',
                        'unit' => 'fL',
                        'referenceMin' => 7.5,
                        'referenceMax' => 12.0,
                        'description' => 'Average platelet volume',
                    ],
                ],
            ],

            'TLC' => [
                'name' => 'Total Leukocyte Count',
                'category' => 'Hematology',
                'parameters' => [
                    'tlc' => [
                        'name' => 'WBC',
                        'fullName' => 'Total Leukocyte Count',
                        'unit' => '10⁹/L',
                        'referenceMin' => 4.0,
                        'referenceMax' => 10.0,
                        'criticalLow' => 2.0,
                        'criticalHigh' => 30.0,
                        'description' => 'Total white blood cell count',
                    ],
                ],
            ],

            'DLC' => [
                'name' => 'Differential Leukocyte Count',
                'category' => 'Hematology',
                'parameters' => [
                    'neutrophils' => [
                        'name' => 'Neutrophils',
                        'fullName' => 'Neutrophils (Polymorphonuclear Leukocytes)',
                        'unit' => '%',
                        'referenceMin' => 50,
                        'referenceMax' => 70,
                        'referenceMinAbs' => 2.0,
                        'referenceMaxAbs' => 7.0,
                        'unitAbs' => '10⁹/L',
                        'description' => 'Neutrophil percentage and absolute count',
                    ],
                    'lymphocytes' => [
                        'name' => 'Lymphocytes',
                        'fullName' => 'Lymphocytes',
                        'unit' => '%',
                        'referenceMin' => 20,
                        'referenceMax' => 40,
                        'referenceMinAbs' => 1.0,
                        'referenceMaxAbs' => 4.0,
                        'unitAbs' => '10⁹/L',
                        'description' => 'Lymphocyte percentage and absolute count',
                    ],
                    'monocytes' => [
                        'name' => 'Monocytes',
                        'fullName' => 'Monocytes',
                        'unit' => '%',
                        'referenceMin' => 2,
                        'referenceMax' => 10,
                        'referenceMinAbs' => 0.1,
                        'referenceMaxAbs' => 1.0,
                        'unitAbs' => '10⁹/L',
                        'description' => 'Monocyte percentage and absolute count',
                    ],
                    'eosinophils' => [
                        'name' => 'Eosinophils',
                        'fullName' => 'Eosinophils (Eosinophilic Leukocytes)',
                        'unit' => '%',
                        'referenceMin' => 1,
                        'referenceMax' => 6,
                        'referenceMinAbs' => 0.02,
                        'referenceMaxAbs' => 0.5,
                        'unitAbs' => '10⁹/L',
                        'description' => 'Eosinophil percentage and absolute count',
                    ],
                    'basophils' => [
                        'name' => 'Basophils',
                        'fullName' => 'Basophils (Basophilic Leukocytes)',
                        'unit' => '%',
                        'referenceMin' => 0,
                        'referenceMax' => 1,
                        'referenceMinAbs' => 0.0,
                        'referenceMaxAbs' => 0.1,
                        'unitAbs' => '10⁹/L',
                        'description' => 'Basophil percentage and absolute count',
                    ],
                ],
            ],

            'HB' => [
                'name' => 'Hemoglobin',
                'category' => 'Hematology',
                'parameters' => [
                    'hemoglobin' => [
                        'name' => 'Hemoglobin',
                        'fullName' => 'Hemoglobin Concentration',
                        'unit' => 'g/dL',
                        'referenceMinMale' => 13.0,
                        'referenceMaxMale' => 18.0,
                        'referenceMinFemale' => 12.0,
                        'referenceMaxFemale' => 16.0,
                        'criticalLow' => 7.0,
                        'criticalHigh' => 20.0,
                        'description' => 'Hemoglobin concentration in blood',
                    ],
                ],
            ],

            'ESR' => [
                'name' => 'Erythrocyte Sedimentation Rate',
                'category' => 'Hematology',
                'parameters' => [
                    'esr' => [
                        'name' => 'ESR',
                        'fullName' => 'Erythrocyte Sedimentation Rate',
                        'unit' => 'mm/hr',
                        'referenceMaxMale' => 15,
                        'referenceMaxFemale' => 20,
                        'criticalHigh' => 100,
                        'description' => 'Rate at which red blood cells settle in a tube',
                    ],
                ],
            ],

            'PLT' => [
                'name' => 'Platelet Count',
                'category' => 'Hematology',
                'parameters' => [
                    'platelets' => [
                        'name' => 'Platelet Count',
                        'fullName' => 'Thrombocyte Count',
                        'unit' => '10⁹/L',
                        'referenceMin' => 100,
                        'referenceMax' => 300,
                        'criticalLow' => 20,
                        'criticalHigh' => 1000,
                        'description' => 'Total platelet count',
                    ],
                ],
            ],

            'RET' => [
                'name' => 'Reticulocyte Count',
                'category' => 'Hematology',
                'parameters' => [
                    'reticulocytes' => [
                        'name' => 'Reticulocytes',
                        'fullName' => 'Reticulocyte Count',
                        'unit' => '%',
                        'referenceMin' => 0.5,
                        'referenceMax' => 2.5,
                        'description' => 'Percentage of immature red blood cells',
                    ],
                ],
            ],

            'BG' => [
                'name' => 'Blood Group & Rh Factor',
                'category' => 'Blood Bank',
                'parameters' => [
                    'abo_group' => [
                        'name' => 'ABO Group',
                        'fullName' => 'ABO Blood Group',
                        'unit' => 'N/A',
                        'referenceValues' => ['A', 'B', 'AB', 'O'],
                        'description' => 'ABO blood group determination',
                    ],
                    'rh_factor' => [
                        'name' => 'Rh Factor',
                        'fullName' => 'Rhesus Factor',
                        'unit' => 'N/A',
                        'referenceValues' => ['Rh Positive', 'Rh Negative'],
                        'description' => 'Rh factor determination',
                    ],
                ],
            ],

            // ==================== BASIC METABOLIC PANEL ====================
            'BMP' => [
                'name' => 'Basic Metabolic Panel',
                'category' => 'Biochemistry',
                'parameters' => [
                    'glucose' => [
                        'name' => 'Glucose',
                        'fullName' => 'Fasting Blood Glucose',
                        'unit' => 'mg/dL',
                        'referenceMin' => 70,
                        'referenceMax' => 100,
                        'criticalLow' => 40,
                        'criticalHigh' => 400,
                        'description' => 'Blood glucose level after fasting',
                    ],
                    'bun' => [
                        'name' => 'BUN',
                        'fullName' => 'Blood Urea Nitrogen',
                        'unit' => 'mg/dL',
                        'referenceMin' => 7,
                        'referenceMax' => 20,
                        'criticalHigh' => 100,
                        'description' => 'Urea nitrogen concentration in blood',
                    ],
                    'creatinine' => [
                        'name' => 'Creatinine',
                        'fullName' => 'Serum Creatinine',
                        'unit' => 'mg/dL',
                        'referenceMinMale' => 0.7,
                        'referenceMaxMale' => 1.3,
                        'referenceMinFemale' => 0.6,
                        'referenceMaxFemale' => 1.1,
                        'criticalHigh' => 10.0,
                        'description' => 'Creatinine concentration in blood',
                    ],
                    'sodium' => [
                        'name' => 'Sodium',
                        'fullName' => 'Serum Sodium',
                        'unit' => 'mEq/L',
                        'referenceMin' => 135,
                        'referenceMax' => 145,
                        'criticalLow' => 120,
                        'criticalHigh' => 160,
                        'description' => 'Sodium concentration in blood',
                    ],
                    'potassium' => [
                        'name' => 'Potassium',
                        'fullName' => 'Serum Potassium',
                        'unit' => 'mEq/L',
                        'referenceMin' => 3.5,
                        'referenceMax' => 5.0,
                        'criticalLow' => 2.5,
                        'criticalHigh' => 6.5,
                        'description' => 'Potassium concentration in blood',
                    ],
                    'chloride' => [
                        'name' => 'Chloride',
                        'fullName' => 'Serum Chloride',
                        'unit' => 'mEq/L',
                        'referenceMin' => 98,
                        'referenceMax' => 106,
                        'criticalLow' => 80,
                        'criticalHigh' => 115,
                        'description' => 'Chloride concentration in blood',
                    ],
                    'co2' => [
                        'name' => 'CO2',
                        'fullName' => 'Carbon Dioxide',
                        'unit' => 'mEq/L',
                        'referenceMin' => 23,
                        'referenceMax' => 29,
                        'criticalLow' => 15,
                        'criticalHigh' => 35,
                        'description' => 'Bicarbonate and CO2 content',
                    ],
                    'calcium' => [
                        'name' => 'Calcium',
                        'fullName' => 'Serum Calcium',
                        'unit' => 'mg/dL',
                        'referenceMin' => 8.5,
                        'referenceMax' => 10.5,
                        'criticalLow' => 7.0,
                        'criticalHigh' => 14.0,
                        'description' => 'Total calcium concentration in blood',
                    ],
                ],
            ],

            // ==================== LIPID PROFILE ====================
            'Lipid' => [
                'name' => 'Lipid Profile',
                'category' => 'Biochemistry',
                'parameters' => [
                    'total_cholesterol' => [
                        'name' => 'Total Cholesterol',
                        'fullName' => 'Serum Total Cholesterol',
                        'unit' => 'mg/dL',
                        'referenceMax' => 200,
                        'borderlineMin' => 200,
                        'borderlineMax' => 239,
                        'highMin' => 240,
                        'criticalHigh' => 300,
                        'description' => 'Total cholesterol concentration',
                    ],
                    'ldl' => [
                        'name' => 'LDL Cholesterol',
                        'fullName' => 'Low-Density Lipoprotein Cholesterol',
                        'unit' => 'mg/dL',
                        'optimalMax' => 100,
                        'nearOptimalMin' => 100,
                        'nearOptimalMax' => 129,
                        'borderlineMin' => 130,
                        'borderlineMax' => 159,
                        'highMin' => 160,
                        'veryHighMin' => 190,
                        'criticalHigh' => 220,
                        'description' => 'LDL cholesterol ("bad" cholesterol)',
                    ],
                    'hdl' => [
                        'name' => 'HDL Cholesterol',
                        'fullName' => 'High-Density Lipoprotein Cholesterol',
                        'unit' => 'mg/dL',
                        'referenceMinMale' => 40,
                        'referenceMaxMale' => 200,
                        'referenceMinFemale' => 50,
                        'referenceMaxFemale' => 200,
                        'lowRiskMax' => 40,
                        'criticalLow' => 20,
                        'description' => 'HDL cholesterol ("good" cholesterol)',
                    ],
                    'triglycerides' => [
                        'name' => 'Triglycerides',
                        'fullName' => 'Serum Triglycerides',
                        'unit' => 'mg/dL',
                        'referenceMax' => 150,
                        'borderlineMin' => 150,
                        'borderlineMax' => 199,
                        'highMin' => 200,
                        'highMax' => 499,
                        'veryHighMin' => 500,
                        'criticalHigh' => 1000,
                        'description' => 'Triglyceride concentration in blood',
                    ],
                    'vldl' => [
                        'name' => 'VLDL',
                        'fullName' => 'Very Low-Density Lipoprotein',
                        'unit' => 'mg/dL',
                        'referenceMin' => 5,
                        'referenceMax' => 40,
                        'description' => 'VLDL cholesterol (calculated)',
                    ],
                ],
            ],

            // ==================== LIVER FUNCTION TESTS ====================
            'LFT' => [
                'name' => 'Liver Function Test',
                'category' => 'Biochemistry',
                'parameters' => [
                    'alt' => [
                        'name' => 'ALT',
                        'fullName' => 'Alanine Aminotransferase (SGPT)',
                        'unit' => 'U/L',
                        'referenceMinMale' => 10,
                        'referenceMaxMale' => 40,
                        'referenceMinFemale' => 7,
                        'referenceMaxFemale' => 56,
                        'criticalHigh' => 500,
                        'description' => 'Liver enzyme - specific marker for liver cell injury',
                    ],
                    'ast' => [
                        'name' => 'AST',
                        'fullName' => 'Aspartate Aminotransferase (SGOT)',
                        'unit' => 'U/L',
                        'referenceMinMale' => 10,
                        'referenceMaxMale' => 40,
                        'referenceMinFemale' => 9,
                        'referenceMaxFemale' => 32,
                        'criticalHigh' => 500,
                        'description' => 'Liver enzyme - elevated in liver and heart disease',
                    ],
                    'alp' => [
                        'name' => 'ALP',
                        'fullName' => 'Alkaline Phosphatase',
                        'unit' => 'U/L',
                        'referenceMin' => 44,
                        'referenceMax' => 147,
                        'criticalHigh' => 500,
                        'description' => 'Enzyme elevated in liver and bone disease',
                    ],
                    'bilirubin_total' => [
                        'name' => 'Total Bilirubin',
                        'fullName' => 'Total Bilirubin',
                        'unit' => 'mg/dL',
                        'referenceMin' => 0.1,
                        'referenceMax' => 1.2,
                        'criticalHigh' => 15.0,
                        'description' => 'Total bilirubin (direct + indirect)',
                    ],
                    'bilirubin_direct' => [
                        'name' => 'Direct Bilirubin',
                        'fullName' => 'Conjugated Bilirubin',
                        'unit' => 'mg/dL',
                        'referenceMin' => 0.0,
                        'referenceMax' => 0.3,
                        'criticalHigh' => 5.0,
                        'description' => 'Direct (conjugated) bilirubin',
                    ],
                    'bilirubin_indirect' => [
                        'name' => 'Indirect Bilirubin',
                        'fullName' => 'Unconjugated Bilirubin',
                        'unit' => 'mg/dL',
                        'referenceMin' => 0.1,
                        'referenceMax' => 1.0,
                        'description' => 'Indirect (unconjugated) bilirubin - calculated',
                    ],
                    'albumin' => [
                        'name' => 'Albumin',
                        'fullName' => 'Serum Albumin',
                        'unit' => 'g/dL',
                        'referenceMin' => 3.5,
                        'referenceMax' => 5.0,
                        'criticalLow' => 2.0,
                        'description' => 'Protein made by the liver',
                    ],
                    'total_protein' => [
                        'name' => 'Total Protein',
                        'fullName' => 'Serum Total Protein',
                        'unit' => 'g/dL',
                        'referenceMin' => 6.0,
                        'referenceMax' => 8.3,
                        'criticalLow' => 4.0,
                        'description' => 'Total protein (albumin + globulin)',
                    ],
                    'globulin' => [
                        'name' => 'Globulin',
                        'fullName' => 'Serum Globulin',
                        'unit' => 'g/dL',
                        'referenceMin' => 2.0,
                        'referenceMax' => 3.5,
                        'description' => 'Globulin concentration - calculated',
                    ],
                    'ag_ratio' => [
                        'name' => 'A/G Ratio',
                        'fullName' => 'Albumin/Globulin Ratio',
                        'unit' => 'ratio',
                        'referenceMin' => 1.0,
                        'referenceMax' => 2.0,
                        'description' => 'Ratio of albumin to globulin',
                    ],
                ],
            ],

            // ==================== KIDNEY FUNCTION TESTS ====================
            'KFT' => [
                'name' => 'Kidney Function Test',
                'category' => 'Biochemistry',
                'parameters' => [
                    'creatinine' => [
                        'name' => 'Creatinine',
                        'fullName' => 'Serum Creatinine',
                        'unit' => 'mg/dL',
                        'referenceMinMale' => 0.7,
                        'referenceMaxMale' => 1.3,
                        'referenceMinFemale' => 0.6,
                        'referenceMaxFemale' => 1.1,
                        'criticalHigh' => 10.0,
                        'description' => 'Kidney function marker',
                    ],
                    'urea' => [
                        'name' => 'Urea',
                        'fullName' => 'Blood Urea',
                        'unit' => 'mg/dL',
                        'referenceMin' => 7,
                        'referenceMax' => 20,
                        'criticalHigh' => 100,
                        'description' => 'Waste product filtered by kidneys',
                    ],
                    'bun' => [
                        'name' => 'BUN',
                        'fullName' => 'Blood Urea Nitrogen',
                        'unit' => 'mg/dL',
                        'referenceMin' => 7,
                        'referenceMax' => 20,
                        'criticalHigh' => 100,
                        'description' => 'Nitrogen portion of urea',
                    ],
                    'uric_acid' => [
                        'name' => 'Uric Acid',
                        'fullName' => 'Serum Uric Acid',
                        'unit' => 'mg/dL',
                        'referenceMinMale' => 3.4,
                        'referenceMaxMale' => 7.0,
                        'referenceMinFemale' => 2.4,
                        'referenceMaxFemale' => 6.0,
                        'criticalHigh' => 12.0,
                        'description' => 'Product of purine metabolism',
                    ],
                    'sodium' => [
                        'name' => 'Sodium',
                        'fullName' => 'Serum Sodium',
                        'unit' => 'mEq/L',
                        'referenceMin' => 135,
                        'referenceMax' => 145,
                        'criticalLow' => 120,
                        'criticalHigh' => 160,
                        'description' => 'Electrolyte balance indicator',
                    ],
                    'potassium' => [
                        'name' => 'Potassium',
                        'fullName' => 'Serum Potassium',
                        'unit' => 'mEq/L',
                        'referenceMin' => 3.5,
                        'referenceMax' => 5.0,
                        'criticalLow' => 2.5,
                        'criticalHigh' => 6.5,
                        'description' => 'Critical electrolyte for heart function',
                    ],
                    'chloride' => [
                        'name' => 'Chloride',
                        'fullName' => 'Serum Chloride',
                        'unit' => 'mEq/L',
                        'referenceMin' => 98,
                        'referenceMax' => 106,
                        'description' => 'Electrolyte balance',
                    ],
                    'co2' => [
                        'name' => 'CO2',
                        'fullName' => 'Carbon Dioxide',
                        'unit' => 'mEq/L',
                        'referenceMin' => 23,
                        'referenceMax' => 29,
                        'description' => 'Acid-base balance indicator',
                    ],
                ],
            ],

            // ==================== THYROID FUNCTION TESTS ====================
            'TSH' => [
                'name' => 'Thyroid Stimulating Hormone',
                'category' => 'Endocrinology',
                'parameters' => [
                    'tsh' => [
                        'name' => 'TSH',
                        'fullName' => 'Thyroid Stimulating Hormone',
                        'unit' => 'μIU/mL',
                        'referenceMin' => 0.4,
                        'referenceMax' => 4.0,
                        'criticalLow' => 0.01,
                        'criticalHigh' => 50.0,
                        'description' => 'Primary screening test for thyroid function',
                    ],
                ],
            ],

            'T3' => [
                'name' => 'Triiodothyronine (T3)',
                'category' => 'Endocrinology',
                'parameters' => [
                    't3' => [
                        'name' => 'T3',
                        'fullName' => 'Triiodothyronine (Total)',
                        'unit' => 'ng/dL',
                        'referenceMin' => 80,
                        'referenceMax' => 200,
                        'criticalLow' => 40,
                        'criticalHigh' => 400,
                        'description' => 'Active thyroid hormone',
                    ],
                ],
            ],

            'T4' => [
                'name' => 'Thyroxine (T4)',
                'category' => 'Endocrinology',
                'parameters' => [
                    't4' => [
                        'name' => 'T4',
                        'fullName' => 'Thyroxine (Total)',
                        'unit' => 'μg/dL',
                        'referenceMin' => 5.0,
                        'referenceMax' => 12.0,
                        'criticalLow' => 2.0,
                        'criticalHigh' => 20.0,
                        'description' => 'Primary thyroid hormone',
                    ],
                    'ft4' => [
                        'name' => 'Free T4',
                        'fullName' => 'Free Thyroxine',
                        'unit' => 'ng/dL',
                        'referenceMin' => 0.8,
                        'referenceMax' => 1.8,
                        'criticalLow' => 0.3,
                        'criticalHigh' => 3.0,
                        'description' => 'Active form of T4',
                    ],
                ],
            ],

            // ==================== DIABETES TESTS ====================
            'HbA1c' => [
                'name' => 'Hemoglobin A1c',
                'category' => 'Biochemistry',
                'parameters' => [
                    'hba1c' => [
                        'name' => 'HbA1c',
                        'fullName' => 'Glycated Hemoglobin',
                        'unit' => '%',
                        'referenceMax' => 5.6,
                        'prediabetesMin' => 5.7,
                        'prediabetesMax' => 6.4,
                        'diabetesMin' => 6.5,
                        'description' => 'Average blood glucose over 2-3 months',
                    ],
                ],
            ],

            'GLU' => [
                'name' => 'Blood Glucose',
                'category' => 'Biochemistry',
                'parameters' => [
                    'fasting_glucose' => [
                        'name' => 'Fasting Blood Glucose',
                        'fullName' => 'Fasting Blood Glucose',
                        'unit' => 'mg/dL',
                        'referenceMin' => 70,
                        'referenceMax' => 100,
                        'prediabetesMin' => 100,
                        'prediabetesMax' => 125,
                        'diabetesMin' => 126,
                        'criticalLow' => 40,
                        'criticalHigh' => 400,
                        'description' => 'Blood glucose after overnight fasting',
                    ],
                    'random_glucose' => [
                        'name' => 'Random Blood Glucose',
                        'fullName' => 'Random Blood Glucose',
                        'unit' => 'mg/dL',
                        'referenceMax' => 140,
                        'prediabetesMax' => 199,
                        'diabetesMin' => 200,
                        'description' => 'Blood glucose at any time of day',
                    ],
                    'post_prandial' => [
                        'name' => 'Postprandial Blood Glucose',
                        'fullName' => 'Postprandial Blood Glucose',
                        'unit' => 'mg/dL',
                        'referenceMax' => 140,
                        'prediabetesMin' => 140,
                        'prediabetesMax' => 199,
                        'diabetesMin' => 200,
                        'description' => 'Blood glucose 2 hours after meal',
                    ],
                ],
            ],

            // ==================== ELECTROLYTES ====================
            'ELECTROLYTES' => [
                'name' => 'Electrolyte Panel',
                'category' => 'Biochemistry',
                'parameters' => [
                    'sodium' => [
                        'name' => 'Sodium',
                        'fullName' => 'Serum Sodium',
                        'unit' => 'mEq/L',
                        'referenceMin' => 135,
                        'referenceMax' => 145,
                        'criticalLow' => 120,
                        'criticalHigh' => 160,
                        'description' => 'Major extracellular cation',
                    ],
                    'potassium' => [
                        'name' => 'Potassium',
                        'fullName' => 'Serum Potassium',
                        'unit' => 'mEq/L',
                        'referenceMin' => 3.5,
                        'referenceMax' => 5.0,
                        'criticalLow' => 2.5,
                        'criticalHigh' => 6.5,
                        'description' => 'Major intracellular cation',
                    ],
                    'chloride' => [
                        'name' => 'Chloride',
                        'fullName' => 'Serum Chloride',
                        'unit' => 'mEq/L',
                        'referenceMin' => 98,
                        'referenceMax' => 106,
                        'criticalLow' => 80,
                        'criticalHigh' => 115,
                        'description' => 'Major extracellular anion',
                    ],
                    'bicarbonate' => [
                        'name' => 'Bicarbonate',
                        'fullName' => 'Serum Bicarbonate (CO2)',
                        'unit' => 'mEq/L',
                        'referenceMin' => 23,
                        'referenceMax' => 29,
                        'criticalLow' => 15,
                        'criticalHigh' => 35,
                        'description' => 'Primary buffer in blood',
                    ],
                    'magnesium' => [
                        'name' => 'Magnesium',
                        'fullName' => 'Serum Magnesium',
                        'unit' => 'mg/dL',
                        'referenceMin' => 1.5,
                        'referenceMax' => 2.5,
                        'criticalLow' => 1.0,
                        'criticalHigh' => 4.0,
                        'description' => 'Important for muscle and nerve function',
                    ],
                    'phosphorus' => [
                        'name' => 'Phosphorus',
                        'fullName' => 'Serum Phosphorus/Phosphate',
                        'unit' => 'mg/dL',
                        'referenceMin' => 2.5,
                        'referenceMax' => 4.5,
                        'criticalLow' => 1.0,
                        'criticalHigh' => 7.0,
                        'description' => 'Important for bone metabolism',
                    ],
                ],
            ],

            // ==================== IRON STUDIES ====================
            'IRON' => [
                'name' => 'Iron Studies',
                'category' => 'Hematology',
                'parameters' => [
                    'iron' => [
                        'name' => 'Serum Iron',
                        'fullName' => 'Serum Iron',
                        'unit' => 'μg/dL',
                        'referenceMinMale' => 65,
                        'referenceMaxMale' => 175,
                        'referenceMinFemale' => 50,
                        'referenceMaxFemale' => 170,
                        'description' => 'Iron concentration in blood',
                    ],
                    'ferritin' => [
                        'name' => 'Ferritin',
                        'fullName' => 'Serum Ferritin',
                        'unit' => 'ng/mL',
                        'referenceMinMale' => 20,
                        'referenceMaxMale' => 250,
                        'referenceMinFemale' => 10,
                        'referenceMaxFemale' => 120,
                        'criticalLow' => 10,
                        'description' => 'Stored iron protein',
                    ],
                    'tibc' => [
                        'name' => 'TIBC',
                        'fullName' => 'Total Iron Binding Capacity',
                        'unit' => 'μg/dL',
                        'referenceMin' => 250,
                        'referenceMax' => 450,
                        'description' => 'Maximum iron that can be bound',
                    ],
                    'transferrin' => [
                        'name' => 'Transferrin',
                        'fullName' => 'Serum Transferrin',
                        'unit' => 'mg/dL',
                        'referenceMin' => 200,
                        'referenceMax' => 400,
                        'description' => 'Iron transport protein',
                    ],
                    'transferrin_saturation' => [
                        'name' => 'Transferrin Saturation',
                        'fullName' => 'Transferrin Saturation',
                        'unit' => '%',
                        'referenceMin' => 20,
                        'referenceMax' => 50,
                        'description' => 'Percentage of transferrin bound to iron',
                    ],
                ],
            ],

            // ==================== INFLAMMATORY MARKERS ====================
            'CRP' => [
                'name' => 'C-Reactive Protein',
                'category' => 'Immunology',
                'parameters' => [
                    'crp' => [
                        'name' => 'CRP',
                        'fullName' => 'C-Reactive Protein',
                        'unit' => 'mg/L',
                        'referenceMax' => 3.0,
                        'highMin' => 3.0,
                        'highMax' => 10.0,
                        'veryHighMin' => 10.0,
                        'description' => 'Acute phase inflammatory marker',
                    ],
                    'hs_crp' => [
                        'name' => 'High-Sensitivity CRP',
                        'fullName' => 'High-Sensitivity C-Reactive Protein',
                        'unit' => 'mg/L',
                        'lowRiskMax' => 1.0,
                        'moderateRiskMin' => 1.0,
                        'moderateRiskMax' => 3.0,
                        'highRiskMin' => 3.0,
                        'description' => 'Cardiovascular risk assessment',
                    ],
                ],
            ],

            // ==================== COAGULATION TESTS ====================
            'COAG' => [
                'name' => 'Coagulation Profile',
                'category' => 'Hematology',
                'parameters' => [
                    'pt' => [
                        'name' => 'PT',
                        'fullName' => 'Prothrombin Time',
                        'unit' => 'seconds',
                        'referenceMin' => 11,
                        'referenceMax' => 13.5,
                        'inr_target' => 2.0,
                        'inr_range' => '2.0-3.0',
                        'description' => 'External coagulation pathway test',
                    ],
                    'aptt' => [
                        'name' => 'APTT',
                        'fullName' => 'Activated Partial Thromboplastin Time',
                        'unit' => 'seconds',
                        'referenceMin' => 25,
                        'referenceMax' => 35,
                        'criticalHigh' => 70,
                        'description' => 'Internal coagulation pathway test',
                    ],
                    'inr' => [
                        'name' => 'INR',
                        'fullName' => 'International Normalized Ratio',
                        'unit' => 'ratio',
                        'referenceMax' => 1.1,
                        'therapeuticMin' => 2.0,
                        'therapeuticMax' => 3.0,
                        'description' => 'Standardized coagulation measure',
                    ],
                    'fibrinogen' => [
                        'name' => 'Fibrinogen',
                        'fullName' => 'Plasma Fibrinogen',
                        'unit' => 'mg/dL',
                        'referenceMin' => 200,
                        'referenceMax' => 400,
                        'criticalLow' => 100,
                        'description' => 'Clotting factor and acute phase protein',
                    ],
                ],
            ],

            // ==================== URINE ANALYSIS ====================
            'URINE' => [
                'name' => 'Urinalysis',
                'category' => 'Urine',
                'parameters' => [
                    'specific_gravity' => [
                        'name' => 'Specific Gravity',
                        'fullName' => 'Urine Specific Gravity',
                        'unit' => 'ratio',
                        'referenceMin' => 1.005,
                        'referenceMax' => 1.030,
                        'description' => 'Concentration of urine',
                    ],
                    'ph' => [
                        'name' => 'pH',
                        'fullName' => 'Urine pH',
                        'unit' => 'pH',
                        'referenceMin' => 4.5,
                        'referenceMax' => 8.0,
                        'description' => 'Acidity/alkalinity of urine',
                    ],
                    'protein' => [
                        'name' => 'Protein',
                        'fullName' => 'Urine Protein',
                        'unit' => 'mg/dL',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Protein in urine (normally absent)',
                    ],
                    'glucose' => [
                        'name' => 'Glucose',
                        'fullName' => 'Urine Glucose',
                        'unit' => 'mg/dL',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Glucose in urine (normally absent)',
                    ],
                    'ketones' => [
                        'name' => 'Ketones',
                        'fullName' => 'Urine Ketones',
                        'unit' => 'mg/dL',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Ketones in urine',
                    ],
                    'blood' => [
                        'name' => 'Blood',
                        'fullName' => 'Urine Blood',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Blood in urine (normally absent)',
                    ],
                    'bilirubin' => [
                        'name' => 'Bilirubin',
                        'fullName' => 'Urine Bilirubin',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Bilirubin in urine (normally absent)',
                    ],
                    'urobilinogen' => [
                        'name' => 'Urobilinogen',
                        'fullName' => 'Urine Urobilinogen',
                        'unit' => 'mg/dL',
                        'referenceMax' => 1.0,
                        'description' => 'Normal urobilinogen in urine',
                    ],
                    'nitrite' => [
                        'name' => 'Nitrite',
                        'fullName' => 'Urine Nitrite',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Bacterial infection indicator',
                    ],
                    'leukocyte_esterase' => [
                        'name' => 'Leukocyte Esterase',
                        'fullName' => 'Urine Leukocyte Esterase',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'White blood cell indicator',
                    ],
                ],
            ],

            // ==================== ADDITIONAL COMMON TESTS ====================
            'G6PD' => [
                'name' => 'G6PD Deficiency Test',
                'category' => 'Hematology',
                'parameters' => [
                    'g6pd' => [
                        'name' => 'G6PD',
                        'fullName' => 'Glucose-6-Phosphate Dehydrogenase',
                        'unit' => 'U/gHb',
                        'referenceMin' => 4.6,
                        'referenceMax' => 13.5,
                        'criticalLow' => 2.0,
                        'description' => 'Enzyme deficiency test for hemolytic anemia',
                    ],
                ],
            ],

            'TPHA' => [
                'name' => 'TPHA Test',
                'category' => 'Serology',
                'parameters' => [
                    'tpha' => [
                        'name' => 'TPHA',
                        'fullName' => 'Treponema pallidum Hemagglutination Assay',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Syphilis screening test',
                    ],
                ],
            ],

            'HBSAG' => [
                'name' => 'HBsAg Test',
                'category' => 'Serology',
                'parameters' => [
                    'hbsag' => [
                        'name' => 'HBsAg',
                        'fullName' => 'Hepatitis B Surface Antigen',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Hepatitis B infection marker',
                    ],
                ],
            ],

            'HCV' => [
                'name' => 'HCV Test',
                'category' => 'Serology',
                'parameters' => [
                    'hcv' => [
                        'name' => 'HCV Antibody',
                        'fullName' => 'Hepatitis C Virus Antibody',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Hepatitis C infection screening',
                    ],
                ],
            ],

            'HIV' => [
                'name' => 'HIV Test',
                'category' => 'Serology',
                'parameters' => [
                    'hiv' => [
                        'name' => 'HIV 1&2',
                        'fullName' => 'Human Immunodeficiency Virus 1 & 2',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'HIV infection screening',
                    ],
                ],
            ],

            'DENGUE' => [
                'name' => 'Dengue Test',
                'category' => 'Serology',
                'parameters' => [
                    'dengue_ns1' => [
                        'name' => 'Dengue NS1',
                        'fullName' => 'Dengue NS1 Antigen',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Early dengue infection marker',
                    ],
                    'dengue_igg' => [
                        'name' => 'Dengue IgG',
                        'fullName' => 'Dengue IgG Antibody',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Past dengue infection',
                    ],
                    'dengue_igm' => [
                        'name' => 'Dengue IgM',
                        'fullName' => 'Dengue IgM Antibody',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Recent dengue infection',
                    ],
                ],
            ],

            'TYPHOID' => [
                'name' => 'Typhoid Test',
                'category' => 'Serology',
                'parameters' => [
                    'typhoid_igg' => [
                        'name' => 'Typhoid IgG',
                        'fullName' => 'Salmonella Typhi IgG',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Past typhoid infection',
                    ],
                    'typhoid_igm' => [
                        'name' => 'Typhoid IgM',
                        'fullName' => 'Salmonella Typhi IgM',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Recent typhoid infection',
                    ],
                ],
            ],

            'MALARIA' => [
                'name' => 'Malaria Test',
                'category' => 'Parasitology',
                'parameters' => [
                    'malaria_mp' => [
                        'name' => 'Malaria MP',
                        'fullName' => 'Malaria Parasite (Blood Smear)',
                        'unit' => 'N/A',
                        'referenceMax' => 'No parasites seen',
                        'normalValue' => 'No parasites seen',
                        'description' => 'Microscopic examination for malaria parasites',
                    ],
                    'malaria_rdt' => [
                        'name' => 'Malaria RDT',
                        'fullName' => 'Malaria Rapid Diagnostic Test',
                        'unit' => 'N/A',
                        'referenceMax' => 'Negative',
                        'normalValue' => 'Negative',
                        'description' => 'Rapid test for malaria antigens',
                    ],
                ],
            ],

            // ==================== PREGNANCY TESTS ====================
            'PREGNANCY' => [
                'name' => 'Pregnancy Test',
                'category' => 'Serology',
                'parameters' => [
                    'hcg' => [
                        'name' => 'β-hCG',
                        'fullName' => 'Beta-Human Chorionic Gonadotropin',
                        'unit' => 'mIU/mL',
                        'nonPregnantMax' => 5,
                        'description' => 'Pregnancy hormone',
                    ],
                ],
            ],

            // ==================== CARDIAC MARKERS ====================
            'CARDIAC' => [
                'name' => 'Cardiac Markers',
                'category' => 'Biochemistry',
                'parameters' => [
                    'troponin_i' => [
                        'name' => 'Troponin I',
                        'fullName' => 'Cardiac Troponin I',
                        'unit' => 'ng/mL',
                        'referenceMax' => 0.04,
                        'criticalHigh' => 0.5,
                        'description' => 'Heart muscle damage marker',
                    ],
                    'troponin_t' => [
                        'name' => 'Troponin T',
                        'fullName' => 'Cardiac Troponin T',
                        'unit' => 'ng/mL',
                        'referenceMax' => 0.1,
                        'criticalHigh' => 0.2,
                        'description' => 'Heart muscle damage marker',
                    ],
                    'ck_mb' => [
                        'name' => 'CK-MB',
                        'fullName' => 'Creatine Kinase MB',
                        'unit' => 'ng/mL',
                        'referenceMax' => 5.0,
                        'criticalHigh' => 10.0,
                        'description' => 'Heart-specific enzyme',
                    ],
                    'bnp' => [
                        'name' => 'BNP',
                        'fullName' => 'B-type Natriuretic Peptide',
                        'unit' => 'pg/mL',
                        'referenceMax' => 100,
                        'heartFailureMin' => 100,
                        'description' => 'Heart failure indicator',
                    ],
                ],
            ],

            // ==================== PANCREATIC TESTS ====================
            'PANCREAS' => [
                'name' => 'Pancreatic Tests',
                'category' => 'Biochemistry',
                'parameters' => [
                    'amylase' => [
                        'name' => 'Amylase',
                        'fullName' => 'Serum Amylase',
                        'unit' => 'U/L',
                        'referenceMin' => 25,
                        'referenceMax' => 125,
                        'criticalHigh' => 500,
                        'description' => 'Pancreatic enzyme',
                    ],
                    'lipase' => [
                        'name' => 'Lipase',
                        'fullName' => 'Serum Lipase',
                        'unit' => 'U/L',
                        'referenceMin' => 10,
                        'referenceMax' => 140,
                        'criticalHigh' => 400,
                        'description' => 'Pancreatic enzyme',
                    ],
                ],
            ],

            // ==================== BONE METABOLISM ====================
            'BONE' => [
                'name' => 'Bone Metabolism',
                'category' => 'Biochemistry',
                'parameters' => [
                    'calcium' => [
                        'name' => 'Calcium',
                        'fullName' => 'Serum Calcium',
                        'unit' => 'mg/dL',
                        'referenceMin' => 8.5,
                        'referenceMax' => 10.5,
                        'criticalLow' => 7.0,
                        'criticalHigh' => 14.0,
                        'description' => 'Total calcium in blood',
                    ],
                    'phosphorus' => [
                        'name' => 'Phosphorus',
                        'fullName' => 'Serum Phosphorus',
                        'unit' => 'mg/dL',
                        'referenceMin' => 2.5,
                        'referenceMax' => 4.5,
                        'criticalLow' => 1.0,
                        'criticalHigh' => 7.0,
                        'description' => 'Phosphate in blood',
                    ],
                    'vitamin_d' => [
                        'name' => 'Vitamin D',
                        'fullName' => '25-Hydroxy Vitamin D',
                        'unit' => 'ng/mL',
                        'deficiencyMax' => 20,
                        'insufficiencyMin' => 20,
                        'insufficiencyMax' => 30,
                        'sufficiencyMin' => 30,
                        'optimalMin' => 30,
                        'optimalMax' => 100,
                        'description' => 'Vitamin D status',
                    ],
                    'pth' => [
                        'name' => 'PTH',
                        'fullName' => 'Parathyroid Hormone',
                        'unit' => 'pg/mL',
                        'referenceMin' => 15,
                        'referenceMax' => 65,
                        'description' => 'Calcium regulation hormone',
                    ],
                ],
            ],
        ];
    }

    /**
     * Get reference range for a specific test code
     *
     * @param string $testCode
     * @return array|null
     */
    public static function getReferenceRange(string $testCode): ?array
    {
        $ranges = self::getAllReferenceRanges();
        return $ranges[strtoupper($testCode)] ?? null;
    }

    /**
     * Get reference range for a specific parameter within a test
     *
     * @param string $testCode
     * @param string $parameter
     * @return array|null
     */
    public static function getParameterRange(string $testCode, string $parameter): ?array
    {
        $testRange = self::getReferenceRange($testCode);

        if (!$testRange || !isset($testRange['parameters'])) {
            return null;
        }

        return $testRange['parameters'][strtolower($parameter)] ?? null;
    }

    /**
     * Check if a value is within normal range
     *
     * @param string $testCode
     * @param string $parameter
     * @param mixed $value
     * @param string $gender Optional gender for sex-specific ranges
     * @return array Result with status and interpretation
     */
    public static function checkValue(
        string $testCode,
        string $parameter,
        $value,
        ?string $gender = null
    ): array {
        $paramRange = self::getParameterRange($testCode, $parameter);

        if (!$paramRange) {
            return [
                'status' => 'unknown',
                'message' => 'Reference range not found for this parameter',
            ];
        }

        // Handle non-numeric values (qualitative tests)
        if (isset($paramRange['referenceValues'])) {
            $isNormal = in_array($value, $paramRange['referenceValues']) ||
                        $value === $paramRange['normalValue'];
            return [
                'status' => $isNormal ? 'normal' : 'abnormal',
                'interpretation' => $isNormal ? 'Normal' : 'Abnormal',
                'message' => $isNormal
                    ? 'Value is within normal range'
                    : 'Value is outside normal range',
            ];
        }

        // Get appropriate reference range based on gender
        $refMin = $paramRange['referenceMin'];
        $refMax = $paramRange['referenceMax'];

        if ($gender && isset($paramRange['referenceMinMale'])) {
            if (strtolower($gender) === 'male') {
                $refMin = $paramRange['referenceMinMale'] ?? $refMin;
                $refMax = $paramRange['referenceMaxMale'] ?? $refMax;
            } elseif (strtolower($gender) === 'female') {
                $refMin = $paramRange['referenceMinFemale'] ?? $refMin;
                $refMax = $paramRange['referenceMaxFemale'] ?? $refMax;
            }
        }

        // Check critical values first
        if (isset($paramRange['criticalLow']) && $value < $paramRange['criticalLow']) {
            return [
                'status' => 'critical_low',
                'interpretation' => 'Critically Low',
                'message' => 'Value is critically low - requires immediate attention',
            ];
        }

        if (isset($paramRange['criticalHigh']) && $value > $paramRange['criticalHigh']) {
            return [
                'status' => 'critical_high',
                'interpretation' => 'Critically High',
                'message' => 'Value is critically high - requires immediate attention',
            ];
        }

        // Check normal range
        if ($value < $refMin) {
            return [
                'status' => 'low',
                'interpretation' => 'Low',
                'message' => 'Value is below normal range',
                'referenceMin' => $refMin,
                'referenceMax' => $refMax,
            ];
        }

        if ($value > $refMax) {
            return [
                'status' => 'high',
                'interpretation' => 'High',
                'message' => 'Value is above normal range',
                'referenceMin' => $refMin,
                'referenceMax' => $refMax,
            ];
        }

        return [
            'status' => 'normal',
            'interpretation' => 'Normal',
            'message' => 'Value is within normal range',
            'referenceMin' => $refMin,
            'referenceMax' => $refMax,
        ];
    }

    /**
     * Get all test categories
     *
     * @return array
     */
    public static function getCategories(): array
    {
        $ranges = self::getAllReferenceRanges();
        $categories = [];

        foreach ($ranges as $testCode => $testData) {
            $category = $testData['category'] ?? 'Other';
            if (!isset($categories[$category])) {
                $categories[$category] = [];
            }
            $categories[$category][] = [
                'code' => $testCode,
                'name' => $testData['name'],
            ];
        }

        return $categories;
    }

    /**
     * Get all test codes
     *
     * @return array
     */
    public static function getAllTestCodes(): array
    {
        $ranges = self::getAllReferenceRanges();
        return array_keys($ranges);
    }

    /**
     * Export reference ranges as JSON
     *
     * @return string
     */
    public static function toJson(): string
    {
        return json_encode(self::getAllReferenceRanges(), JSON_PRETTY_PRINT);
    }
}
