<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Mail\PaymentReceiptMail;
use App\Models\Boq;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PaymentController extends Controller
{
    /**
     * Record a payment received against a BOQ.
     */
    public function store(StorePaymentRequest $request, Boq $boq): RedirectResponse
    {
        // Payments can only be recorded against a finalized BOQ.
        if ($boq->status !== 'finalized') {
            return back()->withErrors([
                'amount' => 'Payments can only be recorded once the BOQ is finalized.',
            ]);
        }

        $payment = $boq->payments()->create($request->validated());

        return back()->with('success', $this->emailReceipt($boq, $payment));
    }

    /**
     * Email a receipt copy to the client and return a status message.
     */
    private function emailReceipt(Boq $boq, Payment $payment): string
    {
        $client = $boq->project?->client;

        if (! $client || ! $client->email) {
            return 'Payment recorded. No client email on file, so no receipt was sent.';
        }

        try {
            // Queued (PaymentReceiptMail implements ShouldQueue): this returns
            // immediately and a worker renders the PDF and sends the email.
            Mail::to($client->email)->queue(new PaymentReceiptMail($payment));

            return 'Payment recorded. A receipt is being emailed to ' . $client->email . '.';
        } catch (\Throwable $e) {
            // Only fires if the job could not be pushed onto the queue at all.
            Log::error('Payment receipt could not be queued: ' . $e->getMessage());

            return 'Payment recorded, but the receipt email could not be queued.';
        }
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
