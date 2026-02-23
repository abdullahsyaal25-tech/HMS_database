<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature', 'Integration', 'E2E', 'Unit');

// Add traits for testing methods
uses(
    Illuminate\Foundation\Testing\Concerns\InteractsWithAuthentication::class,
    Illuminate\Foundation\Testing\Concerns\InteractsWithDatabase::class,
    Illuminate\Foundation\Testing\Concerns\MakesHttpRequests::class,
    Illuminate\Foundation\Testing\Concerns\InteractsWithContainer::class,
    Illuminate\Foundation\Testing\Concerns\InteractsWithSession::class,
    Illuminate\Foundation\Testing\Concerns\InteractsWithTime::class,
    Tests\Traits\InteractsWithHMSAuth::class,
    Tests\Traits\CreatesHMSTestData::class,
    Tests\Traits\MockExternalServices::class,
)->in('Feature', 'Integration', 'E2E', 'Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeValidModel', function () {
    return $this->toHave('id')
        ->toHave('created_at')
        ->toHave('updated_at');
});

expect()->extend('toBeSuccessfulApiResponse', function () {
    return $this->status(200, 201)
        ->toHave('message')
        ->not->toHave('errors');
});

expect()->extend('toBePaginatedResponse', function () {
    return $this->toHave('data')
        ->toHave('links')
        ->toHave('meta');
});

expect()->extend('toBeUnauthorizedResponse', function () {
    return $this->status(401)
        ->toHave('message');
});

expect()->extend('toBeForbiddenResponse', function () {
    return $this->status(403)
        ->toHave('message');
});

expect()->extend('toBeNotFoundResponse', function () {
    return $this->status(404)
        ->toHave('message');
});

expect()->extend('toBeValidationErrorResponse', function () {
    return $this->status(422)
        ->toHave('errors');
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/**
 * Create authenticated GET request
 */
function authenticatedGet($user, string $uri, array $headers = [])
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders(array_merge([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ], $headers))
        ->getJson($uri);
}

/**
 * Create authenticated POST request
 */
function authenticatedPost($user, string $uri, array $data = [])
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])
        ->postJson($uri, $data);
}

/**
 * Create authenticated PUT request
 */
function authenticatedPut($user, string $uri, array $data = [])
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])
        ->putJson($uri, $data);
}

/**
 * Create authenticated PATCH request
 */
function authenticatedPatch($user, string $uri, array $data = [])
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])
        ->patchJson($uri, $data);
}

/**
 * Create authenticated DELETE request
 */
function authenticatedDelete($user, string $uri)
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])
        ->deleteJson($uri);
}

/**
 * Create guest (unauthenticated) request
 */
function guestGet(string $uri)
{
    return test()->getJson($uri);
}

function guestPost(string $uri, array $data = [])
{
    return test()->postJson($uri, $data);
}

/**
 * Create test data factories
 */
function createPatient(array $overrides = [])
{
    return \App\Models\Patient::factory()->create($overrides);
}

function createDoctor(array $overrides = [])
{
    return \App\Models\Doctor::factory()->create($overrides);
}

function createAppointment(array $overrides = [])
{
    return \App\Models\Appointment::factory()->create($overrides);
}

function createUser(array $overrides = [])
{
    return \App\Models\User::factory()->create($overrides);
}

function createMedicine(array $overrides = [])
{
    return \App\Models\Medicine::factory()->create($overrides);
}

function createLabTest(array $overrides = [])
{
    return \App\Models\LabTest::factory()->create($overrides);
}

/**
 * Generate fake data for testing
 */
function fakePatientData()
{
    return \App\Models\Patient::factory()->make()->toArray();
}

function fakeDoctorData()
{
    return \App\Models\Doctor::factory()->make()->toArray();
}

function fakeAppointmentData()
{
    return \App\Models\Appointment::factory()->make()->toArray();
}

/**
 * Assert permission denied
 */
function assertPermissionDenied($response)
{
    $response->assertStatus(403)
        ->assertJson([
            'message' => 'Unauthorized. Insufficient permissions.',
        ]);
}

/**
 * Assert unauthenticated
 */
function assertUnauthenticated($response)
{
    $response->assertStatus(401);
}

/**
 * Assert resource not found
 */
function assertNotFound($response)
{
    $response->assertStatus(404)
        ->assertJson([
            'message' => 'Resource not found',
        ]);
}

/**
 * Assert validation error
 */
function assertValidationError($response, array $fields)
{
    $response->assertStatus(422)
        ->assertJsonValidationErrors($fields);
}
