# Billing System - Database Migration Plan

## Overview

This document provides detailed migration specifications for the enhanced billing system. These migrations should be run in the order specified to maintain database integrity.

---

## Migration 1: Enhance Bills Table

**File:** `database/migrations/2026_02_01_000001_enhance_bills_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            // Invoice and identification
            $table->string('invoice_number')->unique()->nullable()->after('bill_number');
            $table->date('due_date')->nullable()->after('bill_date');
            
            // Financial breakdown
            $table->decimal('total_discount', 10, 2)->default(0.00)->after('discount');
            $table->decimal('total_tax', 10, 2)->default(0.00)->after('tax');
            $table->decimal('balance_due', 10, 2)->default(0.00)->after('amount_due');
            
            // Billing address
            $table->json('billing_address')->nullable()->after('notes');
            
            // Payment tracking
            $table->timestamp('last_payment_date')->nullable()->after('balance_due');
            
            // Reminder tracking
            $table->integer('reminder_sent_count')->default(0)->after('last_payment_date');
            $table->timestamp('reminder_last_sent')->nullable()->after('reminder_sent_count');
            
            // Void tracking
            $table->timestamp('voided_at')->nullable()->after('reminder_last_sent');
            $table->foreignId('voided_by')->nullable()->constrained('users')->after('voided_at');
            $table->text('void_reason')->nullable()->after('voided_by');
            
            // Indexes for performance
            $table->index('invoice_number');
            $table->index('due_date');
            $table->index('payment_status');
            $table->index('status');
            $table->index(['patient_id', 'payment_status']);
            $table->index(['bill_date', 'payment_status']);
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropColumn([
                'invoice_number',
                'due_date',
                'total_discount',
                'total_tax',
                'balance_due',
                'billing_address',
                'last_payment_date',
                'reminder_sent_count',
                'reminder_last_sent',
                'voided_at',
                'voided_by',
                'void_reason',
            ]);
            
            $table->dropIndex(['invoice_number']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['status']);
            $table->dropIndex(['patient_id', 'payment_status']);
            $table->dropIndex(['bill_date', 'payment_status']);
        });
    }
};
```

---

## Migration 2: Enhance Bill Items Table

**File:** `database/migrations/2026_02_01_000002_enhance_bill_items_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bill_items', function (Blueprint $table) {
            // Item source tracking
            $table->enum('item_type', [
                'appointment',
                'lab_test',
                'pharmacy',
                'department_service',
                'manual'
            ])->default('manual')->after('bill_id');
            
            $table->string('source_type')->nullable()->after('item_type'); // App\Models\Appointment, etc.
            $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
            
            // Enhanced pricing
            $table->decimal('discount_amount', 10, 2)->default(0.00)->after('unit_price');
            $table->decimal('discount_percentage', 5, 2)->default(0.00)->after('discount_amount');
            
            // Item categorization
            $table->string('category')->nullable()->after('item_description');
            
            // Indexes
            $table->index(['item_type', 'source_type', 'source_id']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::table('bill_items', function (Blueprint $table) {
            $table->dropColumn([
                'item_type',
                'source_type',
                'source_id',
                'discount_amount',
                'discount_percentage',
                'category',
            ]);
        });
    }
};
```

---

## Migration 3: Create Insurance Providers Table

**File:** `database/migrations/2026_02_01_000003_create_insurance_providers_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_providers', function (Blueprint $table) {
            $table->id();
            
            // Basic info
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            
            // Contact information
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->json('address')->nullable();
            
            // Coverage details
            $table->json('coverage_types')->nullable(); // ['inpatient', 'outpatient', 'pharmacy', 'lab']
            $table->decimal('max_coverage_amount', 12, 2)->nullable();
            
            // API integration (for future)
            $table->string('api_endpoint')->nullable();
            $table->string('api_key')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_providers');
    }
};
```

---

## Migration 4: Create Patient Insurances Table

