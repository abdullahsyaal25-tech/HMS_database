<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserPermissionsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Check if user has manage-users or manage-permissions permission
        return $user && ($user->hasPermission('manage-users') || $user->hasPermission('manage-permissions'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
            'grant_permissions' => ['nullable', 'array'],
            'grant_permissions.*' => ['integer', 'exists:permissions,id'],
            'revoke_permissions' => ['nullable', 'array'],
            'revoke_permissions.*' => ['integer', 'exists:permissions,id'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'permissions.*.integer' => 'Permission IDs must be valid integers.',
            'permissions.*.exists' => 'One or more selected permissions do not exist.',
            'grant_permissions.*.integer' => 'Permission IDs must be valid integers.',
            'grant_permissions.*.exists' => 'One or more selected permissions to grant do not exist.',
            'revoke_permissions.*.integer' => 'Permission IDs must be valid integers.',
            'revoke_permissions.*.exists' => 'One or more selected permissions to revoke do not exist.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Ensure permissions arrays are unique
        if ($this->has('permissions')) {
            $this->merge([
                'permissions' => array_unique($this->input('permissions', [])),
            ]);
        }
        
        if ($this->has('grant_permissions')) {
            $this->merge([
                'grant_permissions' => array_unique($this->input('grant_permissions', [])),
            ]);
        }
        
        if ($this->has('revoke_permissions')) {
            $this->merge([
                'revoke_permissions' => array_unique($this->input('revoke_permissions', [])),
            ]);
        }
    }
}
