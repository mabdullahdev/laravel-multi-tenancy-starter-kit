import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';

export type ContractAddonForm = {
    name: string;
    unit: string;
    quantity: string;
    rate: string;
};

export type ContractMilestoneForm = {
    name: string;
    percentage: string;
    amount: string;
    due_on: string;
};

export type ContractFormData = {
    title: string;
    type: string;
    billable_area_sqft: string;
    rate_per_sqft: string;
    quality_tier: string;
    currency: string;
    signed_on: string;
    status: string;
    notes: string;
    payment_terms: string;
    exclusions: string;
    addons: ContractAddonForm[];
    milestones: ContractMilestoneForm[];
};

export interface ContractProject {
    id: number;
    name: string;
    covered_area_sqft: string | null;
}

interface Option {
    value: string;
    label: string;
}

export const contractTypes: Option[] = [
    { value: 'theka_per_sqft', label: 'Theka — per sqft' },
    { value: 'dihari', label: 'Dihari — daily wage' },
];

export const qualityTiers: Option[] = [
    { value: 'basic', label: 'Basic' },
    { value: 'standard', label: 'Standard' },
    { value: 'premium', label: 'Premium' },
];

export const contractStatuses: Option[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
];

export const LUMP_SUM = 'lump sum';

/** Units an add-on can be priced in. Most are a flat lump sum. */
export const addonUnits: string[] = [LUMP_SUM, 'sqft', 'rft', 'gallon', 'nos', 'kW'];

/** The upgrades offered on the public calculator, as quick-add presets. */
const addonPresets: ContractAddonForm[] = [
    { name: 'Basement', unit: 'sqft', quantity: '', rate: '' },
    { name: 'Solar prep', unit: 'lump sum', quantity: '1', rate: '' },
    { name: 'Roof insulation', unit: 'sqft', quantity: '', rate: '' },
    { name: 'Underground water tank', unit: 'gallon', quantity: '', rate: '' },
    { name: 'Smart home prep', unit: 'lump sum', quantity: '1', rate: '' },
];

const emptyAddon = (): ContractAddonForm => ({ name: '', unit: 'lump sum', quantity: '1', rate: '' });

const emptyMilestone = (): ContractMilestoneForm => ({ name: '', percentage: '', amount: '', due_on: '' });

/** A typical Pakistani theka schedule, as a one-click starting point. */
const milestonePresets: ContractMilestoneForm[] = [
    { name: 'Advance', percentage: '20', amount: '', due_on: '' },
    { name: 'On grey structure', percentage: '30', amount: '', due_on: '' },
    { name: 'On lenter', percentage: '30', amount: '', due_on: '' },
    { name: 'On handover', percentage: '20', amount: '', due_on: '' },
];

/** A lump sum has no quantity — it is priced as one flat amount. */
const isLumpSum = (addon: ContractAddonForm): boolean => addon.unit === LUMP_SUM;

function addonAmount(addon: ContractAddonForm): number {
    return (parseFloat(addon.quantity) || 0) * (parseFloat(addon.rate) || 0);
}

interface Props {
    data: ContractFormData;
    setData: <K extends keyof ContractFormData>(key: K, value: ContractFormData[K]) => void;
    errors: Record<string, string>;
    project: ContractProject;
}

