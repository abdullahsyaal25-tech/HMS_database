<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SecurityController extends Controller
{
    /**
     * Update the authenticated user's password
     */
    public function updateOwnPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    /**
     * Update another user's password (admin only)
     */
    public function updateUserPassword(Request $request, User $user): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to manage users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('manage-users')) {
            return response()->json([
                'message' => 'Unauthorized to update other user\'s password'
            ], 403);
        }

        // Prevent updating super admin passwords unless the current user is also a super admin
        if ($user->isSuperAdmin() && !$authenticatedUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Only super admins can update other super admin accounts'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update the user's password
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'message' => 'User password updated successfully'
        ]);
    }

    /**
     * Update another user's username (admin only)
     */
    public function updateUsername(Request $request, User $user): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to manage users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('manage-users')) {
            return response()->json([
                'message' => 'Unauthorized to update other user\'s username'
            ], 403);
        }

        // Prevent updating super admin usernames unless the current user is also a super admin
        if ($user->isSuperAdmin() && !$authenticatedUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Only super admins can update other super admin accounts'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update the user's email/username (using email field as username for now)
        // In Laravel with Fortify, typically email is used as the login field
        // If you want to implement a separate username field, you'd need to modify the migration
        $user->update([
            'email' => $request->username // Assuming email is used as the username/login field
        ]);

        return response()->json([
            'message' => 'Username updated successfully'
        ]);
    }

    /**
     * Get all users for admin management (admin only)
     */
    public function getUsers(Request $request): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to view users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('view-users')) {
            return response()->json([
                'message' => 'Unauthorized to view users'
            ], 403);
        }

        $users = User::select('id', 'name', 'email', 'role')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ];
        });

        return response()->json($users);
    }
}