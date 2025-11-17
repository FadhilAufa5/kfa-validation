<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    const CATEGORY_VALIDATION = 'Validation';
    const CATEGORY_LOGIN = 'Login';
    const CATEGORY_USER = 'User';
    const CATEGORY_SETTING = 'Setting';
    const CATEGORY_REPORT = 'Report';
    const CATEGORY_PERMISSION = 'Permission';
    const CATEGORY_ROLE = 'Role';

    public static function log(
        string $action,
        ?string $description = null,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $metadata = null,
        ?string $category = null
    ): ActivityLog {
        $user = Auth::user();
        
        return ActivityLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'System',
            'user_role' => $user?->role,
            'action' => $action,
            'category' => $category,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'description' => $description,
            'metadata' => $metadata,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    public static function logLogin($user): ActivityLog
    {
        return self::log(
            action: 'login',
            description: "User {$user->name} berhasil login",
            metadata: ['user_email' => $user->email],
            category: self::CATEGORY_LOGIN
        );
    }

    public static function logLogout($user): ActivityLog
    {
        return self::log(
            action: 'logout',
            description: "User {$user->name} logout",
            metadata: ['user_email' => $user->email],
            category: self::CATEGORY_LOGIN
        );
    }

    public static function logCreate(string $entityType, $entity, ?string $description = null): ActivityLog
    {
        $category = match(strtolower($entityType)) {
            'user', 'visitor' => self::CATEGORY_USER,
            'validation' => self::CATEGORY_VALIDATION,
            'setting', 'validationsetting' => self::CATEGORY_SETTING,
            'report' => self::CATEGORY_REPORT,
            default => null
        };

        return self::log(
            action: 'create',
            description: $description ?? "Membuat {$entityType} baru",
            entityType: $entityType,
            entityId: (string) $entity->id,
            metadata: ['entity_data' => $entity->toArray()],
            category: $category
        );
    }

    public static function logUpdate(string $entityType, $entity, ?string $description = null, ?array $changes = null): ActivityLog
    {
        $category = match(strtolower($entityType)) {
            'user', 'visitor' => self::CATEGORY_USER,
            'validation' => self::CATEGORY_VALIDATION,
            'setting', 'validationsetting' => self::CATEGORY_SETTING,
            'report' => self::CATEGORY_REPORT,
            default => null
        };

        return self::log(
            action: 'update',
            description: $description ?? "Mengupdate {$entityType}",
            entityType: $entityType,
            entityId: (string) $entity->id,
            metadata: array_merge(
                ['entity_data' => $entity->toArray()],
                $changes ? ['changes' => $changes] : []
            ),
            category: $category
        );
    }

    public static function logDelete(string $entityType, $entity, ?string $description = null): ActivityLog
    {
        $category = match(strtolower($entityType)) {
            'user', 'visitor' => self::CATEGORY_USER,
            'validation' => self::CATEGORY_VALIDATION,
            'setting', 'validationsetting' => self::CATEGORY_SETTING,
            'report' => self::CATEGORY_REPORT,
            default => null
        };

        return self::log(
            action: 'delete',
            description: $description ?? "Menghapus {$entityType}",
            entityType: $entityType,
            entityId: (string) $entity->id,
            metadata: ['entity_data' => $entity->toArray()],
            category: $category
        );
    }

    public static function logUpload(string $filename, string $type, ?array $metadata = null): ActivityLog
    {
        return self::log(
            action: 'upload',
            description: "Upload file {$filename} untuk {$type}",
            entityType: 'file',
            entityId: $filename,
            metadata: array_merge(['filename' => $filename, 'type' => $type], $metadata ?? []),
            category: self::CATEGORY_VALIDATION
        );
    }

    public static function logValidation(string $filename, string $status, ?array $metadata = null): ActivityLog
    {
        return self::log(
            action: 'validation',
            description: "Validasi file {$filename} dengan status {$status}",
            entityType: 'validation',
            entityId: $filename,
            metadata: array_merge(['filename' => $filename, 'status' => $status], $metadata ?? []),
            category: self::CATEGORY_VALIDATION
        );
    }
}