function money(value: number, currency: string): string {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ContractFormFields({ data, setData, errors, project }: Props) {
    const isTheka = data.type === 'theka_per_sqft';

    // Mirrors Contract::booted() so the figure here matches what gets stored.
    const area = parseFloat(data.billable_area_sqft) || 0;
    const rate = parseFloat(data.rate_per_sqft) || 0;
    const addons = data.addons.reduce((sum, addon) => sum + addonAmount(addon), 0);
    const base = isTheka ? area * rate : 0;
    const total = base + addons;

    const projectArea = project.covered_area_sqft ? parseFloat(project.covered_area_sqft) : null;
    const areaDiffersFromHouse = isTheka && projectArea !== null && area > 0 && area !== projectArea;

    const addAddon = (addon: ContractAddonForm) => setData('addons', [...data.addons, { ...addon }]);

    const removeAddon = (index: number) =>
        setData('addons', data.addons.filter((_, i) => i !== index));

    const updateAddon = (index: number, key: keyof ContractAddonForm, value: string) => {
        const next = [...data.addons];
        next[index] = { ...next[index], [key]: value };
        setData('addons', next);
    };

    /**
     * Changing the unit resets the quantity. A lump sum is pinned to 1; switching
     * to a real unit clears it, because carrying the 1 over would silently price
     * "1 sqft of basement" while looking filled in.
     */
    const updateAddonUnit = (index: number, unit: string) => {
        const next = [...data.addons];
        next[index] = { ...next[index], unit, quantity: unit === LUMP_SUM ? '1' : '' };
        setData('addons', next);
    };

    const addMilestone = (milestone: ContractMilestoneForm) => setData('milestones', [...data.milestones, { ...milestone }]);

    const removeMilestone = (index: number) =>
        setData('milestones', data.milestones.filter((_, i) => i !== index));

    const updateMilestone = (index: number, key: keyof ContractMilestoneForm, value: string) => {
        const next = [...data.milestones];
        next[index] = { ...next[index], [key]: value };
        setData('milestones', next);
    };

    // Mirrors ContractController::syncMilestones() — a percentage milestone derives
    // its amount from the contract total, a flat one keeps what was entered.
    const milestoneAmount = (milestone: ContractMilestoneForm): number =>
        milestone.percentage !== '' ? (total * (parseFloat(milestone.percentage) || 0)) / 100 : parseFloat(milestone.amount) || 0;

    const scheduled = data.milestones.reduce((sum, m) => sum + milestoneAmount(m), 0);
    const scheduledPct = data.milestones.reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0);

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">
                    Contract Title<span className="text-red-500"> *</span>
                </Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="e.g. Grey Structure, Finishing, Turnkey"
                    className={errors.title ? 'border-red-500' : ''}
                    autoComplete="off"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                    <SelectTrigger id="type" className={errors.type ? 'border-red-500' : ''}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {contractTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                    <SelectTrigger id="status" className={errors.status ? 'border-red-500' : ''}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {contractStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            </div>

            {isTheka && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="billable_area_sqft">
                            Billable Area (sqft)<span className="text-red-500"> *</span>
                        </Label>
                        <Input
                            id="billable_area_sqft"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.billable_area_sqft}
                            onChange={(e) => setData('billable_area_sqft', e.target.value)}
                            placeholder="e.g. 2000"
                            className={errors.billable_area_sqft ? 'border-red-500' : ''}
                            autoComplete="off"
                        />
                        {errors.billable_area_sqft ? (
                            <p className="text-sm text-red-500">{errors.billable_area_sqft}</p>
                        ) : areaDiffersFromHouse ? (
                            <p className="text-sm text-amber-600">
                                The house is {projectArea?.toLocaleString()} sqft — this contract bills on {area.toLocaleString()}.
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Defaults to the full house. Lower it if this deal covers only part.</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rate_per_sqft">
                            Rate per sqft<span className="text-red-500"> *</span>
                        </Label>
                        <Input
                            id="rate_per_sqft"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.rate_per_sqft}
                            onChange={(e) => setData('rate_per_sqft', e.target.value)}
                            placeholder="e.g. 1175"
                            className={errors.rate_per_sqft ? 'border-red-500' : ''}
                            autoComplete="off"
                        />
                        {errors.rate_per_sqft && <p className="text-sm text-red-500">{errors.rate_per_sqft}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quality_tier">Finishing Quality</Label>
                        <Select value={data.quality_tier} onValueChange={(value) => setData('quality_tier', value)}>
                            <SelectTrigger id="quality_tier" className={errors.quality_tier ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select a tier" />
                            </SelectTrigger>
                            <SelectContent>
                                {qualityTiers.map((tier) => (
                                    <SelectItem key={tier.value} value={tier.value}>
                                        {tier.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.quality_tier && <p className="text-sm text-red-500">{errors.quality_tier}</p>}
                    </div>
                </>
            )}

            {!isTheka && (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground sm:col-span-2">
                    A dihari contract has no per-sqft rate. How you charge for one isn't modelled yet, so its amount will be whatever you
                    enter as add-ons below.
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="signed_on">Signed On</Label>
                <Input
                    id="signed_on"
                    type="date"
                    value={data.signed_on}
                    onChange={(e) => setData('signed_on', e.target.value)}
                    className={errors.signed_on ? 'border-red-500' : ''}
                />
                {errors.signed_on && <p className="text-sm text-red-500">{errors.signed_on}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="Anything else agreed with the client"
                    className={errors.notes ? 'border-red-500' : ''}
                    rows={3}
                />
                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
            </div>

            {/* Add-ons — itemised lines that roll up into the contract amount. */}
            <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                    <Label>Add-ons</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addAddon(emptyAddon())} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add Line
                    </Button>
                </div>

                {data.addons.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4">
                        <p className="text-sm text-muted-foreground">No add-ons. Add a line, or start from one of these:</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {addonPresets.map((preset) => (
                                <Button
                                    key={preset.name}
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => addAddon(preset)}
                                    className="gap-1"
                                >
                                    <Plus className="h-3 w-3" />
                                    {preset.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.addons.map((addon, index) => (
                            <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-12 sm:items-start">
                                <div className="space-y-1 sm:col-span-3">
                                    <Label htmlFor={`addon-name-${index}`} className="text-xs text-muted-foreground">
                                        Name
                                    </Label>
                                    <Input
                                        id={`addon-name-${index}`}
                                        value={addon.name}
                                        onChange={(e) => updateAddon(index, 'name', e.target.value)}
                                        placeholder="e.g. Basement"
                                        className={errors[`addons.${index}.name`] ? 'border-red-500' : ''}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-3">
                                    <Label htmlFor={`addon-unit-${index}`} className="text-xs text-muted-foreground">
                                        Priced by
                                    </Label>
                                    <Select value={addon.unit} onValueChange={(value) => updateAddonUnit(index, value)}>
                                        <SelectTrigger
                                            id={`addon-unit-${index}`}
                                            className={`whitespace-nowrap ${errors[`addons.${index}.unit`] ? 'border-red-500' : ''}`}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {addonUnits.map((unit) => (
                                                <SelectItem key={unit} value={unit}>
                                                    {unit}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {isLumpSum(addon) ? (
                                    /* One flat amount — no quantity to ask for. */
                                    <div className="space-y-1 sm:col-span-5">
                                        <Label htmlFor={`addon-rate-${index}`} className="text-xs text-muted-foreground">
                                            Amount ({data.currency})
                                        </Label>
                                        <Input
                                            id={`addon-rate-${index}`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={addon.rate}
                                            onChange={(e) => updateAddon(index, 'rate', e.target.value)}
                                            placeholder="e.g. 150000"
                                            className={errors[`addons.${index}.rate`] ? 'border-red-500' : ''}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label htmlFor={`addon-qty-${index}`} className="text-xs text-muted-foreground">
                                                Qty ({addon.unit})
                                            </Label>
                                            <Input
                                                id={`addon-qty-${index}`}
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                value={addon.quantity}
                                                onChange={(e) => updateAddon(index, 'quantity', e.target.value)}
                                                className={errors[`addons.${index}.quantity`] ? 'border-red-500' : ''}
                                            />
                                        </div>
                                        <div className="space-y-1 sm:col-span-3">
                                            <Label htmlFor={`addon-rate-${index}`} className="text-xs text-muted-foreground">
                                                Rate / {addon.unit}
                                            </Label>
                                            <Input
                                                id={`addon-rate-${index}`}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={addon.rate}
                                                onChange={(e) => updateAddon(index, 'rate', e.target.value)}
                                                className={errors[`addons.${index}.rate`] ? 'border-red-500' : ''}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Same label + h-9 control structure as the fields, so it lines up with them. */}
                                <div className="space-y-1 sm:col-span-1">
                                    <Label aria-hidden className="pointer-events-none hidden select-none text-xs opacity-0 sm:inline">
                                        &nbsp;
                                    </Label>
                                    <div className="flex h-9 items-center justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeAddon(index)}
                                            aria-label={`Remove ${addon.name || 'add-on'}`}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {!isLumpSum(addon) && (
                                    <p className="text-xs text-muted-foreground sm:col-span-12 sm:text-right">
                                        {(parseFloat(addon.quantity) || 0).toLocaleString()} {addon.unit} ×{' '}
                                        {money(parseFloat(addon.rate) || 0, data.currency)} ={' '}
                                        <span className="font-medium text-foreground">{money(addonAmount(addon), data.currency)}</span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Textarea
                    id="payment_terms"
                    value={data.payment_terms}
                    onChange={(e) => setData('payment_terms', e.target.value)}
                    placeholder="e.g. 20% advance with work order. Stage payments within 7 days of demand."
                    className={errors.payment_terms ? 'border-red-500' : ''}
                    rows={3}
                />
                {errors.payment_terms && <p className="text-sm text-red-500">{errors.payment_terms}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="exclusions">Not Included in This Price</Label>
                <Textarea
                    id="exclusions"
                    value={data.exclusions}
                    onChange={(e) => setData('exclusions', e.target.value)}
                    placeholder="e.g. Boundary wall, landscaping, external development, utility connection fees."
                    className={errors.exclusions ? 'border-red-500' : ''}
                    rows={3}
                />
                {errors.exclusions ? (
                    <p className="text-sm text-red-500">{errors.exclusions}</p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Spelled out on the contract PDF. This is where theka disputes usually start.
                    </p>
                )}
            </div>

            {/* Payment schedule — the stages the client pays against. */}
            <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                    <Label>Payment Schedule</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addMilestone(emptyMilestone())} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add Stage
                    </Button>
                </div>

                {data.milestones.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4">
                        <p className="text-sm text-muted-foreground">
                            No schedule. The client pays in one go — or start from a typical theka split:
                        </p>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setData('milestones', milestonePresets.map((m) => ({ ...m })))}
                            className="mt-3 gap-1"
                        >
                            <Plus className="h-3 w-3" />
                            20% advance / 30% grey / 30% lenter / 20% handover
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.milestones.map((milestone, index) => (
                            <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-12 sm:items-start">
                                <div className="space-y-1 sm:col-span-4">
                                    <Label htmlFor={`ms-name-${index}`} className="text-xs text-muted-foreground">
                                        Stage
                                    </Label>
                                    <Input
                                        id={`ms-name-${index}`}
                                        value={milestone.name}
                                        onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                                        placeholder="e.g. On lenter"
                                        className={errors[`milestones.${index}.name`] ? 'border-red-500' : ''}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor={`ms-pct-${index}`} className="text-xs text-muted-foreground">
                                        % of total
                                    </Label>
                                    <Input
                                        id={`ms-pct-${index}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={milestone.percentage}
                                        onChange={(e) => updateMilestone(index, 'percentage', e.target.value)}
                                        className={errors[`milestones.${index}.percentage`] ? 'border-red-500' : ''}
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <Label htmlFor={`ms-amount-${index}`} className="text-xs text-muted-foreground">
                                        or Amount
                                    </Label>
                                    <Input
                                        id={`ms-amount-${index}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={milestone.percentage !== '' ? milestoneAmount(milestone).toFixed(2) : milestone.amount}
                                        onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                                        disabled={milestone.percentage !== ''}
                                        className={errors[`milestones.${index}.amount`] ? 'border-red-500' : ''}
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-3">
                                    <Label htmlFor={`ms-due-${index}`} className="text-xs text-muted-foreground">
                                        Due (optional)
                                    </Label>
                                    <Input
                                        id={`ms-due-${index}`}
                                        type="date"
                                        value={milestone.due_on}
                                        onChange={(e) => updateMilestone(index, 'due_on', e.target.value)}
                                        className={errors[`milestones.${index}.due_on`] ? 'border-red-500' : ''}
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                    <Label aria-hidden className="pointer-events-none hidden select-none text-xs opacity-0 sm:inline">
                                        &nbsp;
                                    </Label>
                                    <div className="flex h-9 items-center justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeMilestone(index)}
                                            aria-label={`Remove ${milestone.name || 'stage'}`}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="flex items-baseline justify-between gap-4 px-1 text-sm">
                            <span className="text-muted-foreground">
                                Scheduled{scheduledPct > 0 ? ` · ${scheduledPct.toFixed(2).replace(/\.00$/, '')}%` : ''}
                            </span>
                            <span className={scheduled.toFixed(2) !== total.toFixed(2) ? 'font-medium text-amber-600' : 'font-medium'}>
                                {money(scheduled, data.currency)} of {money(total, data.currency)}
                            </span>
                        </div>
                        {scheduled.toFixed(2) !== total.toFixed(2) && (
                            <p className="px-1 text-xs text-amber-600">
                                The schedule doesn't add up to the contract amount. That's allowed — just check it's what you meant.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Live preview of what will be stored as this contract's revenue. */}
            <div className="rounded-md bg-muted/50 p-4 sm:col-span-2">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">
                        {isTheka ? `${area.toLocaleString()} sqft × ${data.currency} ${rate.toLocaleString()}` : 'Base'}
                    </span>
                    <span>{money(base, data.currency)}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">Add-ons</span>
                    <span>{money(addons, data.currency)}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-4 border-t pt-3">
                    <span className="font-medium">Contract Amount</span>
                    <span className="text-lg font-semibold">{money(total, data.currency)}</span>
                </div>
            </div>
        </div>
    );
}
