<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RolePermission;
use App\Models\Permission;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $users = User::select('id', 'name', 'username', 'role', 'created_at', 'updated_at')
                     ->paginate(10);
        
        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Get all available roles from role_permissions table
        $roles = RolePermission::select('role')
                              ->distinct()
                              ->pluck('role');
        
        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|alpha_dash|max:255|unique:users,username',
            'password' => 'required|string|min:8|confirmed',
            'role' => [
                'required',
                'string',
                Rule::in($this->getAvailableRoles())
            ],
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $currentUser = \Illuminate\Support\Facades\Auth::user();
        $user = User::with('rolePermissions.permission')->findOrFail($id);
        
        // Security check: Only users with view-users permission can view user details
        if (!$currentUser->isSuperAdmin() && !$currentUser->hasPermission('view-users')) {
            abort(403, 'Unauthorized to view user details');
        }
        
        // Check if current user can delete this user
        $canDelete = $this->canCurrentUserDelete($currentUser, $user);
        
        // Check if current user can edit this user
        $canEdit = $this->canCurrentUserEdit($currentUser, $user);
        
        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'isSuperAdmin' => $user->isSuperAdmin(),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'rolePermissions' => $user->rolePermissions,
            ],
            'canDelete' => $canDelete,
            'canEdit' => $canEdit,
            'currentUserRole' => $currentUser->role,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $user = User::findOrFail($id);
        
        // Get all available roles from role_permissions table
        $roles = RolePermission::select('role')
                              ->distinct()
                              ->pluck('role');
        
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => [
                'required',
                'string',
                'alpha_dash',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'role' => [
                'required',
                'string',
                Rule::in($this->getAvailableRoles())
            ],
        ]);

        $userData = [
            'name' => $request->name,
            'username' => $request->username,
            'role' => $request->role,
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        // Prevent deletion of own account
        if (\Illuminate\Support\Facades\Auth::check() && $user->id == \Illuminate\Support\Facades\Auth::id()) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }

        // Prevent deletion of Super Admin
        if (!$user->isDeletable()) {
            return redirect()->back()->with('error', 'Super Admin accounts cannot be deleted.');
        }

        // Only Super Admin can delete Sub Super Admin accounts
        if ($user->role === 'Sub Super Admin' && !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
            return redirect()->back()->with('error', 'Only Super Admin can delete Sub Super Admin accounts.');
        }

        $user->delete();

        // Log the deletion
        AuditLog::create([
            'user_id' => \Illuminate\Support\Facades\Auth::id(),
            'user_name' => \Illuminate\Support\Facades\Auth::user()->name,
            'user_role' => \Illuminate\Support\Facades\Auth::user()->role,
            'action' => 'Delete User',
            'description' => "Deleted user {$user->name} (ID: {$user->id}, Role: {$user->role})",
            'module' => 'User Management',
            'severity' => 'high',
            'response_time' => 0.1, // placeholder
            'memory_usage' => 1000000, // placeholder
            'request_method' => 'DELETE',
            'request_url' => request()->fullUrl(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'logged_at' => now(),
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    /**
     * Show the form for editing user permissions.
     */
    public function editPermissions(string $id): Response
    {
        $user = User::with('userPermissions.permission')->findOrFail($id);
        
        // Get all available permissions
        $allPermissions = Permission::all();
        
        // Get permissions currently assigned to the user
        $userPermissionIds = $user->userPermissions->pluck('permission_id')->toArray();
        
        return Inertia::render('Admin/Users/EditPermissions', [
            'user' => $user,
            'allPermissions' => $allPermissions,
            'userPermissionIds' => $userPermissionIds,
        ]);
    }

    /**
     * Update user permissions.
     */
    public function updatePermissions(Request $request, string $id): RedirectResponse
    {
        $user = User::findOrFail($id);
        
        // Clear existing user-specific permissions
        $user->userPermissions()->delete();
        
        // Add new permissions if provided
        if ($request->has('permissions') && is_array($request->permissions)) {
            foreach ($request->permissions as $permissionId) {
                $permission = Permission::find($permissionId);
                if ($permission) {
                    $user->userPermissions()->create([
                        'permission_id' => $permission->id,
                        'granted' => true,
                    ]);
                }
            }
        }
        
        return redirect()->route('admin.users.index')->with('success', 'User permissions updated successfully.');
    }

    /**
     * Check if current user can delete the target user
     */
    private function canCurrentUserDelete($currentUser, $targetUser): bool
    {
        // Cannot delete own account
        if ($currentUser->id === $targetUser->id) {
            return false;
        }
        
        // Super Admin can delete anyone except themselves
        if ($currentUser->isSuperAdmin()) {
            return true;
        }
        
        // Sub Super Admin can delete regular users but not Super Admins
        if ($currentUser->role === 'Sub Super Admin') {
            return !$targetUser->isSuperAdmin();
        }
        
        // Regular admins with manage-users permission can delete non-admin users
        if ($currentUser->hasPermission('manage-users')) {
            return !$targetUser->isSuperAdmin() && $targetUser->role !== 'Sub Super Admin';
        }
        
        return false;
    }
    
    /**
     * Check if current user can edit the target user
     */
    private function canCurrentUserEdit($currentUser, $targetUser): bool
    {
        // Can always edit own account
        if ($currentUser->id === $targetUser->id) {
            return true;
        }
        
        // Super Admin can edit anyone
        if ($currentUser->isSuperAdmin()) {
            return true;
        }
        
        // Sub Super Admin can edit regular users but not Super Admins
        if ($currentUser->role === 'Sub Super Admin') {
            return !$targetUser->isSuperAdmin();
        }
        
        // Regular admins with manage-users permission can edit non-admin users
        if ($currentUser->hasPermission('manage-users')) {
            return !$targetUser->isSuperAdmin() && $targetUser->role !== 'Sub Super Admin';
        }
        
        return false;
    }
    
    /**
     * Get all available roles from the role permissions.
     */
    private function getAvailableRoles(): array
    {
        return RolePermission::select('role')
                             ->distinct()
                             ->pluck('role')
                             ->toArray();
    }
}