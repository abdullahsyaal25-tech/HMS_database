<?php
$files = [
    'resources/js/types/pharmacy.ts',
    'resources/js/types/medicine.ts',
    'resources/js/lib/validation.ts',
    'resources/js/Pages/Pharmacy/Stock/Valuation.tsx',
    'resources/js/Pages/Pharmacy/Sales/Show.tsx',
    'resources/js/Pages/Pharmacy/Sales/SalesDashboard.tsx',
    'resources/js/Pages/Pharmacy/Sales/Receipt.tsx',
    'resources/js/Pages/Pharmacy/Sales/Create.tsx',
    'resources/js/Pages/Pharmacy/Reports/StockReport.tsx',
    'resources/js/Pages/Pharmacy/Purchases/Create.tsx',
    'resources/js/Pages/Pharmacy/Reports/ExpiryReport.tsx',
    'resources/js/Pages/Pharmacy/Medicines/Index.tsx',
    'resources/js/Pages/Pharmacy/Medicines/Edit.tsx',
    'resources/js/components/pharmacy/Cart.tsx',
    'resources/js/components/pharmacy/MedicineSearch.tsx',
    'resources/js/components/pharmacy/MedicineCard.tsx'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $newContent = str_replace('unit_price', 'sale_price', $content);
        file_put_contents($file, $newContent);
        echo "Processed: $file\n";
    } else {
        echo "Not found: $file\n";
    }
}
echo "Done!\n";
