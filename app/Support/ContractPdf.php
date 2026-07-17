<?php

namespace App\Support;

use App\Models\Contract;

/**
 * Renders a contract to PDF bytes.
 *
 * Lives outside the controller because two callers need identical output: the
 * on-demand download, and the issue action that freezes a copy to disk. If they
 * rendered separately they could drift, and the whole point of the frozen copy
 * is that it matches what the client was handed.
 */
class ContractPdf
{
    public function __construct(private Contract $contract)
    {
        $this->contract->loadMissing(['project.client', 'addons', 'milestones']);
    }

    /**
     * Render the contract and return the raw PDF bytes.
     */
    public function render(): string
    {
        $logo = public_path('logo.svg');

        $html = view('pdf.contract', [
            'contract' => $this->contract,
            'project' => $this->contract->project,
            'client' => $this->contract->project->client,
            'currency' => $this->contract->currency,
            'companyName' => config('app.name'),
            'logoPath' => is_file($logo) ? $logo : null,
            'generatedAt' => now()->format('d M Y'),
        ])->render();

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

    /**
     * A filename for this contract's PDF.
     */
    public function filename(): string
    {
        return 'contract-' . \Illuminate\Support\Str::slug($this->contract->project->name . '-' . $this->contract->title) . '.pdf';
    }
}
