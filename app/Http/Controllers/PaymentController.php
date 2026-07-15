<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Models\Boq;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;

class PaymentController extends Controller
{
    /**
     * Record a payment received against a BOQ.
     */
    public function store(StorePaymentRequest $request, Boq $boq): RedirectResponse
    {
        $boq->payments()->create($request->validated());

        return back()->with('success', 'Payment recorded.');
    }

    /**
     * Remove a recorded payment.
     */
    public function destroy(Payment $payment): RedirectResponse
    {
        $payment->delete();

        return back()->with('success', 'Payment removed.');
    }
}
