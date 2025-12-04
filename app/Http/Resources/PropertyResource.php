<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get value from resource (handles both Eloquent models and plain objects/arrays)
        $get = function ($key, $default = null) {
            if (is_array($this->resource)) {
                return $this->resource[$key] ?? $default;
            }
            if (is_object($this->resource) && method_exists($this->resource, 'getAttribute')) {
                // Eloquent model
                return $this->resource->getAttribute($key) ?? $default;
            }
            // Plain object
            return $this->resource->$key ?? $default;
        };
        
        $createdAt = $get('created_at');
        $updatedAt = $get('updated_at');
        
        // Convert to ISO string if it's a Carbon instance or string
        if ($createdAt instanceof \Carbon\Carbon) {
            $createdAt = $createdAt->toISOString();
        } elseif ($createdAt && is_string($createdAt)) {
            $createdAt = (new \Carbon\Carbon($createdAt))->toISOString();
        }
        
        if ($updatedAt instanceof \Carbon\Carbon) {
            $updatedAt = $updatedAt->toISOString();
        } elseif ($updatedAt && is_string($updatedAt)) {
            $updatedAt = (new \Carbon\Carbon($updatedAt))->toISOString();
        }
        
        return [
            'id' => $get('id'),
            'tenant_id' => $get('tenant_id'),
            'address' => $get('address'),
            'city' => $get('city'),
            'province' => $get('province'),
            'postal_code' => $get('postal_code'),
            'price' => $get('price'),
            'formatted_price' => $get('formatted_price'),
            'display_price' => $get('display_price'),
            'security_deposit' => $get('security_deposit'),
            'maintenance_charges' => $get('maintenance_charges'),
            'price_unit' => $get('price_unit'),
            'type' => $get('type'),
            'status' => $get('status'),
            'category' => $get('category'),
            'sub_category' => $get('sub_category'),
            'bedrooms' => $get('bedrooms'),
            'bathrooms' => $get('bathrooms'),
            'square_feet' => $get('square_feet'),
            'description' => $get('description'),
            'primary_image' => $this->when(
                $get('primary_image'),
                function() use ($get) {
                    $img = $get('primary_image');
                    // If it's already an array, return as is, otherwise use resource
                    if (is_array($img)) {
                        return $img;
                    }
                    return new PropertyImageResource($img);
                }
            ),
            'images' => $this->when(
                $get('images'),
                function() use ($get) {
                    $images = $get('images', []);
                    // If it's already an array of arrays, return as is
                    if (is_array($images) && (!empty($images) && is_array($images[0]))) {
                        return $images;
                    }
                    return PropertyImageResource::collection($images);
                }
            ),
            'primary_contact' => $this->when(
                $get('primary_contact'),
                function() use ($get) {
                    $contact = $get('primary_contact');
                    // If it's already an array, return as is, otherwise use resource
                    if (is_array($contact)) {
                        return $contact;
                    }
                    return new PropertyContactResource($contact);
                }
            ),
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
        ];
    }
}

