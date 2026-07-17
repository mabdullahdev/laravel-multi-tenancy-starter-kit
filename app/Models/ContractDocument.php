<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ContractDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'type',
        'name',
        'path',
        'disk',
        'mime',
        'size',
        'content_hash',
        'amount_at_issue',
        'issued_at',
    ];

    protected $casts = [
        'size' => 'integer',
        'amount_at_issue' => 'decimal:2',
        'issued_at' => 'datetime',
    ];

    /**
     * Hook model events so the stored file follows the row.
     */
    protected static function booted(): void
    {
        // Deleting the row must delete the file, or storage fills with orphans
        // nothing points at. Note this does NOT fire when a contract cascade-deletes
        // its documents at the database level — Contract::deleting handles that.
        static::deleted(function (ContractDocument $document) {
            Storage::disk($document->disk)->delete($document->path);
        });
    }

    /**
     * The directory a contract's documents live in.
     */
    public static function directoryFor(Contract $contract): string
    {
        return 'contracts/' . $contract->id;
    }

    /**
     * True when the contract has moved on since this document was issued.
     *
     * An issued PDF is frozen on purpose; this is how the UI can point out that
     * the paper the client holds no longer matches the current terms.
     *
     * Compares the whole fingerprint rather than the amount: an edit to the
     * exclusions or the schedule changes the client's copy without touching the
     * price, and that is exactly the change worth catching.
     *
     * Only issued copies carry a hash — an uploaded scan is never "stale".
     */
    public function isStale(): bool
    {
        if ($this->content_hash === null) {
            return false;
        }

        return $this->content_hash !== $this->contract->documentFingerprint();
    }

    /**
     * Get the contract this document belongs to.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
