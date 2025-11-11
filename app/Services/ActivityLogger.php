<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    public static function log(
        string $action,
        ?string $description = null,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $metadata = null
    ): ActivityLog {
        $user = Auth::user();
        
        return ActivityLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'System',
            'user_role' => $user?->role,
            'action' => $action,
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
            metadata: ['user_email' => $user->email]
        );
    }

    public static function logLogout($user): ActivityLog
    {
        return self::log(
            action: 'logout',
            description: "User {$user->name} logout",
            metadata: ['user_email' => $user->email]
        );
    }

    public static function logCreate(string $entityType, $entity, ?string $description = null): ActivityLog
    {
        return self::log(
            action: 'create',
            description: $description ?? "Membuat {$entityType} baru",
            entityType: $entityType,
            entityId: (string) $entity->id,
            metadata: ['entity_data' => $entity->toArray()]
        );
    }

    public static function logUpdate(string $entityType, $entity, ?string $description = null, ?array $changes = null): ActivityLog
    {
        return self::log(
            action: 'update',
            description: $description ?? "Mengupdate {$entityType}",
            entityType: $entityType,
            entityId: (string) $entity->id,
            metadata: array_merge(
                ['entity_data' => $entity->toArray()],
                $changes ? ['changes' => $changes] : []
            )
        );
    }

    public static function logDelete(string $entityType, $entity, ?string $description = null): ActivityLog
    {
        return self::log(
            action: 'delete',
            description: $description ?? "Menghapus {$entityType}",
            entityType: $entityType,
            entityId: (string) $entity->id,
            metadata: ['entity_data' => $entity->toArray()]
        );
    }

    public static function logUpload(string $filename, string $type, ?array $metadata = null): ActivityLog
    {
        return self::log(
            action: 'upload',
            description: "Upload file {$filename} untuk {$type}",
            entityType: 'file',
            entityId: $filename,
            metadata: array_merge(['filename' => $filename, 'type' => $type], $metadata ?? [])
        );
    }

    public static function logValidation(string $filename, string $status, ?array $metadata = null): ActivityLog
    {
        return self::log(
            action: 'validation',
            description: "Validasi file {$filename} dengan status {$status}",
            entityType: 'validation',
            entityId: $filename,
            metadata: array_merge(['filename' => $filename, 'status' => $status], $metadata ?? [])
        );
    }
}
