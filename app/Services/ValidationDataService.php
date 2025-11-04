<?php

namespace App\Services;

use App\Models\Validation;

class ValidationDataService
{
    public function getValidationSummary(int $id): ?array
    {
        $validation = Validation::with(['invalidGroups', 'matchedGroups'])->find($id);

        if (!$validation) {
            return null;
        }

        // Try to get counts from relationships first, fallback to JSON
        $invalidGroupsCount = $validation->invalidGroups()->count() ?: count($validation->validation_details['invalid_groups'] ?? []);
        $matchedGroupsCount = $validation->matchedGroups()->count() ?: count($validation->validation_details['matched_groups'] ?? []);

        return [
            'fileName' => $validation->file_name,
            'role' => $validation->role,
            'category' => $validation->document_category,
            'score' => $validation->score,
            'matched' => $validation->matched_records,
            'total' => $validation->total_records,
            'mismatched' => $validation->mismatched_records,
            'invalidGroups' => $invalidGroupsCount,
            'matchedGroups' => $matchedGroupsCount,
            'isValid' => $validation->mismatched_records === 0,
        ];
    }

    public function getAllInvalidGroups(int $id): array
    {
        $validation = Validation::with('invalidGroups')->find($id);

        if (!$validation) {
            throw new \Exception('Validation data not found');
        }

        // Try to get from relationships first
        if ($validation->invalidGroups()->exists()) {
            return $validation->invalidGroups->map(function ($group) {
                return [
                    'key' => $group->key_value,
                    'discrepancy_category' => $group->discrepancy_category,
                    'error' => $group->error,
                    'uploaded_total' => (float) $group->uploaded_total,
                    'source_total' => (float) $group->source_total,
                    'discrepancy_value' => (float) $group->discrepancy_value,
                    'sourceLabel' => $this->getSourceLabel([
                        'uploaded_total' => $group->uploaded_total,
                        'source_total' => $group->source_total,
                        'discrepancy_value' => $group->discrepancy_value,
                        'discrepancy_category' => $group->discrepancy_category,
                    ]),
                ];
            })->toArray();
        }

        // Fallback to JSON data
        $invalidGroups = $validation->validation_details['invalid_groups'] ?? [];
        $allItems = [];
        foreach ($invalidGroups as $key => $group) {
            $allItems[] = array_merge(['key' => $key], $group, [
                'sourceLabel' => $this->getSourceLabel($group),
            ]);
        }

        return $allItems;
    }

    public function getAllMatchedGroups(int $id): array
    {
        $validation = Validation::with(['matchedRows', 'matchedGroups'])->find($id);

        if (!$validation) {
            throw new \Exception('Validation data not found');
        }

        // Try to get from relationships first
        if ($validation->matchedRows()->exists()) {
            $matchedGroupsKeyed = $validation->matchedGroups->keyBy('key_value');

            return $validation->matchedRows->map(function ($row) use ($matchedGroupsKeyed) {
                $groupInfo = $matchedGroupsKeyed->get($row->key_value);

                return [
                    'key' => $row->key_value,
                    'uploaded_total' => (float) $row->uploaded_total,
                    'source_total' => (float) $row->validation_source_total,
                    'difference' => (float) $row->uploaded_total - (float) ($row->validation_source_total ?? 0),
                    'note' => $groupInfo?->note ?? 'Sum Matched',
                    'is_individual_row' => true,
                ];
            })->toArray();
        }

        // Fallback to JSON data
        $matchedRows = $validation->validation_details['matched_rows'] ?? [];
        $matchedGroups = $validation->validation_details['matched_groups'] ?? [];

        $allItems = [];
        foreach ($matchedRows as $row) {
            $key = $row['key_value'];
            $groupInfo = $matchedGroups[$key] ?? null;

            $allItems[] = [
                'key' => $key,
                'uploaded_total' => $row['uploaded_total'],
                'source_total' => $row['validation_source_total'],
                'difference' => $row['uploaded_total'] - ($row['validation_source_total'] ?? 0),
                'note' => $groupInfo['note'] ?? 'Sum Matched',
                'is_individual_row' => true,
            ];
        }

        return $allItems;
    }

