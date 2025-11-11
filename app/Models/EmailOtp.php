<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailOtp extends Model
{
    protected $fillable = [
        'email',
        'otp',
        'type',
        'expires_at',
        'verified',
        'ip_address',
        'failed_attempts',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified' => 'boolean',
        'failed_attempts' => 'integer',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        return !$this->verified && !$this->isExpired();
    }
}
