# HMS Code Review - Implementation Tasks

## Overview
This document breaks down the code review findings into actionable tasks organized by priority and category. Each task is designed to be implemented independently.

---

## CRITICAL ISSUES (Week 1)

### Task 1.1: Fix SQL Injection in Patient Model
**File**: `app/Models/Patient.php`
**Priority**: Critical
**Estimated Time**: 1 hour

**Description**: Fix the vulnerable LIKE query in `scopeSearchByName` method.

**Changes Required**:
```php
// Current (VULNERABLE)
public function scopeSearchByName($query, string $name)
{
    return $query->where(function ($q) use ($name) {
        $q->where('first_name', 'like', "%{$name}%")
          ->orWhere('father_name', 'like', "%{$name}%");
    });
}

// Fixed (SAFE)
public function scopeSearchByName($query, string $name)
{
    $sanitizedName = '%' . addcslashes($name, '%_\\') . '%';
    return $query->where(function ($q) use ($sanitizedName) {
        $q->where('first_name', 'like', $sanitizedName)
          ->orWhere('father_name', 'like', $sanitizedName);
    });
}
```

**Testing**: Write unit test to verify SQL injection is not possible.

---

### Task 1.2: Add Authentication to Public API Endpoint
**File**: `routes/api.php`
**Priority**: Critical
**Estimated Time**: 30 minutes

**Description**: Add authentication middleware to the public billing endpoint.

**Changes Required**:
```php
// Current (INSECURE)
Route::prefix('billing')->group(function () {
    Route::get('/all/items', [BillController::class, 'getAllItems']);
});

// Fixed (SECURE)
Route::middleware(['auth:sanctum'])->prefix('billing')->group(function () {
    Route::get('/all/items', [BillController::class, 'getAllItems']);
});
```

---

### Task 1.3: Remove/Protect Debug Auth Endpoint
**File**: `routes/api.php`
**Priority**: Critical
**Estimated Time**: 15 minutes

**Description**: Either remove the debug endpoint or protect it with proper authentication.

**Option A - Remove entirely**:
```php
// Remove lines 107-127
```

**Option B - Protect in development only**:
```php
Route::middleware(['auth:sanctum', 'dev-only'])->get('/debug/auth', function () {
    // Limited debug info without sensitive data
    return response()->json([
        'authenticated' => auth()->check(),
        'user_id' => auth()->id(),
    ]);
});
```

---

### Task 1.4: Enable Session Encryption
**File**: `config/session.php`
**Priority**: Critical
**Estimated Time**: 10 minutes

**Description**: Enable session encryption for security.

**Changes Required**:
```php
// Current
encrypt' => env('SESSION_ENCRYPT', false),

// Fixed
encrypt' => env('SESSION_ENCRYPT', true),
```

**Additional**: Update `.env.example` to include:
```
SESSION_ENCRYPT=true
```

---

### Task 1.5: Strengthen Password Generation
**File**: `app/Http/Controllers/Patient/PatientController.php`
**Priority**: Critical
**Estimated Time**: 15 minutes

**Description**: Use Laravel's built-in password generator for better security.

**Changes Required**:
```php
// Current
'password' => bcrypt(\Illuminate\Support\Str::random(12)),

// Fixed
'password' => bcrypt(\Illuminate\Support\Str::password(16, true, true, true, true)),
```

---

## HIGH PRIORITY ISSUES (Month 1)

### Task 2.1: Fix N+1 Query in PatientController
**File**: `app/Http/Controllers/Patient/PatientController.php`
**Priority**: High
**Estimated Time**: 2 hours

**Description**: Optimize billing history queries to avoid N+1 problems.

**Changes Required**:
1. Use eager loading properly
2. Avoid nested loops for transactions
3. Add database indexes

