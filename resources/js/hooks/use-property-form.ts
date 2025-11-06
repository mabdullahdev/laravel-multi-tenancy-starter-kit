import { useState, FormEvent, useRef } from 'react';
import { router } from '@inertiajs/react';

export interface PropertyFormData {
    // Location fields
    address: string;
    city: string;
    province: string;
    postal_code: string;
    
    // Pricing fields
    price: string;
    security_deposit: string;
    maintenance_charges: string;
    price_unit: string;
    
    // Property type and status
    type: 'sale' | 'rental';
    status: string;
    category: 'house' | 'apartment' | 'plot';
    sub_category: string;
    
    // Property details
    bedrooms: string;
    bathrooms: string;
    square_feet: string;
    description: string;
    
    // Contact info
    contact_name: string;
    contact_phone: string;
    contact_phone_secondary: string;
    contact_email: string;
    contact_whatsapp: string;
    contact_type: string;
}

export const pakistanProvinces = [
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Sindh', label: 'Sindh' },
    { value: 'Khyber Pakhtunkhwa', label: 'Khyber Pakhtunkhwa' },
    { value: 'Balochistan', label: 'Balochistan' },
    { value: 'Gilgit-Baltistan', label: 'Gilgit-Baltistan' },
    { value: 'Azad Jammu and Kashmir', label: 'Azad Jammu and Kashmir' },
];

export function usePropertyForm() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
    const [processing, setProcessing] = useState<boolean>(false);
    const [errors, setErrors] = useState<Partial<Record<keyof PropertyFormData, string>>>({});

    const [data, setDataState] = useState<PropertyFormData>({
        // Location fields
        address: '',
        city: '',
        province: '',
        postal_code: '',
        
        // Pricing fields
        price: '',
        security_deposit: '',
        maintenance_charges: '',
        price_unit: 'total',
        
        // Property type and status
        type: 'sale',
        status: 'available',
        category: 'house',
        sub_category: '',
        
        // Property details
        bedrooms: '',
        bathrooms: '',
        square_feet: '',
        description: '',
        
        // Contact info
        contact_name: '',
        contact_phone: '',
        contact_phone_secondary: '',
        contact_email: '',
        contact_whatsapp: '',
        contact_type: 'owner',
    });

    const setData = <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => {
        setDataState(prev => ({ ...prev, [key]: value }));
        // Clear error for this field when user starts typing
        if (errors[key]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof PropertyFormData, string>> = {};

        // Required: address
        if (!data.address.trim()) {
            newErrors.address = 'Address is required';
        }

        // Required: city
        if (!data.city.trim()) {
            newErrors.city = 'City is required';
        }

        // Required: type (rental or sale)
        if (!data.type) {
            newErrors.type = 'Property type is required';
        }

        // Required: category (house, apartment, plot)
        if (!data.category) {
            newErrors.category = 'Property category is required';
        }

        // Required: bedrooms (can be 0, but must be a number)
        if (data.bedrooms === '') {
            newErrors.bedrooms = 'Number of bedrooms is required';
        } else if (parseInt(data.bedrooms) < 0) {
            newErrors.bedrooms = 'Bedrooms cannot be negative';
        }

        // Required: contact_name
        if (!data.contact_name.trim()) {
            newErrors.contact_name = 'Contact name is required';
        }

        // Required: contact_phone
        if (!data.contact_phone.trim()) {
            newErrors.contact_phone = 'Contact phone is required';
        } else if (!/^[\d\s\-+()]+$/.test(data.contact_phone)) {
            newErrors.contact_phone = 'Please enter a valid phone number';
        }

        // Optional but validate if provided: email
        if (data.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
            newErrors.contact_email = 'Please enter a valid email address';
        }

        // Optional but validate if provided: bathrooms
        if (data.bathrooms && parseInt(data.bathrooms) < 0) {
            newErrors.bathrooms = 'Bathrooms cannot be negative';
        }

        // Optional but validate if provided: square_feet
        if (data.square_feet && parseInt(data.square_feet) <= 0) {
            newErrors.square_feet = 'Square feet must be greater than 0';
        }

        // Optional but validate if provided: price
        if (data.price && parseFloat(data.price) < 0) {
            newErrors.price = 'Price cannot be negative';
        }

        // Optional but validate if provided: security_deposit
        if (data.security_deposit && parseFloat(data.security_deposit) < 0) {
            newErrors.security_deposit = 'Security deposit cannot be negative';
        }

        // Optional but validate if provided: maintenance_charges
        if (data.maintenance_charges && parseFloat(data.maintenance_charges) < 0) {
            newErrors.maintenance_charges = 'Maintenance charges cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setSelectedImages(prev => [...prev, ...files]);

        // Create preview URLs
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        // Clear the input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        
        // Adjust primary image index if needed
        if (primaryImageIndex === index) {
            setPrimaryImageIndex(0);
        } else if (primaryImageIndex > index) {
            setPrimaryImageIndex(primaryImageIndex - 1);
        }

        // Clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateForm()) {
            // Scroll to first error
            const firstErrorField = document.querySelector('[aria-invalid="true"]');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        setProcessing(true);
        setErrors({});
        
        // Create FormData to handle file uploads
        const formData = new FormData();
        
        // Append all form fields
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value.toString());
            }
        });
        
        // Append images
        selectedImages.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
            if (index === primaryImageIndex) {
                formData.append(`primary_image_index`, index.toString());
            }
        });
        
        // Use router.post for FormData submissions
        router.post(route('tenant.properties.store'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (errors) => {
                setProcessing(false);
                setErrors(errors as Partial<Record<keyof PropertyFormData, string>>);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return {
        // Form data
        data,
        setData,
        processing,
        errors,
        
        // Image handling
        fileInputRef,
        selectedImages,
        imagePreviews,
        primaryImageIndex,
        setPrimaryImageIndex,
        handleImageSelect,
        removeImage,
        
        // Form submission
        handleSubmit,
    };
}

