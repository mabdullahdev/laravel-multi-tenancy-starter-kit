<?php

namespace Database\Seeders;

use App\Models\Boq;
use App\Models\BoqItem;
use App\Models\BoqSection;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Database\Seeder;

class BoqExampleSeeder extends Seeder
{
    /**
     * Seed an example client → project → BOQ (Damp Proof Course) with sections
     * and line items, so the BOQ screens have realistic data to click through.
     */
    public function run(): void
    {
        $client = Client::create([
            'name' => 'Ahmed Khan',
            'company_name' => 'Khan Builders',
            'email' => 'ahmed@khanbuilders.pk',
            'phone' => '+92 300 1234567',
            'whatsapp' => '+92 300 1234567',
            'cnic' => '35202-1234567-1',
            'address' => '12-B, Model Town',
            'city' => 'Lahore',
            'province' => 'Punjab',
            'postal_code' => '54000',
        ]);

        $project = Project::create([
            'client_id' => $client->id,
            'name' => 'Boundary Wall',
            'location' => 'DHA Phase 5, Lahore',
            'status' => 'active',
        ]);

        $boq = Boq::create([
            'project_id' => $project->id,
            'title' => 'Damp Proof Course',
            'revision' => 1,
            'currency' => 'PKR',
            'status' => 'finalized',
            'total_amount' => 0,
            'notes' => 'Rates exclude sales tax. Water and electricity to be provided at site by client.',
        ]);

        $sections = [
            [
                'name' => 'Surface Preparation',
                'items' => [
                    ['item_code' => 'SP-1', 'description' => 'Clean and level plinth top before laying DPC', 'unit' => 'm²', 'quantity' => 9.2, 'rate' => 80],
                ],
            ],
            [
                'name' => 'Concrete Work',
                'items' => [
                    ['item_code' => 'CW-1', 'description' => '1:2:4 cement concrete for DPC, 40 mm thick', 'unit' => 'm²', 'quantity' => 9.2, 'rate' => 850],
                    ['item_code' => 'CW-2', 'description' => 'Edge shuttering / formwork to sides of DPC', 'unit' => 'm', 'quantity' => 80, 'rate' => 120],
                ],
            ],
            [
                'name' => 'Waterproofing',
                'items' => [
                    ['item_code' => 'WP-1', 'description' => 'Integral waterproofing compound added to DPC concrete', 'unit' => 'kg', 'quantity' => 18, 'rate' => 320],
                    ['item_code' => 'WP-2', 'description' => 'Two coats bitumen coating over DPC surface', 'unit' => 'm²', 'quantity' => 9.2, 'rate' => 250],
                ],
            ],
        ];

        foreach ($sections as $order => $sectionData) {
            $section = BoqSection::create([
                'boq_id' => $boq->id,
                'name' => $sectionData['name'],
                'display_order' => $order,
            ]);

            foreach ($sectionData['items'] as $itemOrder => $item) {
                BoqItem::create([
                    'boq_section_id' => $section->id,
                    'item_code' => $item['item_code'],
                    'description' => $item['description'],
                    'unit' => $item['unit'],
                    'quantity' => $item['quantity'],
                    'rate' => $item['rate'],
                    'display_order' => $itemOrder,
                ]);
            }
        }

        // Roll up the denormalized total from the seeded items.
        $boq->recalculateTotal();
    }
}
