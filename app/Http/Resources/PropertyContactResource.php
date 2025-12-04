<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyContactResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'contact_name' => $this->contact_name,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'contact_phone_secondary' => $this->contact_phone_secondary,
            'contact_whatsapp' => $this->contact_whatsapp,
            'contact_type' => $this->contact_type,
            'is_primary' => $this->is_primary,
            'notes' => $this->notes,
        ];
    }
}

