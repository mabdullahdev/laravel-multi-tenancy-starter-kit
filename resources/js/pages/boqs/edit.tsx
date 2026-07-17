import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';

type ItemForm = {
    item_code: string;
    description: string;
    unit: string;
    quantity: string;
    rate: string;
};

type SectionForm = {
    name: string;
    items: ItemForm[];
};

interface Boq {
    id: number;
    project_id: number;
    title: string;
    revision: number;
    currency: string;
    status: string;
    notes: string;
    project: { id: number; name: string; client_name: string | null };
    sections: {
        id: number;
        name: string;
        items: { item_code: string; description: string; unit: string; quantity: string; rate: string }[];
    }[];
}

interface Props {
    boq: Boq;
}

/** Common units of measurement for construction BOQ line items. */
const BOQ_UNITS = [
    'm',
    'm²',
    'm³',
    'rft',
    'sft',
    'cft',
    'kg',
    'ton',
    'quintal',
    'bag',
    'nos',
    'pcs',
    'litre',
    'day',
    'LS',
    '%',
];

const emptyItem = (): ItemForm => ({ item_code: '', description: '', unit: '', quantity: '', rate: '' });

function lineAmount(item: ItemForm): number {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return qty * rate;
}

function formatMoney(value: number, currency: string): string {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BoqEdit({ boq }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: '/projects' },
        { title: boq.project.name, href: `/projects/${boq.project_id}` },
        { title: `${boq.title} (v${boq.revision})`, href: `/boqs/${boq.id}/edit` },
    ];

    const { data, setData, put, processing, errors } = useForm<{
        title: string;
        currency: string;
        status: string;
        notes: string;
        sections: SectionForm[];
    }>({
        title: boq.title,
        currency: boq.currency,
        status: boq.status,
        notes: boq.notes,
        sections: boq.sections.map((s) => ({
            name: s.name,
            items: s.items.map((i) => ({
                item_code: i.item_code,
                description: i.description,
                unit: i.unit,
                quantity: i.quantity,
                rate: i.rate,
            })),
        })),
    });

    const err = (key: string): string | undefined => (errors as Record<string, string>)[key];

    const grandTotal = data.sections.reduce(
        (sum, section) => sum + section.items.reduce((s, item) => s + lineAmount(item), 0),
        0,
    );

    // --- Section mutations ---
    const addSection = () => setData('sections', [...data.sections, { name: '', items: [emptyItem()] }]);

    const removeSection = (si: number) =>
        setData('sections', data.sections.filter((_, i) => i !== si));

    const updateSectionName = (si: number, value: string) => {
        const next = [...data.sections];
        next[si] = { ...next[si], name: value };
        setData('sections', next);
    };

    // --- Item mutations ---
    const addItem = (si: number) => {
        const next = [...data.sections];
        next[si] = { ...next[si], items: [...next[si].items, emptyItem()] };
        setData('sections', next);
    };

    const removeItem = (si: number, ii: number) => {
        const next = [...data.sections];
        next[si] = { ...next[si], items: next[si].items.filter((_, i) => i !== ii) };
        setData('sections', next);
    };

    const updateItem = (si: number, ii: number, key: keyof ItemForm, value: string) => {
        const next = [...data.sections];
        const items = [...next[si].items];
        items[ii] = { ...items[ii], [key]: value };
        next[si] = { ...next[si], items };
        setData('sections', next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('boqs.update', boq.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${boq.title}`} />
            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2">
                        <Save className="h-4 w-4" />
                        {processing ? 'Saving...' : 'Save BOQ'}
                    </Button>
                </div>

                {/* Header */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            BOQ Details
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                Revision {boq.revision} · {boq.project.name}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className={err('title') ? 'border-red-500' : ''}
                            />
                            {err('title') && <p className="text-sm text-red-500">{err('title')}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="finalized">Finalized</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Sections */}
                {data.sections.map((section, si) => {
                    const sectionTotal = section.items.reduce((s, item) => s + lineAmount(item), 0);
                    return (
                        <Card key={si}>
                            <CardHeader>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor={`section-${si}`}>Section Name *</Label>
                                        <Input
                                            id={`section-${si}`}
                                            value={section.name}
                                            onChange={(e) => updateSectionName(si, e.target.value)}
                                            placeholder="e.g. Excavation"
                                            className={err(`sections.${si}.name`) ? 'border-red-500' : ''}
                                        />
                                        {err(`sections.${si}.name`) && (
                                            <p className="text-sm text-red-500">{err(`sections.${si}.name`)}</p>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="gap-1 text-red-600 hover:text-red-700"
                                        onClick={() => removeSection(si)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Remove Section
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="px-2 py-2 font-medium">Code</th>
                                                <th className="px-2 py-2 font-medium">Description *</th>
                                                <th className="px-2 py-2 font-medium">Unit *</th>
                                                <th className="px-2 py-2 font-medium">Qty *</th>
                                                <th className="px-2 py-2 font-medium">Rate *</th>
                                                <th className="px-2 py-2 text-right font-medium">Amount</th>
                                                <th className="px-2 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.items.map((item, ii) => (
                                                <tr key={ii} className="border-b last:border-0 align-top">
                                                    <td className="px-1 py-2">
                                                        <Input
                                                            value={item.item_code}
                                                            onChange={(e) => updateItem(si, ii, 'item_code', e.target.value)}
                                                            placeholder="C-1"
                                                            className="w-20"
                                                        />
                                                    </td>
                                                    <td className="px-1 py-2">
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => updateItem(si, ii, 'description', e.target.value)}
                                                            placeholder="Work description"
                                                            className={`min-w-48 ${err(`sections.${si}.items.${ii}.description`) ? 'border-red-500' : ''}`}
                                                        />
                                                    </td>
                                                    <td className="px-1 py-2">
                                                        <Select
                                                            value={item.unit || undefined}
                                                            onValueChange={(v) => updateItem(si, ii, 'unit', v)}
                                                        >
                                                            <SelectTrigger
                                                                className={`w-24 ${err(`sections.${si}.items.${ii}.unit`) ? 'border-red-500' : ''}`}
                                                            >
                                                                <SelectValue placeholder="Unit" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {/* Keep any legacy value that isn't in the standard list selectable */}
                                                                {item.unit && !BOQ_UNITS.includes(item.unit) && (
                                                                    <SelectItem value={item.unit}>{item.unit}</SelectItem>
                                                                )}
                                                                {BOQ_UNITS.map((unit) => (
                                                                    <SelectItem key={unit} value={unit}>
                                                                        {unit}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="px-1 py-2">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(si, ii, 'quantity', e.target.value)}
                                                            className={`w-24 ${err(`sections.${si}.items.${ii}.quantity`) ? 'border-red-500' : ''}`}
                                                        />
                                                    </td>
                                                    <td className="px-1 py-2">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={item.rate}
                                                            onChange={(e) => updateItem(si, ii, 'rate', e.target.value)}
                                                            className={`w-28 ${err(`sections.${si}.items.${ii}.rate`) ? 'border-red-500' : ''}`}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-right font-medium tabular-nums">
                                                        {lineAmount(item).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                    <td className="px-1 py-2 text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => removeItem(si, ii)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addItem(si)}>
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Item
                                    </Button>
                                    <p className="text-sm text-muted-foreground">
                                        Section total: <span className="font-medium text-foreground">{formatMoney(sectionTotal, data.currency)}</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" className="gap-2" onClick={addSection}>
                        <Plus className="h-4 w-4" />
                        Add Section
                    </Button>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Grand Total</p>
                        <p className="text-2xl font-bold tabular-nums">{formatMoney(grandTotal, data.currency)}</p>
                    </div>
                </div>

                <div>
                    <Button type="submit" disabled={processing} className="gap-2">
                        <Save className="h-4 w-4" />
                        {processing ? 'Saving...' : 'Save BOQ'}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
