<?php

namespace App\Repositories;

use App\Models\Validation;
use App\Repositories\Contracts\ValidationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ValidationRepository implements ValidationRepositoryInterface
{
    public function __construct(
        protected Validation $model
    ) {}

    public function find(int $id): ?Validation
    {
        return $this->model->find($id);
    }

    public function findWithRelations(int $id, array $relations = []): ?Validation
    {
        return $this->model->with($relations)->find($id);
    }

    public function getAll(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        $this->applyFilters($query, $filters);

        return $query->get();
    }

    public function getPaginated(array $filters = [], int $perPage = 10): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        $this->applyFilters($query, $filters);

        return $query->paginate($perPage);
    }

    public function create(array $data): Validation
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $validation = $this->find($id);
        
        if (!$validation) {
            return false;
        }

        return $validation->update($data);
    }

    public function delete(int $id): bool
    {
        $validation = $this->find($id);
        
        if (!$validation) {
            return false;
        }

        return $validation->delete();
    }

    public function count(array $filters = []): int
    {
        $query = $this->model->newQuery();

        $this->applyFilters($query, $filters);

        return $query->count();
    }

    public function getByDocumentType(string $documentType, ?int $userId = null): Collection
    {
        $query = $this->model->where('document_type', $documentType);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function getByUser(int $userId): Collection
    {
        return $this->model
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getProcessing(array $ids = []): Collection
    {
        $query = $this->model->where('status', 'processing');

        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        return $query->get();
    }

    public function updateStatus(int $id, string $status, ?array $processingDetails = null): bool
    {
        $validation = $this->find($id);
        
        if (!$validation) {
            return false;
        }

        return $validation->updateStatus($status, $processingDetails);
    }

    public function getStatistics(array $filters = []): array
    {
        $query = $this->model->newQuery();

        $this->applyFilters($query, $filters);

        return [
            'total' => (clone $query)->count(),
            'by_document_type' => (clone $query)
                ->select('document_type', DB::raw('COUNT(*) as count'))
                ->groupBy('document_type')
                ->pluck('count', 'document_type')
                ->toArray(),
            'by_status' => (clone $query)
                ->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'by_category' => (clone $query)
                ->select('document_category', DB::raw('COUNT(*) as count'))
                ->groupBy('document_category')
                ->pluck('count', 'document_category')
                ->toArray(),
        ];
    }

    /**
     * Apply filters to query
     */
    protected function applyFilters($query, array $filters): void
    {
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        if (isset($filters['document_category'])) {
            $query->where('document_category', $filters['document_category']);
        }

        if (isset($filters['status'])) {
            if ($filters['status'] !== 'All') {
                $query->where('status', $filters['status']);
            }
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $query->where('file_name', 'like', '%' . $filters['search'] . '%');
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        // Default ordering
        if (!isset($filters['no_order'])) {
            $query->orderBy('created_at', 'desc');
        }
    }
}
