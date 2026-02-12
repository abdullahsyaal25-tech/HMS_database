# HMS Test Suite Documentation

## Overview

This document describes the comprehensive test suite for the Hospital Management System (HMS). The test suite includes **unit tests**, **integration tests**, **feature tests**, and **end-to-end (E2E) tests** covering all aspects of the application.

## Test Architecture

```
tests/
├── Unit/                    # Unit tests for individual components
│   ├── Authentication/      # User authentication unit tests
│   └── Services/            # Service layer unit tests
├── Integration/             # Integration tests for module interactions
├── Feature/                 # Feature/API endpoint tests
│   ├── Api/
│   │   ├── Patients/
│   │   ├── Appointments/
│   │   ├── Billing/
│   │   ├── Pharmacy/
│   │   ├── Laboratory/
│   │   └── Dashboard/
│   └── Concurrent/          # Race condition and concurrency tests
├── E2E/                     # End-to-end workflow tests
└── Traits/                  # Shared test traits and helpers
```

## Test Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Authentication | 95% |
| Patient Management | 90% |
| Appointments | 90% |
| Billing & Payments | 90% |
| Pharmacy | 85% |
| Laboratory | 85% |
| RBAC/Permissions | 95% |
| **Overall** | **90%** |

## Running Tests

### Prerequisites

- PHP 8.2+
- MySQL 8.0
- Composer dependencies installed
- npm dependencies installed

### Local Test Execution

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Unit
php artisan test --testsuite=Integration
php artisan test --testsuite=Feature

# Run with coverage report
php artisan test --coverage-html coverage/

# Run with parallel execution
php artisan test --parallel --processes=4

# Run specific test file
php artisan test tests/Unit/Services/Billing/BillCalculationServiceTest.php

# Run specific test
php artisan test --filter="test_should_calculate_subtotal"

# Run tests matching pattern
php artisan test --filter="Billing"
```

### Environment Configuration

Create `.env.testing` for test environment:

```env
APP_ENV=testing
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hms_test
DB_USERNAME=root
DB_PASSWORD=root
CACHE_DRIVER=array
SESSION_DRIVER=array
QUEUE_CONNECTION=sync
```

## Test Categories

### 1. Unit Tests

Unit tests verify individual components in isolation.

**Location**: `tests/Unit/`

**Examples**:
- [`tests/Unit/Services/Billing/BillCalculationServiceTest.php`](tests/Unit/Services/Billing/BillCalculationServiceTest.php) - Business logic calculations
- [`tests/Unit/Services/RBACServiceTest.php`](tests/Unit/Services/RBACServiceTest.php) - Permission checks
- [`tests/Unit/Services/AppointmentServiceTest.php`](tests/Unit/Services/AppointmentServiceTest.php) - Appointment scheduling logic

**Best Practices**:
- Test one behavior per test
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

### 2. Integration Tests

Integration tests verify interactions between components.

**Location**: `tests/Integration/`

**Examples**:
- [`tests/Integration/Authentication/LoginApiTest.php`](tests/Integration/Authentication/LoginApiTest.php) - Authentication flows

### 3. Feature Tests

Feature tests verify complete API endpoints and business workflows.

**Location**: `tests/Feature/Api/`

**Modules**:
- [`tests/Feature/Api/Patients/PatientApiTest.php`](tests/Feature/Api/Patients/PatientApiTest.php)
- [`tests/Feature/Api/Appointments/AppointmentApiTest.php`](tests/Feature/Api/Appointments/AppointmentApiTest.php)
- [`tests/Feature/Api/Billing/BillingApiTest.php`](tests/Feature/Api/Billing/BillingApiTest.php)
- [`tests/Feature/Api/Pharmacy/PharmacyApiTest.php`](tests/Feature/Api/Pharmacy/PharmacyApiTest.php)
- [`tests/Feature/Api/Laboratory/LaboratoryApiTest.php`](tests/Feature/Api/Laboratory/LaboratoryApiTest.php)

**Test Scenarios**:
- CRUD operations
- Validation rules
- Authorization checks
- Error handling
- Pagination
- Filtering and searching

### 4. End-to-End (E2E) Tests

E2E tests verify complete user workflows.

**Location**: `tests/E2E/`

**Examples**:
- [`tests/E2E/PatientAppointmentWorkflowTest.php`](tests/E2E/PatientAppointmentWorkflowTest.php) - Complete patient journey

### 5. Concurrent Tests

Tests for race conditions and concurrency.

**Location**: `tests/Feature/Concurrent/`

**Examples**:
- Double booking prevention
- Stock update atomicity
- Payment processing consistency

## Test Traits

### InteractsWithHMSAuth

Provides authentication helpers for different user roles:

```php
use Tests\Traits\InteractsWithHMSAuth;

