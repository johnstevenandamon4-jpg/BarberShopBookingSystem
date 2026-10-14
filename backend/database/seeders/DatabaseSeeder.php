<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create the admin account.
        User::updateOrCreate(
            ['email' => 'admin@barbershop.test'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('Admin12345!'),
                'role' => 'admin',
            ]
        );

        // Create sample customer accounts.
        foreach (range(1, 5) as $number) {
            User::updateOrCreate(
                ['email' => "customer{$number}@barbershop.test"],
                [
                    'name' => "Customer {$number}",
                    'password' => Hash::make('Customer123!'),
                    'role' => 'customer',
                ]
            );
        }

        // Seed barbers, services, and appointments.
        $this->call([
            BarberSeeder::class,
            ServiceSeeder::class,
            AppointmentSeeder::class,
        ]);
    }
}