**File:** `database/migrations/2026_02_01_000004_create_patient_insurances_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_insurances', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('insurance_provider_id')->constrained()->onDelete('cascade');
            
            // Policy details
            $table->string('policy_number');
            $table->string('policy_holder_name');
            $table->string('relationship_to_patient')->default('self'); // self, spouse, child, parent
            
            // Coverage period
            $table->date('coverage_start_date');
            $table->date('coverage_end_date')->nullable();
            
            // Co-pay details
            $table->decimal('co_pay_amount', 10, 2)->default(0.00);
            $table->decimal('co_pay_percentage', 5, 2)->default(0.00);
            $table->decimal('deductible_amount', 10, 2)->default(0.00);
            $table->decimal('deductible_met', 10, 2)->default(0.00);
            
            // Coverage limits
            $table->decimal('annual_max_coverage', 12, 2)->nullable();
            $table->decimal('annual_used_amount', 12, 2)->default(0.00);
            
            // Priority
            $table->boolean('is_primary')->default(false);
            $table->integer('priority_order')->default(1);
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->unique(['patient_id', 'policy_number']);
            $table->index(['patient_id', 'is_active']);
            $table->index(['insurance_provider_id', 'is_active']);
            $table->index('policy_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_insurances');
    }
};
```

---

## Migration 5: Create Payments Table

**File:** `database/migrations/2026_02_01_000005_create_payments_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            
            // Relationship
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            
            // Payment details
            $table->enum('payment_method', [
                'cash',
                'card',
                'insurance',
                'bank_transfer',
                'mobile_money',
                'check'
            ]);
            $table->decimal('amount', 10, 2);
            $table->dateTime('payment_date');
            
            // Transaction details
            $table->string('transaction_id')->nullable();
            $table->string('reference_number')->nullable();
            $table->string('card_last_four')->nullable();
            $table->string('card_type')->nullable(); // visa, mastercard, etc.
            $table->string('bank_name')->nullable();
            $table->string('check_number')->nullable();
            
            // For cash payments
            $table->decimal('amount_tendered', 10, 2)->nullable();
            $table->decimal('change_due', 10, 2)->nullable();
            
            // For insurance payments
            $table->foreignId('insurance_claim_id')->nullable()->constrained()->onDelete('set null');
            
            // User tracking
            $table->foreignId('received_by')->constrained('users');
            
            // Notes
            $table->text('notes')->nullable();
            
            // Status
            $table->enum('status', ['completed', 'pending', 'failed', 'refunded'])->default('completed');
            
            $table->timestamps();
            
            // Indexes
            $table->index('bill_id');
            $table->index('payment_method');
            $table->index('payment_date');
            $table->index('transaction_id');
            $table->index('status');
            $table->index(['bill_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
```

---

## Migration 6: Create Insurance Claims Table

**File:** `database/migrations/2026_02_01_000006_create_insurance_claims_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_claims', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_insurance_id')->constrained()->onDelete('cascade');
            
            // Claim identification
            $table->string('claim_number')->unique();
            
            // Financial details
            $table->decimal('claim_amount', 10, 2);
            $table->decimal('approved_amount', 10, 2)->nullable();
            $table->decimal('deductible_amount', 10, 2)->default(0.00);
            $table->decimal('co_pay_amount', 10, 2)->default(0.00);
            
            // Status tracking
            $table->enum('status', [
                'draft',
                'pending',
                'submitted',
                'under_review',
                'approved',
                'partial_approved',
                'rejected',
                'appealed'
            ])->default('draft');
            
            // Dates
            $table->date('submission_date')->nullable();
            $table->date('response_date')->nullable();
            $table->date('approval_date')->nullable();
            
            // Rejection details
            $table->text('rejection_reason')->nullable();
            $table->json('rejection_codes')->nullable();
            
            // Documents
            $table->json('documents')->nullable(); // Array of file paths
            
            // Notes
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            
            // User tracking
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->foreignId('processed_by')->nullable()->constrained('users');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('bill_id');
            $table->index('patient_insurance_id');
            $table->index('claim_number');
            $table->index('status');
            $table->index('submission_date');
            $table->index(['status', 'submission_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_claims');
    }
};
```

