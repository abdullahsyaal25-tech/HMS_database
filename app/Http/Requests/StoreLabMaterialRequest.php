<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLabMaterialRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->hasPermission('create-lab-materials');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'lab_test_id' => 'nullable|exists:lab_tests,id',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|string|in:active,low_stock,out_of_stock',
            'reorder_level' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'cost_per_unit' => 'required|numeric|min:0',
            'supplier' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date|after_or_equal:today',
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Material name is required.',
            'name.string' => 'Material name must be a string.',
            'name.max' => 'Material name cannot exceed 255 characters.',
            'quantity.required' => 'Quantity is required.',
            'quantity.integer' => 'Quantity must be a whole number.',
            'quantity.min' => 'Quantity cannot be negative.',
            'lab_test_id.exists' => 'The selected lab test does not exist.',
            'description.max' => 'Description cannot exceed 1000 characters.',
            'status.required' => 'Status is required.',
            'status.in' => 'Please select a valid status.',
            'reorder_level.required' => 'Reorder level is required.',
            'reorder_level.integer' => 'Reorder level must be a whole number.',
            'reorder_level.min' => 'Reorder level cannot be negative.',
            'unit.required' => 'Unit of measurement is required.',
            'unit.string' => 'Unit must be a string.',
            'unit.max' => 'Unit cannot exceed 50 characters.',
            'cost_per_unit.required' => 'Cost per unit is required.',
            'cost_per_unit.numeric' => 'Cost per unit must be a number.',
            'cost_per_unit.min' => 'Cost per unit cannot be negative.',
            'supplier.string' => 'Supplier must be a string.',
            'supplier.max' => 'Supplier name cannot exceed 255 characters.',
            'expiry_date.date' => 'Please provide a valid expiry date.',
            'expiry_date.after_or_equal' => 'Expiry date must be today or in the future.',
        ];
    }
}
