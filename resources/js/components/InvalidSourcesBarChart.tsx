import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InvalidSourcesBarChartProps {
    sourceCounts: Record<string, number>;
    maxSources?: number;
}

export default function InvalidSourcesBarChart({
    sourceCounts,
    maxSources = 5,
}: InvalidSourcesBarChartProps) {
    const sources = Object.entries(sourceCounts).slice(0, maxSources);

    const maxCount = Math.max(...Object.values(sourceCounts), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Persentase Sumber Data Tidak Valid</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {sources.map(([sourceLabel, count]) => {
                        return (
                            <div key={sourceLabel} className="flex items-center gap-2">
                                <span className="w-24 truncate text-xs">
                                    {sourceLabel}
                                </span>
                                <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                                    <div
                                        className="flex h-6 items-center justify-end rounded-full bg-purple-500 pr-2"
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
