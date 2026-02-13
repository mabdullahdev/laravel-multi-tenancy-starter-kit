import { useState, FormEvent } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Home, MapPin, Banknote, Info } from 'lucide-react';
import { pakistanProvinces } from '@/hooks/use-property-form';

interface EditPropertyFormData {
    address: string;
    city: string;
    province: string;
    postal_code: string;
    price: string;
    security_deposit: string;
    maintenance_charges: string;
    price_unit: string;
    type: 'sale' | 'rental';
    status: string;
    category: 'house' | 'apartment' | 'plot';
    sub_category: string;
    bedrooms: string;
    bathrooms: string;
    square_feet: string;
    description: string;
}

interface Property extends EditPropertyFormData {
    id: number;
}

interface Props {
    property: Property;
}

function toFormData(property: Property): EditPropertyFormData {
    return {
        address: property.address ?? '',
        city: property.city ?? '',
        province: property.province ?? '',
        postal_code: property.postal_code ?? '',
        price: property.price ?? '',
        security_deposit: property.security_deposit ?? '',
        maintenance_charges: property.maintenance_charges ?? '',
        price_unit: property.price_unit ?? 'total',
        type: property.type ?? 'sale',
        status: property.status ?? 'available',
        category: property.category ?? 'house',
        sub_category: property.sub_category ?? '',
        bedrooms: property.bedrooms ?? '',
        bathrooms: property.bathrooms ?? '',
        square_feet: property.square_feet ?? '',
        description: property.description ?? '',
    };
}

export default function EditPropertyPage({ property: initialProperty }: Props) {
    const [data, setData] = useState<EditPropertyFormData>(() => toFormData(initialProperty));
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof EditPropertyFormData, string>>>({});

    const setDataField = <K extends keyof EditPropertyFormData>(key: K, value: EditPropertyFormData[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/tenant/dashboard' },
        { title: 'Properties', href: '/properties' },
        { title: initialProperty.address || 'Property', href: route('tenant.properties.show', initialProperty.id) },
        { title: 'Edit', href: route('tenant.properties.edit', initialProperty.id) },
    ];

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        router.put(route('tenant.properties.update', initialProperty.id), {
            ...data,
            price_unit: data.type === 'sale' ? 'total' : data.price_unit,
            price: data.price === '' ? null : Number(data.price),
            security_deposit: data.security_deposit === '' ? null : Number(data.security_deposit),
            maintenance_charges: data.maintenance_charges === '' ? null : Number(data.maintenance_charges),
            bedrooms: Number(data.bedrooms) || 0,
            bathrooms: data.bathrooms === '' ? null : Number(data.bathrooms),
            square_feet: data.square_feet === '' ? null : Number(data.square_feet),
            sub_category: data.sub_category || null,
            province: data.province || null,
            postal_code: data.postal_code || null,
            description: data.description || null,
        }, {
            onSuccess: () => setProcessing(false),
            onError: (err) => {
                setProcessing(false);
                setErrors(err as Partial<Record<keyof EditPropertyFormData, string>>);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${initialProperty.address}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
                        <p className="text-muted-foreground">{initialProperty.address}</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={route('tenant.properties.show', initialProperty.id)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Property
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-8">
                    {/* Property Type & Status */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Property Type & Status
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Listing Type *</Label>
                                <Select value={data.type} onValueChange={(v: 'sale' | 'rental') => setDataField('type', v)}>
                                    <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sale">For Sale</SelectItem>
                                        <SelectItem value="rental">For Rent</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Property Category *</Label>
                                <Select value={data.category} onValueChange={(v: 'house' | 'apartment' | 'plot') => setDataField('category', v)}>
                                    <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="house">House</SelectItem>
                                        <SelectItem value="apartment">Apartment</SelectItem>
                                        <SelectItem value="plot">Plot</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select value={data.status} onValueChange={(v) => setDataField('status', v)}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="sold">Sold</SelectItem>
                                        <SelectItem value="rented">Rented</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                            </div>
                            {data.category === 'plot' && (
                                <div className="space-y-2">
                                    <Label htmlFor="sub_category">Plot Type</Label>
                                    <Select value={data.sub_category} onValueChange={(v) => setDataField('sub_category', v)}>
                                        <SelectTrigger id="sub_category"><SelectValue placeholder="Select plot type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="residential">Residential</SelectItem>
                                            <SelectItem value="commercial">Commercial</SelectItem>
                                            <SelectItem value="agricultural">Agricultural</SelectItem>
                                            <SelectItem value="industrial">Industrial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Location
                        </h2>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input id="address" value={data.address} onChange={(e) => setDataField('address', e.target.value)} placeholder="Street address" aria-invalid={!!errors.address} />
                            {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input id="city" value={data.city} onChange={(e) => setDataField('city', e.target.value)} placeholder="City" aria-invalid={!!errors.city} />
                                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="province">Province</Label>
                                <Select value={data.province} onValueChange={(v) => setDataField('province', v)}>
                                    <SelectTrigger id="province"><SelectValue placeholder="Select province" /></SelectTrigger>
                                    <SelectContent>
                                        {pakistanProvinces.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="postal_code">Postal Code</Label>
                            <Input id="postal_code" value={data.postal_code} onChange={(e) => setDataField('postal_code', e.target.value.replace(/\D/g, ''))} placeholder="Postal code" maxLength={10} />
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Banknote className="h-5 w-5" />
                            Pricing
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">{data.type === 'rental' ? 'Rent Amount' : 'Sale Price'}</Label>
                                <Input id="price" type="number" min={0} step="0.01" value={data.price} onChange={(e) => setDataField('price', e.target.value)} placeholder="Price on request" />
                                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                            </div>
                            {data.type === 'rental' && (
                                <div className="space-y-2">
                                    <Label htmlFor="price_unit">Rent Period</Label>
                                    <Select value={data.price_unit} onValueChange={(v) => setDataField('price_unit', v)}>
                                        <SelectTrigger id="price_unit"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="per_month">Per Month</SelectItem>
                                            <SelectItem value="per_year">Per Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        {data.type === 'rental' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="security_deposit">Security Deposit</Label>
                                    <Input id="security_deposit" type="number" min={0} step="0.01" value={data.security_deposit} onChange={(e) => setDataField('security_deposit', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maintenance_charges">Maintenance Charges</Label>
                                    <Input id="maintenance_charges" type="number" min={0} step="0.01" value={data.maintenance_charges} onChange={(e) => setDataField('maintenance_charges', e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Property Details */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Property Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bedrooms">Bedrooms *</Label>
                                <Input id="bedrooms" type="number" min={0} value={data.bedrooms} onChange={(e) => setDataField('bedrooms', e.target.value)} aria-invalid={!!errors.bedrooms} />
                                {errors.bedrooms && <p className="text-sm text-destructive">{errors.bedrooms}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bathrooms">Bathrooms</Label>
                                <Input id="bathrooms" type="number" min={0} value={data.bathrooms} onChange={(e) => setDataField('bathrooms', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="square_feet">Square Feet</Label>
                                <Input id="square_feet" type="number" min={0} value={data.square_feet} onChange={(e) => setDataField('square_feet', e.target.value)} />
                                {errors.square_feet && <p className="text-sm text-destructive">{errors.square_feet}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" rows={6} className="resize-none" value={data.description} onChange={(e) => setDataField('description', e.target.value)} placeholder="Property description..." />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href={route('tenant.properties.show', initialProperty.id)}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
