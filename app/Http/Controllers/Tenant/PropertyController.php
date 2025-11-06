<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Models\Property;
use App\Models\PropertyContact;
use App\Models\PropertyImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PropertyController extends Controller
{
    /**
     * Display a listing of properties.
     */
    public function index()
    {
        $properties = Property::with(['primaryImage', 'primaryContact'])
            ->latest()
            ->get()
            ->map(function ($property) {
                return [
                    'id' => $property->id,
                    'address' => $property->address,
                    'city' => $property->city,
                    'province' => $property->province,
                    'postal_code' => $property->postal_code,
                    'price' => $property->price,
                    'formatted_price' => $property->display_price,
                    'type' => $property->type,
                    'status' => $property->status,
                    'category' => $property->category,
                    'sub_category' => $property->sub_category,
                    'bedrooms' => $property->bedrooms,
                    'bathrooms' => $property->bathrooms,
                    'square_feet' => $property->square_feet,
                    'description' => $property->description,
                    'image_url' => $property->primaryImage ? asset('storage/' . $property->primaryImage->image_url) : null,
                ];
            });

        return inertia('tenant/properties/index', [
            'properties' => $properties,
        ]);
    }

    /**
     * Show the form for creating a new property.
     */
    public function create()
    {
        return inertia('tenant/properties/create');
    }

    /**
     * Store a newly created property in storage.
     */
    public function store(StorePropertyRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            DB::beginTransaction();

            // Create the property
            $property = Property::create([
                'address' => $validated['address'],
                'city' => $validated['city'],
                'province' => $validated['province'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'price' => $validated['price'] ?? null,
                'security_deposit' => $validated['security_deposit'] ?? null,
                'maintenance_charges' => $validated['maintenance_charges'] ?? null,
                'price_unit' => $validated['price_unit'],
                'type' => $validated['type'],
                'status' => $validated['status'],
                'category' => $validated['category'],
                'sub_category' => $validated['sub_category'] ?? null,
                'bedrooms' => $validated['bedrooms'],
                'bathrooms' => $validated['bathrooms'] ?? null,
                'square_feet' => $validated['square_feet'] ?? null,
                'description' => $validated['description'] ?? null,
            ]);

            // Handle image uploads
            if ($request->hasFile('images')) {
                $images = $request->file('images');
                $primaryImageIndex = $validated['primary_image_index'] ?? 0;

                foreach ($images as $index => $image) {
                    // Store image in tenant's storage directory
                    $path = $image->store('properties/' . $property->id, 'public');

                    // Create image record
                    PropertyImage::create([
                        'property_id' => $property->id,
                        'image_url' => $path,
                        'display_order' => $index,
                        'is_primary' => $index == $primaryImageIndex,
                        'alt_text' => $validated['address'] . ' - Image ' . ($index + 1),
                    ]);
                }
            }

            // Create property contact
            PropertyContact::create([
                'property_id' => $property->id,
                'contact_name' => $validated['contact_name'],
                'contact_phone' => $validated['contact_phone'],
                'contact_phone_secondary' => $validated['contact_phone_secondary'] ?? null,
                'contact_email' => $validated['contact_email'] ?? null,
                'contact_whatsapp' => $validated['contact_whatsapp'] ?? null,
                'contact_type' => $validated['contact_type'],
                'is_primary' => true,
            ]);

            DB::commit();

            return redirect()
                ->route('tenant.properties.index')
                ->with('success', 'Property created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            // Log the error
            \Log::error('Property creation failed: ' . $e->getMessage());

            return back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create property. Please try again.']);
        }
    }

    /**
     * Display the specified property.
     */
    public function show(Property $property)
    {
        $property->load(['images', 'contacts']);

        return inertia('tenant/properties/show', [
            'property' => $property,
        ]);
    }

    /**
     * Update the specified property in storage.
     */
    public function update(UpdatePropertyRequest $request, Property $property): RedirectResponse
    {
        $validated = $request->validated();

        $property->update($validated);

        return redirect()
            ->route('tenant.properties.index')
            ->with('success', 'Property updated successfully!');
    }

    /**
     * Remove the specified property from storage.
     */
    public function destroy(Property $property): RedirectResponse
    {
        try {
            DB::beginTransaction();

            // Delete all images from storage
            foreach ($property->images as $image) {
                Storage::disk('public')->delete($image->image_url);
            }

            // Delete the property (cascades to images and contacts)
            $property->delete();

            DB::commit();

            return redirect()
                ->route('tenant.properties.index')
                ->with('success', 'Property deleted successfully!');

        } catch (\Exception $e) {
            DB::rollBack();

            \Log::error('Property deletion failed: ' . $e->getMessage());

            return back()
                ->withErrors(['error' => 'Failed to delete property. Please try again.']);
        }
    }
}

