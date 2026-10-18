<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Barber;
use App\Models\CustomerNotification;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! in_array($request->user()->role, ['admin', 'customer'], true)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        $appointments = Appointment::query()
            ->with([
                'customer:id,name,email',
                'barber:id,name,is_available',
                'service:id,name,price',
            ])
            ->when(
                $request->user()->role === 'customer',
                fn ($query) => $query->where('user_id', $request->user()->id)
            )
            ->latest()
            ->paginate(10);

        return response()->json($appointments);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $barber = Barber::findOrFail($validated['barber_id']);
        $service = Service::findOrFail($validated['service_id']);

        if (! $barber->is_available) {
            return response()->json([
                'message' => 'This barber is currently unavailable.',
            ], 422);
        }

        if (! $service->is_active) {
            return response()->json([
                'message' => 'This service is currently unavailable.',
            ], 422);
        }

        $appointment = DB::transaction(function () use ($request, $validated) {
            $conflictExists = Appointment::query()
                ->where('barber_id', $validated['barber_id'])
                ->whereDate('appointment_date', $validated['appointment_date'])
                ->where('appointment_time', $validated['appointment_time'])
                ->whereIn('status', ['pending', 'confirmed'])
                ->lockForUpdate()
                ->exists();

            if ($conflictExists) {
                return null;
            }

            return Appointment::create([
                'user_id' => $request->user()->id,
                'barber_id' => $validated['barber_id'],
                'service_id' => $validated['service_id'],
                'appointment_date' => $validated['appointment_date'],
                'appointment_time' => $validated['appointment_time'],
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        if (! $appointment) {
            return response()->json([
                'message' => 'This barber already has an appointment at that date and time.',
            ], 422);
        }

        return response()->json([
            'message' => 'Appointment created successfully.',
            'data' => $appointment->load([
                'customer:id,name,email',
                'barber:id,name,is_available',
                'service:id,name,price',
            ]),
        ], 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();

        if (! in_array($user->role, ['admin', 'customer'], true)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        if (
            $user->role === 'customer'
            && $appointment->user_id !== $user->id
        ) {
            return response()->json([
                'message' => 'You are not authorized to view this appointment.',
            ], 403);
        }

        return response()->json([
            'data' => $appointment->load([
                'customer:id,name,email',
                'barber:id,name,is_available',
                'service:id,name,price',
            ]),
        ]);
    }

    public function complete(
        Request $request,
        Appointment $appointment
    ): JsonResponse {
        $user = $request->user();

        if ($user->role !== 'customer') {
            return response()->json([
                'message' => 'Only customers can use this completion action.',
            ], 403);
        }

        if ($appointment->user_id !== $user->id) {
            return response()->json([
                'message' => 'You are not authorized to complete this appointment.',
            ], 403);
        }

        if ($appointment->status !== 'confirmed') {
            return response()->json([
                'message' => 'Only confirmed appointments can be marked as done.',
            ], 422);
        }

        $appointmentDateTime = Carbon::parse(
            $appointment->appointment_date->toDateString()
            . ' '
            . substr((string) $appointment->appointment_time, 0, 8)
        );

        if ($appointmentDateTime->isFuture()) {
            return response()->json([
                'message' => 'You can mark this appointment as done only after its scheduled date and time.',
            ], 422);
        }

        $updated = Appointment::query()
            ->whereKey($appointment->id)
            ->where('user_id', $user->id)
            ->where('status', 'confirmed')
            ->update(['status' => 'completed']);

        if (! $updated) {
            return response()->json([
                'message' => 'This appointment could not be completed. Please refresh and try again.',
            ], 422);
        }

        return response()->json([
            'message' => 'Appointment marked as done successfully.',
            'data' => $appointment->fresh()->load([
                'customer:id,name,email',
                'barber:id,name,is_available',
                'service:id,name,price',
            ]),
        ]);
    }

    public function update(
        UpdateAppointmentRequest $request,
        Appointment $appointment
    ): JsonResponse {
        $user = $request->user();

        if (! in_array($user->role, ['admin', 'customer'], true)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        if ($user->role === 'customer') {
            if ($appointment->user_id !== $user->id) {
                return response()->json([
                    'message' => 'You are not authorized to update this appointment.',
                ], 403);
            }

            if ($appointment->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending appointments can be edited by customers.',
                ], 422);
            }
        }

        $validated = $request->validated();

        if ($user->role === 'admin' && isset($validated['status'])) {
            $allowedTransitions = [
                'pending' => ['confirmed', 'cancelled'],
                'confirmed' => ['completed', 'cancelled', 'no_show'],
                'completed' => [],
                'cancelled' => [],
                'no_show' => [],
            ];

            if (
                ! in_array(
                    $validated['status'],
                    $allowedTransitions[$appointment->status] ?? [],
                    true
                )
            ) {
                return response()->json([
                    'message' => 'This appointment status transition is not allowed.',
                ], 422);
            }
        }

        $barberId = $validated['barber_id'] ?? $appointment->barber_id;
        $serviceId = $validated['service_id'] ?? $appointment->service_id;
        $appointmentDate = $validated['appointment_date']
            ?? $appointment->appointment_date->toDateString();
        $appointmentTime = $validated['appointment_time']
            ?? substr((string) $appointment->appointment_time, 0, 5);

        $isActiveBooking = in_array(
            $validated['status'] ?? $appointment->status,
            ['pending', 'confirmed'],
            true
        );

        if ($isActiveBooking) {
            $barber = Barber::findOrFail($barberId);
            $service = Service::findOrFail($serviceId);

            if (! $barber->is_available) {
                return response()->json([
                    'message' => 'This barber is currently unavailable.',
                ], 422);
            }

            if (! $service->is_active) {
                return response()->json([
                    'message' => 'This service is currently unavailable.',
                ], 422);
            }

            $conflictExists = Appointment::query()
                ->where('barber_id', $barberId)
                ->whereDate('appointment_date', $appointmentDate)
                ->where('appointment_time', $appointmentTime)
                ->whereIn('status', ['pending', 'confirmed'])
                ->where('id', '!=', $appointment->id)
                ->exists();

            if ($conflictExists) {
                return response()->json([
                    'message' => 'This barber already has an appointment at that date and time.',
                ], 422);
            }
        }

        DB::transaction(function () use ($appointment, $validated) {
            $previousStatus = $appointment->status;
            $newStatus = $validated['status'] ?? $previousStatus;

            $appointment->update($validated);

            if ($previousStatus === 'confirmed' && $newStatus === 'no_show') {
                CustomerNotification::create([
                    'user_id' => $appointment->user_id,
                    'appointment_id' => $appointment->id,
                    'title' => 'Appointment Marked as No-Show',
                    'message' => 'Your appointment scheduled for '
                        . $appointment->appointment_date->format('F j, Y')
                        . ' at '
                        . Carbon::parse(
                            (string) $appointment->appointment_time
                        )->format('g:i A')
                        . ' has been marked as No Show because you did not arrive at your scheduled appointment time. If you believe this status was assigned by mistake, please contact the barber shop.',
                ]);
            }
        });

        return response()->json([
            'message' => 'Appointment updated successfully.',
            'data' => $appointment->fresh()->load([
                'customer:id,name,email',
                'barber:id,name,is_available',
                'service:id,name,price',
            ]),
        ]);
    }

    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();

        if (! in_array($user->role, ['admin', 'customer'], true)) {
            return response()->json(['message' => 'Access denied.'], 403);
        }

        if ($user->role === 'customer') {
            if ($appointment->user_id !== $user->id) {
                return response()->json([
                    'message' => 'You are not authorized to cancel this appointment.',
                ], 403);
            }

            if ($appointment->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending appointments can be cancelled by customers.',
                ], 422);
            }

            $appointment->update(['status' => 'cancelled']);

            return response()->json([
                'message' => 'Appointment cancelled successfully.',
                'data' => $appointment->fresh()->load([
                    'customer:id,name,email',
                    'barber:id,name,is_available',
                    'service:id,name,price',
                ]),
            ]);
        }

        return response()->json([
            'message' => 'Administrators should update appointment status instead of deleting appointment history.',
        ], 422);
    }
}
