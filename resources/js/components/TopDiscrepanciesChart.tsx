import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopDiscrepancy {
    key: string;
    discrepancy_value: number;
}

interface TopDiscrepanciesChartProps {
    topDiscrepancies: TopDiscrepancy[];
    topCount?: number;
}

export default function TopDiscrepanciesChart({
    topDiscrepancies,
    topCount = 5,
}: TopDiscrepanciesChartProps) {
    const maxValue = topDiscrepancies.length > 0
        ? Math.max(...topDiscrepancies.map(d => Math.abs(d.discrepancy_value)))
        : 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top {topCount} Baris dengan Selisih Tertinggi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {topDiscrepancies.map((item, index) => {
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
                    {topDiscrepancies.length === 0 && (
                        <div className="py-4 text-center text-muted-foreground">
                            Tidak ada data selisih untuk ditampilkan
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
