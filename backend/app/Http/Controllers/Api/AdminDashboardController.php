<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Barber;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $appointments = Appointment::query();

        $totalBookings = (clone $appointments)->count();

        $pendingBookings = (clone $appointments)
            ->where('status', 'pending')
            ->count();

        $confirmedBookings = (clone $appointments)
            ->where('status', 'confirmed')
            ->count();

        $completedBookings = (clone $appointments)
            ->where('status', 'completed')
            ->count();

        $cancelledBookings = (clone $appointments)
            ->where('status', 'cancelled')
            ->count();

        $noShowBookings = (clone $appointments)
            ->where('status', 'no_show')
            ->count();

        $bookingsByBarber = Barber::query()
            ->withCount('appointments')
            ->orderBy('name')
            ->get(['id', 'name', 'is_available']);

        // Return all appointments so React can paginate the full list.
        $recentAppointments = Appointment::query()
            ->with([
                'customer:id,name,email',
                'barber:id,name',
                'service:id,name,price',
            ])
            ->latest()
            ->get();

        return response()->json([
            'summary' => [
                'total_bookings' => $totalBookings,
                'pending_bookings' => $pendingBookings,
                'confirmed_bookings' => $confirmedBookings,
                'completed_bookings' => $completedBookings,
                'cancelled_bookings' => $cancelledBookings,
                'no_show_bookings' => $noShowBookings,
            ],
            'bookings_by_barber' => $bookingsByBarber,
            'recent_appointments' => $recentAppointments,
        ]);
    }
}