beforeEach(function () {
    $this->actingAsAdmin();
    $this->actingAsDoctor();
    $this->actingAsPatient();
});
```

### CreatesHMSTestData

Provides factory methods for creating test data:

```php
use Tests\Traits\CreatesHMSTestData;

beforeEach(function () {
    $this->createBaseTestData();
    $this->patient = $this->createPatient();
    $this->doctor = $this->createDoctor();
});
```

### MockExternalServices

Mocks external services for testing:

```php
use Tests\Traits\MockExternalServices;

beforeEach(function () {
    $this->mockHttpClient();
    $this->mockMailer();
    $this->mockQueue();
});
```

## CI/CD Pipeline

### GitHub Actions Workflow

**Location**: `.github/workflows/test.yml`

The CI pipeline includes:

1. **Test Suite** - Runs all test types with MySQL
2. **Code Quality** - PHPStan, PHP CS Fixer, Pint
3. **Security Scan** - Composer audit, sensitive data detection
4. **Performance Tests** - Load and performance benchmarks

### Automated Execution

Tests run on:
- Every push to `main` or `develop`
- Every pull request
- Daily scheduled run (2:00 AM UTC)

### Coverage Reports

Coverage reports are generated and:
- Uploaded as artifacts
- Checked against 90% threshold
- Published to Codecov (optional)

## Writing New Tests

### Test Naming Convention

Use descriptive names following Pest conventions:

```php
it('should_calculate_subtotal_for_multiple_items', function () {
    // Test code
});

describe('calculateSubtotal', function () {
    it('should_calculate_subtotal_for_single_item', function () {
        // Test code
    });
});
```

### Test Structure

```php
describe('Feature Name', function () {
    beforeEach(function () {
        // Setup code
    });

    describe('POST /endpoint', function () {
        it('should_create_resource_successfully', function () {
            // Arrange
            $data = [...];

            // Act
            $response = $this->postJson('/api/v1/resource', $data);

            // Assert
            $response->assertStatus(201)
                ->assertJson(['key' => 'value']);
        });

        it('should_validate_required_fields', function () {
            $response = $this->postJson('/api/v1/resource', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['field1', 'field2']);
        });
    });
});
```

### Common Assertions

```php
// Response status
$response->assertStatus(200);
$response->assertOk();
$response->assertCreated();
$response->assertAccepted();
$response->assertBadRequest();
$response->assertUnauthorized();
$response->assertForbidden();
$response->assertNotFound();
$response->assertUnprocessable();

// JSON structure
$response->assertJsonStructure(['data', 'meta']);
$response->assertJsonPath('data.id', $id);
$response->assertJson(['key' => 'value']);

// Validation errors
$response->assertJsonValidationErrors(['field']);

// Database
$this->assertDatabaseHas('table', ['field' => 'value']);
$this->assertDatabaseMissing('table', ['field' => 'value']);
$this->assertCount(5, $collection);
```

## Test Data Management

### Factories

Use factories for creating test data:

```php
// In tests
Patient::factory()->create(['name' => 'John']);
Doctor::factory()->count(10)->create();

// Custom factory methods
$this->createPatientWithAppointments(5);
$this->createFullyPaidBill();
```

### Database Seeding

```bash
# Seed with performance test data
php artisan db:seed --class=PerformanceTestSeeder
```

## Performance Testing

### Running Performance Tests

```bash
php artisan test --testsuite=Performance
```

### Performance Benchmarks

| Operation | Target Time |
|-----------|-------------|
| Single API request | < 500ms |
| List endpoint (20 items) | < 1s |
| Search query (200 records) | < 2s |
| Bulk create (100 records) | < 30s |

## Troubleshooting

### Common Issues

**MySQL Connection Failed**
```bash
# Ensure MySQL is running
sudo systemctl status mysql

# Create test database
mysql -u root -p -e "CREATE DATABASE hms_test;"
```

**Memory Limit Exceeded**
```bash
php artisan test --memory-limit=512M
```

**Slow Tests**
```bash
# Run without coverage
php artisan test --no-coverage

# Run in parallel
php artisan test --parallel
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Fast Tests**: Keep unit tests fast (< 100ms)
3. **Clear Names**: Test names should describe behavior
4. **Single Concern**: One assertion per test when possible
5. **Meaningful Data**: Use realistic test data
6. **Clean Fixtures**: Reset state between tests
7. **Edge Cases**: Test boundary conditions
8. **Negative Tests**: Verify error handling

## Coverage Requirements

- Minimum 90% overall coverage
- 100% coverage on critical paths:
  - Authentication/Authorization
  - Payment processing
  - Permission checks
- All API endpoints must have:
  - Success scenarios
  - Validation error scenarios
  - Authorization error scenarios
