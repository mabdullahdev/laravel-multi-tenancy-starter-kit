import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Plus, Search, Filter } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/tenant/dashboard',
    },
    {
        title: 'Properties',
        href: '/properties',
    },
];

interface Property {
    id: number;
    address: string;
    city: string;
    province?: string;
    postal_code?: string;
    price?: number;
    formatted_price?: string;
    type: 'rental' | 'sale';
    status: 'available' | 'pending' | 'sold' | 'rented';
    category: 'house' | 'apartment' | 'plot';
    sub_category?: 'residential' | 'commercial' | 'agricultural' | 'industrial';
    bedrooms: number;
    bathrooms?: number;
    square_feet?: number;
    description?: string;
    image_url?: string;
}

interface Props {
    properties: Property[];
}

export default function PropertiesPage({ properties: initialProperties }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'rental' | 'sale'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'pending' | 'sold' | 'rented'>('all');

    const filteredProperties = initialProperties.filter((property) => {
        const matchesSearch =
            property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (property.province && property.province.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (property.postal_code && property.postal_code.includes(searchQuery));

        const matchesType = filterType === 'all' || property.type === filterType;
        const matchesStatus = filterStatus === 'all' || property.status === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Properties - Real Estate" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
                        <p className="text-muted-foreground">
                            Manage and view all rental and selling properties
                        </p>
                    </div>
                    <Button className="gap-2" asChild>
                        <Link href={route('tenant.properties.create')}>
                            <Plus className="h-4 w-4" />
                            Add Property
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Search & Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by address, city, or ZIP..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filterType} onValueChange={(value: 'all' | 'rental' | 'sale') => setFilterType(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Property Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="rental">Rental</SelectItem>
                                    <SelectItem value="sale">For Sale</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={(value: 'all' | 'available' | 'pending' | 'sold' | 'rented') => setFilterStatus(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="available">Available</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="sold">Sold</SelectItem>
                                    <SelectItem value="rented">Rented</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {filteredProperties.length} of {initialProperties.length} properties
                    </p>
                </div>

                {filteredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProperties.map((property) => {
                            const stats = [
                                `${property.bedrooms} ${property.bedrooms === 1 ? 'bed' : 'beds'}`,
                                property.bathrooms != null && `${property.bathrooms} ${property.bathrooms === 1 ? 'bath' : 'baths'}`,
                                property.square_feet != null && `${property.square_feet.toLocaleString()} sq ft`,
                            ].filter(Boolean) as string[];
                            return (
                                <Link
                                    key={property.id}
                                    href={route('tenant.properties.show', property.id)}
                                    className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-card hover:shadow-md transition-shadow text-left"
                                >
                                    <div className="aspect-[4/3] bg-muted flex items-center justify-center relative overflow-hidden">
                                        {property.image_url ? (
                                            <img
                                                src={property.image_url}
                                                alt={property.address}
                                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                                            />
                                        ) : (
                                            <Home className="h-12 w-12 text-muted-foreground" />
                                        )}
                                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs font-medium bg-background/90 text-foreground capitalize">
                                            {property.type === 'rental' ? 'Rent' : 'Sale'}
                                        </span>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <p className="font-semibold text-foreground">
                                            {property.formatted_price || 'Price on request'}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                            {property.address}, {property.city}
                                            {property.province && `, ${property.province}`}
                                        </p>
                                        {stats.length > 0 && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {stats.join(' · ')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-2 capitalize">
                                            {property.status}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Home className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {initialProperties.length === 0 
                                    ? 'Get started by adding your first property' 
                                    : 'Try adjusting your search or filter criteria'}
                            </p>
                            <Button variant="outline" asChild>
                                <Link href={route('tenant.properties.create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New Property
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
