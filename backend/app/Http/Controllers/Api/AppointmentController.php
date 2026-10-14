<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $appointments = Appointment::query()
            ->with(['customer:id,name,email', 'barber:id,name', 'service:id,name,price'])
            ->when(
                $request->user()->role === 'customer',
                fn ($query) => $query->where('user_id', $request->user()->id)
            )
            ->latest()
            ->paginate(10);

        return response()->json($appointments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'barber_id' => [
                'required',
                'integer',
                'exists:barbers,id',
            ],
            'service_id' => [
                'required',
                'integer',
                'exists:services,id',
            ],
            'appointment_date' => [
                'required',
                'date',
                'after_or_equal:today',
            ],
            'appointment_time' => [
                'required',
                'date_format:H:i',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $barber = \App\Models\Barber::findOrFail($validated['barber_id']);
        $service = \App\Models\Service::findOrFail($validated['service_id']);

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
            ->where('barber_id', $validated['barber_id'])
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->where('appointment_time', $validated['appointment_time'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($conflictExists) {
            return response()->json([
                'message' => 'This barber already has an appointment at that date and time.',
            ], 422);
        }

        $appointment = Appointment::create([
            'user_id' => $request->user()->id,
            'barber_id' => $validated['barber_id'],
            'service_id' => $validated['service_id'],
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Appointment created successfully.',
            'data' => $appointment->load([
                'customer:id,name,email',
                'barber:id,name',
                'service:id,name,price',
            ]),
        ], 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        if (
            $request->user()->role === 'customer'
            && $appointment->user_id !== $request->user()->id
        ) {
            return response()->json([
                'message' => 'You are not authorized to view this appointment.',
            ], 403);
        }

        return response()->json([
            'data' => $appointment->load([
                'customer:id,name,email',
                'barber:id,name',
                'service:id,name,price',
            ]),
        ]);
    }

    public function update(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();

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

        $validated = $request->validate([
            'barber_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:barbers,id',
            ],
            'service_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:services,id',
            ],
            'appointment_date' => [
                'sometimes',
                'required',
                'date',
                'after_or_equal:today',
            ],
            'appointment_time' => [
                'sometimes',
                'required',
                'date_format:H:i',
            ],
            'status' => [
                Rule::prohibitedIf($user->role === 'customer'),
                'sometimes',
                Rule::in([
                    'pending',
                    'confirmed',
                    'completed',
                    'cancelled',
                    'no_show',
                ]),
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $barberId = $validated['barber_id'] ?? $appointment->barber_id;
        $appointmentDate = $validated['appointment_date'] ?? $appointment->appointment_date->toDateString();
        $appointmentTime = $validated['appointment_time'] ?? $appointment->appointment_time;

        $conflictExists = Appointment::query()
            ->where('barber_id', $barberId)
            ->whereDate('appointment_date', $appointmentDate)
            ->where('appointment_time', $appointmentTime)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('id', '!=', $appointment->id)
            ->exists();

        if (
            $conflictExists
            && in_array($validated['status'] ?? $appointment->status, ['pending', 'confirmed'], true)
        ) {
            return response()->json([
                'message' => 'This barber already has an appointment at that date and time.',
            ], 422);
        }

        $appointment->update($validated);

        return response()->json([
            'message' => 'Appointment updated successfully.',
            'data' => $appointment->fresh()->load([
                'customer:id,name,email',
                'barber:id,name',
                'service:id,name,price',
            ]),
        ]);
    }

    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'customer') {
            if ($appointment->user_id !== $user->id) {
                return response()->json([
                    'message' => 'You are not authorized to delete this appointment.',
                ], 403);
            }

            if ($appointment->status !== 'pending') {
                return response()->json([
                    'message' => 'Only pending appointments can be cancelled by customers.',
                ], 422);
            }

            $appointment->update([
                'status' => 'cancelled',
            ]);

            return response()->json([
                'message' => 'Appointment cancelled successfully.',
                'data' => $appointment->fresh(),
            ]);
        }

        $appointment->delete();

        return response()->json(null, 204);
    }
}
