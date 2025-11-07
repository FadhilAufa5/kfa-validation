import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationGroupData {
    discrepancy_category: string;
}

interface InvalidCategoriesBarChartProps {
    allInvalidGroups: ValidationGroupData[];
    maxCategories?: number;
}

export default function InvalidCategoriesBarChart({
    allInvalidGroups,
    maxCategories = 5,
}: InvalidCategoriesBarChartProps) {
    const categories = Array.from(
        new Set(allInvalidGroups.map((g) => g.discrepancy_category)),
    ).slice(0, maxCategories);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Kategori Data Tidak Valid</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {categories.map((category) => {
                        const count = allInvalidGroups.filter(
                            (g) => g.discrepancy_category === category,
                        ).length;
                        const maxCount = Math.max(
                            ...categories.map(
                                (cat) =>
                                    allInvalidGroups.filter(
                                        (g) => g.discrepancy_category === cat,
                                    ).length,
                            ),
                            1,
                        );
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
