<?php

namespace App\Repositories\Contracts;

use App\Models\Validation;
use Illuminate\Database\Eloquent\Collection;

interface ValidationRepositoryInterface
{
    /**
     * Find validation by ID
     */
    public function find(int $id): ?Validation;

    /**
     * Find validation by ID with relationships
     */
    public function findWithRelations(int $id, array $relations = []): ?Validation;

    /**
     * Get all validations with optional filters
     */
    public function getAll(array $filters = []): Collection;

    /**
     * Get paginated validations
     */
    public function getPaginated(array $filters = [], int $perPage = 10): \Illuminate\Pagination\LengthAwarePaginator;

    /**
     * Create new validation
     */
    public function create(array $data): Validation;

    /**
     * Update validation
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete validation
     */
    public function delete(int $id): bool;

    /**
     * Get validation count by filters
     */
    public function count(array $filters = []): int;

    /**
     * Get validations by document type
     */
    public function getByDocumentType(string $documentType, ?int $userId = null): Collection;

    /**
     * Get validations by user
     */
    public function getByUser(int $userId): Collection;

    /**
     * Get processing validations
     */
    public function getProcessing(array $ids = []): Collection;

    /**
     * Update validation status
     */
    public function updateStatus(int $id, string $status, ?array $processingDetails = null): bool;

    /**
     * Get validation statistics
     */
    public function getStatistics(array $filters = []): array;
}
