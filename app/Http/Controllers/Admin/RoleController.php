<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class RoleController extends Controller
{
    /**
     * Display a listing of all roles.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Allow users with manage-roles permission or super admins
        if (!$user->isSuperAdmin() && !$user->hasPermission('manage-roles')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to view roles.',
            ], Response::HTTP_FORBIDDEN);
        }

        $roles = Role::orderBy('priority', 'desc')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'description' => $role->description,
                    'is_super_admin' => $role->is_super_admin,
                    'is_system' => $role->is_system,
                    'priority' => $role->priority,
                    'users_count' => $role->users()->count(),
                    'created_at' => $role->created_at,
                    'updated_at' => $role->updated_at,
                ];
            });

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(StoreRoleRequest $request)
    {
        $user = $request->user();

        // Allow users with manage-roles permission or super admins
        if (!$user->isSuperAdmin() && !$user->hasPermission('manage-roles')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to create roles.',
            ], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validated();

        // Security check: Prevent creating roles named "Super Admin" or "Sub Super Admin" (case insensitive)
        $forbiddenNames = ['super admin', 'sub super admin'];
        if (in_array(strtolower($validated['name']), $forbiddenNames)) {
            return response()->json([
                'success' => false,
                'message' => 'Creating roles with this name is not allowed.',
                'errors' => [
                    'name' => ['The role name cannot be "Super Admin" or "Sub Super Admin".'],
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Security check: Prevent creating roles with is_super_admin = true unless the current user is a super admin
        $isSuperAdminRequested = isset($validated['is_super_admin']) && $validated['is_super_admin'] === true;
        
        if ($isSuperAdminRequested && !$user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Only super admins can create super admin roles.',
                'errors' => [
                    'is_super_admin' => ['You do not have permission to create super admin roles.'],
                ],
            ], Response::HTTP_FORBIDDEN);
        }

        // Generate slug from name
        $slug = strtolower(str_replace(' ', '-', $validated['name']));

        try {
            DB::beginTransaction();

            $role = Role::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'is_super_admin' => $isSuperAdminRequested ? true : false,
                'is_system' => false,
                'priority' => $this->calculatePriority($validated['name']),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully.',
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'description' => $role->description,
                    'is_super_admin' => $role->is_super_admin,
                    'is_system' => $role->is_system,
                    'priority' => $role->priority,
                    'created_at' => $role->created_at,
                ],
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create role. Please try again.',
                'errors' => [
                    'general' => ['An error occurred while creating the role.'],
                ],
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified role from storage.
     * 
     * Note: This functionality is currently disabled and will be disabled later.
     */
    public function destroy(Request $request, int $id)
    {
        // Functionality disabled - will be implemented later
        return response()->json([
            'success' => false,
            'message' => 'Role deletion is currently disabled.',
        ], Response::HTTP_FORBIDDEN);

        // TODO: Implement role deletion when needed
        // $user = $request->user();
        // 
        // // Allow users with manage-roles permission or super admins
        // if (!$user->isSuperAdmin() && !$user->hasPermission('manage-roles')) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'You do not have permission to delete roles.',
        //     ], Response::HTTP_FORBIDDEN);
        // }
        //
        // $role = Role::findOrFail($id);
        //
        // // Prevent deletion of system roles
        // if ($role->is_system) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'System roles cannot be deleted.',
        //     ], Response::HTTP_FORBIDDEN);
        // }
        //
        // // Prevent deletion of super admin roles
        // if ($role->is_super_admin) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Super admin roles cannot be deleted.',
        //     ], Response::HTTP_FORBIDDEN);
        // }
        //
        // // Check if role has users
        // if ($role->users()->count() > 0) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Cannot delete role with assigned users. Please reassign users first.',
        //     ], Response::HTTP_UNPROCESSABLE_ENTITY);
        // }
        //
        // try {
        //     DB::beginTransaction();
        //     
        //     // Detach all permissions
        //     $role->permissions()->detach();
        //     
        //     $role->delete();
        //
        //     DB::commit();
        //
        //     return response()->json([
        //         'success' => true,
        //         'message' => 'Role deleted successfully.',
        //     ], Response::HTTP_OK);
        // } catch (\Exception $e) {
        //     DB::rollBack();
        //
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Failed to delete role. Please try again.',
        //     ], Response::HTTP_INTERNAL_SERVER_ERROR);
        // }
    }

    /**
     * Calculate priority based on role name.
     * Higher priority for more important roles.
     */
    private function calculatePriority(string $roleName): int
    {
        $name = strtolower($roleName);

        // Higher priority for admin-related roles
        if (str_contains($name, 'admin')) {
            return 100;
        }

        // Medium-high priority for manager roles
        if (str_contains($name, 'manager')) {
            return 80;
        }

        // Medium priority for head/lead roles
        if (str_contains($name, 'head') || str_contains($name, 'lead')) {
            return 60;
        }

        // Lower priority for staff roles
        if (str_contains($name, 'staff')) {
            return 40;
        }

        // Default priority
        return 50;
    }
}
