<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContractDocumentRequest;
use App\Models\Contract;
use App\Models\ContractDocument;
use App\Support\ContractPdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractDocumentController extends Controller
{
    /**
     * Stream a live PDF of the contract as it stands right now.
     *
     * This always reflects current data, so it is not a record of anything —
     * issue() is what freezes a copy.
     */
    public function pdf(Contract $contract): Response
    {
        $pdf = new ContractPdf($contract);

        return response($pdf->render(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $pdf->filename() . '"',
        ]);
    }

    /**
     * Issue the contract: render it and freeze that copy to disk.
     *
     * Kept as an explicit action rather than a hook on the draft → active
     * transition. Issuing is a deliberate moment — the version here is the one
     * the client is handed, and it must not move when the contract is edited later.
     */
    public function issue(Contract $contract): RedirectResponse
    {
        if ($contract->status === 'draft') {
            return back()->withErrors([
                'issue' => 'Activate the contract before issuing it — a draft is not agreed yet.',
            ]);
        }

        $fingerprint = $contract->documentFingerprint();
        $issued = $contract->issuedContract();

        // Re-issuing is how a re-signed contract is recorded, but only when something
        // actually changed. Without this a double-click stacks up identical copies and
        // buries the versions that matter. Enforced here, not just by grasying out the
        // button, since the button is not the only way to reach this.
        if ($issued && $issued->content_hash === $fingerprint) {
            return back()->withErrors([
                'issue' => 'Nothing has changed since you last issued this contract.',
            ]);
        }

        $pdf = new ContractPdf($contract);
        $bytes = $pdf->render();

        $path = ContractDocument::directoryFor($contract) . '/' . now()->format('Ymd-His') . '-' . $pdf->filename();

        Storage::disk('local')->put($path, $bytes);

        $contract->documents()->create([
            'type' => 'issued_contract',
            'name' => 'Contract — ' . $contract->title . ' (' . now()->format('d M Y') . ')',
            'path' => $path,
            'disk' => 'local',
            'mime' => 'application/pdf',
            'size' => strlen($bytes),
            // Freeze what this copy was rendered from, so a later edit shows up as a
            // difference rather than silently rewriting history. The hash detects the
            // change; the amount is what makes the message readable.
            'content_hash' => $fingerprint,
            'amount_at_issue' => $contract->contract_amount,
            'issued_at' => now(),
        ]);

        return back()->with('success', 'Contract issued. The copy is saved under Documents.');
    }

    /**
     * Attach a document to the contract — typically the client's signed scan.
     */
    public function store(StoreContractDocumentRequest $request, Contract $contract): RedirectResponse
    {
        $file = $request->file('file');

        // 'local' disk = storage/app/private. These are client documents, so they
        // are never web-readable; download() below is the only way out.
        $path = $file->store(ContractDocument::directoryFor($contract), 'local');

        $contract->documents()->create([
            'type' => $request->validated('type'),
            'name' => $request->validated('name') ?: $file->getClientOriginalName(),
            'path' => $path,
            'disk' => 'local',
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ]);

        return back()->with('success', 'Document uploaded.');
    }

    /**
     * Stream a stored document back to an authenticated user.
     */
    public function download(ContractDocument $document): StreamedResponse
    {
        abort_unless(Storage::disk($document->disk)->exists($document->path), 404);

        return Storage::disk($document->disk)->download($document->path, $document->name . '.' . pathinfo($document->path, PATHINFO_EXTENSION));
    }

    /**
     * Remove a document and its file.
     */
    public function destroy(ContractDocument $document): RedirectResponse
    {
        // ContractDocument::deleted() removes the file from disk.
        $document->delete();

        return back()->with('success', 'Document removed.');
    }
}
