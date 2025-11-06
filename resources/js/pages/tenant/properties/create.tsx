import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Home, MapPin, Banknote, Info, Phone, Image as ImageIcon, X } from 'lucide-react';
import { usePropertyForm, pakistanProvinces } from '@/hooks/use-property-form';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/tenant/dashboard',
    },
    {
        title: 'Properties',
        href: '/properties',
    },
    {
        title: 'Create',
        href: '/properties/create',
    },
];

export default function CreateProperty() {
    const {
        data,
        setData,
        processing,
        errors,
        fileInputRef,
        imagePreviews,
        primaryImageIndex,
        setPrimaryImageIndex,
        handleImageSelect,
        removeImage,
        handleSubmit,
    } = usePropertyForm();

    // Format Pakistani phone number: +92 XXX XXXXXXX
    const formatPakistaniPhone = (value: string): string => {
        // Remove all non-numeric characters
        const numbers = value.replace(/\D/g, '');
        
        // If empty, return empty
        if (!numbers) return '';
        
        // Remove country code if present to normalize
        let cleaned = numbers;
        if (cleaned.startsWith('92')) {
            cleaned = cleaned.substring(2);
        }
        
        // Limit to 10 digits (Pakistani mobile numbers)
        cleaned = cleaned.substring(0, 10);
        
        // Format as +92 XXX XXXXXXX
        if (cleaned.length === 0) return '+92 ';
        if (cleaned.length <= 3) return `+92 ${cleaned}`;
        return `+92 ${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Property" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create New Property</h1>
                        <p className="text-muted-foreground">
                            Add a new property for rent or sale
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={route('tenant.properties.index')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Properties
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-8">
                    {/* Property Type & Status */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                Property Type & Status
                            </h2>
                            <p className="text-sm text-muted-foreground">Basic property classification</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Listing Type *</Label>
                                    <Select value={data.type} onValueChange={(value: 'sale' | 'rental') => setData('type', value)}>
                                        <SelectTrigger id="type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sale">For Sale</SelectItem>
                                            <SelectItem value="rental">For Rent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Property Category *</Label>
                                    <Select value={data.category} onValueChange={(value: 'house' | 'apartment' | 'plot') => setData('category', value)}>
                                        <SelectTrigger id="category">
                                            <SelectValue />
                                        </SelectTrigger>
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
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
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
                                        <Select value={data.sub_category} onValueChange={(value) => setData('sub_category', value)}>
                                            <SelectTrigger id="sub_category">
                                                <SelectValue placeholder="Select plot type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="residential">Residential</SelectItem>
                                                <SelectItem value="commercial">Commercial</SelectItem>
                                                <SelectItem value="agricultural">Agricultural</SelectItem>
                                                <SelectItem value="industrial">Industrial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.sub_category && <p className="text-sm text-destructive">{errors.sub_category}</p>}
                                    </div>
                                )}
                            </div>
                    </div>

                    {/* Location Information */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Location Information
                            </h2>
                            <p className="text-sm text-muted-foreground">Property address and location details</p>
                        </div>
                        <div className="space-y-2">
                                <Label htmlFor="address">Address *</Label>
                                <Input
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Street address, house/flat number"
                                    aria-invalid={!!errors.address}
                                    autoComplete="off"
                                />
                                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                            </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="e.g., Karachi, Lahore, Islamabad"
                                        aria-invalid={!!errors.city}
                                        autoComplete="off"
                                    />
                                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="province">Province</Label>
                                    <Select value={data.province} onValueChange={(value) => setData('province', value)}>
                                        <SelectTrigger id="province">
                                            <SelectValue placeholder="Select province" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pakistanProvinces.map((province) => (
                                                <SelectItem key={province.value} value={province.value}>
                                                    {province.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                {errors.province && <p className="text-sm text-destructive">{errors.province}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                                <Label htmlFor="postal_code">Postal Code</Label>
                                <Input
                                    id="postal_code"
                                    type="tel"
                                    value={data.postal_code}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setData('postal_code', value);
                                    }}
                                    placeholder="5-digit postal code"
                                    maxLength={10}
                                    autoComplete="off"
                                />
                                {errors.postal_code && <p className="text-sm text-destructive">{errors.postal_code}</p>}
                            </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Banknote className="h-5 w-5" />
                                Pricing Information
                            </h2>
                            <p className="text-sm text-muted-foreground">Set property price and rental charges</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">
                                        {data.type === 'rental' ? 'Rent Amount' : 'Sale Price'}
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="Leave empty for 'Price on Request'"
                                        min="0"
                                        step="0.01"
                                        aria-invalid={!!errors.price}
                                        autoComplete="off"
                                    />
                                    {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                                </div>

                                {data.type === 'rental' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="price_unit">Rent Period</Label>
                                        <Select value={data.price_unit} onValueChange={(value) => setData('price_unit', value)}>
                                            <SelectTrigger id="price_unit">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="per_month">Per Month</SelectItem>
                                                <SelectItem value="per_year">Per Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    {errors.price_unit && <p className="text-sm text-destructive">{errors.price_unit}</p>}
                                </div>
                            )}
                        </div>
                        {data.type === 'rental' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="security_deposit">Security Deposit</Label>
                                        <Input
                                            id="security_deposit"
                                            type="number"
                                            value={data.security_deposit}
                                            onChange={(e) => setData('security_deposit', e.target.value)}
                                            placeholder="Security deposit amount"
                                            min="0"
                                            step="0.01"
                                            aria-invalid={!!errors.security_deposit}
                                            autoComplete="off"
                                        />
                                        {errors.security_deposit && <p className="text-sm text-destructive">{errors.security_deposit}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maintenance_charges">Maintenance Charges</Label>
                                        <Input
                                            id="maintenance_charges"
                                            type="number"
                                            value={data.maintenance_charges}
                                            onChange={(e) => setData('maintenance_charges', e.target.value)}
                                            placeholder="Monthly maintenance"
                                            min="0"
                                            step="0.01"
                                            aria-invalid={!!errors.maintenance_charges}
                                            autoComplete="off"
                                        />
                                    {errors.maintenance_charges && <p className="text-sm text-destructive">{errors.maintenance_charges}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Property Details */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Property Details
                            </h2>
                            <p className="text-sm text-muted-foreground">Size and room specifications</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bedrooms">Bedrooms *</Label>
                                    <Input
                                        id="bedrooms"
                                        type="number"
                                        value={data.bedrooms}
                                        onChange={(e) => setData('bedrooms', e.target.value)}
                                        placeholder="Number of bedrooms (0 for studio)"
                                        min="0"
                                        aria-invalid={!!errors.bedrooms}
                                        autoComplete="off"
                                    />
                                    {errors.bedrooms && <p className="text-sm text-destructive">{errors.bedrooms}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bathrooms">Bathrooms</Label>
                                    <Input
                                        id="bathrooms"
                                        type="number"
                                        value={data.bathrooms}
                                        onChange={(e) => setData('bathrooms', e.target.value)}
                                        placeholder="Number of bathrooms"
                                        min="0"
                                        aria-invalid={!!errors.bathrooms}
                                        autoComplete="off"
                                    />
                                    {errors.bathrooms && <p className="text-sm text-destructive">{errors.bathrooms}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="square_feet">Square Feet</Label>
                                    <Input
                                        id="square_feet"
                                        type="number"
                                        value={data.square_feet}
                                        onChange={(e) => setData('square_feet', e.target.value)}
                                        placeholder="Total area in sq ft"
                                        min="0"
                                        aria-invalid={!!errors.square_feet}
                                        autoComplete="off"
                                    />
                                {errors.square_feet && <p className="text-sm text-destructive">{errors.square_feet}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Detailed description of the property, features, amenities, and any additional information..."
                                    rows={6}
                                    className="resize-none"
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>
                    </div>

                    {/* Property Images */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <ImageIcon className="h-5 w-5" />
                                Property Images
                            </h2>
                            <p className="text-sm text-muted-foreground">Upload photos of the property</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="images">Upload Images</Label>
                                <Input
                                    ref={fileInputRef}
                                    id="images"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground">
                                    You can select multiple images. Click on an image to set it as primary.
                                </p>
                            </div>

                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div
                                            key={index}
                                            className={`relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                                                primaryImageIndex === index
                                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                                    : 'border-border hover:border-primary/50'
                                            }`}
                                            onClick={() => setPrimaryImageIndex(index)}
                                        >
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            {primaryImageIndex === index && (
                                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                                    Primary
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage(index);
                                                }}
                                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Contact Information
                            </h2>
                            <p className="text-sm text-muted-foreground">Property contact person details</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_name">Contact Name *</Label>
                                    <Input
                                        id="contact_name"
                                        value={data.contact_name}
                                        onChange={(e) => setData('contact_name', e.target.value)}
                                        placeholder="Contact person name"
                                        aria-invalid={!!errors.contact_name}
                                        autoComplete="off"
                                    />
                                    {errors.contact_name && <p className="text-sm text-destructive">{errors.contact_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact_type">Contact Type</Label>
                                    <Select value={data.contact_type} onValueChange={(value) => setData('contact_type', value)}>
                                        <SelectTrigger id="contact_type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">Owner</SelectItem>
                                            <SelectItem value="agent">Agent</SelectItem>
                                            <SelectItem value="broker">Broker</SelectItem>
                                            <SelectItem value="dealer">Dealer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                {errors.contact_type && <p className="text-sm text-destructive">{errors.contact_type}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_phone">Primary Phone *</Label>
                                    <Input
                                        id="contact_phone"
                                        type="tel"
                                        value={data.contact_phone}
                                        onChange={(e) => {
                                            const formatted = formatPakistaniPhone(e.target.value);
                                            setData('contact_phone', formatted);
                                        }}
                                        placeholder="+92 300 1234567"
                                        aria-invalid={!!errors.contact_phone}
                                        autoComplete="off"
                                        maxLength={16}
                                    />
                                    {errors.contact_phone && <p className="text-sm text-destructive">{errors.contact_phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact_phone_secondary">Secondary Phone</Label>
                                    <Input
                                        id="contact_phone_secondary"
                                        type="tel"
                                        value={data.contact_phone_secondary}
                                        onChange={(e) => {
                                            const formatted = formatPakistaniPhone(e.target.value);
                                            setData('contact_phone_secondary', formatted);
                                        }}
                                        placeholder="+92 300 1234567"
                                        autoComplete="off"
                                        maxLength={16}
                                    />
                                {errors.contact_phone_secondary && <p className="text-sm text-destructive">{errors.contact_phone_secondary}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_email">Email</Label>
                                    <Input
                                        id="contact_email"
                                        type="email"
                                        value={data.contact_email}
                                        onChange={(e) => setData('contact_email', e.target.value)}
                                        placeholder="contact@example.com"
                                        aria-invalid={!!errors.contact_email}
                                        autoComplete="off"
                                    />
                                    {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="contact_whatsapp">WhatsApp Number</Label>
                                        {data.contact_phone && (
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                                onClick={() => {
                                                    setData('contact_whatsapp', data.contact_phone);
                                                }}
                                            >
                                                Same as Primary Phone
                                            </Button>
                                        )}
                                    </div>
                                    <Input
                                        id="contact_whatsapp"
                                        type="tel"
                                        value={data.contact_whatsapp}
                                        onChange={(e) => {
                                            const formatted = formatPakistaniPhone(e.target.value);
                                            setData('contact_whatsapp', formatted);
                                        }}
                                        placeholder="+92 300 1234567"
                                        autoComplete="off"
                                        maxLength={16}
                                    />
                                {errors.contact_whatsapp && <p className="text-sm text-destructive">{errors.contact_whatsapp}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href={route('tenant.properties.index')}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Property'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