    public function getInvalidGroupsPaginated(int $id, array $filters): array
    {
        $validation = Validation::with('invalidGroups')->find($id);

        if (!$validation) {
            throw new \Exception('Validation data not found');
        }

        // Try to get from relationships first
        if ($validation->invalidGroups()->exists()) {
            $query = $validation->invalidGroups();

            // Apply search filter
            if (!empty($filters['search'])) {
                $query->where('key_value', 'LIKE', '%' . $filters['search'] . '%');
            }

            // Apply category filter
            if (!empty($filters['category'])) {
                $query->where('discrepancy_category', $filters['category']);
            }

            // Get unique categories and sources
            $uniqueCategories = $validation->invalidGroups()
                ->distinct()
                ->pluck('discrepancy_category')
                ->toArray();

            // Apply sorting
            $sortKey = $filters['sort_key'] ?? 'key_value';
            $sortDirection = $filters['sort_direction'] ?? 'asc';

            // Map sort key to database column
            $dbSortKey = match($sortKey) {
                'key' => 'key_value',
                default => $sortKey
            };

            $query->orderBy($dbSortKey, $sortDirection);

            // Paginate
            $perPage = $filters['per_page'] ?? 10;
            $page = $filters['page'] ?? 1;
            $results = $query->paginate($perPage, ['*'], 'page', $page);

            $data = $results->items();
            $formattedData = array_map(function ($group) {
                return [
                    'key' => $group->key_value,
                    'discrepancy_category' => $group->discrepancy_category,
                    'error' => $group->error,
                    'uploaded_total' => (float) $group->uploaded_total,
                    'source_total' => (float) $group->source_total,
                    'discrepancy_value' => (float) $group->discrepancy_value,
                    'sourceLabel' => $this->getSourceLabel([
                        'uploaded_total' => $group->uploaded_total,
                        'source_total' => $group->source_total,
                        'discrepancy_value' => $group->discrepancy_value,
                        'discrepancy_category' => $group->discrepancy_category,
                    ]),
                ];
            }, $data);

            // Get unique sources from formatted data
            $uniqueSources = array_values(array_unique(array_column($formattedData, 'sourceLabel')));

            return [
                'data' => $formattedData,
                'pagination' => [
                    'current_page' => $results->currentPage(),
                    'per_page' => $results->perPage(),
                    'total' => $results->total(),
                    'total_pages' => $results->lastPage(),
                ],
                'filters' => [
                    'search' => $filters['search'] ?? '',
                    'category' => $filters['category'] ?? '',
                    'source' => $filters['source'] ?? '',
                ],
                'sort' => [
                    'key' => $sortKey,
                    'direction' => $sortDirection,
                ],
                'uniqueFilters' => [
                    'categories' => $uniqueCategories,
                    'sources' => $uniqueSources,
                ],
            ];
        }

        // Fallback to JSON data (old implementation)
        return $this->getInvalidGroupsPaginatedFromJSON($validation, $filters);
    }

    private function getInvalidGroupsPaginatedFromJSON(Validation $validation, array $filters): array
    {
        $invalidGroups = $validation->validation_details['invalid_groups'] ?? [];

        $allItems = [];
        foreach ($invalidGroups as $key => $group) {
            $allItems[] = array_merge(['key' => $key], $group, [
                'sourceLabel' => $this->getSourceLabel($group),
            ]);
        }

        $uniqueCategories = array_values(array_unique(array_column($allItems, 'discrepancy_category')));
        $uniqueSources = array_values(array_unique(array_column($allItems, 'sourceLabel')));

        $filteredItems = $this->applyFilters($allItems, $filters);
        $filteredItems = $this->applySorting($filteredItems, $filters['sort_key'] ?? 'key', $filters['sort_direction'] ?? 'asc');

        $pagination = $this->paginateResults($filteredItems, $filters['page'] ?? 1, $filters['per_page'] ?? 10);

        return [
            'data' => $pagination['data'],
            'pagination' => $pagination['meta'],
            'filters' => [
                'search' => $filters['search'] ?? '',
                'category' => $filters['category'] ?? '',
                'source' => $filters['source'] ?? '',
            ],
            'sort' => [
                'key' => $filters['sort_key'] ?? 'key',
                'direction' => $filters['sort_direction'] ?? 'asc',
            ],
            'uniqueFilters' => [
                'categories' => $uniqueCategories,
                'sources' => $uniqueSources,
            ],
        ];
    }

