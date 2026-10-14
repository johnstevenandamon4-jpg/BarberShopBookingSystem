<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $barbers = Barber::where('is_available', true)->get();
        $services = Service::where('is_active', true)->get();

        if ($customers->isEmpty() || $barbers->isEmpty() || $services->isEmpty()) {
            return;
        }

        foreach (range(1, 10) as $number) {
            $date = now()->addDays($number)->toDateString();

            Appointment::create([
                'user_id' => $customers[($number - 1) % $customers->count()]->id,
                'barber_id' => $barbers[($number - 1) % $barbers->count()]->id,
                'service_id' => $services[($number - 1) % $services->count()]->id,
                'appointment_date' => $date,
                'appointment_time' => sprintf('%02d:00:00', 9 + (($number - 1) % 8)),
                'status' => $number % 3 === 0 ? 'confirmed' : 'pending',
                'notes' => 'Sample appointment for project demonstration.',
            ]);
        }
    }
}