---

## Migration 7: Create Bill Refunds Table

**File:** `database/migrations/2026_02_01_000007_create_bill_refunds_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_refunds', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            $table->foreignId('payment_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('bill_item_id')->nullable()->constrained()->onDelete('set null');
            
            // Refund details
            $table->decimal('refund_amount', 10, 2);
            $table->enum('refund_type', ['full', 'partial', 'item'])->default('partial');
            $table->text('refund_reason');
            $table->dateTime('refund_date');
            
            // Refund method
            $table->enum('refund_method', [
                'cash',
                'card',
                'bank_transfer',
                'check'
            ]);
            $table->string('reference_number')->nullable();
            
            // Approval workflow
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'processed'
            ])->default('pending');
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Processing
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->timestamp('processed_at')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('bill_id');
            $table->index('payment_id');
            $table->index('status');
            $table->index('refund_date');
            $table->index(['bill_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_refunds');
    }
};
```

---

## Migration 8: Create Bill Status History Table

**File:** `database/migrations/2026_02_01_000008_create_bill_status_history_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_status_history', function (Blueprint $table) {
            $table->id();
            
            // Relationship
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            
            // Status change
            $table->string('status_from')->nullable();
            $table->string('status_to');
            $table->string('field_name')->default('payment_status'); // payment_status, status, etc.
            
            // User and reason
            $table->foreignId('changed_by')->constrained('users');
            $table->text('reason')->nullable();
            
            // Additional data
            $table->json('metadata')->nullable();
            
            $table->timestamp('created_at');
            
            // Indexes
            $table->index('bill_id');
            $table->index('status_to');
            $table->index('changed_by');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_status_history');
    }
};
```

---

## Migration 9: Create Billing Settings Table

**File:** `database/migrations/2026_02_01_000009_create_billing_settings_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_settings', function (Blueprint $table) {
            $table->id();
            
            // General settings
            $table->string('setting_key')->unique();
            $table->text('setting_value')->nullable();
            $table->string('data_type')->default('string'); // string, integer, float, boolean, json
            $table->string('group')->default('general');
            
            // Description
            $table->string('label');
            $table->text('description')->nullable();
            
            // UI hints
            $table->string('input_type')->default('text'); // text, number, select, checkbox, textarea
            $table->json('options')->nullable(); // For select inputs
            
            $table->timestamps();
            
            // Indexes
            $table->index('setting_key');
            $table->index('group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_settings');
    }
};
```

---

## Migration 10: Add Insurance to Bills Table

**File:** `database/migrations/2026_02_01_000010_add_insurance_to_bills_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            // Insurance relationship
            $table->foreignId('primary_insurance_id')
                ->nullable()
                ->constrained('patient_insurances')
                ->after('created_by')
                ->onDelete('set null');
            
            // Insurance amounts
            $table->decimal('insurance_claim_amount', 10, 2)
                ->default(0.00)
                ->after('total_tax');
            $table->decimal('insurance_approved_amount', 10, 2)
                ->nullable()
                ->after('insurance_claim_amount');
            $table->decimal('patient_responsibility', 10, 2)
                ->default(0.00)
                ->after('insurance_approved_amount');
            
            // Indexes
            $table->index('primary_insurance_id');
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropForeign(['primary_insurance_id']);
            $table->dropColumn([
                'primary_insurance_id',
                'insurance_claim_amount',
                'insurance_approved_amount',
                'patient_responsibility',
            ]);
        });
    }
};
```

---

## Migration Order Summary

