<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => env('CENTRAL_OWNER_NAME', 'Central Owner'),
            'email' => env('CENTRAL_OWNER_EMAIL', 'owner@example.com'),
            'password' => env('CENTRAL_OWNER_PASSWORD', 'password'),
        ]);
    }
}
