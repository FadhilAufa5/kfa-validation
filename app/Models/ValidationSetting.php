<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class ValidationSetting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'description'];

    public static function get(string $key, $default = null)
    {
        return Cache::remember("validation_setting_{$key}", 3600, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            
            if (!$setting) {
                return $default;
            }

            return match ($setting->type) {
                'int', 'integer' => (int) $setting->value,
                'float', 'double' => (float) $setting->value,
                'bool', 'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
                'json' => json_decode($setting->value, true),
                default => $setting->value,
            };
        });
    }

    public static function set(string $key, $value, string $type = 'string', ?string $description = null): void
    {
        $valueString = is_array($value) ? json_encode($value) : (string) $value;
        
        self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $valueString,
                'type' => $type,
                'description' => $description
            ]
        );

        Cache::forget("validation_setting_{$key}");
    }
}
