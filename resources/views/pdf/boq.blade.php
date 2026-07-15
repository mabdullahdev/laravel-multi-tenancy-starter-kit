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
        .meta .label { color: #6b7280; width: 70px; }
        .meta .value { font-weight: bold; color: #111827; padding-right: 24px; }

        .badge { font-size: 8pt; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; }
        .badge-draft { background: #f3f4f6; color: #374151; }
        .badge-finalized { background: #dcfce7; color: #166534; }

        .section-title { background: #111827; color: #ffffff; font-size: 10pt; font-weight: bold; padding: 5px 8px; margin-top: 12px; }

        table.items { width: 100%; border-collapse: collapse; }
        table.items th { background: #f3f4f6; color: #374151; font-size: 8.5pt; text-transform: uppercase;
            text-align: left; padding: 5px 6px; border-bottom: 1px solid #d1d5db; }
        table.items td { padding: 5px 6px; border-bottom: 0.5px solid #e5e7eb; font-size: 9.5pt; vertical-align: top; }
        table.items .num { text-align: right; }
        table.items .code { color: #6b7280; white-space: nowrap; }
        table.items tfoot td { border-top: 1px solid #9ca3af; border-bottom: none; font-weight: bold; }

        .grand-total { width: 100%; margin-top: 18px; }
        .grand-total .box { background: #111827; color: #ffffff; padding: 10px 14px; }
        .grand-total .gt-label { font-size: 9pt; color: #d1d5db; }
        .grand-total .gt-value { font-size: 15pt; font-weight: bold; }
        .pay-summary td { padding: 3px 14px; font-size: 9.5pt; }
        .pay-summary .ps-label { color: #6b7280; }
        .pay-summary .ps-value { text-align: right; font-weight: bold; color: #111827; }

        .terms { margin-top: 18px; font-size: 9pt; color: #374151; }
        .terms .terms-label { font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 8pt; margin-bottom: 2px; }

        .notes { margin-top: 14px; font-size: 9pt; color: #374151; }
        .notes .notes-label { font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 8pt; margin-bottom: 2px; }

        .validity-note { margin-top: 18px; padding-top: 8px; border-top: 0.5px solid #e5e7eb;
            font-size: 8pt; font-style: italic; color: #6b7280; }
    </style>
</head>
<body>

<htmlpagefooter name="pageFooter">
    <table width="100%" style="border-top: 0.5px solid #d1d5db; padding-top: 4px; color: #9ca3af; font-size: 8pt;">
        <tr>
            <td style="text-align: left;">{{ $companyName }}</td>
            <td style="text-align: center;">Generated {{ $generatedAt }}</td>
            <td style="text-align: right;">Page {PAGENO} of {nbpg}</td>
        </tr>
    </table>
</htmlpagefooter>
<sethtmlpagefooter name="pageFooter" value="on" />

{{-- Letterhead --}}
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
            <div class="doc-title">BILL OF QUANTITIES</div>
            <div class="doc-subtitle">{{ $boq['title'] }} &middot; Revision {{ $boq['revision'] }}</div>
        </td>
    </tr>
</table>

{{-- Meta --}}
<table class="meta">
    <tr>
        <td class="label">Project</td>
        <td class="value">{{ $boq['project']['name'] }}</td>
        <td class="label">Client</td>
        <td class="value">{{ $boq['project']['client_name'] ?? '—' }}</td>
    </tr>
    <tr>
        <td class="label">BOQ</td>
        <td class="value">{{ $boq['title'] }}</td>
        <td class="label">Status</td>
        <td class="value">
            <span class="badge {{ $boq['status'] === 'finalized' ? 'badge-finalized' : 'badge-draft' }}">{{ $boq['status'] }}</span>
        </td>
    </tr>
    <tr>
        <td class="label">Revision</td>
        <td class="value">v{{ $boq['revision'] }}</td>
        <td class="label">Date</td>
        <td class="value">{{ $generatedAt }}</td>
    </tr>
    <tr>
        <td class="label">Valid Until</td>
        <td class="value">{{ $validUntil }}</td>
        <td class="label"></td>
        <td class="value"></td>
    </tr>
</table>

{{-- Sections --}}
@php $currency = $boq['currency']; @endphp
@forelse($boq['sections'] as $section)
    @php $sectionTotal = 0; @endphp
    <div class="section-title">{{ $section['name'] }}</div>
    <table class="items">
        <thead>
            <tr>
                <th width="9%">Code</th>
                <th width="43%">Description</th>
                <th width="8%">Unit</th>
                <th width="10%" class="num">Qty</th>
                <th width="13%" class="num">Rate</th>
                <th width="17%" class="num">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($section['items'] as $item)
                @php $sectionTotal += (float) $item['amount']; @endphp
                <tr>
                    <td class="code">{{ $item['item_code'] ?: '—' }}</td>
                    <td>{{ $item['description'] }}</td>
                    <td>{{ $item['unit'] }}</td>
                    <td class="num">{{ rtrim(rtrim(number_format((float) $item['quantity'], 3), '0'), '.') }}</td>
                    <td class="num">{{ number_format((float) $item['rate'], 2) }}</td>
                    <td class="num">{{ number_format((float) $item['amount'], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="5" class="num">Section total ({{ $currency }})</td>
                <td class="num">{{ number_format($sectionTotal, 2) }}</td>
            </tr>
        </tfoot>
    </table>
@empty
    <p style="color: #6b7280;">This BOQ has no sections or items.</p>
@endforelse

{{-- Grand total + payment summary --}}
<table class="grand-total">
    <tr>
        <td width="55%"></td>
        <td width="45%">
            @if(isset($payment) && (float) $payment['paid'] > 0)
                <table width="100%" class="pay-summary">
                    <tr>
                        <td class="ps-label">Grand Total</td>
                        <td class="ps-value">{{ $currency }} {{ number_format((float) $boq['total_amount'], 2) }}</td>
                    </tr>
                    <tr>
                        <td class="ps-label">Amount Received</td>
                        <td class="ps-value">&minus; {{ $currency }} {{ number_format((float) $payment['paid'], 2) }}</td>
                    </tr>
                </table>
                <table class="box" width="100%">
                    <tr>
                        <td class="gt-label">BALANCE DUE</td>
                        <td class="gt-value" style="text-align: right;">{{ $currency }} {{ number_format((float) $payment['due'], 2) }}</td>
                    </tr>
                </table>
            @else
                <table class="box" width="100%">
                    <tr>
                        <td class="gt-label">GRAND TOTAL</td>
                        <td class="gt-value" style="text-align: right;">{{ $currency }} {{ number_format((float) $boq['total_amount'], 2) }}</td>
                    </tr>
                </table>
            @endif
        </td>
    </tr>
</table>

@if(!empty($boq['payment_terms']))
    <div class="terms">
        <div class="terms-label">Payment Terms</div>
        {!! nl2br(e($boq['payment_terms'])) !!}
    </div>
@endif

@if(!empty($boq['notes']))
    <div class="notes">
        <div class="notes-label">Notes</div>
        {!! nl2br(e($boq['notes'])) !!}
    </div>
@endif

<div class="validity-note">
    This quotation is valid for {{ $validityDays }} days from the date of issue (until {{ $validUntil }}).
    Prices are subject to revision thereafter.
</div>

</body>
</html>
