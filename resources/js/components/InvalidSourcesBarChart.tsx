import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, CheckCircle2 } from 'lucide-react';

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
    const totalCount = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-500" />
                    <span>Persentase Sumber Data Tidak Valid</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
                <div className="flex-1 space-y-3">
                    {sources.length > 0 ? (
                        <>
                            {sources.map(([sourceLabel, count]) => {
                                const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                                const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

                                return (
                                    <div key={sourceLabel} className="flex items-center gap-3">
                                        <span className="w-28 truncate text-sm font-medium" title={sourceLabel}>
                                            {sourceLabel}
                                        </span>
                                        <div className="relative h-8 flex-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-gradient-to-r from-purple-500 to-purple-600 pr-3 transition-all duration-500 ease-out shadow-sm"
                                                style={{
                                                    width: `${Math.max(barWidth, 2)}%`,
                                                }}
                                            >
                                                <span className="text-xs font-semibold text-white drop-shadow">
                                                    {count} ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            {barWidth < 1 && (
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                        {count} ({percentage.toFixed(1)}%)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {sources.length < Object.keys(sourceCounts).length && (
                                <div className="text-xs text-muted-foreground text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                    +{Object.keys(sourceCounts).length - sources.length} sumber lainnya
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="text-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <div className="text-sm text-muted-foreground">
                                    Tidak ada sumber data tidak valid
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
