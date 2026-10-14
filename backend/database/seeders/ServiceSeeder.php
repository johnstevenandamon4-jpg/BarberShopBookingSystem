<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        Service::insert([
            [
                'name' => 'Basic Haircut',
                'description' => 'A simple, clean haircut.',
                'price' => 100.00,
                'duration_minutes' => 30,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Skin Fade',
                'description' => 'A modern fade haircut with a clean finish.',
                'price' => 150.00,
                'duration_minutes' => 45,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Haircut and Beard Trim',
                'description' => 'A haircut combined with beard trimming.',
                'price' => 200.00,
                'duration_minutes' => 60,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Buzz Cut',
                'description' => 'A short, low-maintenance haircut.',
                'price' => 80.00,
                'duration_minutes' => 20,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Hair and Scalp Treatment',
                'description' => 'A basic hair and scalp care treatment.',
                'price' => 250.00,
                'duration_minutes' => 45,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
