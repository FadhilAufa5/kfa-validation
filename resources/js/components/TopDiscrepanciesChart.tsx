import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationGroupData {
    key: string;
    discrepancy_value: number;
}

interface TopDiscrepanciesChartProps {
    allInvalidGroups: ValidationGroupData[];
    topCount?: number;
}

export default function TopDiscrepanciesChart({
    allInvalidGroups,
    topCount = 5,
}: TopDiscrepanciesChartProps) {
    const topItems = allInvalidGroups
        .sort((a, b) => Math.abs(b.discrepancy_value) - Math.abs(a.discrepancy_value))
        .slice(0, topCount);

    const maxValue = allInvalidGroups.reduce(
        (max, g) => Math.max(max, Math.abs(g.discrepancy_value)),
        1,
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top {topCount} Baris dengan Selisih Tertinggi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {topItems.map((item, index) => {
                        const absValue = Math.abs(item.discrepancy_value);
                        const barWidth = maxValue > 0 ? (absValue / maxValue) * 100 : 0;

                        return (
                            <div key={item.key} className="flex items-center gap-2">
                                <div className="flex w-8 items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        #{index + 1}
                                    </span>
                                </div>
                                <span className="w-32 truncate text-xs">
                                    {item.key}
                                </span>
                                <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                                    <div
                                        className="flex h-6 items-center justify-end rounded-full bg-red-500 pr-2"
                                        style={{
                                            width: `${barWidth}%`,
                                        }}
                                    >
                                        <span className="text-xs font-medium text-white">
                                            {absValue.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {allInvalidGroups.length === 0 && (
                        <div className="py-4 text-center text-muted-foreground">
                            Tidak ada data selisih untuk ditampilkan
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
