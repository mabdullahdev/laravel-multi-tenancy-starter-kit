<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        * { font-family: sans-serif; }
        body { color: #1f2937; font-size: 10pt; }

        .letterhead { width: 100%; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 14px; }
        .letterhead td { vertical-align: middle; }
        .brand-logo { width: 46px; }
        .brand-name { font-size: 16pt; font-weight: bold; color: #111827; padding-left: 10px; }
        .doc-title { text-align: right; font-size: 15pt; font-weight: bold; letter-spacing: 1px; color: #111827; }
        .doc-subtitle { text-align: right; font-size: 8.5pt; color: #6b7280; }

        .meta { width: 100%; margin-bottom: 16px; }
        .meta td { padding: 2px 0; font-size: 9.5pt; }
        .meta .label { color: #6b7280; width: 90px; }
        .meta .value { font-weight: bold; color: #111827; padding-right: 24px; }

        table.detail { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.detail th { background: #f3f4f6; color: #374151; font-size: 8.5pt; text-transform: uppercase;
            text-align: left; padding: 6px 8px; border-bottom: 1px solid #d1d5db; }
        table.detail td { padding: 8px; border-bottom: 0.5px solid #e5e7eb; font-size: 10pt; }

        .received { width: 100%; margin: 6px 0 18px; }
        .received .box { background: #111827; color: #ffffff; padding: 10px 14px; }
        .received .r-label { font-size: 9pt; color: #d1d5db; }
        .received .r-value { font-size: 15pt; font-weight: bold; }

        .summary { width: 60%; border-collapse: collapse; }
        .summary td { padding: 4px 8px; font-size: 9.5pt; }
        .summary .s-label { color: #6b7280; }
        .summary .s-value { text-align: right; font-weight: bold; }
        .summary .s-due { border-top: 1px solid #9ca3af; color: #b91c1c; }

        .footnote { margin-top: 26px; font-size: 8pt; font-style: italic; color: #6b7280;
            border-top: 0.5px solid #e5e7eb; padding-top: 8px; }
    </style>
</head>
<body>

<table class="letterhead">
    <tr>
        <td width="55%">
            <table>
                <tr>
                    @if($logoPath)
                        <td><img src="{{ $logoPath }}" class="brand-logo"></td>
                    @endif
                    <td class="brand-name">{{ $companyName }}</td>
                </tr>
            </table>
        </td>
        <td width="45%">
            <div class="doc-title">PAYMENT RECEIPT</div>
            <div class="doc-subtitle">{{ $receiptNo }}</div>
        </td>
    </tr>
</table>

<table class="meta">
    <tr>
        <td class="label">Received From</td>
        <td class="value">{{ $client->name }}{{ $client->company_name ? ' — ' . $client->company_name : '' }}</td>
        <td class="label">Date</td>
        <td class="value">{{ $payment->paid_on->format('d M Y') }}</td>
    </tr>
    <tr>
        <td class="label">Project</td>
        <td class="value">{{ $project->name }}</td>
        <td class="label">Receipt No.</td>
        <td class="value">{{ $receiptNo }}</td>
    </tr>
    <tr>
        <td class="label">BOQ</td>
        <td class="value">{{ $boq->title }} (Rev {{ $boq->revision }})</td>
        <td class="label">Issued</td>
        <td class="value">{{ $generatedAt }}</td>
    </tr>
</table>

<table class="detail">
    <thead>
        <tr>
            <th width="30%">Method</th>
            <th width="40%">Reference</th>
            <th width="30%">Note</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>{{ ucwords(str_replace('_', ' ', $payment->method)) }}</td>
            <td>{{ $payment->reference ?: '—' }}</td>
            <td>{{ $payment->note ?: '—' }}</td>
        </tr>
    </tbody>
</table>

<table class="received">
    <tr>
        <td width="55%"></td>
        <td width="45%">
            <table class="box" width="100%">
                <tr>
                    <td class="r-label">AMOUNT RECEIVED</td>
                    <td class="r-value" style="text-align: right;">{{ $currency }} {{ number_format((float) $payment->amount, 2) }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<table class="summary">
    <tr>
        <td class="s-label">BOQ Total</td>
        <td class="s-value">{{ $currency }} {{ number_format((float) $total, 2) }}</td>
    </tr>
    <tr>
        <td class="s-label">Total Paid to Date</td>
        <td class="s-value">{{ $currency }} {{ number_format((float) $paid, 2) }}</td>
    </tr>
    <tr>
        <td class="s-label s-due">Balance Due</td>
        <td class="s-value s-due">{{ $currency }} {{ number_format((float) $due, 2) }}</td>
    </tr>
</table>

<div class="footnote">
    This is a computer-generated receipt for the payment recorded against the above BOQ.
    Thank you for your payment.
</div>

</body>
</html>