    public function getMatchedRecordsPaginated(int $id, array $filters): array
    {
        $validation = Validation::with(['matchedRows', 'matchedGroups'])->find($id);

        if (!$validation) {
            throw new \Exception('Validation data not found');
        }

        // Try to get from relationships first
        if ($validation->matchedRows()->exists()) {
            $query = $validation->matchedRows();

            // Apply search filter
            if (!empty($filters['search'])) {
                $query->where('key_value', 'LIKE', '%' . $filters['search'] . '%');
            }

            // Apply sorting
            $sortKey = $filters['sort_key'] ?? 'row_index';
            $sortDirection = $filters['sort_direction'] ?? 'asc';

            $query->orderBy($sortKey, $sortDirection);

            // Paginate
            $perPage = $filters['per_page'] ?? 10;
            $page = $filters['page'] ?? 1;
            $results = $query->paginate($perPage, ['*'], 'page', $page);

            $matchedGroupsKeyed = $validation->matchedGroups->keyBy('key_value');

            $formattedData = array_map(function ($row) use ($matchedGroupsKeyed) {
                $groupInfo = $matchedGroupsKeyed->get($row->key_value);

                return [
                    'row_index' => $row->row_index,
                    'key' => $row->key_value,
                    'uploaded_total' => (float) $row->uploaded_total,
                    'source_total' => (float) $row->validation_source_total,
                    'difference' => (float) $row->uploaded_total - (float) ($row->validation_source_total ?? 0),
                    'note' => $groupInfo?->note ?? 'Sum Matched',
                    'is_individual_row' => true,
                ];
            }, $results->items());

            // Get unique notes
            $uniqueNotes = $validation->matchedGroups()
                ->distinct()
                ->pluck('note')
                ->toArray();

            return [
                'data' => $formattedData,
                'pagination' => [
                    'current_page' => $results->currentPage(),
                    'per_page' => $results->perPage(),
                    'total' => $results->total(),
                    'total_pages' => $results->lastPage(),
                ],
                'filters' => [
                    'search' => $filters['search'] ?? '',
                    'note' => $filters['note'] ?? '',
                ],
                'sort' => [
                    'key' => $sortKey,
                    'direction' => $sortDirection,
                ],
                'uniqueFilters' => [
                    'notes' => $uniqueNotes,
                ],
            ];
        }

        // Fallback to JSON data (old implementation)
        return $this->getMatchedRecordsPaginatedFromJSON($validation, $filters);
    }

    private function getMatchedRecordsPaginatedFromJSON(Validation $validation, array $filters): array
    {
        $matchedRows = $validation->validation_details['matched_rows'] ?? [];
        $matchedGroups = $validation->validation_details['matched_groups'] ?? [];

        $uniqueNotesSet = [];
        $filteredItems = [];

        foreach ($matchedRows as $row) {
            $key = $row['key_value'];

            if (isset($filters['search']) && $filters['search'] && stripos($key, $filters['search']) === false) {
                continue;
            }

            $groupInfo = $matchedGroups[$key] ?? null;
            $note = $groupInfo['note'] ?? 'Sum Matched';

            $uniqueNotesSet[$note] = true;

            if (isset($filters['note']) && $filters['note'] && $note !== $filters['note']) {
                continue;
            }

            $filteredItems[] = [
                'row_index' => $row['row_index'],
                'key' => $key,
                'uploaded_total' => $row['uploaded_total'],
                'source_total' => $row['validation_source_total'],
                'difference' => $row['uploaded_total'] - ($row['validation_source_total'] ?? 0),
                'note' => $note,
                'is_individual_row' => true,
            ];
        }

        $uniqueNotes = array_keys($uniqueNotesSet);

        $filteredItems = $this->applySorting(
            $filteredItems,
            $filters['sort_key'] ?? 'row_index',
            $filters['sort_direction'] ?? 'asc'
        );

        $pagination = $this->paginateResults($filteredItems, $filters['page'] ?? 1, $filters['per_page'] ?? 10);

        return [
            'data' => $pagination['data'],
            'pagination' => $pagination['meta'],
            'filters' => [
                'search' => $filters['search'] ?? '',
                'note' => $filters['note'] ?? '',
            ],
            'sort' => [
                'key' => $filters['sort_key'] ?? 'row_index',
                'direction' => $filters['sort_direction'] ?? 'asc',
            ],
            'uniqueFilters' => [
                'notes' => $uniqueNotes,
            ],
        ];
    }

