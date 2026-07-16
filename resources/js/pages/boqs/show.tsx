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
import { ArrowLeft, Copy, Download, Pencil, Plus, Trash2, Wallet } from 'lucide-react';

interface Item {
    id: number;
    item_code: string;
    description: string;
    unit: string;
    quantity: string;
    rate: string;
    amount: string | number;
}

interface Section {
    id: number;
    name: string;
    items: Item[];
}

interface Boq {
    id: number;
    project_id: number;
    title: string;
    revision: number;
    currency: string;
    status: string;
    notes: string;
    total_amount: string | number;
    project: { id: number; name: string; client_name: string | null };
    sections: Section[];
}

interface Payment {
    id: number;
    amount: string | number;
    paid_on: string;
    method: string;
    reference: string | null;
    note: string | null;
}

interface PaymentSummary {
    total: string | number;
    paid: string | number;
    due: string | number;
    status: 'unpaid' | 'partial' | 'paid';
}

interface Props {
    boq: Boq;
    payments: Payment[];
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

function money(value: string | number, currency: string): string {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Today's date as YYYY-MM-DD for the date input default. */
function today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sectionTotal(section: Section): number {
    return section.items.reduce((s, i) => s + (typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount), 0);
}

export default function BoqShow({ boq, payments, paymentSummary }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: boq.project.name, href: `/projects/${boq.project_id}` },
        { title: `${boq.title} (v${boq.revision})`, href: `/boqs/${boq.id}` },
    ];

