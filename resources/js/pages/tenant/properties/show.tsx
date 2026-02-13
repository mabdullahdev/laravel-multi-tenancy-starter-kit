import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Home,
    MapPin,
    Bed,
    Bath,
    Square,
    Banknote,
    Phone,
    Mail,
    MessageCircle,
    Trash2,
    ChevronRight,
    Pencil,
} from 'lucide-react';

interface PropertyImage {
    id: number;
    image_url: string;
    alt_text: string | null;
    is_primary: boolean;
    display_order: number;
}

interface PropertyContact {
    id: number;
    contact_name: string;
    contact_phone: string;
    contact_phone_secondary: string | null;
    contact_email: string | null;
    contact_whatsapp: string | null;
    contact_type: string;
    is_primary: boolean;
}

interface Property {
    id: number;
    address: string;
    city: string;
    province: string | null;
    postal_code: string | null;
    price: number | string | null;
    formatted_price: string | null;
    security_deposit: number | string | null;
    maintenance_charges: number | string | null;
    price_unit: string;
    type: 'rental' | 'sale';
    status: string;
    category: string;
    sub_category: string | null;
    bedrooms: number;
    bathrooms: number | null;
    square_feet: number | null;
    description: string | null;
    images: PropertyImage[];
    contacts: PropertyContact[];
}

interface Props {
    property: Property;
}

function formatCategory(category: string, subCategory: string | null, type: string) {
    const cat = category.charAt(0).toUpperCase() + category.slice(1);
    const sub = subCategory ? ` · ${subCategory}` : '';
    return type === 'rental' ? `${cat} for rent${sub}` : `${cat} for sale${sub}`;
}

