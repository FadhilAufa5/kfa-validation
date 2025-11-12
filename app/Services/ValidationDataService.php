<?php

namespace App\Services;

use App\Models\Validation;
use App\Models\ValidationSetting;

class ValidationDataService
{
    public function getValidationSummary(int $id): ?array
    {
        // Don't eager load relationships - we only need counts!
        $validation = Validation::find($id);

        if (!$validation) {
            return null;
        }

        // Use count queries instead of loading all records
        // This is MUCH more efficient for large datasets (229K+ records)
        $invalidGroupsCount = $validation->invalidGroups()->count();
        $matchedGroupsCount = $validation->matchedGroups()->count();

        // Fallback to JSON if no database records exist
        if ($invalidGroupsCount === 0 && isset($validation->validation_details['invalid_groups'])) {
            $invalidGroupsCount = count($validation->validation_details['invalid_groups']);
        }
        if ($matchedGroupsCount === 0 && isset($validation->validation_details['matched_groups'])) {
            $matchedGroupsCount = count($validation->validation_details['matched_groups']);
        }

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
            'roundingValue' => $this->getRoundingValue(),
        ];
    }

    public function getRoundingValue(): float
    {
        return ValidationSetting::get('rounding_tolerance', 1000.01);
    }

    /**
     * Get aggregated chart data for invalid groups (optimized for performance)
     * Returns only the data needed for charts instead of all records
     */
    public function getInvalidGroupsChartData(int $id): array
    {
        $validation = Validation::find($id);

        if (!$validation) {
            throw new \Exception('Validation data not found');
        }

        // Try to get from relationships first
        if ($validation->invalidGroups()->exists()) {
            // Get category counts using database aggregation
            $categoryCounts = $validation->invalidGroups()
                ->selectRaw('discrepancy_category, COUNT(*) as count')
                ->groupBy('discrepancy_category')
                ->get()
                ->mapWithKeys(fn($item) => [$item->discrepancy_category => $item->count])
                ->toArray();

            // Get source label counts using database aggregation with CASE statement
            // This computes sourceLabel in SQL instead of loading all records
            $sourceCounts = $validation->invalidGroups()
                ->selectRaw("
                    CASE
                        WHEN discrepancy_category = 'im_invalid' THEN 'Tidak Ditemukan di Sumber'
                        WHEN uploaded_total > source_total AND discrepancy_value > 0 THEN 'File Sumber'
                        WHEN source_total > uploaded_total AND discrepancy_value < 0 THEN 'File Diupload'
                        ELSE 'Tidak Diketahui'
                    END as source_label,
                    COUNT(*) as count
                ")
                ->groupByRaw("
                    CASE
                        WHEN discrepancy_category = 'im_invalid' THEN 'Tidak Ditemukan di Sumber'
                        WHEN uploaded_total > source_total AND discrepancy_value > 0 THEN 'File Sumber'
                        WHEN source_total > uploaded_total AND discrepancy_value < 0 THEN 'File Diupload'
                        ELSE 'Tidak Diketahui'
                    END
                ")
                ->get()
                ->mapWithKeys(fn($item) => [$item->source_label => $item->count])
                ->toArray();

            // Get top 5 discrepancies
            $topDiscrepancies = $validation->invalidGroups()
                ->selectRaw('key_value as key, discrepancy_value')
                ->orderByRaw('ABS(discrepancy_value) DESC')
                ->limit(5)
                ->get()
                ->map(fn($item) => [
                    'key' => $item->key,
                    'discrepancy_value' => (float) $item->discrepancy_value
                ])
                ->toArray();

            return [
                'categories' => $categoryCounts,
                'sources' => $sourceCounts,
                'topDiscrepancies' => $topDiscrepancies,
            ];
        }

        // Fallback to JSON data
        return $this->getInvalidGroupsChartDataFromJSON($validation);
    }

    private function getInvalidGroupsChartDataFromJSON(Validation $validation): array
    {
        $invalidGroups = $validation->validation_details['invalid_groups'] ?? [];

        $categoryCounts = [];
        $sourceCounts = [];
        $discrepancies = [];

        foreach ($invalidGroups as $key => $group) {
            // Count categories
            $category = $group['discrepancy_category'];
            $categoryCounts[$category] = ($categoryCounts[$category] ?? 0) + 1;

            // Count sources
            $sourceLabel = $this->getSourceLabel($group);
            $sourceCounts[$sourceLabel] = ($sourceCounts[$sourceLabel] ?? 0) + 1;

            // Collect discrepancies for top N
            $discrepancies[] = [
                'key' => $key,
                'discrepancy_value' => $group['discrepancy_value']
            ];
        }

        // Sort by absolute discrepancy value and get top 5
        usort($discrepancies, fn($a, $b) => abs($b['discrepancy_value']) <=> abs($a['discrepancy_value']));
        $topDiscrepancies = array_slice($discrepancies, 0, 5);

        return [
            'categories' => $categoryCounts,
            'sources' => $sourceCounts,
            'topDiscrepancies' => $topDiscrepancies,
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

    /**
     * Get aggregated chart data for matched groups (optimized for performance)
     * Returns only the data needed for charts instead of all records
     */
    public function getMatchedGroupsChartData(int $id): array
    {
        $validation = Validation::find($id);

        if (!$validation) {
            throw new \Exception('Validation data not found');
        }

        // Try to get from relationships first
        if ($validation->matchedGroups()->exists()) {
            // Get note counts using database aggregation
            $noteCounts = $validation->matchedGroups()
                ->selectRaw('note, COUNT(*) as count')
                ->groupBy('note')
                ->get()
                ->mapWithKeys(fn($item) => [$item->note ?? 'Sum Matched' => $item->count])
                ->toArray();

            return [
                'notes' => $noteCounts,
            ];
        }

        // Fallback to JSON data
        return $this->getMatchedGroupsChartDataFromJSON($validation);
    }

    private function getMatchedGroupsChartDataFromJSON(Validation $validation): array
    {
        $matchedGroups = $validation->validation_details['matched_groups'] ?? [];

        $noteCounts = [];

        foreach ($matchedGroups as $group) {
            $note = $group['note'] ?? 'Sum Matched';
            $noteCounts[$note] = ($noteCounts[$note] ?? 0) + 1;
        }

        return [
            'notes' => $noteCounts,
        ];
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

            // Check if any group has more than 1 matched row
            $groupCounts = $validation->matchedRows->groupBy('key_value')->map->count();
            $hasMultipleRowsPerGroup = $groupCounts->filter(fn($count) => $count > 1)->isNotEmpty();

            // If all groups have only 1 row, display individual rows
            if (!$hasMultipleRowsPerGroup) {
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

            // If any group has more than 1 row, display groups
            return $validation->matchedGroups->map(function ($group) {
                return [
                    'key' => $group->key_value,
                    'uploaded_total' => (float) $group->uploaded_total,
                    'source_total' => (float) $group->source_total,
                    'difference' => (float) $group->uploaded_total - (float) ($group->source_total ?? 0),
                    'note' => $group->note ?? 'Sum Matched',
                    'is_individual_row' => false,
                ];
            })->toArray();
        }

        // Fallback to JSON data
        $matchedRows = $validation->validation_details['matched_rows'] ?? [];
        $matchedGroups = $validation->validation_details['matched_groups'] ?? [];

        // Check if any group has more than 1 matched row
        $groupCounts = [];
        foreach ($matchedRows as $row) {
            $key = $row['key_value'];
            $groupCounts[$key] = ($groupCounts[$key] ?? 0) + 1;
        }
        $hasMultipleRowsPerGroup = !empty(array_filter($groupCounts, fn($count) => $count > 1));

        // If all groups have only 1 row, display individual rows
        if (!$hasMultipleRowsPerGroup) {
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

        // If any group has more than 1 row, display groups
        $allItems = [];
        foreach ($matchedGroups as $key => $group) {
            $allItems[] = [
                'key' => $key,
                'uploaded_total' => $group['uploaded_total'],
                'source_total' => $group['source_total'],
                'difference' => $group['uploaded_total'] - ($group['source_total'] ?? 0),
                'note' => $group['note'] ?? 'Sum Matched',
                'is_individual_row' => false,
            ];
        }

        return $allItems;
    }

    public function getInvalidGroupsPaginated(int $id, array $filters): array
    {
        // Don't eager load - use query builder for efficient pagination
        $validation = Validation::find($id);

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

            // Get unique categories (optimized query)
            $uniqueCategories = $validation->invalidGroups()
                ->distinct()
                ->pluck('discrepancy_category')
                ->toArray();

            // Get unique sources using database aggregation with CASE statement
            // This computes sourceLabel in SQL instead of loading all records
            $uniqueSources = $validation->invalidGroups()
                ->selectRaw("DISTINCT
                    CASE
                        WHEN discrepancy_category = 'im_invalid' THEN 'Tidak Ditemukan di Sumber'
                        WHEN uploaded_total > source_total AND discrepancy_value > 0 THEN 'File Sumber'
                        WHEN source_total > uploaded_total AND discrepancy_value < 0 THEN 'File Diupload'
                        ELSE 'Tidak Diketahui'
                    END as source_label
                ")
                ->get()
                ->pluck('source_label')
                ->toArray();

            // Apply source filter (requires loading data for sourceLabel check)
            // This is the only case where we need all records
            if (!empty($filters['source'])) {
                // For source filtering, we need to load and filter in memory
                // because sourceLabel is computed
                $allFilteredGroups = $query->get()->filter(function ($group) use ($filters) {
                    $sourceLabel = $this->getSourceLabel([
                        'uploaded_total' => $group->uploaded_total,
                        'source_total' => $group->source_total,
                        'discrepancy_value' => $group->discrepancy_value,
                        'discrepancy_category' => $group->discrepancy_category,
                    ]);
                    return $sourceLabel === $filters['source'];
                });

                // Apply sorting
                $sortKey = $filters['sort_key'] ?? 'key_value';
                $sortDirection = $filters['sort_direction'] ?? 'asc';
                
                $sortedGroups = $allFilteredGroups->sortBy(
                    match($sortKey) {
                        'key' => 'key_value',
                        default => $sortKey
                    },
                    SORT_REGULAR,
                    $sortDirection === 'desc'
                )->values();

                // Manual pagination
                $perPage = $filters['per_page'] ?? 10;
                $page = $filters['page'] ?? 1;
                $total = $sortedGroups->count();
                $totalPages = ceil($total / $perPage);
                $offset = ($page - 1) * $perPage;
                
                $paginatedGroups = $sortedGroups->slice($offset, $perPage);

                $formattedData = $paginatedGroups->map(function ($group) {
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
                })->values()->toArray();

                return [
                    'data' => $formattedData,
                    'pagination' => [
                        'current_page' => (int) $page,
                        'per_page' => (int) $perPage,
                        'total' => $total,
                        'total_pages' => $totalPages,
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

            // NO source filter - use efficient database pagination
            // Apply sorting
            $sortKey = $filters['sort_key'] ?? 'key_value';
            $sortDirection = $filters['sort_direction'] ?? 'asc';

            // Map sort key to database column
            $dbSortKey = match ($sortKey) {
                'key' => 'key_value',
                default => $sortKey
            };

            $query->orderBy($dbSortKey, $sortDirection);

            // Efficient database pagination - only loads the current page
            $perPage = $filters['per_page'] ?? 10;
            $page = $filters['page'] ?? 1;
            $results = $query->paginate($perPage, ['*'], 'page', $page);

            // Format only the paginated results
            $formattedData = $results->items();
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
            }, $formattedData);

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
            // Check if any group has more than 1 matched row
            $groupCounts = $validation->matchedRows->groupBy('key_value')->map->count();
            $hasMultipleRowsPerGroup = $groupCounts->filter(fn($count) => $count > 1)->isNotEmpty();

            // If all groups have only 1 row, display individual rows
            if (!$hasMultipleRowsPerGroup) {
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

            // If any group has more than 1 row, display groups
            $query = $validation->matchedGroups();

            // Apply search filter
            if (!empty($filters['search'])) {
                $query->where('key_value', 'LIKE', '%' . $filters['search'] . '%');
            }

            // Apply note filter
            if (!empty($filters['note'])) {
                $query->where('note', $filters['note']);
            }

            // Apply sorting
            $sortKey = $filters['sort_key'] ?? 'key_value';
            $sortDirection = $filters['sort_direction'] ?? 'asc';

            // Map sort key to database column
            $dbSortKey = match ($sortKey) {
                'key' => 'key_value',
                'row_index' => 'key_value', // Groups don't have row_index, sort by key instead
                default => $sortKey
            };

            $query->orderBy($dbSortKey, $sortDirection);

            // Paginate
            $perPage = $filters['per_page'] ?? 10;
            $page = $filters['page'] ?? 1;
            $results = $query->paginate($perPage, ['*'], 'page', $page);

            $formattedData = array_map(function ($group) {
                return [
                    'row_index' => 0, // Groups don't have row_index
                    'key' => $group->key_value,
                    'uploaded_total' => (float) $group->uploaded_total,
                    'source_total' => (float) $group->source_total,
                    'difference' => (float) $group->uploaded_total - (float) ($group->source_total ?? 0),
                    'note' => $group->note ?? 'Sum Matched',
                    'is_individual_row' => false,
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

        // Check if any group has more than 1 matched row
        $groupCounts = [];
        foreach ($matchedRows as $row) {
            $key = $row['key_value'];
            $groupCounts[$key] = ($groupCounts[$key] ?? 0) + 1;
        }
        $hasMultipleRowsPerGroup = !empty(array_filter($groupCounts, fn($count) => $count > 1));

        $uniqueNotesSet = [];
        $filteredItems = [];

        // If all groups have only 1 row, display individual rows
        if (!$hasMultipleRowsPerGroup) {
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

        // If any group has more than 1 row, display groups
        foreach ($matchedGroups as $key => $group) {
            if (isset($filters['search']) && $filters['search'] && stripos($key, $filters['search']) === false) {
                continue;
            }

            $note = $group['note'] ?? 'Sum Matched';
            $uniqueNotesSet[$note] = true;

            if (isset($filters['note']) && $filters['note'] && $note !== $filters['note']) {
                continue;
            }

            $filteredItems[] = [
                'row_index' => 0, // Groups don't have row_index
                'key' => $key,
                'uploaded_total' => $group['uploaded_total'],
                'source_total' => $group['source_total'],
                'difference' => $group['uploaded_total'] - ($group['source_total'] ?? 0),
                'note' => $note,
                'is_individual_row' => false,
            ];
        }

        $uniqueNotes = array_keys($uniqueNotesSet);

        $filteredItems = $this->applySorting(
            $filteredItems,
            $filters['sort_key'] ?? 'key',
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
                'key' => $filters['sort_key'] ?? 'key',
                'direction' => $filters['sort_direction'] ?? 'asc',
            ],
            'uniqueFilters' => [
                'notes' => $uniqueNotes,
            ],
        ];
    }

    public function getValidationHistory(array $filters): array
    {
        $query = Validation::with([
            'user',
            'report' => function ($q) {
                $q->latest();
            }
        ]);
        $currentUser = auth()->user();

        if (!empty($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        // Exclude validations with accepted reports
        $query->whereDoesntHave('report', function ($q) {
            $q->where('status', 'accepted');
        });

        // Apply role-based filtering
        if ($currentUser) {
            if ($currentUser->role === 'super_admin') {
                // Super admin sees all validation history
                // No additional filter needed
            } elseif ($currentUser->role === 'user') {
                // Regular user sees only their own validation history
                $query->where('user_id', $currentUser->id);
            } elseif ($currentUser->role === 'visitor') {
                // Visitor sees assigned user's validation history
                // If no user is assigned, they see their own (empty) history
                $assignedUserId = $currentUser->assigned_user_id ?? $currentUser->id;
                $query->where('user_id', $assignedUserId);
            }
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('file_name', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('role', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('document_type', 'LIKE', "%{$filters['search']}%")
                    ->orWhere('document_category', 'LIKE', "%{$filters['search']}%")
                    ->orWhereHas('user', function ($userQuery) use ($filters) {
                        $userQuery->where('name', 'LIKE', "%{$filters['search']}%");
                    });
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

            // Get latest report if exists
            $latestReport = $validation->report->first();
            $reportData = null;
            if ($latestReport) {
                $reportData = [
                    'id' => $latestReport->id,
                    'status' => $latestReport->status,
                    'report_type' => $latestReport->report_type,
                    'report_message' => $latestReport->report_message,
                ];
            }

            return [
                'id' => $validation->id,
                'user' => $validation->user ? $validation->user->name : $validation->role,
                'fileName' => $validation->file_name,
                'documentCategory' => $validation->document_category,
                'uploadTime' => $validation->created_at->format('Y-m-d H:i'),
                'score' => number_format($validation->score, 2) . '%',
                'status' => $displayStatus,
                'processing_status' => $validation->status, // 'processing', 'completed', 'failed'
                'processing_details' => $validation->processing_details,
                'report' => $reportData,
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
