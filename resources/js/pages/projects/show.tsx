import ConfirmDialog from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Copy, Download, Eye, FileSignature, FileText, Pencil, Plus, Trash2 } from 'lucide-react';

interface Boq {
    id: number;
    title: string;
    revision: number;
    currency: string;
    status: string;
    total_amount: string | number;
}

interface ContractAddon {
    id: number;
    name: string;
    unit: string;
    quantity: string | number;
    rate: string | number;
    amount: string | number;
}

interface Contract {
    id: number;
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
    addons: ContractAddon[];
}

interface Project {
    id: number;
    name: string;
    location: string | null;
    covered_area_sqft: string | null;
    status: string;
    client: {
        id: number;
        name: string;
        company_name: string | null;
        phone: string;
        email: string | null;
    };
    contracts: Contract[];
    contracts_total: string | number;
    boqs: Boq[];
}

interface Props {
    project: Project;
}

function formatMoney(amount: string | number, currency: string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProjectShow({ project }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: project.name, href: `/projects/${project.id}` },
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        project_id: project.id,
        title: '',
    });

    const createBoq = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('boqs.store'), { onSuccess: () => reset('title') });
    };

    const revise = (boq: Boq) => router.post(route('boqs.revise', boq.id));

    const deleteBoq = (boq: Boq) => router.delete(route('boqs.destroy', boq.id));

    const deleteContract = (contract: Contract) => router.delete(route('contracts.destroy', contract.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project.name} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Link href={route('projects.edit', project.id)}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Project
                        </Button>
                    </Link>
                </div>

                {/* Project + client summary */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-xl">{project.name}</CardTitle>
                            <Badge className="capitalize">{project.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <p className="font-medium text-muted-foreground">Location</p>
                            <p>{project.location || '—'}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Covered Area</p>
                            <p>{project.covered_area_sqft ? `${parseFloat(project.covered_area_sqft).toLocaleString()} sqft` : '—'}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Client</p>
                            <p>
                                {project.client.name}
                                {project.client.company_name ? ` · ${project.client.company_name}` : ''}
                            </p>
                            <p className="text-muted-foreground">
                                {project.client.phone}
                                {project.client.email ? ` · ${project.client.email}` : ''}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Contracts — what the client owes for this project */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileSignature className="h-4 w-4" />
                                Contracts
                            </CardTitle>
                            <Link href={route('contracts.create', project.id)}>
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    New Contract
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {project.contracts.length === 0 ? (
                            <p className="px-6 py-8 text-center text-muted-foreground">
                                No contracts yet. Add one to record what the client is paying for this project.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-4 py-3 font-medium">Title</th>
                                            <th className="px-4 py-3 font-medium">Terms</th>
                                            <th className="px-4 py-3 font-medium">Signed</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Amount</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.contracts.map((contract) => (
                                            <tr key={contract.id} className="border-b last:border-0 hover:bg-muted/40">
                                                <td className="px-4 py-3 font-medium">
                                                    {contract.title}
                                                    {contract.addons.length > 0 && (
                                                        <ul className="mt-1 space-y-0.5 text-xs font-normal text-muted-foreground">
                                                            {contract.addons.map((addon) => (
                                                                <li key={addon.id}>
                                                                    + {addon.name} · {formatMoney(addon.amount, contract.currency)}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 align-top text-muted-foreground">
                                                    {contract.type === 'theka_per_sqft' && contract.rate_per_sqft
                                                        ? `${parseFloat(contract.billable_area_sqft ?? '0').toLocaleString()} sqft × ${contract.currency} ${parseFloat(contract.rate_per_sqft).toLocaleString()}`
                                                        : 'Dihari'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{contract.signed_on ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={contract.status === 'draft' ? 'outline' : 'default'} className="capitalize">
                                                        {contract.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 font-medium">{formatMoney(contract.contract_amount, contract.currency)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={route('contracts.show', contract.id)}>
                                                            <Button variant="ghost" size="sm" className="gap-1">
                                                                <Eye className="h-3.5 w-3.5" />
                                                                View
                                                            </Button>
                                                        </Link>
                                                        <Link href={route('contracts.edit', contract.id)}>
                                                            <Button variant="ghost" size="sm" className="gap-1">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <ConfirmDialog
                                                            trigger={
                                                                <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            }
                                                            title={`Delete "${contract.title}"?`}
                                                            description="This permanently deletes the contract. This cannot be undone."
                                                            confirmLabel="Delete"
                                                            confirmVariant="destructive"
                                                            onConfirm={() => deleteContract(contract)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t bg-muted/30">
                                            <td className="px-4 py-3 font-medium" colSpan={4}>
                                                Total contracted
                                            </td>
                                            <td className="px-4 py-3 font-semibold">
                                                {formatMoney(project.contracts_total, project.contracts[0].currency)}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create BOQ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Plus className="h-4 w-4" />
                            New BOQ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={createBoq} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="title">BOQ Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Tender Estimate"
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>
                            <Button type="submit" disabled={processing} className="gap-2">
                                <Plus className="h-4 w-4" />
                                {processing ? 'Creating...' : 'Create BOQ'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* BOQ list */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4" />
                            Bills of Quantities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {project.boqs.length === 0 ? (
                            <p className="px-6 py-8 text-center text-muted-foreground">No BOQs yet. Create the first one above.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="px-4 py-3 font-medium">Title</th>
                                            <th className="px-4 py-3 font-medium">Rev</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 font-medium">Total</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.boqs.map((boq) => (
                                            <tr key={boq.id} className="border-b last:border-0 hover:bg-muted/40">
                                                <td className="px-4 py-3 font-medium">{boq.title}</td>
                                                <td className="px-4 py-3">v{boq.revision}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={boq.status === 'finalized' ? 'default' : 'outline'} className="capitalize">
                                                        {boq.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 font-medium">{formatMoney(boq.total_amount, boq.currency)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={route('boqs.show', boq.id)}>
                                                            <Button variant="ghost" size="sm" className="gap-1">
                                                                <Eye className="h-3.5 w-3.5" />
                                                                View
                                                            </Button>
                                                        </Link>
                                                        <a href={route('boqs.pdf', boq.id)}>
                                                            <Button variant="ghost" size="sm" className="gap-1">
                                                                <Download className="h-3.5 w-3.5" />
                                                                PDF
                                                            </Button>
                                                        </a>
                                                        <Link href={route('boqs.edit', boq.id)}>
                                                            <Button variant="ghost" size="sm" className="gap-1">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <ConfirmDialog
                                                            trigger={
                                                                <Button variant="ghost" size="sm" className="gap-1">
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                    Revise
                                                                </Button>
                                                            }
                                                            title={`Create a revision of "${boq.title}"?`}
                                                            description={`This copies revision ${boq.revision} into a new editable draft. The original stays unchanged as a snapshot.`}
                                                            confirmLabel="Create Revision"
                                                            onConfirm={() => revise(boq)}
                                                        />
                                                        <ConfirmDialog
                                                            trigger={
                                                                <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            }
                                                            title={`Delete "${boq.title}" (rev ${boq.revision})?`}
                                                            description="This permanently deletes this BOQ and all its sections and items. This cannot be undone."
                                                            confirmLabel="Delete"
                                                            confirmVariant="destructive"
                                                            onConfirm={() => deleteBoq(boq)}
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
            </div>
        </AppLayout>
    );
}