    public function getValidationHistory(array $filters): array
    {
        $query = Validation::query();

        if (!empty($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('file_name', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('role', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('document_type', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('document_category', 'LIKE', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'All') {
            if ($filters['status'] === 'Valid') {
                $query->where('mismatched_records', 0);
            } elseif ($filters['status'] === 'Invalid') {
                $query->where('mismatched_records', '>', 0);
            }
        }

        $query->orderBy('created_at', 'desc');

        $validations = $query->paginate($filters['per_page'] ?? 10, ['*'], 'page', $filters['page'] ?? 1);

        $data = $validations->getCollection()->map(function ($validation) {
            // Determine display status based on validation status field
            $displayStatus = 'Valid';
            if ($validation->status === 'processing') {
                $displayStatus = 'Processing';
            } elseif ($validation->status === 'failed') {
                $displayStatus = 'Failed';
            } elseif ($validation->mismatched_records > 0) {
                $displayStatus = 'Invalid';
            }

            return [
                'id' => $validation->id,
                'user' => $validation->role,
                'fileName' => $validation->file_name,
                'documentCategory' => $validation->document_category,
                'uploadTime' => $validation->created_at->format('Y-m-d H:i'),
                'score' => number_format($validation->score, 2) . '%',
                'status' => $displayStatus,
                'processing_status' => $validation->status, // 'processing', 'completed', 'failed'
                'processing_details' => $validation->processing_details,
            ];
        });

        return [
            'data' => $data,
            'pagination' => [
                'current_page' => $validations->currentPage(),
                'last_page' => $validations->lastPage(),
                'per_page' => $validations->perPage(),
                'total' => $validations->total(),
                'from' => $validations->firstItem(),
                'to' => $validations->lastItem(),
            ],
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? 'All',
            ],
        ];
    }

    private function getSourceLabel(array $group): string
    {
        $isFromValidation = $group['source_total'] > $group['uploaded_total'] && $group['discrepancy_value'] < 0;
        $isFromUploaded = $group['uploaded_total'] > $group['source_total'] && $group['discrepancy_value'] > 0;
        $isKeyNotFound = $group['discrepancy_category'] === 'im_invalid';

        if ($isKeyNotFound) {
            return 'Tidak Ditemukan di Sumber';
        } else if ($isFromUploaded) {
            return 'File Sumber';
        } else if ($isFromValidation) {
            return 'File Diupload';
        } else {
            return 'Tidak Diketahui';
        }
    }

    private function applyFilters(array $items, array $filters): array
    {
        if (!empty($filters['search'])) {
            $items = array_filter($items, function ($item) use ($filters) {
                return stripos($item['key'], $filters['search']) !== false;
            });
        }

        if (!empty($filters['category'])) {
            $items = array_filter($items, function ($item) use ($filters) {
                return $item['discrepancy_category'] === $filters['category'];
            });
        }

        if (!empty($filters['source'])) {
            $items = array_filter($items, function ($item) use ($filters) {
                return $item['sourceLabel'] === $filters['source'];
            });
        }

        return array_values($items);
    }

    private function applySorting(array $items, string $sortKey, string $sortDirection): array
    {
        usort($items, function ($a, $b) use ($sortKey, $sortDirection) {
            $aValue = $a[$sortKey] ?? null;
            $bValue = $b[$sortKey] ?? null;

            if (in_array($sortKey, ['discrepancy_value', 'difference'])) {
                $result = abs($aValue) <=> abs($bValue);
            } else if (is_string($aValue) && is_string($bValue)) {
                $result = strcasecmp($aValue, $bValue);
            } else {
                $result = $aValue <=> $bValue;
            }

            return $sortDirection === 'desc' ? -$result : $result;
        });

        return $items;
    }

    private function paginateResults(array $items, int $page, int $perPage): array
    {
        $totalItems = count($items);
        $offset = ($page - 1) * $perPage;
        $paginatedItems = array_slice($items, $offset, $perPage);

        return [
            'data' => $paginatedItems,
            'meta' => [
                'current_page' => (int) $page,
                'per_page' => (int) $perPage,
                'total' => $totalItems,
                'total_pages' => ceil($totalItems / $perPage),
            ],
        ];
    }
}
