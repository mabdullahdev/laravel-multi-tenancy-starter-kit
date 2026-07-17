<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
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
        $contract = $this->route('contract');

        // Cap the payment at the outstanding balance so total paid can never
        // exceed what the client agreed to.
        $due = (float) $contract->balance_due;

        return [
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . $due],
            'paid_on' => ['required', 'date'],
            'method' => ['required', Rule::in(['cash', 'bank_transfer', 'cheque', 'online', 'other'])],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:255'],

            // A payment may settle a scheduled stage, but need not — an ad-hoc
            // payment has no milestone. Scoped to this contract's own schedule so
            // a payment can't be attached to another contract's milestone.
            'contract_milestone_id' => [
                'nullable',
                Rule::exists('contract_milestones', 'id')->where('contract_id', $contract->id),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $contract = $this->route('contract');

        return [
            'amount.required' => 'Enter the amount received.',
            'amount.min' => 'The amount must be greater than zero.',
            'amount.max' => 'The amount exceeds the outstanding balance of '
                . $contract->currency . ' ' . number_format((float) $contract->balance_due, 2) . '.',
            'paid_on.required' => 'Enter the date the payment was received.',
            'contract_milestone_id.exists' => 'That milestone does not belong to this contract.',
        ];
    }
}
