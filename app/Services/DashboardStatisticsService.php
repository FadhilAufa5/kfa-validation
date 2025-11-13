<?php

namespace App\Services;

use App\Models\User;
use App\Models\Validation;
use App\Models\ActivityLog;
use App\Repositories\Contracts\ValidationRepositoryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardStatisticsService
{
    public function __construct(
        protected ValidationRepositoryInterface $validationRepository,
        protected ValidationConfigService $configService
    ) {}

    /**
     * Get dashboard statistics with caching
     */
    public function getStatistics(?int $userId = null, ?string $role = null): array
    {
        $cacheKey = "dashboard_stats_{$userId}_{$role}";
        $cacheTtl = $this->configService->getStatsCacheTtl();

        return Cache::remember($cacheKey, $cacheTtl, function () use ($userId, $role) {
            return $this->computeStatistics($userId, $role);
        });
    }

    /**
     * Compute dashboard statistics
     */
    protected function computeStatistics(?int $userId, ?string $role): array
    {
        $filters = $this->buildFilters($userId, $role);

        // Single optimized query for all counts
        $stats = $this->validationRepository->getStatistics($filters);

        // Get additional metrics
        $filesChangeFromLastMonth = $this->getFilesChangeFromLastMonth($filters);
        $lastWeekPembelian = $this->getLastWeekCount('pembelian', $filters);
        $todayPenjualan = $this->getTodayCount('penjualan', $filters);

        return [
            'totalFiles' => $stats['total'],
            'totalPembelian' => $stats['by_document_type']['pembelian'] ?? 0,
            'totalPenjualan' => $stats['by_document_type']['penjualan'] ?? 0,
            'filesChangeFromLastMonth' => $filesChangeFromLastMonth,
            'lastWeekPembelian' => $lastWeekPembelian,
            'todayPenjualan' => $todayPenjualan,
        ];
    }

    /**
     * Get active users count
     */
    public function getActiveUsersCount(): int
    {
        return User::all()->filter(function ($user) {
            return Cache::has('user-is-online-' . $user->id);
        })->count();
    }

    /**
     * Get document distribution (for charts)
     */
    public function getDocumentDistribution(string $documentType, ?int $userId = null, ?string $role = null): array
    {
        $cacheKey = "chart_distribution_{$documentType}_{$userId}_{$role}";
        $cacheTtl = $this->configService->getChartDataCacheTtl();

        return Cache::remember($cacheKey, $cacheTtl, function () use ($documentType, $userId, $role) {
            $filters = $this->buildFilters($userId, $role);
            $filters['document_type'] = $documentType;

            $stats = $this->validationRepository->getStatistics($filters);

            $distribution = [];
            foreach ($stats['by_category'] as $category => $count) {
                $distribution[] = [
                    'name' => $category,
                    'value' => $count,
                ];
            }

            return $distribution;
        });
    }

    /**
     * Get recent activities
     */
    public function getRecentActivities(?int $userId = null, ?string $role = null, int $limit = 10): array
    {
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit);

        // Apply role-based filtering
        if ($role === 'user' && $userId) {
            $query->where('user_id', $userId);
        } elseif ($role === 'visitor' && $userId) {
            $assignedUserId = User::find($userId)?->assigned_user_id ?? $userId;
            $query->where('user_id', $assignedUserId);
        }

        return $query->get()->map(function ($activity) {
            $minutesAgo = $activity->created_at->diffInMinutes(now());
            $isNew = $minutesAgo <= 10;

            return [
                'id' => $activity->id,
                'user' => $activity->user_name,
                'action' => $activity->description ?? $activity->action,
                'time' => $activity->created_at->diffForHumans(),
                'isNew' => $isNew,
            ];
        })->toArray();
    }

    /**
     * Build filters based on user role
     */
    protected function buildFilters(?int $userId, ?string $role): array
    {
        $filters = [];

        if ($role === 'user' && $userId) {
            $filters['user_id'] = $userId;
        } elseif ($role === 'visitor' && $userId) {
            $filters['user_id'] = User::find($userId)?->assigned_user_id ?? $userId;
        }

        return $filters;
    }

    /**
     * Get files change from last month
     */
    protected function getFilesChangeFromLastMonth(array $filters): int
    {
        $currentMonthCount = $this->validationRepository->count($filters);

        $lastMonthFilters = array_merge($filters, [
            'date_from' => now()->subMonth()->startOfMonth()->toDateString(),
            'date_to' => now()->subMonth()->endOfMonth()->toDateString(),
        ]);

        $lastMonthCount = $this->validationRepository->count($lastMonthFilters);

        return $currentMonthCount - $lastMonthCount;
    }

    /**
     * Get last week count for document type
     */
    protected function getLastWeekCount(string $documentType, array $filters): int
    {
        $weekFilters = array_merge($filters, [
            'document_type' => $documentType,
            'date_from' => now()->subWeek()->toDateString(),
        ]);

        return $this->validationRepository->count($weekFilters);
    }

    /**
     * Get today count for document type
     */
    protected function getTodayCount(string $documentType, array $filters): int
    {
        $todayFilters = array_merge($filters, [
            'document_type' => $documentType,
            'date_from' => now()->toDateString(),
            'date_to' => now()->toDateString(),
        ]);

        return $this->validationRepository->count($todayFilters);
    }

    /**
     * Clear dashboard cache
     */
    public function clearCache(?int $userId = null, ?string $role = null): void
    {
        if ($userId && $role) {
            Cache::forget("dashboard_stats_{$userId}_{$role}");
            Cache::forget("chart_distribution_pembelian_{$userId}_{$role}");
            Cache::forget("chart_distribution_penjualan_{$userId}_{$role}");
        } else {
            // Clear all dashboard caches
            Cache::flush();
        }
    }
}