export default function PropertyShowPage({ property }: Props) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const images = property.images?.length ? property.images : [];
    const primaryContact = property.contacts?.find((c) => c.is_primary) ?? property.contacts?.[0];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/tenant/dashboard' },
        { title: 'Properties', href: '/properties' },
        { title: property.address || 'Property Details', href: route('tenant.properties.show', property.id) },
    ];

    const goNext = () => setCurrentImageIndex((i) => (i >= images.length - 1 ? 0 : i + 1));
    const goPrev = () => setCurrentImageIndex((i) => (i <= 0 ? images.length - 1 : i - 1));

    const handleDelete = () => {
        router.delete(route('tenant.properties.destroy', property.id), {
            onSuccess: () => setDeleteOpen(false),
        });
    };

    const stats: string[] = [
        `${property.bedrooms} ${property.bedrooms === 1 ? 'bed' : 'beds'}`,
        property.bathrooms != null && `${property.bathrooms} ${property.bathrooms === 1 ? 'bath' : 'baths'}`,
        property.square_feet != null && `${property.square_feet.toLocaleString()} sq ft`,
    ].filter(Boolean) as string[];

    // Airbnb-style grid: 1 large + 4 small when we have 5+ images
    const useGrid = images.length >= 5;
    const gridImages = useGrid ? images.slice(0, 5) : images;
    const showGalleryGrid = useGrid && gridImages.length === 5;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${property.address} - Property`} />

            <div className="flex flex-1 flex-col min-h-0">
                {/* Top bar - minimal */}
                <div className="border-b border-border/60 bg-background/95 sticky top-0 z-10 shrink-0">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-14 items-center justify-between">
                        <Link
                            href={route('tenant.properties.index')}
                            className="text-foreground hover:underline text-sm font-medium inline-flex items-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to listings
                        </Link>
                    </div>
                </div>

                {/* Gallery - full width, rounded bottom on mobile */}
                <div className="relative w-full bg-muted">
                    {images.length > 0 ? (
                        showGalleryGrid ? (
                            <div className="overflow-hidden rounded-b-2xl max-h-[70vh] h-[60vmin] min-h-[320px] grid grid-cols-4 grid-rows-2 gap-1 p-1 sm:p-2 sm:gap-2">
                                <button
                                    type="button"
                                    className="col-span-2 row-span-2 relative overflow-hidden rounded-l-xl sm:rounded-l-2xl"
                                    onClick={() => setCurrentImageIndex(0)}
                                >
                                    <img
                                        src={gridImages[0].image_url}
                                        alt={gridImages[0].alt_text ?? property.address}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </button>
                                {[1, 2, 3, 4].map((i) => (
                                    <button
                                        key={gridImages[i].id}
                                        type="button"
                                        className={`relative overflow-hidden ${i === 1 ? 'rounded-tr-xl sm:rounded-tr-2xl' : ''} ${i === 3 ? 'rounded-bl-xl sm:rounded-bl-2xl' : ''} ${i === 4 ? 'rounded-br-xl sm:rounded-br-2xl' : ''}`}
                                        onClick={() => setCurrentImageIndex(i)}
                                    >
                                        <img
                                            src={gridImages[i].image_url}
                                            alt={gridImages[i].alt_text ?? property.address}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="relative aspect-[4/3] max-h-[70vh] w-full sm:aspect-[16/10] rounded-b-2xl overflow-hidden">
                                <img
                                    src={images[currentImageIndex]?.image_url}
                                    alt={images[currentImageIndex]?.alt_text ?? property.address}
                                    className="w-full h-full object-cover"
                                />
                                {images.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={goPrev}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            aria-label="Previous image"
                                        >
                                            <ChevronRight className="h-5 w-5 rotate-180" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={goNext}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {images.map((_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setCurrentImageIndex(i)}
                                                    className={`h-1.5 rounded-full transition-all ${
                                                        i === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
                                                    }`}
                                                    aria-label={`View image ${i + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="aspect-[4/3] max-h-[50vh] w-full flex items-center justify-center rounded-b-2xl">
                            <Home className="h-20 w-20 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Content - two column on large screens */}
                <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Main content */}
                        <div className="lg:col-span-2 min-w-0">
                            <p className="text-sm font-medium text-foreground mt-1">
                                {formatCategory(property.category, property.sub_category, property.type)}
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mt-1">
                                {property.address}
                            </h1>
                            <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                {[property.city, property.province, property.postal_code].filter(Boolean).join(', ')}
                            </p>

                            {stats.length > 0 && (
                                <p className="mt-4 text-foreground font-medium">
                                    {stats.join(' · ')}
                                </p>
                            )}

                            <hr className="my-8 border-border" />

                            {property.description && (
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground">About this space</h2>
                                    <p className="mt-3 text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {property.description}
                                    </p>
                                </section>
                            )}

                            {property.type === 'rental' && (property.security_deposit != null || property.maintenance_charges != null) && (
                                <>
                                    <hr className="my-8 border-border" />
                                    <section>
                                        <h2 className="text-xl font-semibold text-foreground">Fees & charges</h2>
                                        <ul className="mt-3 space-y-2 text-muted-foreground">
                                            {property.security_deposit != null && (
                                                <li className="flex items-center gap-2">
                                                    <Banknote className="h-4 w-4 shrink-0" />
                                                    Security deposit: Rs. {Number(property.security_deposit).toLocaleString()}
                                                </li>
                                            )}
                                            {property.maintenance_charges != null && (
                                                <li className="flex items-center gap-2">
                                                    <Banknote className="h-4 w-4 shrink-0" />
                                                    Maintenance: Rs. {Number(property.maintenance_charges).toLocaleString()}
                                                </li>
                                            )}
                                        </ul>
                                    </section>
                                </>
                            )}
                        </div>

                        {/* Sticky card - Airbnb style */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-24 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                        <span className="text-2xl font-semibold text-foreground">
                                            {property.formatted_price ?? 'Price on request'}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {property.type === 'rental' ? 'per month' : 'total'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                                        {property.status}
                                    </p>
                                    <Button variant="outline" size="sm" className="w-full mt-3 gap-2" asChild>
                                        <Link href={route('tenant.properties.edit', property.id)}>
                                            <Pencil className="h-4 w-4" />
                                            Edit property
                                        </Link>
                                    </Button>
                                </div>

                                {primaryContact && (
                                    <div className="px-6 pb-6">
                                        <p className="text-sm font-semibold text-foreground">Contact</p>
                                        <p className="text-sm font-medium text-foreground mt-0.5">{primaryContact.contact_name}</p>
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            <a
                                                href={`tel:${primaryContact.contact_phone}`}
                                                className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-2 hover:no-underline"
                                            >
                                                <Phone className="h-3.5 w-3.5" />
                                                Call
                                            </a>
                                            {primaryContact.contact_email && (
                                                <a
                                                    href={`mailto:${primaryContact.contact_email}`}
                                                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-2 hover:no-underline"
                                                >
                                                    <Mail className="h-3.5 w-3.5" />
                                                    Email
                                                </a>
                                            )}
                                            {primaryContact.contact_whatsapp && (
                                                <a
                                                    href={`https://wa.me/${primaryContact.contact_whatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-2 hover:no-underline"
                                                >
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="px-6 pb-6 pt-2 border-t border-border">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                                        onClick={() => setDeleteOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete listing
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete this listing?</DialogTitle>
                        <DialogDescription>
                            This will permanently remove the property and its photos. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
