<?php

namespace Database\Seeders;

use App\Models\Barber;
use Illuminate\Database\Seeder;

class BarberSeeder extends Seeder
{
    public function run(): void
    {
        Barber::insert([
            [
                'name' => 'Alex Santos',
                'phone' => '09171234561',
                'email' => 'alex.barber@example.com',
                'description' => 'Experienced barber specializing in classic haircuts.',
                'is_available' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Mark Reyes',
                'phone' => '09171234562',
                'email' => 'mark.barber@example.com',
                'description' => 'Specializes in fades and modern hairstyles.',
                'is_available' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Joshua Cruz',
                'phone' => '09171234563',
                'email' => 'joshua.barber@example.com',
                'description' => 'Provides clean cuts and beard grooming.',
                'is_available' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Daniel Garcia',
                'phone' => '09171234564',
                'email' => 'daniel.barber@example.com',
                'description' => 'Experienced in traditional and contemporary cuts.',
                'is_available' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Miguel Torres',
                'phone' => '09171234565',
                'email' => 'miguel.barber@example.com',
                'description' => 'Focuses on detailed styling and grooming.',
                'is_available' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}