**Code Changes**:
```php
public function show(string $id): Response
{
    $patient = Patient::with('user')->findOrFail($id);
    
    // Use proper eager loading
    $bills = Bill::where('patient_id', $patient->id)
        ->with(['items', 'payments', 'primaryInsurance.insuranceProvider'])
        ->withCount(['payments as completed_payments_sum' => function($query) {
            $query->where('status', 'completed');
        }])
        ->latest()
        ->get();
    
    // Process transactions efficiently
    $recentTransactions = $bills->flatMap(function ($bill) {
        $transactions = [];
        
        // Add bill
        $transactions[] = [
            'type' => 'bill',
            'title' => "Bill #{$bill->bill_number}",
            'amount' => $bill->total_amount,
            'date' => $bill->bill_date,
            'status' => $bill->payment_status,
        ];
        
        // Add payments (limited to 3 per bill)
        foreach ($bill->payments->take(3) as $payment) {
            $transactions[] = [
                'type' => 'payment',
                'title' => "Payment for Bill #{$bill->bill_number}",
                'amount' => $payment->amount,
                'date' => $payment->payment_date,
                'status' => $payment->status,
            ];
        }
        
        return $transactions;
    })->sortByDesc('date')->take(10)->values();
    
    // ... rest of method
}
```

---

### Task 2.2: Add IDOR Protection
**File**: `app/Http/Controllers/Patient/PatientController.php`
**Priority**: High
**Estimated Time**: 1 hour

**Description**: Add ownership verification to patient data access.

**Changes Required**:
```php
public function show(string $id): Response
{
    $patient = Patient::with('user')->findOrFail($id);
    
    if (!$this->userCanAccessPatient($patient)) {
        abort(403, 'Unauthorized access to patient record');
    }
    // ... rest of method
}

private function userCanAccessPatient(Patient $patient): bool
{
    $user = auth()->user();
    
    if (!$user) {
        return false;
    }
    
    // Super admin can access all
    if ($user->isSuperAdmin()) {
        return true;
    }
    
    // Users with broad permissions
    if ($user->hasPermission('view-all-patients')) {
        return true;
    }
    
    // Owner access (for patient portals)
    if ($patient->user_id === $user->id) {
        return true;
    }
    
    // Check specific department access
    return $user->hasPermission('view-patients');
}
```

---

### Task 2.3: Add Rate Limiting Middleware
**File**: `app/Http/Middleware/LoginThrottleMiddleware.php`
**Priority**: High
**Estimated Time**: 1.5 hours

**Description**: Implement enhanced rate limiting with exponential backoff.

**Changes Required**:
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class LoginThrottleMiddleware
{
    protected const MAX_ATTEMPTS = 5;
    protected const DECAY_MINUTES = 15;
    protected const MAX_LOCKOUT_HOURS = 24;

    public function handle(Request $request, Closure $next): Response
    {
        $key = $this->resolveSignature($request);
        
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);
            
            return response()->json([
                'message' => 'Too many login attempts. Please try again in ' . 
                             ceil($seconds / 60) . ' minutes.',
                'retry_after' => $seconds,
                'retry_after_minutes' => ceil($seconds / 60),
            ], 429);
        }
        
        RateLimiter::hit($key, self::DECAY_MINUTES * 60);
        
        $response = $next($request);
        
        // Reset on successful login
        if ($response->getStatusCode() === 200) {
            RateLimiter::clear($key);
        }
        
        return $response;
    }
    
    protected function resolveSignature(Request $request): string
    {
        return sha1($request->ip() . '|' . $request->userAgent());
    }
}
```

---

### Task 2.4: Secure Frontend Token Storage
**File**: `resources/js/composables/useApi.ts`
**Priority**: High
**Estimated Time**: 2 hours

**Description**: Replace localStorage with HttpOnly cookies for token storage.

**Changes Required**:
1. Remove localStorage/sessionStorage token storage
2. Use Sanctum's built-in cookie authentication
3. Update API client to work with cookies

```typescript
// Updated useApi.ts - Remove token storage
const getToken = useCallback((): string | null => {
    // Tokens are now handled via cookies by Sanctum
    return null;
}, [])

