<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Mail\PaymentReceiptMail;
use App\Models\Contract;
use App\Models\ContractMilestone;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PaymentController extends Controller
{
    /**
     * Record a payment received against a contract.
     */
    public function store(StorePaymentRequest $request, Contract $contract): RedirectResponse
    {
        // A draft contract has not been agreed with the client yet, so there is
        // nothing for a payment to settle.
        if ($contract->status === 'draft') {
            return back()->withErrors([
                'amount' => 'Payments can only be recorded once the contract is active.',
            ]);
        }

        $payment = $contract->payments()->create($request->validated());

        $this->settleMilestone($payment);

        return back()->with('success', $this->emailReceipt($contract, $payment));
    }

    /**
     * Mark a milestone paid once its payments cover its amount.
     */
    private function settleMilestone(Payment $payment): void
    {
        $milestone = $payment->milestone;

        if (! $milestone) {
            return;
        }

        // Within a paisa of the amount counts as settled.
        $paid = (float) $milestone->payments()->sum('amount');

        if ($paid + 0.01 >= (float) $milestone->amount) {
            $milestone->update(['status' => 'paid']);
        }
    }

    /**
     * Email a receipt copy to the client and return a status message.
     */
    private function emailReceipt(Contract $contract, Payment $payment): string
    {
        $client = $contract->project?->client;

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
        $milestone = $payment->milestone;

        $payment->delete();

        // Removing a payment can take a milestone back below its amount.
        if ($milestone) {
            $this->unsettleMilestone($milestone);
        }

        return back()->with('success', 'Payment removed.');
    }

    /**
     * Walk a milestone back from paid if its remaining payments no longer cover it.
     */
    private function unsettleMilestone(ContractMilestone $milestone): void
    {
        $paid = (float) $milestone->payments()->sum('amount');

        if ($paid + 0.01 < (float) $milestone->amount && $milestone->status === 'paid') {
            $milestone->update(['status' => $milestone->isBilled() ? 'invoiced' : 'pending']);
        }
    }
}
