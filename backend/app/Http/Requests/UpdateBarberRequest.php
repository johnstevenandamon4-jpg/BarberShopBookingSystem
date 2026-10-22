<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBarberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                // $this->route('barber') is the Barber model from route-model binding.
                Rule::unique('barbers', 'email')->ignore($this->route('barber')),
            ],
            'description' => ['nullable', 'string'],
            'is_available' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please enter the barber\'s name.',
            'email.unique' => 'A barber with this email already exists.',
        ];
    }
}