// Remove setToken and removeToken functions or make them no-ops
```

**Backend Changes**: Ensure Sanctum is configured to use cookies:
```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),
```

---

### Task 2.5: Add Content Security Policy
**File**: `app/Http/Middleware/HandleInertiaRequests.php`
**Priority**: High
**Estimated Time**: 1 hour

**Description**: Add CSP headers to prevent XSS attacks.

**Changes Required**:
```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    
    $cspConfig = config('csp', [
        'default-src' => "'self'",
        'script-src' => "'self' 'unsafe-inline' 'unsafe-eval'",
        'style-src' => "'self' 'unsafe-inline'",
        'img-src' => "'self' data: https:",
        'connect-src' => "'self'",
        'frame-ancestors' => "'none'",
    ]);
    
    $cspHeader = implode('; ', array_map(
        fn($key, $value) => "{$key} {$value}",
        array_keys($cspConfig),
        array_values($cspConfig)
    ));
    
    $response->headers->set('Content-Security-Policy', $cspHeader);
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('X-Frame-Options', 'DENY');
    $response->headers->set('X-XSS-Protection', '1; mode=block');
    
    return $response;
}
```

---

### Task 2.6: Fix Verbose Error Messages
**File**: `app/Http/Controllers/Billing/BillController.php`
**Priority**: High
**Estimated Time**: 30 minutes

**Description**: Sanitize error messages in production.

**Changes Required**:
```php
public function index(Request $request): Response|JsonResponse
{
    try {
        // ... query logic
    } catch (Exception $e) {
        Log::error('Error fetching bills', ['error' => $e->getMessage()]);
        
        $userMessage = config('app.debug') 
            ? 'Failed to fetch bills: ' . $e->getMessage()
            : 'Failed to fetch billing information. Please try again later.';
        
        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => $userMessage,
            ], 500);
        }
        
        return Inertia::render('Billing/Index', [
            'bills' => [],
            'error' => $userMessage,
        ]);
    }
}
```

---

### Task 2.7: Fix Authorization in BillController
**File**: `app/Http/Controllers/Billing/BillController.php`
**Priority**: High
**Estimated Time**: 1 hour

**Description**: Move authorization checks before data loading.

**Changes Required**:
```php
public function edit(Request $request, string $id): Response|JsonResponse|RedirectResponse
{
    // First check authorization
    $this->authorize('edit-bills');
    
    // Then load data
    $bill = Bill::with(['patient', 'doctor', 'items', 'primaryInsurance'])->findOrFail($id);
    
    // Verify access to specific bill
    if (!$this->canAccessBill($bill)) {
        abort(403, 'Unauthorized access to this bill');
    }
    // ... rest of method
}

private function canAccessBill(Bill $bill): bool
{
    $user = auth()->user();
    
    return $user->isSuperAdmin() || 
           $user->hasPermission('edit-all-bills') ||
           $bill->created_by === $user->id;
}
```

---

### Task 2.8: Add Transaction to Bill Calculations
**File**: `app/Services/Billing/BillCalculationService.php`
**Priority**: High
**Estimated Time**: 1 hour

**Description**: Ensure all bill calculations use atomic transactions.

**Changes Required**:
```php
public function calculateTotals(Bill $bill): array
{
    return DB::transaction(function () use ($bill) {
        // Load bill items if not already loaded
        if (!$bill->relationLoaded('items')) {
            $bill->load('items');
        }
        
        // ... all calculation logic
        
        // Log after successful transaction
        $this->auditLogService->logActivity(
            'Bill Totals Calculated',
            'Billing',
            // Use non-sensitive summary
            "Bill #{$bill->bill_number} totals calculated",
            'info'
        );
        
        return [/* results */];
    });
}
```

---

### Task 2.9: Add Input Sanitization
**File**: `app/Http/Controllers/Patient/PatientController.php`
**Priority**: High
**Estimated Time**: 1 hour

**Description**: Sanitize user inputs to prevent XSS.

**Changes Required**:
```php
use Illuminate\Support\Str;