    const revise = () => router.post(route('boqs.revise', boq.id));

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        paid_on: today(),
        method: 'cash',
        reference: '',
        note: '',
    });

    const recordPayment = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('boqs.payments.store', boq.id), {
            preserveScroll: true,
            onSuccess: () => reset('amount', 'reference', 'note'),
        });
    };

    const deletePayment = (payment: Payment) =>
        router.delete(route('payments.destroy', payment.id), { preserveScroll: true });

    const status = statusMeta[paymentSummary.status] ?? statusMeta.unpaid;
    const isFinalized = boq.status === 'finalized';
    const due = typeof paymentSummary.due === 'string' ? parseFloat(paymentSummary.due) : paymentSummary.due;
    const canRecord = isFinalized && due > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${boq.title} (v${boq.revision})`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div className="flex gap-2">
                        <a href={route('boqs.pdf', boq.id)}>
                            <Button variant="outline" size="sm" className="gap-1">
                                <Download className="h-3.5 w-3.5" />
                                Export PDF
                            </Button>
                        </a>
                        <ConfirmDialog
                            trigger={
                                <Button variant="outline" size="sm" className="gap-1">
                                    <Copy className="h-3.5 w-3.5" />
                                    Create Revision
                                </Button>
                            }
                            title={`Create a revision of "${boq.title}"?`}
                            description={`This copies revision ${boq.revision} into a new editable draft. The original stays unchanged as a snapshot.`}
                            confirmLabel="Create Revision"
                            onConfirm={revise}
                        />
                        <Link href={route('boqs.edit', boq.id)}>
                            <Button size="sm" className="gap-1">
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-xl">
                                {boq.title}
                                <span className="ml-2 text-sm font-normal text-muted-foreground">Revision {boq.revision}</span>
                            </CardTitle>
                            <Badge variant={boq.status === 'finalized' ? 'default' : 'outline'} className="capitalize">
                                {boq.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                        <p><span className="text-muted-foreground">Project:</span> {boq.project.name}</p>
                        <p><span className="text-muted-foreground">Client:</span> {boq.project.client_name ?? '—'}</p>
                        {boq.notes && <p className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> {boq.notes}</p>}
                    </CardContent>
                </Card>

                {boq.sections.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            This BOQ has no sections yet.{' '}
                            <Link href={route('boqs.edit', boq.id)} className="text-primary underline">
                                Add some
                            </Link>
                            .
                        </CardContent>
                    </Card>
                ) : (
                    boq.sections.map((section) => (
                        <Card key={section.id}>
                            <CardHeader>
                                <CardTitle className="text-base">{section.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="px-4 py-2 font-medium">Code</th>
                                                <th className="px-4 py-2 font-medium">Description</th>
                                                <th className="px-4 py-2 font-medium">Unit</th>
                                                <th className="px-4 py-2 text-right font-medium">Qty</th>
                                                <th className="px-4 py-2 text-right font-medium">Rate</th>
                                                <th className="px-4 py-2 text-right font-medium">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.items.map((item) => (
                                                <tr key={item.id} className="border-b last:border-0">
                                                    <td className="px-4 py-2 text-muted-foreground">{item.item_code || '—'}</td>
                                                    <td className="px-4 py-2">{item.description}</td>
                                                    <td className="px-4 py-2">{item.unit}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums">{item.rate}</td>
                                                    <td className="px-4 py-2 text-right font-medium tabular-nums">
                                                        {money(item.amount, boq.currency)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t">
                                                <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">
                                                    Section total
                                                </td>
                                                <td className="px-4 py-2 text-right font-semibold tabular-nums">
                                                    {money(sectionTotal(section), boq.currency)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                <div className="flex justify-end border-t pt-4">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Grand Total</p>
                        <p className="text-2xl font-bold tabular-nums">{money(boq.total_amount, boq.currency)}</p>
                    </div>
                </div>

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
                        {/* Summary */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-lg font-semibold tabular-nums">{money(paymentSummary.total, boq.currency)}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Paid</p>
                                <p className="text-lg font-semibold tabular-nums text-green-600 dark:text-green-500">
                                    {money(paymentSummary.paid, boq.currency)}
                                </p>
                            </div>
                            <div className="rounded-lg border p-3">
                                <p className="text-xs text-muted-foreground">Balance Due</p>
                                <p className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-500">
                                    {money(paymentSummary.due, boq.currency)}
                                </p>
                            </div>
                        </div>

                        {/* Record a payment — only for a finalized BOQ with a balance */}
                        {!isFinalized ? (
                            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                Payments can only be recorded once this BOQ is{' '}
                                <span className="font-medium text-foreground">finalized</span>. Change its status in the{' '}
                                <Link href={route('boqs.edit', boq.id)} className="text-primary underline">
                                    builder
                                </Link>
                                .
                            </div>
                        ) : due <= 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-center text-sm font-medium text-green-600 dark:text-green-500">
                                This BOQ is fully paid.
                            </div>
                        ) : (
                        <form onSubmit={recordPayment} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-6 sm:items-end">
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
                                <Label htmlFor="reference">Reference</Label>
                                <Input
                                    id="reference"
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    placeholder="Cheque / txn #"
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-1">
                                <Label htmlFor="note">Note</Label>
                                <Input
                                    id="note"
                                    value={data.note}
                                    onChange={(e) => setData('note', e.target.value)}
                                    placeholder="e.g. Advance"
                                />
                            </div>
                            <div className="sm:col-span-1">
                                <Button type="submit" disabled={processing} className="w-full gap-1">
                                    <Plus className="h-4 w-4" />
                                    {processing ? 'Saving...' : 'Record'}
                                </Button>
                            </div>
                            {errors.amount && <p className="text-sm text-red-500 sm:col-span-6">{errors.amount}</p>}
                            <p className="text-xs text-muted-foreground sm:col-span-6">
                                Outstanding balance: {money(paymentSummary.due, boq.currency)}. A receipt will be emailed to the client.
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
                                            <th className="px-3 py-2 font-medium">Method</th>
                                            <th className="px-3 py-2 font-medium">Reference</th>
                                            <th className="px-3 py-2 font-medium">Note</th>
                                            <th className="px-3 py-2 text-right font-medium">Amount</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="border-b last:border-0">
                                                <td className="px-3 py-2">{payment.paid_on}</td>
                                                <td className="px-3 py-2">{methodLabel(payment.method)}</td>
                                                <td className="px-3 py-2 text-muted-foreground">{payment.reference || '—'}</td>
                                                <td className="px-3 py-2 text-muted-foreground">{payment.note || '—'}</td>
                                                <td className="px-3 py-2 text-right font-medium tabular-nums">
                                                    {money(payment.amount, boq.currency)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <ConfirmDialog
                                                        trigger={
                                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        }
                                                        title="Delete this payment?"
                                                        description={`This removes the ${money(payment.amount, boq.currency)} payment recorded on ${payment.paid_on}.`}
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
