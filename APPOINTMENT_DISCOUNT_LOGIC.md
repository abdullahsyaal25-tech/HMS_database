# Appointment Discount Calculation Logic

## Overview
This document explains how discounts and totals are calculated in the DepartmentPrint component.

## IMPORTANT: How Backend Stores Discounts

The backend **COMBINES** both per-service discounts AND the global appointment discount into `final_cost`:

```php
// From AppointmentService.php attachServices()
$serviceDiscount = $customCost * ($discountPercentage / 100);
$globalDiscountPerService = $globalDiscount / count($services);
$totalDiscount = $serviceDiscount + $globalDiscountPerService;
$finalCost = $customCost - $totalDiscount;  // Already includes BOTH discounts!
```

## Data Structure

### Service Item (appointment.services)
Each service has:
- `custom_cost`: Original price before any discounts
- `final_cost`: Price after **BOTH** per-service AND global discounts applied
- `discount_percentage`: Discount % applied to this specific service

### Appointment
- `fee`: Consultation fee (when no services)
- `discount`: Global discount value (percentage or fixed)
- `grand_total`: Final calculated total (from backend)

## Backend Calculation (Source of Truth)

### Grand Total (from Appointment model)
```php
public function getGrandTotalAttribute(): float
{
    if ($this->services->isNotEmpty()) {
        return (float) $this->services->sum('pivot.final_cost');
        // final_cost ALREADY includes both per-service + global discounts
    }
    return max(0, ($this->fee ?? 0) - ($this->discount ?? 0));
}
```

## Frontend Calculation

### 1. Services Subtotal (Original Amount)
```typescript
servicesSubtotal = sum of all service custom_cost
```

### 2. Total Discount (Everything Combined)
```typescript
// The difference between original and final already includes ALL discounts
totalDiscount = servicesSubtotal - servicesFinalTotal
              = sum of (custom_cost - final_cost) for each service
```

### 3. Amount Paid (from Backend)
```typescript
amountPaid = appointment.grand_total  // Use backend value!
```

## Receipt Display Logic (Matches Appointment Form)

### What to Show:
1. **Individual Services**: Show `final_cost` (discounted prices - matches appointment form)
2. **Services Subtotal**: Show `servicesSubtotal` (sum of original prices)
3. **Total Discount**: Show `totalDiscount` (this is ALL discounts combined)
4. **Amount Paid**: Show `grandTotal` from backend

### Example Receipt:
```
Consultation:                400.00  (final_cost - discounted)
Stress Test:                1200.00  (final_cost - discounted)
-----------------------------
Services Subtotal:          2000.00  (sum of original prices)
Total Discount:             -400.00  (all discounts combined)
-----------------------------
Amount Paid:                1600.00
```

### Calculation Verification:
```
1300.08 (Subtotal) - 799.84 (Total Discount) = 500.24 (Amount Paid) ✓
```

## Key Points

1. **Individual services show discounted prices** (`final_cost`) to match the appointment creation form

2. **Services Subtotal shows original total** (`sum of custom_cost`)

3. **Total Discount includes EVERYTHING**:
   - Per-service discounts (from `discount_percentage`)
   - Global appointment discount (from `appointment.discount`)
   - Both are already combined in the `final_cost` value
   - Calculated as: `totalDiscount = servicesSubtotal - servicesFinalTotal`

4. **DO NOT add appointment.discount separately!**
   - It's already included in the `final_cost` calculation

5. **Always use backend `grand_total`** for the final amount to ensure consistency

## Common Issues & Solutions

### Issue: Double-counting discounts
**Cause**: Adding `appointment.discount` to `totalDiscount` when it's already included in `final_cost`
**Solution**: 
```typescript
// WRONG - double counts:
totalDiscount = servicesDiscount + additionalDiscount

// CORRECT - servicesDiscount already includes global discount:
totalDiscount = servicesSubtotal - servicesFinalTotal
```

### Issue: Mismatch between individual services and subtotal
**Cause**: Showing `final_cost` for services but `servicesSubtotal` (sum of `custom_cost`)
**Solution**: Always show `custom_cost` for individual services

### Issue: Modal and print show different amounts
**Cause**: Using different calculations for display vs print
**Solution**: Both should use `grandTotal` from backend
