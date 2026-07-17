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
        .meta .label { color: #6b7280; width: 78px; }
        .meta .value { font-weight: bold; color: #111827; padding-right: 24px; }

        .badge { font-size: 8pt; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; }
        .badge-draft { background: #f3f4f6; color: #374151; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-completed { background: #dbeafe; color: #1e40af; }

        .section-title { background: #111827; color: #ffffff; font-size: 10pt; font-weight: bold; padding: 5px 8px; margin-top: 12px; }

        .parties { width: 100%; margin-bottom: 4px; }
        .parties td { width: 50%; vertical-align: top; padding: 8px 10px 8px 0; font-size: 9.5pt; }
        .parties .party-label { color: #6b7280; text-transform: uppercase; font-size: 8pt; font-weight: bold; margin-bottom: 3px; }
        .parties .party-name { font-weight: bold; color: #111827; }

        table.items { width: 100%; border-collapse: collapse; }
        table.items th { background: #f3f4f6; color: #374151; font-size: 8.5pt; text-transform: uppercase;
            text-align: left; padding: 5px 6px; border-bottom: 1px solid #d1d5db; }
        table.items td { padding: 5px 6px; border-bottom: 0.5px solid #e5e7eb; font-size: 9.5pt; vertical-align: top; }
        table.items .num { text-align: right; }
        table.items .muted { color: #6b7280; }
        table.items tfoot td { border-top: 1px solid #9ca3af; border-bottom: none; font-weight: bold; }

        .grand-total { width: 100%; margin-top: 18px; }
        .grand-total .box { background: #111827; color: #ffffff; padding: 10px 14px; }
        .grand-total .gt-label { font-size: 9pt; color: #d1d5db; }
        .grand-total .gt-value { font-size: 15pt; font-weight: bold; }

        .terms { margin-top: 18px; font-size: 9pt; color: #374151; }
        .terms .terms-label { font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 8pt; margin-bottom: 2px; }

        .notes { margin-top: 14px; font-size: 9pt; color: #374151; }
        .notes .notes-label { font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 8pt; margin-bottom: 2px; }

        .signatures { width: 100%; margin-top: 34px; }
        .signatures td { width: 50%; padding-right: 24px; font-size: 9pt; vertical-align: bottom; }
        .signatures .sig-line { border-top: 0.5px solid #9ca3af; padding-top: 4px; color: #6b7280; }
        .signatures .sig-who { font-weight: bold; color: #111827; }

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
            <div class="doc-title">CONSTRUCTION CONTRACT</div>
            <div class="doc-subtitle">{{ $contract->title }}</div>
        </td>
    </tr>
</table>

{{-- Parties --}}
<table class="parties">
    <tr>
        <td>
            <div class="party-label">Contractor</div>
            <div class="party-name">{{ $companyName }}</div>
        </td>
        <td>
            <div class="party-label">Client</div>
            <div class="party-name">{{ $client?->name ?? '—' }}</div>
            @if($client?->company_name)
                <div>{{ $client->company_name }}</div>
            @endif
            @if($client?->phone)
                <div class="muted">{{ $client->phone }}</div>
            @endif
            @if($client?->cnic)
                <div class="muted">CNIC: {{ $client->cnic }}</div>
            @endif
        </td>
    </tr>
</table>

{{-- Meta --}}
<table class="meta">
    <tr>
        <td class="label">Project</td>
        <td class="value">{{ $project->name }}</td>
        <td class="label">Status</td>
        <td class="value">
            <span class="badge badge-{{ $contract->status }}">{{ $contract->status }}</span>
        </td>
    </tr>
    <tr>
        <td class="label">Site</td>
        <td class="value">{{ $project->location ?? '—' }}</td>
        <td class="label">Signed</td>
        <td class="value">{{ $contract->signed_on?->format('d M Y') ?? '—' }}</td>
    </tr>
    <tr>
        <td class="label">Covered Area</td>
        <td class="value">
            {{ $contract->billable_area_sqft ? number_format((float) $contract->billable_area_sqft) . ' sqft' : '—' }}
        </td>
        <td class="label">Finishing</td>
        <td class="value">{{ $contract->quality_tier ? ucfirst($contract->quality_tier) : '—' }}</td>
    </tr>
</table>

{{-- Price breakdown --}}
<div class="section-title">SCOPE &amp; PRICE</div>
<table class="items">
    <thead>
        <tr>
            <th width="52%">Description</th>
            <th width="14%" class="num">Qty</th>
            <th width="16%" class="num">Rate</th>
            <th width="18%" class="num">Amount</th>
        </tr>
    </thead>
    <tbody>
        @if($contract->type === 'theka_per_sqft')
            <tr>
                <td>
                    {{ $contract->title }}
                    <div class="muted">Construction at a fixed rate per square foot of covered area.</div>
                </td>
                <td class="num">{{ number_format((float) $contract->billable_area_sqft) }} sqft</td>
                <td class="num">{{ $currency }} {{ number_format((float) $contract->rate_per_sqft, 2) }}</td>
                <td class="num">{{ $currency }} {{ number_format((float) $contract->base_amount, 2) }}</td>
            </tr>
        @else
            <tr>
                <td>{{ $contract->title }} <div class="muted">Dihari — labour engaged on a daily-wage basis.</div></td>
                <td class="num">—</td>
                <td class="num">—</td>
                <td class="num">{{ $currency }} {{ number_format((float) $contract->base_amount, 2) }}</td>
            </tr>
        @endif

        @foreach($contract->addons as $addon)
            <tr>
                <td>{{ $addon->name }}</td>
                <td class="num">
                    @if($addon->unit === 'lump sum')
                        Lump sum
                    @else
                        {{ number_format((float) $addon->quantity, 2) }} {{ $addon->unit }}
                    @endif
                </td>
                <td class="num">
                    {{ $addon->unit === 'lump sum' ? '—' : $currency . ' ' . number_format((float) $addon->rate, 2) }}
                </td>
                <td class="num">{{ $currency }} {{ number_format((float) $addon->amount, 2) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

{{-- Contract amount --}}
<table class="grand-total">
    <tr>
        <td width="60%"></td>
        <td width="40%">
            <table class="box" width="100%">
                <tr>
                    <td class="gt-label">Contract Amount</td>
                    <td class="gt-value" style="text-align: right;">{{ $currency }} {{ number_format((float) $contract->contract_amount, 2) }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

{{-- Payment schedule --}}
@if($contract->milestones->isNotEmpty())
    <div class="section-title">PAYMENT SCHEDULE</div>
    <table class="items">
        <thead>
            <tr>
                <th width="50%">Stage</th>
                <th width="14%" class="num">Share</th>
                <th width="18%">Due</th>
                <th width="18%" class="num">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($contract->milestones as $milestone)
                <tr>
                    <td>{{ $milestone->name }}</td>
                    <td class="num muted">
                        {{ $milestone->percentage !== null ? rtrim(rtrim(number_format((float) $milestone->percentage, 2), '0'), '.') . '%' : '—' }}
                    </td>
                    <td class="muted">{{ $milestone->due_on?->format('d M Y') ?? '—' }}</td>
                    <td class="num">{{ $currency }} {{ number_format((float) $milestone->amount, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">Total scheduled</td>
                <td class="num">{{ $currency }} {{ number_format((float) $contract->milestones->sum('amount'), 2) }}</td>
            </tr>
        </tfoot>
    </table>
@endif

@if(!empty($contract->payment_terms))
    <div class="terms">
        <div class="terms-label">Payment Terms</div>
        {!! nl2br(e($contract->payment_terms)) !!}
    </div>
@endif

@if(!empty($contract->exclusions))
    <div class="terms">
        <div class="terms-label">Not Included in This Price</div>
        {!! nl2br(e($contract->exclusions)) !!}
    </div>
@endif

@if(!empty($contract->notes))
    <div class="notes">
        <div class="notes-label">Notes</div>
        {!! nl2br(e($contract->notes)) !!}
    </div>
@endif

{{-- Signatures --}}
<table class="signatures">
    <tr>
        <td>
            <div class="sig-line">
                <div class="sig-who">For {{ $companyName }}</div>
                <div>Name, signature &amp; date</div>
            </div>
        </td>
        <td>
            <div class="sig-line">
                <div class="sig-who">{{ $client?->name ?? 'Client' }}</div>
                <div>Signature &amp; date</div>
            </div>
        </td>
    </tr>
</table>

<div class="validity-note">
    This contract covers only the scope priced above. Any work not listed — including anything under "Not Included in
    This Price" — is chargeable separately and requires written agreement before it is carried out.
</div>

</body>
</html>
