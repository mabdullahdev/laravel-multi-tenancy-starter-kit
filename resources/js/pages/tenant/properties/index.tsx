import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, MapPin, Bed, Bath, Square, Plus, Search, Filter } from 'lucide-react';

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

    const getStatusBadgeVariant = (status: Property['status']) => {
        switch (status) {
            case 'available':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'sold':
            case 'rented':
                return 'outline';
            default:
                return 'default';
        }
    };

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((property) => (
                            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-video bg-muted flex items-center justify-center">
                                    {property.image_url ? (
                                        <img
                                            src={property.image_url}
                                            alt={property.address}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Home className="h-12 w-12 text-muted-foreground" />
                                    )}
                                </div>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg mb-1">
                                                {property.formatted_price || 'Price on Request'}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                {property.address}, {property.city}
                                                {property.province && `, ${property.province}`}
                                                {property.postal_code && ` ${property.postal_code}`}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={property.type === 'rental' ? 'secondary' : 'default'}>
                                            {property.type === 'rental' ? 'Rent' : 'Sale'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Bed className="h-4 w-4" />
                                                {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                                            </div>
                                            {property.bathrooms && (
                                                <div className="flex items-center gap-1">
                                                    <Bath className="h-4 w-4" />
                                                    {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                                                </div>
                                            )}
                                            {property.square_feet && (
                                                <div className="flex items-center gap-1">
                                                    <Square className="h-4 w-4" />
                                                    {property.square_feet.toLocaleString()} sq ft
                                                </div>
                                            )}
                                        </div>
                                        
                                        {property.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {property.description}
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center justify-between pt-2">
                                            <Badge variant={getStatusBadgeVariant(property.status)}>
                                                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                                            </Badge>
                                            <Button variant="outline" size="sm" className="cursor-pointer">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
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
