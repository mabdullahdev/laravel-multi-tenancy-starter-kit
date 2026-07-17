<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family: Arial, Helvetica, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; max-width:600px;">
                    <tr>
                        <td style="background:#111827; padding:20px 28px;">
                            <span style="color:#ffffff; font-size:18px; font-weight:bold;">{{ $companyName }}</span>
                            <span style="color:#9ca3af; font-size:13px; float:right; padding-top:4px;">Payment Receipt</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px; font-size:15px;">Dear {{ $client->name }},</p>
                            <p style="margin:0 0 20px; font-size:14px; line-height:1.5; color:#374151;">
                                Thank you. We have received your payment for
                                <strong>{{ $project->name }}</strong> ({{ $contract->title }}@if ($milestone) — {{ $milestone->name }}@endif).
                                A formal receipt is attached to this email.
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb; border-radius:6px; margin-bottom:20px;">
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #f3f4f6; font-size:13px; color:#6b7280;">Receipt No.</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #f3f4f6; font-size:13px; font-weight:bold; text-align:right;">{{ $receiptNo }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #f3f4f6; font-size:13px; color:#6b7280;">Date</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #f3f4f6; font-size:13px; font-weight:bold; text-align:right;">{{ $payment->paid_on->format('d M Y') }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; border-bottom:1px solid #f3f4f6; font-size:13px; color:#6b7280;">Method</td>
                                    <td style="padding:14px 16px; border-bottom:1px solid #f3f4f6; font-size:13px; font-weight:bold; text-align:right;">{{ ucwords(str_replace('_', ' ', $payment->method)) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px 16px; font-size:15px; color:#111827; font-weight:bold;">Amount Received</td>
                                    <td style="padding:14px 16px; font-size:15px; font-weight:bold; text-align:right; color:#111827;">{{ $currency }} {{ number_format((float) $payment->amount, 2) }}</td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#6b7280;">Total Paid to Date</td>
                                    <td style="padding:4px 0; font-size:13px; font-weight:bold; text-align:right;">{{ $currency }} {{ number_format((float) $paid, 2) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#6b7280;">Balance Due</td>
                                    <td style="padding:4px 0; font-size:13px; font-weight:bold; text-align:right; color:#b91c1c;">{{ $currency }} {{ number_format((float) $due, 2) }}</td>
                                </tr>
                            </table>

                            <p style="margin:24px 0 0; font-size:13px; color:#6b7280; line-height:1.5;">
                                If you have any questions about this receipt, simply reply to this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f9fafb; padding:16px 28px; font-size:11px; color:#9ca3af; text-align:center;">
                            This is an automated receipt from {{ $companyName }}.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
