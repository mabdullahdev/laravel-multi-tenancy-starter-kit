import ConfirmDialog from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarClock, Download, FileText, Pencil, Plus, Trash2, Upload, Wallet } from 'lucide-react';
import { useRef } from 'react';

interface Addon {
    id: number;
    name: string;
    unit: string;
    quantity: string | number;
    rate: string | number;
    amount: string | number;
}

interface Milestone {
    id: number;
    name: string;
    percentage: string | null;
    amount: string | number;
    due_on: string | null;
    status: string;
    invoice_no: string | null;
    paid_amount: string | number;
}

interface Contract {
    id: number;
    project_id: number;
    project_name: string;
    client_name: string | null;
    title: string;
    type: string;
    billable_area_sqft: string | null;
    rate_per_sqft: string | null;
    quality_tier: string | null;
    base_amount: string | number;
    addons_amount: string | number;
    contract_amount: string | number;
    currency: string;
    signed_on: string | null;
    status: string;
    notes: string | null;
    payment_terms: string | null;
    exclusions: string | null;
    addons: Addon[];
    milestones: Milestone[];
}

interface ContractDocument {
    id: number;
    type: string;
    name: string;
    mime: string | null;
    size: number | null;
    amount_at_issue: string | null;
    issued_at: string | null;
    created_at: string;
    is_stale: boolean;
}

interface Payment {
    id: number;
    amount: string | number;
    paid_on: string;
    method: string;
    reference: string | null;
    note: string | null;
    milestone_name: string | null;
}

interface PaymentSummary {
    total: string | number;
    paid: string | number;
    due: string | number;
    status: 'unpaid' | 'partial' | 'paid';
}

interface IssueState {
    can_issue: boolean;
    reason: string | null;
}

interface Props {
    contract: Contract;
    payments: Payment[];
    documents: ContractDocument[];
    issue: IssueState;
    paymentSummary: PaymentSummary;
}

const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online' },
    { value: 'other', label: 'Other' },
];

const methodLabel = (value: string) => paymentMethods.find((m) => m.value === value)?.label ?? value;

const statusMeta: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    paid: { label: 'Paid', variant: 'default' },
    partial: { label: 'Partially Paid', variant: 'secondary' },
    unpaid: { label: 'Unpaid', variant: 'outline' },
};

const NO_MILESTONE = 'none';

