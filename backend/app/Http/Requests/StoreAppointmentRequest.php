<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && in_array($this->user()->role, ['admin', 'customer'], true);
    }

    public function rules(): array
    {
        return [
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
        ];
    }

    public function messages(): array
    {
        return [
            'barber_id.required' => 'Please choose a barber.',
            'barber_id.exists' => 'The selected barber does not exist.',
            'service_id.required' => 'Please choose a service.',
            'service_id.exists' => 'The selected service does not exist.',
            'appointment_date.after_or_equal' => 'The appointment date cannot be in the past.',
            'appointment_time.date_format' => 'Please provide a valid appointment time.',
        ];
    }
}

