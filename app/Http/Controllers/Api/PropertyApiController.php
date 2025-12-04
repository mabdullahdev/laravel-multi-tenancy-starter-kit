<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PropertyApiController extends Controller
{
    /**
     * Fetch all properties from all tenants with pagination for infinite scroll.
     * 
     * Supports optional filtering by status and/or type via query parameters.
     * This method efficiently iterates through all tenants and aggregates their properties,
     * implementing cursor-based pagination for optimal infinite scroll performance.
     * 
     * Query Parameters:
     * - page: Page number (default: 1)
     * - per_page: Items per page (default: 20, max: 100)
     * - status: Filter by status (optional, e.g., 'available', 'rented', 'sold')
     * - type: Filter by type (optional, e.g., 'rental', 'sale')
     * 
     * Examples:
     * - GET /api/properties - All properties
     * - GET /api/properties?status=available - Available properties only
     * - GET /api/properties?type=rental - Rental properties only
     * - GET /api/properties?status=available&type=rental - Available rental properties
     * 
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = max(1, min(100, (int) $request->input('per_page', 20))); // Default 20, max 100
        $page = max(1, (int) $request->input('page', 1));
        
        // Optional filters
        $status = $request->input('status');
        $type = $request->input('type');
        $category = $request->input('category');
        $city = $request->input('city');
        
        // Get all tenants
        $tenants = Tenant::all();
        
        if ($tenants->isEmpty()) {
            return $this->emptyResponse($page, $perPage, $status, $type);
        }
        
        $allProperties = collect();
        
        try {
            // Iterate through each tenant and fetch their properties
            foreach ($tenants as $tenant) {
                try {
                    // Use tenant->run() to execute code in tenant context
                    // Convert to array while still in tenant context to avoid connection issues
                    $properties = $tenant->run(function () use ($tenant, $status, $type, $category, $city) {
                        // Check if properties table exists in tenant database
                        if (!Schema::hasTable('properties')) {
                            \Log::info("Properties table does not exist for tenant: {$tenant->id}");
                            return [];
                        }
                        
                        // Build query with optional filters
                        $query = Property::with(['primaryImage', 'images', 'primaryContact']);
                        
                        // Apply filters if provided
                        if ($status) {
                            $query->where('status', $status);
                        }
                        if ($type) {
                            $query->where('type', $type);
                        }

                        if ($category) {
                            $query->where('category', $category);
                        }
                        if ($city) {
                            $query->where('city', $city);
                        }
                        
                        // Fetch properties from this tenant's database with eager loading for performance
                        $properties = $query
                            ->orderBy('created_at', 'desc')
                            ->orderBy('id', 'desc')
                            ->get();
                        
                        // Convert to array and add tenant_id while still in tenant context
                        // Extract all data manually to avoid any attribute access after leaving tenant context
                        return $properties->map(function ($property) use ($tenant) {
                            return $this->convertPropertyToArray($property, $tenant);
                        })->toArray();
                    });
                    
                    // Convert array back to collection for concatenation
                    $allProperties = $allProperties->concat(collect($properties));
                    
                } catch (\Illuminate\Database\QueryException $tenantException) {
                    // Log database connection errors but continue with other tenants
                    \Log::info("Database connection issue for tenant {$tenant->id}: " . $tenantException->getMessage());
                    continue;
                } catch (\Exception $tenantException) {
                    // Log other tenant-specific errors but continue with other tenants
                    \Log::warning("Error fetching properties for tenant {$tenant->id}", [
                        'error' => $tenantException->getMessage(),
                        'file' => $tenantException->getFile(),
                        'line' => $tenantException->getLine(),
                    ]);
                }
            }

            // Sort all properties by created_at desc (most recent first)
            // Properties are now arrays, so access as array keys
            $allProperties = $allProperties->sortByDesc(function ($property) {
                $createdAt = is_array($property) ? ($property['created_at'] ?? null) : ($property->created_at ?? null);
                if ($createdAt instanceof \Carbon\Carbon) {
                    return $createdAt->timestamp;
                }
                return $createdAt ? strtotime($createdAt) : 0;
            })->values();
            
            // Implement manual pagination
            $total = $allProperties->count();
            $offset = ($page - 1) * $perPage;
            $paginatedProperties = $allProperties->slice($offset, $perPage)->values();
            
            // Convert arrays to objects for PropertyResource
            // PropertyResource expects objects/arrays, not Eloquent models
            $propertyData = $paginatedProperties->map(function ($propertyArray) {
                if (is_array($propertyArray)) {
                    return (object) $propertyArray;
                }
                return $propertyArray;
            });
            
            // Calculate pagination metadata
            $lastPage = max(1, (int) ceil($total / $perPage));
            $hasMorePages = $page < $lastPage;
            
            // Build meta with applied filters
            $meta = [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $lastPage,
                'has_more_pages' => $hasMorePages,
                'from' => $total > 0 ? $offset + 1 : null,
                'to' => $total > 0 ? min($offset + $perPage, $total) : null,
            ];
            
            // Include filter info in meta if filters were applied
            if ($status) {
                $meta['status'] = $status;
            }
            if ($type) {
                $meta['type'] = $type;
            }
            
            return PropertyResource::collection($propertyData)->additional(['meta' => $meta]);
            
        } catch (\Exception $e) {
            // Log the error
            \Log::error('Error fetching properties from tenants', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return empty collection
            return $this->emptyResponse($page, $perPage, $status, $type);
        }
    }
    
    /**
     * Convert a property model to array while still in tenant context.
     * This prevents database connection errors when accessing attributes later.
     * 
     * @param \App\Models\Property $property
     * @param \App\Models\Tenant $tenant
     * @return array
     */
    private function convertPropertyToArray($property, $tenant): array
    {
        // Get all attributes directly (no accessors that might trigger DB queries)
        $data = [
            'id' => $property->getAttribute('id'),
            'address' => $property->getAttribute('address'),
            'city' => $property->getAttribute('city'),
            'province' => $property->getAttribute('province'),
            'postal_code' => $property->getAttribute('postal_code'),
            'price' => $property->getAttribute('price'),
            'security_deposit' => $property->getAttribute('security_deposit'),
            'maintenance_charges' => $property->getAttribute('maintenance_charges'),
            'price_unit' => $property->getAttribute('price_unit'),
            'type' => $property->getAttribute('type'),
            'status' => $property->getAttribute('status'),
            'category' => $property->getAttribute('category'),
            'sub_category' => $property->getAttribute('sub_category'),
            'bedrooms' => $property->getAttribute('bedrooms'),
            'bathrooms' => $property->getAttribute('bathrooms'),
            'square_feet' => $property->getAttribute('square_feet'),
            'description' => $property->getAttribute('description'),
            'created_at' => $property->getAttribute('created_at')?->toISOString(),
            'updated_at' => $property->getAttribute('updated_at')?->toISOString(),
            'tenant_id' => $tenant->id,
        ];
        
        // Calculate formatted prices while still in tenant context
        $price = $property->getAttribute('price');
        $type = $property->getAttribute('type');
        $priceUnit = $property->getAttribute('price_unit');
        
        if ($price !== null) {
            if ($type === 'rental') {
                $formatted = number_format((float) $price, 0, '.', ',');
                $unit = $priceUnit === 'per_sqft' ? '/sqft' : '/mo';
                $data['formatted_price'] = "Rs. {$formatted}{$unit}";
            } else {
                $priceInMillions = (float) $price / 1000000;
                $formatted = rtrim(rtrim(number_format($priceInMillions, 1, '.', ''), '0'), '.');
                $data['formatted_price'] = "Rs. {$formatted} Million";
            }
            $data['display_price'] = $data['formatted_price'];
        } else {
            $data['formatted_price'] = null;
            $data['display_price'] = 'Price on Request';
        }
        
        // Convert relationships to arrays while still in tenant context
        if ($property->relationLoaded('primaryImage') && $property->primaryImage) {
            $img = $property->primaryImage;
            $data['primary_image'] = [
                'id' => $img->getAttribute('id'),
                'property_id' => $img->getAttribute('property_id'),
                'image_url' => $img->getAttribute('image_url'),
                'display_order' => $img->getAttribute('display_order'),
                'is_primary' => $img->getAttribute('is_primary'),
                'alt_text' => $img->getAttribute('alt_text'),
            ];
        }
        
        if ($property->relationLoaded('images')) {
            $data['images'] = $property->images->map(function ($img) {
                return [
                    'id' => $img->getAttribute('id'),
                    'property_id' => $img->getAttribute('property_id'),
                    'image_url' => $img->getAttribute('image_url'),
                    'display_order' => $img->getAttribute('display_order'),
                    'is_primary' => $img->getAttribute('is_primary'),
                    'alt_text' => $img->getAttribute('alt_text'),
                ];
            })->toArray();
        }
        
        if ($property->relationLoaded('primaryContact') && $property->primaryContact) {
            $contact = $property->primaryContact;
            $data['primary_contact'] = [
                'id' => $contact->getAttribute('id'),
                'property_id' => $contact->getAttribute('property_id'),
                'contact_name' => $contact->getAttribute('contact_name'),
                'contact_email' => $contact->getAttribute('contact_email'),
                'contact_phone' => $contact->getAttribute('contact_phone'),
                'contact_phone_secondary' => $contact->getAttribute('contact_phone_secondary'),
                'contact_whatsapp' => $contact->getAttribute('contact_whatsapp'),
                'contact_type' => $contact->getAttribute('contact_type'),
                'is_primary' => $contact->getAttribute('is_primary'),
                'notes' => $contact->getAttribute('notes'),
            ];
        }
        
        return $data;
    }
    
    /**
     * Return an empty response with pagination metadata.
     * 
     * @param int $page
     * @param int $perPage
     * @param string|null $status
     * @param string|null $type
     * @return AnonymousResourceCollection
     */
    private function emptyResponse(int $page, int $perPage, ?string $status = null, ?string $type = null): AnonymousResourceCollection
    {
        $meta = [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => 0,
            'last_page' => 1,
            'has_more_pages' => false,
            'from' => null,
            'to' => null,
        ];
        
        if ($status) {
            $meta['status'] = $status;
        }
        if ($type) {
            $meta['type'] = $type;
        }
        
        return PropertyResource::collection(collect())->additional(['meta' => $meta]);
    }
    
    /**
     * Get properties by status (available, rented, sold, etc.)
     * 
     * @deprecated Use index() with status parameter instead: GET /api/properties?status=available
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function byStatus(Request $request): AnonymousResourceCollection
    {
        // Redirect to main index method with status filter
        $request->merge(['status' => $request->input('status', 'available')]);
        return $this->index($request);
    }
    
    /**
     * Get properties by type (rental, sale)
     * 
     * @deprecated Use index() with type parameter instead: GET /api/properties?type=rental
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function byType(Request $request): AnonymousResourceCollection
    {
        // Redirect to main index method with type filter
        $request->merge(['type' => $request->input('type', 'rental')]);
        return $this->index($request);
    }
}

