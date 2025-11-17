<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Traits\HasRoles;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'category',
        'description',
        'guard_name',
    ];

    public function __construct(array $attributes = [])
    {
        $attributes['guard_name'] = $attributes['guard_name'] ?? 'web';
        parent::__construct($attributes);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            config('permission.models.role', Role::class),
            'role_permissions',
            'permission_id',
            'role_id'
        );
    }

    public static function getGroupedPermissions(): array
    {
        return self::all()->groupBy('category')->map(function ($permissions) {
            return $permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'description' => $permission->description,
                ];
            });
        })->toArray();
    }
}
