<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TestPharmacyPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:permissions 
                            {role? : Specific role name to test (default: Pharmacy)}
                            {--category= : Filter by category (pharmacy|laboratory|appointment|all)}
                            {--format= : Output format (text|json)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test and display role permissions from both tables (Pharmacy, Laboratory, Appointment)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $roleName = $this->argument('role') ?? 'Pharmacy';
        $category = $this->option('category') ?? 'all';
        $format = $this->option('format') ?? 'text';

        // Map common role names to search terms
        $searchTerms = $this->getSearchTerms($roleName);

        // Find roles matching the search terms
        $roles = Role::where(function ($query) use ($searchTerms) {
            foreach ($searchTerms as $term) {
                $query->orWhere('name', 'like', '%' . $term . '%')
                    ->orWhere('slug', 'like', '%' . strtolower($term) . '%');
            }
        })->get();

        if ($roles->isEmpty()) {
            $this->error("No role found matching '{$roleName}'.");
            $this->info("Available roles in the system:");
            $allRoles = Role::all();
            foreach ($allRoles as $role) {
                $this->line("  - {$role->name} (slug: {$role->slug}, id: {$role->id})");
            }
            return Command::FAILURE;
        }

        $results = [];

        foreach ($roles as $role) {
            $roleData = $this->getRolePermissions($role, $category);
            $results[] = $roleData;

            // Display in text format
            if ($format === 'text') {
                $this->displayTextOutput($role, $roleData, $category);
            }
        }

        // Display JSON if requested
        if ($format === 'json') {
            $this->line(json_encode($results, JSON_PRETTY_PRINT));
        }

        return Command::SUCCESS;
    }

    /**
     * Get search terms for role matching
     */
    protected function getSearchTerms(string $roleName): array
    {
        $roleNameLower = strtolower($roleName);
        
        // Map role names to search terms
        $mapping = [
            'pharmacy' => ['Pharmacy', 'Pharmacist'],
            'laboratory' => ['Laboratory', 'Lab'],
            'appointment' => ['Appointment', 'Reception'],
            'admin' => ['Admin'],
            'doctor' => ['Doctor'],
            'patient' => ['Patient'],
        ];

        foreach ($mapping as $key => $terms) {
            if (str_contains($roleNameLower, $key)) {
                return $terms;
            }
        }

        return [$roleName];
    }

    /**
     * Get all permissions for a role filtered by category
     */
    protected function getRolePermissions($role, string $category): array
    {
        // NEW NORMALIZED TABLE: role_permission_mappings
        $normalizedPermissions = DB::table('role_permission_mappings')
            ->where('role_id', $role->id)
            ->join('permissions', 'role_permission_mappings.permission_id', '=', 'permissions.id')
            ->select('permissions.*')
            ->get();

        // LEGACY TABLE: role_permissions
        $legacyPermissions = DB::table('role_permissions')
            ->where('role', $role->name)
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->select('permissions.*')
            ->get();

        // Filter by category if specified
        $allFilteredPermissions = $this->filterByCategory($normalizedPermissions, $legacyPermissions, $category);

        // All related permissions in system for this category
        $categoryPermissions = $this->getAllCategoryPermissions($category);

        return [
            'name' => $role->name,
            'slug' => $role->slug,
            'id' => $role->id,
            'description' => $role->description,
            'priority' => $role->priority,
            'normalized_permissions' => $normalizedPermissions->toArray(),
            'legacy_permissions' => $legacyPermissions->toArray(),
            'normalized_count' => $normalizedPermissions->count(),
            'legacy_count' => $legacyPermissions->count(),
            'combined_count' => $normalizedPermissions->merge($legacyPermissions)->unique('id')->count(),
            'filtered_permissions' => $allFilteredPermissions->toArray(),
            'filtered_count' => $allFilteredPermissions->count(),
            'all_category_permissions' => $categoryPermissions->toArray(),
            'all_category_permissions_count' => $categoryPermissions->count(),
        ];
    }

    /**
     * Filter permissions by category
     */
    protected function filterByCategory($normalized, $legacy, string $category)
    {
        $combined = $normalized->merge($legacy)->unique('id');

        if ($category === 'all') {
            return $combined;
        }

        $filters = [
            'pharmacy' => ['pharmacy', 'medicine', 'prescription'],
            'laboratory' => ['laboratory', 'lab', 'test-result', 'quality-control'],
            'appointment' => ['appointment', 'queue'],
        ];

        $filterTerms = $filters[$category] ?? [$category];

        return $combined->filter(function ($perm) use ($filterTerms) {
            foreach ($filterTerms as $term) {
                if (str_contains(strtolower($perm->module), $term) ||
                    str_contains(strtolower($perm->category), $term) ||
                    str_contains(strtolower($perm->name), $term) ||
                    str_contains(strtolower($perm->resource), $term)) {
                    return true;
                }
            }
            return false;
        });
    }

    /**
     * Get all permissions in the system for a category
     */
    protected function getAllCategoryPermissions(string $category)
    {
        if ($category === 'all') {
            return Permission::all();
        }

        $filters = [
            'pharmacy' => ['pharmacy', 'medicine', 'prescription'],
            'laboratory' => ['laboratory', 'lab', 'test-result', 'quality-control'],
            'appointment' => ['appointment', 'queue'],
        ];

        $filterTerms = $filters[$category] ?? [$category];

        return Permission::where(function ($query) use ($filterTerms) {
            foreach ($filterTerms as $term) {
                $query->orWhere('module', 'like', '%' . $term . '%')
                    ->orWhere('category', 'like', '%' . $term . '%')
                    ->orWhere('name', 'like', '%' . $term . '%')
                    ->orWhere('resource', 'like', '%' . $term . '%');
            }
        })->get();
    }

    /**
     * Display output in text format
     */
    protected function displayTextOutput($role, $roleData, string $category)
    {
        $categoryDisplay = strtoupper($category);
        
        $this->newLine();
        $this->line("═══════════════════════════════════════════════════════════════");
        $this->info("  📋 ROLE: {$role->name}");
        $this->line("  ────────────────────────────────────────────────────────────────");
        $this->line("     Slug: {$role->slug}");
        $this->line("     ID: {$role->id}");
        $this->line("     Description: " . ($role->description ?? 'N/A'));
        $this->line("     Priority: " . ($role->priority ?? 'N/A'));
        $this->line("═══════════════════════════════════════════════════════════════");
        $this->newLine();

        // NEW TABLE
        $this->info("━━━ TABLE: role_permission_mappings ━━━");
        if (empty($roleData['normalized_permissions'])) {
            $this->warn("  No permissions found in role_permission_mappings table.");
        } else {
            $this->line("  Total: {$roleData['normalized_count']} permission(s)");
            $this->newLine();
            
            $grouped = collect($roleData['normalized_permissions'])->groupBy('category');
            foreach ($grouped as $cat => $permissions) {
                $this->info("  📁 {$cat}");
                foreach ($permissions as $perm) {
                    $this->line("     ├── {$perm->name}");
                    $this->line("     │      Slug: {$perm->slug}");
                    $this->line("     │      Module: {$perm->module}");
                    $this->line("     │      Risk Level: {$perm->risk_level}");
                    $this->newLine();
                }
            }
        }

        // LEGACY TABLE
        $this->info("━━━ TABLE: role_permissions (Legacy) ━━━");
        if (empty($roleData['legacy_permissions'])) {
            $this->warn("  No permissions found in role_permissions table.");
        } else {
            $this->line("  Total: {$roleData['legacy_count']} permission(s)");
            $this->newLine();
            
            $grouped = collect($roleData['legacy_permissions'])->groupBy('category');
            foreach ($grouped as $cat => $permissions) {
                $this->info("  📁 {$cat}");
                foreach ($permissions as $perm) {
                    $this->line("     ├── {$perm->name}");
                    $this->line("     │      Slug: {$perm->slug}");
                    $this->line("     │      Module: {$perm->module}");
                    $this->line("     │      Risk Level: {$perm->risk_level}");
                    $this->newLine();
                }
            }
        }

        // FILTERED PERMISSIONS FOR CATEGORY
        if ($category !== 'all') {
            $this->info("━━━ {$categoryDisplay} PERMISSIONS FOR THIS ROLE ━━━");
            if (empty($roleData['filtered_permissions'])) {
                $this->warn("  No {$categoryDisplay} permissions assigned to this role.");
            } else {
                $this->line("  Total: {$roleData['filtered_count']} permission(s)");
                $this->newLine();
                
                $grouped = collect($roleData['filtered_permissions'])->groupBy('category');
                foreach ($grouped as $cat => $permissions) {
                    $this->info("  📁 {$cat}");
                    foreach ($permissions as $perm) {
                        $this->line("     ├── {$perm->name}");
                        $this->line("     │      Action: {$perm->action}");
                        $this->line("     │      Resource: {$perm->resource}");
                        $this->newLine();
                    }
                }
            }
        }

        // SUMMARY
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("  📊 SUMMARY FOR: {$role->name}");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->line("  • From role_permission_mappings: {$roleData['normalized_count']}");
        $this->line("  • From role_permissions: {$roleData['legacy_count']}");
        $this->line("  • Combined unique: " . ($roleData['normalized_count'] + $roleData['legacy_count']));
        if ($category !== 'all') {
            $this->line("  • {$categoryDisplay} permissions: {$roleData['filtered_count']}");
        }
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->newLine();

        // ALL CATEGORY PERMISSIONS IN SYSTEM
        if ($category !== 'all') {
            $this->info("━━━ ALL {$categoryDisplay} PERMISSIONS IN SYSTEM ━━━");
            $this->line("  Found {$roleData['all_category_permissions_count']} {$categoryDisplay}-related permission(s):");
            $this->newLine();

            $grouped = collect($roleData['all_category_permissions'])->groupBy('category');
            foreach ($grouped as $cat => $permissions) {
                $this->info("  📁 {$cat}");
                foreach ($permissions as $perm) {
                    $this->line("     ├── {$perm->name}");
                    $this->newLine();
                }
            }
        }

        $this->newLine();
        $this->info("═══════════════════════════════════════════════════════════════");
        $this->info("   ✅ TEST COMPLETE");
        $this->info("═══════════════════════════════════════════════════════════════");
    }
}
