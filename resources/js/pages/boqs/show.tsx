import ConfirmDialog from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Copy, Download, Pencil } from 'lucide-react';

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

interface Props {
    boq: Boq;
}

function money(value: string | number, currency: string): string {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sectionTotal(section: Section): number {
    return section.items.reduce((s, i) => s + (typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount), 0);
}

export default function BoqShow({ boq }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: boq.project.name, href: `/projects/${boq.project_id}` },
        { title: `${boq.title} (v${boq.revision})`, href: `/boqs/${boq.id}` },
    ];

    const revise = () => router.post(route('boqs.revise', boq.id));

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

            </div>
        </AppLayout>
    );
}