public function store(Request $request)
{
    $validated = $request->validate([
        'first_name' => 'nullable|string|max:255|sanitize_html',
        'father_name' => 'nullable|string|max:255|sanitize_html',
        // ... other rules
    ]);
    
    // Additional sanitization
    $sanitized = [
        'first_name' => strip_tags($request->first_name),
        'father_name' => strip_tags($request->father_name),
        'phone' => preg_replace('/[^0-9+]/', '', $request->phone),
        'address' => strip_tags($request->address ?? ''),
    ];
    
    // ... rest of method
}
```

---

### Task 2.10: Add Missing Database Indexes
**File**: `database/migrations/`
**Priority**: High
**Estimated Time**: 1 hour

**Description**: Create migration for missing indexes.

**Changes Required**:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Patients table indexes
        Schema::table('patients', function (Blueprint $table) {
            $table->index('patient_id');
            $table->index(['user_id', 'created_at']);
        });
        
        // Bills table indexes
        Schema::table('bills', function (Blueprint $table) {
            $table->index(['patient_id', 'payment_status']);
            $table->index(['bill_number']);
            $table->index(['created_by', 'created_at']);
        });
        
        // Appointments table indexes
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['patient_id', 'appointment_date']);
            $table->index(['doctor_id', 'status']);
        });
    }
    
    public function down(): void
    {
        // Drop indexes
    }
};
```

---

### Task 2.11: Add Missing Request Validation
**File**: `app/Http/Requests/StorePatientRequest.php`
**Priority**: High
**Estimated Time**: 30 minutes

**Description**: Create proper Form Request class.

**Changes Required**:
```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermission('create-patients') 
            || $this->user()->isSuperAdmin();
    }
    
    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255|sanitize_html',
            'father_name' => 'nullable|string|max:255|sanitize_html',
            'email' => 'required|email|unique:patients,email|unique:users,username',
            'phone' => 'required|string|max:20|regex:/^[0-9+]+$/',
            'age' => 'nullable|integer|min:0|max:150',
            'gender' => 'nullable|in:male,female,other',
        ];
    }
    
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
```

---

### Task 2.12: Add API Rate Limiting Headers
**File**: `app/Http/Middleware/LoginThrottleMiddleware.php`
**Priority**: High
**Estimated Time**: 30 minutes

**Description**: Add standard rate limit headers.

**Changes Required**:
```php
public function handle(Request $request, Closure $next): Response
{
    $key = $this->resolveSignature($request);
    $maxAttempts = self::MAX_ATTEMPTS;
    $attemptsLeft = $maxAttempts - RateLimiter::attempts($key);
    
    $response = $next($request);
    
    $response->headers->set('X-RateLimit-Limit', $maxAttempts);
    $response->headers->set('X-RateLimit-Remaining', max(0, $attemptsLeft));
    $response->headers->set('X-RateLimit-Reset', 
        RateLimiter::availableIn($key) + time());
    
    return $response;
}
```

---

## MEDIUM PRIORITY ISSUES (Quarter 1)

### Task 3.1: Standardize Model Protection
**Files**: `app/Models/*.php`
**Priority**: Medium
**Estimated Time**: 3 hours

**Description**: Change all models to use `$guarded` instead of `$fillable`.

---

### Task 3.2: Add Comprehensive Unit Tests
**Files**: `tests/Unit/`
**Priority**: Medium
**Estimated Time**: 8 hours

**Description**: Add unit tests for:
- BillCalculationService
- PatientService
- RBACService

---

### Task 3.3: Implement Caching Strategy
**Files**: `app/Services/*.php`
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Add caching for:
- Patient lists
- Doctor lists
- Department services
- Permission lookups

---

### Task 3.4: Add PHPDoc Documentation
**Files**: `app/Services/*.php`
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Add comprehensive PHPDoc blocks to all service classes.

---

### Task 3.5: Clean Up Unused Code
**Files**: Multiple
**Priority**: Medium
**Estimated Time**: 2 hours

**Description**:
- Remove unused imports
- Remove dead code
- Remove duplicate logic

---

### Task 3.6: Standardize Error Responses
**Files**: `app/Http/Controllers/*.php`
**Priority**: Medium
**Estimated Time**: 3 hours

**Description**: Create base controller with standardized error handling.

---

### Task 3.7: Add Repository Pattern
**Files**: `app/Repositories/*.php`
**Priority**: Medium
**Estimated Time**: 8 hours

**Description**: Create repository layer for:
- PatientRepository
- BillRepository
- AppointmentRepository

