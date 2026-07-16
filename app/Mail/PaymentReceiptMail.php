<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceiptMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** Retry a few times to ride out transient SMTP hiccups. */
    public $tries = 3;

    /** Seconds to wait between retries. */
    public $backoff = 30;

    public function __construct(public Payment $payment)
    {
        // Note: relations are loaded lazily in receiptData() rather than here,
        // because a queued mailable only serializes the model's key — eager loads
        // set in the constructor would be lost when the job is processed.
    }

    public function envelope(): Envelope
    {
        $boq = $this->payment->boq;

        return new Envelope(
            subject: 'Payment Receipt — ' . $boq->title . ' (Rev ' . $boq->revision . ')',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-receipt',
            with: $this->receiptData(),
        );
    }

    /**
     * Attach a formal PDF copy of the receipt.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $pdf = $this->renderReceiptPdf();

        return [
            Attachment::fromData(fn () => $pdf, $this->filename())
                ->withMime('application/pdf'),
        ];
    }

    private function filename(): string
    {
        return 'receipt-' . $this->receiptNo() . '.pdf';
    }

    private function receiptNo(): string
    {
        return 'RCPT-' . str_pad((string) $this->payment->id, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Shared data for both the email body and the PDF.
     *
     * @return array<string, mixed>
     */
    private function receiptData(): array
    {
        // Ensure the tree is loaded (runs inside the queue worker at send time).
        $this->payment->loadMissing('boq.project.client', 'boq.payments');

        $boq = $this->payment->boq;

        return [
            'payment' => $this->payment,
            'boq' => $boq,
            'project' => $boq->project,
            'client' => $boq->project->client,
            'companyName' => config('app.name'),
            'currency' => $boq->currency,
            'total' => $boq->total_amount,
            'paid' => $boq->total_paid,
            'due' => $boq->balance_due,
            'generatedAt' => now()->format('d M Y'),
            'receiptNo' => $this->receiptNo(),
        ];
    }

    /**
     * Render the receipt as a PDF and return the raw bytes.
     */
    private function renderReceiptPdf(): string
    {
        $logo = public_path('logo.svg');

        $html = view('pdf.receipt', array_merge($this->receiptData(), [
            'logoPath' => is_file($logo) ? $logo : null,
        ]))->render();

        $mpdf = new \Mpdf\Mpdf([
            'tempDir' => storage_path('app/mpdf-temp'),
            'format' => 'A4',
            'margin_top' => 14,
            'margin_bottom' => 16,
            'margin_left' => 12,
            'margin_right' => 12,
        ]);
        $mpdf->WriteHTML($html);

        return $mpdf->Output('', \Mpdf\Output\Destination::STRING_RETURN);
    }
}
