<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

interface MappedFileRepositoryInterface
{
    /**
     * Get mapped files by filename and document info
     */
    public function getByFile(string $filename, string $documentType, string $documentCategory): Collection;

    /**
     * Get count by file
     */
    public function countByFile(string $filename, string $documentType, string $documentCategory): int;

    /**
     * Get aggregated data grouped by connector
     */
    public function getAggregatedByConnector(string $filename, string $documentType, string $documentCategory): array;

    /**
     * Delete mapped files by filename
     */
    public function deleteByFile(string $filename, string $documentType, string $documentCategory): int;

    /**
     * Bulk insert mapped files
     */
    public function bulkInsert(array $records): bool;

    /**
     * Get mapped files with filters
     */
    public function getFiltered(array $filters): Collection;

    /**
     * Get records by connector values
     */
    public function getByConnectors(string $filename, string $documentType, string $documentCategory, array $connectors): Collection;
}
