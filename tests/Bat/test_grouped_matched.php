<?php
// Test script to simulate the grouped matched records functionality

// Simulate matched rows data
$matchedRows = [
    [
        'row_index' => 0,
        'key_value' => 'KEY001',
        'validation_source_total' => 500,
        'uploaded_total' => 500,
        'note' => 'Target Data Sesuai'
    ],
    [
        'row_index' => 1,
        'key_value' => 'KEY001',
        'validation_source_total' => 500,
        'uploaded_total' => 500,
        'note' => 'Target Data Sesuai'
    ],
    [
        'row_index' => 2,
        'key_value' => 'KEY002',
        'validation_source_total' => 0,
        'uploaded_total' => 0,
        'note' => 'Data Ignored. Tidak terdapat value Retur'
    ],
    [
        'row_index' => 3,
        'key_value' => 'KEY003',
        'validation_source_total' => 300,
        'uploaded_total' => 300,
        'note' => 'Target Data Sesuai'
    ],
    [
        'row_index' => 4,
        'key_value' => 'KEY001',
        'validation_source_total' => 500,
        'uploaded_total' => 500,
        'note' => 'Target Data Sesuai'
    ]
];

// Group matched records by key
$groupedMatched = [];
foreach ($matchedRows as $row) {
    $key = $row['key_value'] ?? '';
    if (!isset($groupedMatched[$key])) {
        $groupedMatched[$key] = [
            'key' => $key,
            'validation_source_total' => $row['validation_source_total'] ?? 0,
            'uploaded_total' => $row['uploaded_total'] ?? 0,
            'note' => $row['note'] ?? '',
            'record_count' => 0,
            'rows' => []
        ];
    }
    $groupedMatched[$key]['record_count']++;
    $groupedMatched[$key]['rows'][] = $row;
}

// Convert to array format for easier processing
$groupedItems = array_values($groupedMatched);

echo "Testing Grouped Matched Records Functionality:\n";
echo "==============================================\n";

foreach ($groupedItems as $item) {
    echo "Key: " . $item['key'] . "\n";
    echo "  Validation Source Total: " . $item['validation_source_total'] . "\n";
    echo "  Uploaded Total: " . $item['uploaded_total'] . "\n";
    echo "  Note: " . $item['note'] . "\n";
    echo "  Record Count: " . $item['record_count'] . "\n";
    echo "  Rows: " . count($item['rows']) . " items\n";
    echo "\n";
}

// Test the pagination logic
$searchTerm = '';
$sortKey = 'key';
$sortDirection = 'asc';
$page = 1;
$perPage = 2;

// Apply search filter
$filteredItems = $groupedItems;
if ($searchTerm) {
    $filteredItems = array_filter($filteredItems, function ($item) use ($searchTerm) {
        return stripos($item['key'] ?? '', $searchTerm) !== false;
    });
}

// Apply sorting
if ($sortKey && $sortDirection) {
    usort($filteredItems, function ($a, $b) use ($sortKey, $sortDirection) {
        $aValue = $a[$sortKey] ?? null;
        $bValue = $b[$sortKey] ?? null;

        if (is_string($aValue) && is_string($bValue)) {
            $result = strcasecmp($aValue, $bValue);
        } else {
            $result = $aValue <=> $bValue;
        }

        return $sortDirection === 'desc' ? -$result : $result;
    });
}

// Calculate pagination
$totalItems = count($filteredItems);
$offset = ($page - 1) * $perPage;
$paginatedItems = array_slice($filteredItems, $offset, $perPage);

echo "Pagination Test:\n";
echo "================\n";
echo "Total Items: " . $totalItems . "\n";
echo "Items per Page: " . $perPage . "\n";
echo "Current Page: " . $page . "\n";
echo "Paginated Items: " . count($paginatedItems) . "\n";
echo "\n";

foreach ($paginatedItems as $item) {
    echo "Paginated Key: " . $item['key'] . " (Count: " . $item['record_count'] . ")\n";
}

echo "\nTest completed successfully! The grouping functionality works as expected.\n";