| Order | Migration | Purpose |
|-------|-----------|---------|
| 1 | enhance_bills_table | Add new columns to existing bills |
| 2 | enhance_bill_items_table | Add item source tracking |
| 3 | create_insurance_providers_table | Insurance companies |
| 4 | create_patient_insurances_table | Patient policies |
| 5 | create_payments_table | Payment records |
| 6 | create_insurance_claims_table | Claim tracking |
| 7 | create_bill_refunds_table | Refund records |
| 8 | create_bill_status_history_table | Audit trail |
| 9 | create_billing_settings_table | Configuration |
| 10 | add_insurance_to_bills_table | Insurance relationships |

---

## Default Data Seeding

### Billing Settings Seeder

**File:** `database/seeders/BillingSettingsSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BillingSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'setting_key' => 'currency',
                'setting_value' => 'USD',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Currency',
                'description' => 'Default currency for billing',
                'input_type' => 'text',
            ],
            [
                'setting_key' => 'currency_symbol',
                'setting_value' => '$',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Currency Symbol',
                'description' => 'Symbol to display for currency',
                'input_type' => 'text',
            ],
            [
                'setting_key' => 'tax_rate',
                'setting_value' => '0',
                'data_type' => 'float',
                'group' => 'tax',
                'label' => 'Default Tax Rate (%)',
                'description' => 'Default tax rate percentage',
                'input_type' => 'number',
            ],
            [
                'setting_key' => 'invoice_prefix',
                'setting_value' => 'INV-',
                'data_type' => 'string',
                'group' => 'invoice',
                'label' => 'Invoice Number Prefix',
                'description' => 'Prefix for invoice numbers',
                'input_type' => 'text',
            ],
            [
                'setting_key' => 'payment_terms_days',
                'setting_value' => '30',
                'data_type' => 'integer',
                'group' => 'invoice',
                'label' => 'Payment Terms (Days)',
                'description' => 'Number of days until payment is due',
                'input_type' => 'number',
            ],
            [
                'setting_key' => 'enable_payment_reminders',
                'setting_value' => 'true',
                'data_type' => 'boolean',
                'group' => 'notifications',
                'label' => 'Enable Payment Reminders',
                'description' => 'Send automatic payment reminders',
                'input_type' => 'checkbox',
            ],
            [
                'setting_key' => 'reminder_days',
                'setting_value' => json_encode([7, 3, 1]),
                'data_type' => 'json',
                'group' => 'notifications',
                'label' => 'Reminder Days',
                'description' => 'Days before due date to send reminders',
                'input_type' => 'text',
            ],
            [
                'setting_key' => 'enable_pdf_invoices',
                'setting_value' => 'true',
                'data_type' => 'boolean',
                'group' => 'invoice',
                'label' => 'Enable PDF Invoices',
                'description' => 'Generate PDF invoices',
                'input_type' => 'checkbox',
            ],
            [
                'setting_key' => 'refund_approval_required',
                'setting_value' => 'true',
                'data_type' => 'boolean',
                'group' => 'refunds',
                'label' => 'Refund Approval Required',
                'description' => 'Require approval for refunds',
                'input_type' => 'checkbox',
            ],
            [
                'setting_key' => 'max_refund_amount',
                'setting_value' => '1000',
                'data_type' => 'float',
                'group' => 'refunds',
                'label' => 'Maximum Refund Amount',
                'description' => 'Maximum amount that can be refunded without special approval',
                'input_type' => 'number',
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('billing_settings')->updateOrInsert(
                ['setting_key' => $setting['setting_key']],
                $setting
            );
        }
    }
}
```

---

## Rollback Strategy

In case of issues, migrations can be rolled back in reverse order:

```bash
# Rollback all billing migrations
php artisan migrate:rollback --path=database/migrations/2026_02_01_000010_add_insurance_to_bills_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000009_create_billing_settings_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000008_create_bill_status_history_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000007_create_bill_refunds_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000006_create_insurance_claims_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000005_create_payments_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000004_create_patient_insurances_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000003_create_insurance_providers_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000002_enhance_bill_items_table.php
php artisan migrate:rollback --path=database/migrations/2026_02_01_000001_enhance_bills_table.php
```

---

*Document Version: 1.0*
*Last Updated: 2026-02-01*
