<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && in_array($this->user()->role, ['admin', 'customer'], true);
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
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
                Rule::prohibitedIf($user?->role === 'customer'),
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
                'sometimes',
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'barber_id.exists' => 'The selected barber does not exist.',
            'service_id.exists' => 'The selected service does not exist.',
            'appointment_date.after_or_equal' => 'The appointment date cannot be in the past.',
            'appointment_time.date_format' => 'Please provide a valid appointment time.',
            'status.prohibited' => 'Customers cannot change appointment status.',
            'status.in' => 'The selected appointment status is invalid.',
        ];
    }
}

