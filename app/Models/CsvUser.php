<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CsvUser extends Model
{
    use HasFactory;

    protected $table = 'csv_users';

    protected $fillable = [
        'email',
        'username',
        'role',
        'status',
    ];
}
