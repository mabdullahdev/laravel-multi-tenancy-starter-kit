<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContractRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Fill in the columns that are non-nullable but optional on the form.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'currency' => $this->currency ?: 'PKR',
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['theka_per_sqft', 'dihari'])],

            // Only a per-sqft theka prices off area × rate, so these are required
            // for that type and left null for any other.
            'billable_area_sqft' => ['nullable', 'required_if:type,theka_per_sqft', 'numeric', 'min:0'],
            'rate_per_sqft' => ['nullable', 'required_if:type,theka_per_sqft', 'numeric', 'min:0'],
            'quality_tier' => ['nullable', Rule::in(['basic', 'standard', 'premium'])],

            'currency' => ['required', 'string', 'size:3'],
            'signed_on' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['draft', 'active', 'completed'])],
            'notes' => ['nullable', 'string'],
            'payment_terms' => ['nullable', 'string'],
            'exclusions' => ['nullable', 'string'],

            // Add-ons are submitted as a whole list and replace the existing one.
            // addons_amount is derived from these, never posted directly.
            'addons' => ['present', 'array'],
            'addons.*.name' => ['required', 'string', 'max:255'],
            'addons.*.unit' => ['required', 'string', 'max:255'],
            'addons.*.quantity' => ['required', 'numeric', 'min:0'],
            'addons.*.rate' => ['required', 'numeric', 'min:0'],

            // The payment schedule is submitted as a whole list and replaces the
            // existing one. A milestone is either a percentage of the contract or
            // a flat amount.
            'milestones' => ['present', 'array'],
            'milestones.*.name' => ['required', 'string', 'max:255'],
            'milestones.*.percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'milestones.*.amount' => ['nullable', 'numeric', 'min:0'],
            'milestones.*.due_on' => ['nullable', 'date'],
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
            'title.required' => 'The contract title is required — e.g. "Grey Structure" or "Turnkey".',
            'billable_area_sqft.required_if' => 'A per-sqft theka needs the area it is billed on.',
            'rate_per_sqft.required_if' => 'A per-sqft theka needs a rate per sqft.',
            'addons.*.name.required' => 'Each add-on needs a name.',
            'addons.*.unit.required' => 'Each add-on needs a unit (e.g. lump sum, sqft).',
            'addons.*.quantity.required' => 'Each add-on needs a quantity.',
            'addons.*.rate.required' => 'Each add-on needs a rate.',
            'milestones.*.name.required' => 'Each milestone needs a name.',
            'milestones.*.percentage.max' => 'A milestone cannot be more than 100% of the contract.',
        ];
    }
}
