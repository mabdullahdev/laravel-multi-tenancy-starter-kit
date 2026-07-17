<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBoqRequest extends FormRequest
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
     * The BOQ builder submits the whole tree in one request: the BOQ header
     * plus a nested array of sections, each with its own array of line items.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['required', Rule::in(['draft', 'finalized'])],
            'notes' => ['nullable', 'string'],

            'sections' => ['present', 'array'],
            'sections.*.name' => ['required', 'string', 'max:255'],

            'sections.*.items' => ['present', 'array'],
            'sections.*.items.*.item_code' => ['nullable', 'string', 'max:255'],
            'sections.*.items.*.description' => ['required', 'string'],
            'sections.*.items.*.unit' => ['required', 'string', 'max:255'],
            'sections.*.items.*.quantity' => ['required', 'numeric', 'min:0'],
            'sections.*.items.*.rate' => ['required', 'numeric', 'min:0'],
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
            'title.required' => 'The BOQ title is required.',
            'sections.*.name.required' => 'Each section needs a name.',
            'sections.*.items.*.description.required' => 'Each line item needs a description.',
            'sections.*.items.*.unit.required' => 'Each line item needs a unit (e.g. bag, m², kg).',
            'sections.*.items.*.quantity.required' => 'Each line item needs a quantity.',
            'sections.*.items.*.rate.required' => 'Each line item needs a rate.',
        ];
    }
}
