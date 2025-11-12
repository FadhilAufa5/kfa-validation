import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InvalidCategoriesBarChartProps {
    categoryCounts: Record<string, number>;
    maxCategories?: number;
}

export default function InvalidCategoriesBarChart({
    categoryCounts,
    maxCategories = 5,
}: InvalidCategoriesBarChartProps) {
    const categories = Object.entries(categoryCounts)
        .slice(0, maxCategories);

    const maxCount = Math.max(...Object.values(categoryCounts), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kategori Data Tidak Valid</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {categories.map(([category, count]) => {
                        return (
                            <div key={category} className="flex items-center gap-2">
                                <span className="w-24 truncate text-xs">
                                    {category}
                                </span>
                                <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                                    <div
                                        className="flex h-6 items-center justify-end rounded-full bg-blue-500 pr-2"
                                        style={{
                                            width: `${(count / maxCount) * 100}%`,
                                        }}
                                    >
                                        <span className="text-xs font-medium text-white">
                                            {count}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
