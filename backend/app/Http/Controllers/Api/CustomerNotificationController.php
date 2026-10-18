<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = CustomerNotification::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'appointment:id,user_id,barber_id,service_id,appointment_date,appointment_time,status',
                'appointment.barber:id,name',
                'appointment.service:id,name',
            ])
            ->latest()
            ->paginate(10);

        return response()->json($notifications);
    }

    public function markAsRead(
        Request $request,
        CustomerNotification $customerNotification
    ): JsonResponse {
        if ($customerNotification->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'You are not authorized to access this notification.',
            ], 403);
        }

        if ($customerNotification->read_at === null) {
            $customerNotification->update([
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => $customerNotification->fresh(),
        ]);
    }
}
