<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PatientSearchTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_search_patients_by_first_name()
    {
        Patient::factory()->create(['first_name' => 'John', 'father_name' => 'Doe']);
        Patient::factory()->create(['first_name' => 'Jane', 'father_name' => 'Smith']);
        Patient::factory()->create(['first_name' => 'Johnny', 'father_name' => 'Appleseed']);

        $results = Patient::searchByName('John')->get();

        $this->assertCount(2, $results);
        $this->assertTrue($results->contains('first_name', 'John'));
        $this->assertTrue($results->contains('first_name', 'Johnny'));
    }

    /** @test */
    public function it_can_search_patients_by_father_name()
    {
        Patient::factory()->create(['first_name' => 'John', 'father_name' => 'Michael']);
        Patient::factory()->create(['first_name' => 'Jane', 'father_name' => 'David']);
        Patient::factory()->create(['first_name' => 'Bob', 'father_name' => 'Michael']);

        $results = Patient::searchByName('Michael')->get();

        $this->assertCount(2, $results);
        $this->assertTrue($results->every(fn ($patient) => $patient->father_name === 'Michael'));
    }

    /** @test */
    public function it_sanitizes_wildcard_characters_in_search_term()
    {
        Patient::factory()->create(['first_name' => 'John', 'father_name' => 'Doe']);
        Patient::factory()->create(['first_name' => 'Test%Value', 'father_name' => 'Test']);
        Patient::factory()->create(['first_name' => 'Test_Value', 'father_name' => 'Test']);

        // Search for literal % character - should only match the patient with % in name
        $results = Patient::searchByName('%')->get();
        $this->assertCount(1, $results);
        $this->assertEquals('Test%Value', $results->first()->first_name);

        // Search for literal _ character - should only match the patient with _ in name
        $results = Patient::searchByName('_')->get();
        $this->assertCount(1, $results);
        $this->assertEquals('Test_Value', $results->first()->first_name);

        // Search for literal \ character
        Patient::factory()->create(['first_name' => 'Test\\Value', 'father_name' => 'Test']);
        $results = Patient::searchByName('\\')->get();
        $this->assertCount(1, $results);
        $this->assertEquals('Test\\Value', $results->first()->first_name);
    }

    /** @test */
    public function it_handles_sql_injection_attempt_in_search_term()
    {
        Patient::factory()->create(['first_name' => 'John', 'father_name' => 'Doe']);
        Patient::factory()->create(['first_name' => 'Jane', 'father_name' => 'Smith']);

        // Attempt SQL injection via LIKE wildcards
        $maliciousInput = "'; DROP TABLE patients; --";

        // This should not cause any errors and should return no results
        // rather than executing the malicious query
        $results = Patient::searchByName($maliciousInput)->get();

        // The query should execute safely and return empty results
        // (since no patient name contains the malicious string)
        $this->assertEmpty($results);

        // Verify the patients table still exists and has data
        $this->assertDatabaseCount('patients', 2);
    }

    /** @test */
    public function it_handles_multiple_wildcard_characters_in_search_term()
    {
        Patient::factory()->create(['first_name' => 'John%Doe', 'father_name' => 'Test']);
        Patient::factory()->create(['first_name' => 'Jane_Smith', 'father_name' => 'Test']);
        Patient::factory()->create(['first_name' => 'John\\Smith', 'father_name' => 'Test']);
        Patient::factory()->create(['first_name' => 'Normal Name', 'father_name' => 'Test']);

        // Search for multiple special characters
        $results = Patient::searchByName('%_\\')->get();

        // Should match only the patients with those exact special characters
        $this->assertCount(3, $results);
    }

    /** @test */
    public function it_returns_ordered_results()
    {
        Patient::factory()->create(['first_name' => 'Zoe', 'father_name' => 'Anderson']);
        Patient::factory()->create(['first_name' => 'Alice', 'father_name' => 'Anderson']);
        Patient::factory()->create(['first_name' => 'Bob', 'father_name' => 'Anderson']);

        $results = Patient::searchByName('Anderson')->get();

        $this->assertCount(3, $results);
        // Results should be ordered by ID (default)
        $this->assertEquals('Zoe', $results->first()->first_name);
    }
}
