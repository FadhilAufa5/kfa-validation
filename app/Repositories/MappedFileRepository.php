<?php

namespace App\Repositories;

use App\Models\MappedUploadedFile;
use App\Repositories\Contracts\MappedFileRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MappedFileRepository implements MappedFileRepositoryInterface
{
    public function __construct(
        protected MappedUploadedFile $model
    ) {}

    public function getByFile(string $filename, string $documentType, string $documentCategory): Collection
    {
        return $this->model
            ->where('filename', $filename)
            ->where('document_type', $documentType)
            ->where('document_category', $documentCategory)
            ->get();
    }

    public function countByFile(string $filename, string $documentType, string $documentCategory): int
    {
        return $this->model
            ->where('filename', $filename)
            ->where('document_type', $documentType)
            ->where('document_category', $documentCategory)
            ->count();
    }

    public function getAggregatedByConnector(string $filename, string $documentType, string $documentCategory): array
    {
        $results = DB::table('mapped_uploaded_files')
            ->select('connector', DB::raw('SUM(CAST(sum_field AS REAL)) as total'))
            ->where('filename', $filename)
            ->where('document_type', $documentType)
            ->where('document_category', $documentCategory)
            ->whereNotNull('connector')
            ->where('connector', '!=', '')
            ->groupBy('connector')
            ->get();

        $map = [];
        foreach ($results as $result) {
            $key = trim($result->connector);
            if ($key !== '') {
                $map[$key] = (float) $result->total;
            }
        }

        return $map;
    }

    public function deleteByFile(string $filename, string $documentType, string $documentCategory): int
    {
        return $this->model
            ->where('filename', $filename)
            ->where('document_type', $documentType)
            ->where('document_category', $documentCategory)
            ->delete();
    }

    public function bulkInsert(array $records): bool
    {
        if (empty($records)) {
            return true;
        }

        $chunkSize = 500;
        $chunks = array_chunk($records, $chunkSize);

        foreach ($chunks as $chunk) {
            $inserted = $this->model->insert($chunk);
            if (!$inserted) {
                return false;
            }
        }

        return true;
    }

    public function getFiltered(array $filters): Collection
    {
        $query = $this->model->newQuery();

        if (isset($filters['filename'])) {
            $query->where('filename', $filters['filename']);
        }

        if (isset($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        if (isset($filters['document_category'])) {
            $query->where('document_category', $filters['document_category']);
        }

        if (isset($filters['connector'])) {
            $query->where('connector', $filters['connector']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return $query->get();
    }

    public function getByConnectors(string $filename, string $documentType, string $documentCategory, array $connectors): Collection
    {
        if (empty($connectors)) {
            return collect();
        }

        $allRecords = collect();

        // Process in chunks to avoid SQLite 999 variable limit
        foreach (array_chunk($connectors, 500) as $connectorChunk) {
            $records = $this->model
                ->where('filename', $filename)
                ->where('document_type', $documentType)
                ->where('document_category', $documentCategory)
                ->whereIn('connector', $connectorChunk)
                ->get();

            $allRecords = $allRecords->merge($records);
        }

        return $allRecords;
    }
}
