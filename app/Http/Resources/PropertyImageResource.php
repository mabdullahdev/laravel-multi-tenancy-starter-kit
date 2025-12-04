<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyImageResource extends JsonResource
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
            'image_url' => $this->image_url,
            'display_order' => $this->display_order,
            'is_primary' => $this->is_primary,
            'alt_text' => $this->alt_text,
        ];
    }
}

