import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ProjectFormData {
    client_id: string;
    name: string;
    location: string;
    covered_area_sqft: string;
    status: string;
    [key: string]: string;
}

export interface ClientOption {
    value: string;
    label: string;
}

export const projectStatuses: ClientOption[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
];

interface Props {
    data: ProjectFormData;
    setData: (key: keyof ProjectFormData, value: string) => void;
    errors: Partial<Record<keyof ProjectFormData, string>>;
    clients: ClientOption[];
}

export default function ProjectFormFields({ data, setData, errors, clients }: Props) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="client_id">
                    Client<span className="text-red-500"> *</span>
                </Label>
                <Select value={data.client_id} onValueChange={(value) => setData('client_id', value)}>
                    <SelectTrigger id="client_id" className={errors.client_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map((client) => (
                            <SelectItem key={client.value} value={client.value}>
                                {client.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.client_id && <p className="text-sm text-red-500">{errors.client_id}</p>}
                {clients.length === 0 && (
                    <p className="text-sm text-muted-foreground">No clients yet — add a client first.</p>
                )}
            </div>

            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">
                    Project Name<span className="text-red-500"> *</span>
                </Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Bahria Villa – Block C"
                    className={errors.name ? 'border-red-500' : ''}
                    autoComplete="off"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                    id="location"
                    value={data.location}
                    onChange={(e) => setData('location', e.target.value)}
                    placeholder="Site location"
                    className={errors.location ? 'border-red-500' : ''}
                    autoComplete="off"
                />
                {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="covered_area_sqft">Covered Area (sqft)</Label>
                <Input
                    id="covered_area_sqft"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.covered_area_sqft}
                    onChange={(e) => setData('covered_area_sqft', e.target.value)}
                    placeholder="e.g. 2000"
                    className={errors.covered_area_sqft ? 'border-red-500' : ''}
                    autoComplete="off"
                />
                {errors.covered_area_sqft ? (
                    <p className="text-sm text-red-500">{errors.covered_area_sqft}</p>
                ) : (
                    <p className="text-sm text-muted-foreground">The size of the building. Contracts are priced against this.</p>
                )}
            </div>

            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                    <SelectTrigger id="status" className={errors.status ? 'border-red-500' : ''}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {projectStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            </div>
        </div>
    );
}