function money(value: string | number, currency: string): string {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Today's date as YYYY-MM-DD for the date input default. */
function today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const docTypeLabel: Record<string, string> = {
    issued_contract: 'Issued contract',
    signed_scan: 'Signed copy',
    other: 'Document',
};

function fileSize(bytes: number | null): string {
    if (!bytes) return '—';
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ContractShow({ contract, payments, documents, issue, paymentSummary }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: contract.project_name, href: `/projects/${contract.project_id}` },
        { title: contract.title, href: `/contracts/${contract.id}` },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        paid_on: today(),
        method: 'cash',
        reference: '',
        note: '',
        contract_milestone_id: NO_MILESTONE,
    });

    const recordPayment = (e: React.FormEvent) => {
        e.preventDefault();
        // The select needs a non-empty sentinel; the backend wants null.
        router.post(
            route('contracts.payments.store', contract.id),
            { ...data, contract_milestone_id: data.contract_milestone_id === NO_MILESTONE ? null : data.contract_milestone_id },
            { preserveScroll: true, onSuccess: () => reset('amount', 'reference', 'note') },
        );
    };

    const deletePayment = (payment: Payment) => router.delete(route('payments.destroy', payment.id), { preserveScroll: true });

    const fileInput = useRef<HTMLInputElement>(null);

    const issueContract = () => router.post(route('contracts.issue', contract.id), {}, { preserveScroll: true });

    const uploadSignedScan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        router.post(
            route('contracts.documents.store', contract.id),
            { file, type: 'signed_scan', name: '' },
            { preserveScroll: true, forceFormData: true, onFinish: () => fileInput.current && (fileInput.current.value = '') },
        );
    };

    const deleteDocument = (doc: ContractDocument) =>
        router.delete(route('contract-documents.destroy', doc.id), { preserveScroll: true });

    const status = statusMeta[paymentSummary.status] ?? statusMeta.unpaid;
    const isDraft = contract.status === 'draft';
    const due = typeof paymentSummary.due === 'string' ? parseFloat(paymentSummary.due) : paymentSummary.due;

    const unpaidMilestones = contract.milestones.filter((m) => m.status !== 'paid');

    /** True when this copy's total differs from the contract's — not the same as being stale. */
    const amountChanged = (doc: ContractDocument): boolean =>
        doc.amount_at_issue !== null && parseFloat(doc.amount_at_issue) !== parseFloat(String(contract.contract_amount));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={contract.title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Link href={route('contracts.edit', contract.id)}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Contract
                        </Button>
                    </Link>
                </div>

                {/* Contract summary */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <CardTitle className="text-xl">{contract.title}</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {contract.project_name}
                                    {contract.client_name ? ` · ${contract.client_name}` : ''}
                                </p>
                            </div>
                            <Badge className="capitalize">{contract.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm sm:grid-cols-3">
                        <div>
                            <p className="font-medium text-muted-foreground">Terms</p>
                            <p>
                                {contract.type === 'theka_per_sqft' && contract.rate_per_sqft
                                    ? `${parseFloat(contract.billable_area_sqft ?? '0').toLocaleString()} sqft × ${contract.currency} ${parseFloat(contract.rate_per_sqft).toLocaleString()}`
                                    : 'Dihari'}
                            </p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Signed</p>
                            <p>{contract.signed_on ?? '—'}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Finishing</p>
                            <p className="capitalize">{contract.quality_tier ?? '—'}</p>
                        </div>
                        {contract.addons.length > 0 && (
                            <div className="sm:col-span-3">
                                <p className="font-medium text-muted-foreground">Add-ons</p>
                                <ul className="mt-1 space-y-0.5">
                                    {contract.addons.map((addon) => (
                                        <li key={addon.id} className="flex justify-between gap-4">
                                            <span>
                                                {addon.name}
                                                {addon.unit !== 'lump sum' && (
                                                    <span className="text-muted-foreground">
                                                        {' '}
                                                        · {parseFloat(String(addon.quantity)).toLocaleString()} {addon.unit} ×{' '}
                                                        {money(addon.rate, contract.currency)}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="tabular-nums">{money(addon.amount, contract.currency)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Documents — the issued copy, the client's signed scan, anything else */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-4 w-4" />
                                Documents
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <a href={route('contracts.pdf', contract.id)}>
                                    <Button variant="outline" size="sm" className="gap-1">
                                        <Download className="h-3.5 w-3.5" />
                                        Preview PDF
                                    </Button>
                                </a>
                                <input
                                    ref={fileInput}
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/png"
                                    onChange={uploadSignedScan}
                                    className="hidden"
                                />
                                <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} className="gap-1">
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload Signed Copy
                                </Button>
                                <Button size="sm" onClick={issueContract} disabled={!issue.can_issue} className="gap-1">
                                    <FileText className="h-3.5 w-3.5" />
                                    Issue Contract
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {issue.reason && <p className="px-6 pb-4 text-sm text-muted-foreground">{issue.reason}</p>}
                        {documents.length === 0 ? (
                            <p className="px-6 py-8 text-center text-muted-foreground">
                                Nothing issued yet. "Issue Contract" freezes a PDF of the terms as they stand — that copy is what the
                                client agreed to, and it won't move if you edit the contract later.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-4 py-3 font-medium">Document</th>
                                            <th className="px-4 py-3 font-medium">Type</th>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 font-medium">Size</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {documents.map((doc) => (
                                            <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/40">
                                                <td className="px-4 py-3 font-medium">
                                                    {doc.name}
                                                    {doc.is_stale && (
                                                        <p className="mt-0.5 text-xs font-normal text-amber-600">
                                                            {/* Staleness covers the whole document, so the amount often hasn't
                                                                moved — quoting it either way would print the same figure twice. */}
                                                            {amountChanged(doc)
                                                                ? `Issued at ${money(doc.amount_at_issue ?? 0, contract.currency)} — the contract now says ${money(contract.contract_amount, contract.currency)}.`
                                                                : 'The contract has changed since this copy was issued.'}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={doc.type === 'issued_contract' ? 'default' : 'outline'}>
                                                        {docTypeLabel[doc.type] ?? doc.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{doc.issued_at ?? doc.created_at}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{fileSize(doc.size)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <a href={route('contract-documents.download', doc.id)}>
                                                            <Button variant="ghost" size="sm" className="gap-1">
                                                                <Download className="h-3.5 w-3.5" />
                                                                Download
                                                            </Button>
                                                        </a>
                                                        <ConfirmDialog
                                                            trigger={
                                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            }
                                                            title={`Delete "${doc.name}"?`}
                                                            description="This permanently deletes the file. If it's an issued contract, you lose the record of what the client agreed to."
                                                            confirmLabel="Delete"
                                                            confirmVariant="destructive"
                                                            onConfirm={() => deleteDocument(doc)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarClock className="h-4 w-4" />
                            Payment Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {contract.milestones.length === 0 ? (
                            <p className="px-6 py-8 text-center text-muted-foreground">
                                No schedule set. Add stages in the{' '}
                                <Link href={route('contracts.edit', contract.id)} className="text-primary underline">
                                    contract
                                </Link>{' '}
                                to track what's due when.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-4 py-3 font-medium">Stage</th>
                                            <th className="px-4 py-3 font-medium">Share</th>
                                            <th className="px-4 py-3 font-medium">Due</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 text-right font-medium">Amount</th>
                                            <th className="px-4 py-3 text-right font-medium">Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contract.milestones.map((milestone) => (
                                            <tr key={milestone.id} className="border-b last:border-0">
                                                <td className="px-4 py-3 font-medium">{milestone.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {milestone.percentage ? `${parseFloat(milestone.percentage)}%` : 'Flat'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{milestone.due_on ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={milestone.status === 'paid' ? 'default' : 'outline'} className="capitalize">
                                                        {milestone.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums">
                                                    {money(milestone.amount, contract.currency)}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                                    {money(milestone.paid_amount, contract.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payments */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wallet className="h-4 w-4" />
                                Payments
                            </CardTitle>
                            <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Contracted</p>
                                <p className="text-lg font-semibold tabular-nums">{money(paymentSummary.total, contract.currency)}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Received</p>
                                <p className="text-lg font-semibold tabular-nums text-green-600 dark:text-green-500">
                                    {money(paymentSummary.paid, contract.currency)}
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Balance Due</p>
                                <p className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-500">
                                    {money(paymentSummary.due, contract.currency)}
                                </p>
                            </div>
                        </div>

                        {isDraft ? (
                            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                Payments can only be recorded once this contract is{' '}
                                <span className="font-medium text-foreground">active</span>. Change its status in the{' '}
                                <Link href={route('contracts.edit', contract.id)} className="text-primary underline">
                                    contract
                                </Link>
                                .
                            </div>
                        ) : due <= 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-center text-sm font-medium text-green-600 dark:text-green-500">
                                This contract is fully paid.
                            </div>
                        ) : (
                            <form onSubmit={recordPayment} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-6 sm:items-start">
                                <div className="space-y-1 sm:col-span-1">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="any"
                                        min="0"
                                        max={due}
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        className={errors.amount ? 'border-red-500' : ''}
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                    <Label htmlFor="paid_on">Date *</Label>
                                    <Input
                                        id="paid_on"
                                        type="date"
                                        value={data.paid_on}
                                        onChange={(e) => setData('paid_on', e.target.value)}
                                        className={errors.paid_on ? 'border-red-500' : ''}
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                    <Label htmlFor="method">Method</Label>
                                    <Select value={data.method} onValueChange={(v) => setData('method', v)}>
                                        <SelectTrigger id="method">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map((m) => (
                                                <SelectItem key={m.value} value={m.value}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                    <Label htmlFor="contract_milestone_id">Against</Label>
                                    <Select
                                        value={data.contract_milestone_id}
                                        onValueChange={(v) => setData('contract_milestone_id', v)}
                                        disabled={unpaidMilestones.length === 0}
                                    >
                                        <SelectTrigger id="contract_milestone_id" className="whitespace-nowrap">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NO_MILESTONE}>No stage</SelectItem>
                                            {unpaidMilestones.map((m) => (
                                                <SelectItem key={m.id} value={String(m.id)}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input
                                        id="reference"
                                        value={data.reference}
                                        onChange={(e) => setData('reference', e.target.value)}
                                        placeholder="Cheque / txn #"
                                    />
                                </div>
                                {/* Same label + h-9 control structure as the fields, so it lines up with them. */}
                                <div className="space-y-1 sm:col-span-1">
                                    <Label aria-hidden className="pointer-events-none hidden select-none opacity-0 sm:inline">
                                        &nbsp;
                                    </Label>
                                    <Button type="submit" disabled={processing} className="h-9 w-full gap-1">
                                        <Plus className="h-4 w-4" />
                                        {processing ? 'Saving...' : 'Record'}
                                    </Button>
                                </div>
                                {errors.amount && <p className="text-sm text-red-500 sm:col-span-6">{errors.amount}</p>}
                                <p className="text-xs text-muted-foreground sm:col-span-6">
                                    Outstanding balance: {money(paymentSummary.due, contract.currency)}. A receipt will be emailed to the
                                    client.
                                </p>
                            </form>
                        )}

                        {/* Payment history */}
                        {payments.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground">No payments recorded yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-3 py-2 font-medium">Date</th>
                                            <th className="px-3 py-2 font-medium">Against</th>
                                            <th className="px-3 py-2 font-medium">Method</th>
                                            <th className="px-3 py-2 font-medium">Reference</th>
                                            <th className="px-3 py-2 text-right font-medium">Amount</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="border-b last:border-0">
                                                <td className="px-3 py-2">{payment.paid_on}</td>
                                                <td className="px-3 py-2 text-muted-foreground">{payment.milestone_name ?? '—'}</td>
                                                <td className="px-3 py-2">{methodLabel(payment.method)}</td>
                                                <td className="px-3 py-2 text-muted-foreground">{payment.reference || '—'}</td>
                                                <td className="px-3 py-2 text-right font-medium tabular-nums">
                                                    {money(payment.amount, contract.currency)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <ConfirmDialog
                                                        trigger={
                                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        }
                                                        title="Delete this payment?"
                                                        description={`This removes the ${money(payment.amount, contract.currency)} payment recorded on ${payment.paid_on}.`}
                                                        confirmLabel="Delete"
                                                        confirmVariant="destructive"
                                                        onConfirm={() => deletePayment(payment)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