---

### Task 3.8: Implement Feature Flags
**Files**: `config/features.php`, `app/Providers/`
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Add feature flag system for gradual rollouts.

---

### Task 3.9: Add API Versioning
**Files**: `routes/api.php`, `app/Http/Controllers/API/`
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Implement API versioning strategy.

---

### Task 3.10: Add Query Result Caching
**Files**: `app/Services/*.php`
**Priority**: Medium
**Estimated Time**: 3 hours

**Description**: Implement SmartCacheService for frequently accessed data.

---

### Task 3.11: Add Model Observers
**Files**: `app/Observers/*.php`
**Priority**: Medium
**Estimated Time**: 3 hours

**Description**: Implement observers for:
- PatientObserver
- BillObserver
- UserObserver

---

### Task 3.12: Add Performance Monitoring
**Files**: `app/Http/Middleware/PerformanceMonitoringMiddleware.php`
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Integrate APM for performance tracking.

---

## LOW PRIORITY ISSUES (Ongoing)

### Task 4.1: Code Style Enforcement
**Files**: `.php-cs-fixer.php`, `eslint.config.js`
**Priority**: Low
**Estimated Time**: 2 hours

---

### Task 4.2: Add Type Hints
**Files**: All PHP files
**Priority**: Low
**Estimated Time**: 6 hours

---

### Task 4.3: Move Configuration to Files
**Files**: `app/Services/*.php`
**Priority**: Low
**Estimated Time**: 2 hours

---

### Task 4.4: Add Event Listeners
**Files**: `app/Providers/EventServiceProvider.php`
**Priority**: Low
**Estimated Time**: 3 hours

---

### Task 4.5: Implement Lazy Loading
**Files**: `resources/js/Pages/*.tsx`
**Priority**: Low
**Estimated Time**: 2 hours

---

### Task 4.6: Add Integration Tests
**Files**: `tests/Integration/`
**Priority**: Low
**Estimated Time**: 8 hours

---

## Task Dependencies

```
Week 1 (Critical)
├── Task 1.1: SQL Injection Fix
├── Task 1.2: API Auth
├── Task 1.3: Debug Endpoint
├── Task 1.4: Session Encryption
└── Task 1.5: Password Strength

Month 1 (High Priority)
├── Task 2.1: N+1 Queries
├── Task 2.2: IDOR Protection
├── Task 2.3: Rate Limiting
├── Task 2.4: Token Storage
├── Task 2.5: CSP Headers
├── Task 2.6: Error Messages
├── Task 2.7: Authorization
├── Task 2.8: Transactions
├── Task 2.9: Input Sanitization
├── Task 2.10: Database Indexes
├── Task 2.11: Request Validation
└── Task 2.12: Rate Limit Headers

Quarter 1 (Medium Priority)
├── Task 3.1: Model Protection
├── Task 3.2: Unit Tests
├── Task 3.3: Caching
├── Task 3.4: Documentation
├── Task 3.5: Code Cleanup
├── Task 3.6: Error Standardization
├── Task 3.7: Repository Pattern
├── Task 3.8: Feature Flags
├── Task 3.9: API Versioning
├── Task 3.10: Query Caching
├── Task 3.11: Model Observers
└── Task 3.12: Performance Monitoring
```

---

## Delegation Guide

| Mode | Tasks |
|------|-------|
| Code Mode | Tasks 1.1-1.5, 2.1-2.12, 3.1-3.12 |
| Debug Mode | Task 2.3 (rate limiting), 3.2 (unit tests) |
| Review Mode | All tasks for PR reviews |
| Ask Mode | Task 3.7 (architecture decisions) |

---

## Progress Tracking

| Task | Status | Assignee | Due Date | Notes |
|------|--------|----------|----------|-------|
| 1.1 | Pending | - | - | - |
| 1.2 | Pending | - | - | - |
| 1.3 | Pending | - | - | - |
| 1.4 | Pending | - | - | - |
| 1.5 | Pending | - | - | - |
| 2.1 | Pending | - | - | - |
| 2.2 | Pending | - | - | - |
| ... | ... | ... | ... | ... |
