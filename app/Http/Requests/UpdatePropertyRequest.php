<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePropertyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Location fields
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:10'],
            
            // Pricing fields
            'price' => ['nullable', 'numeric', 'min:0'],
            'security_deposit' => ['nullable', 'numeric', 'min:0'],
            'maintenance_charges' => ['nullable', 'numeric', 'min:0'],
            'price_unit' => ['required', Rule::in(['per_month', 'per_year', 'total'])],
            
            // Property type and status
            'type' => ['required', Rule::in(['rental', 'sale'])],
            'status' => ['required', Rule::in(['available', 'pending', 'sold', 'rented'])],
            'category' => ['required', Rule::in(['house', 'apartment', 'plot'])],
            'sub_category' => ['nullable', Rule::in(['residential', 'commercial', 'agricultural', 'industrial'])],
            
            // Property details
            'bedrooms' => ['required', 'integer', 'min:0'],
            'bathrooms' => ['nullable', 'integer', 'min:0'],
            'square_feet' => ['nullable', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'address' => 'property address',
            'city' => 'city',
            'province' => 'province',
            'postal_code' => 'postal code',
            'price' => 'price',
            'security_deposit' => 'security deposit',
            'maintenance_charges' => 'maintenance charges',
            'price_unit' => 'price unit',
            'type' => 'property type',
            'status' => 'status',
            'category' => 'property category',
            'sub_category' => 'sub category',
            'bedrooms' => 'number of bedrooms',
            'bathrooms' => 'number of bathrooms',
            'square_feet' => 'square feet',
            'description' => 'description',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'address.required' => 'The property address is required.',
            'city.required' => 'The city is required.',
            'type.required' => 'Please select whether this property is for rental or sale.',
            'category.required' => 'Please select the property category.',
            'bedrooms.required' => 'Please specify the number of bedrooms.',
            'bedrooms.min' => 'The number of bedrooms cannot be negative.',
        ];
    }
}

