import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationScoreDonutChartProps {
    score: number;
    matched: number;
    mismatched: number;
    totalGroups: number;
}

export default function ValidationScoreDonutChart({
    score,
    matched,
    mismatched,
    totalGroups,
}: ValidationScoreDonutChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribusi Skor Validasi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center">
                    <div className="relative h-40 w-40">
                        <div className="absolute inset-0 flex items-center justify-center rounded-full">
                            <svg className="h-full w-full -rotate-90 transform">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="14"
                                    fill="none"
                                    className="text-gray-200"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="14"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 70}`}
                                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - score / 100)}`}
                                    className={
                                        score >= 80
                                            ? 'text-green-500'
                                            : score >= 50
                                              ? 'text-yellow-500'
                                              : 'text-red-500'
                                    }
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-xl font-bold">
                                    {score.toFixed(1)}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Skor Validasi
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Matched: {matched}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="text-sm">Invalid: {mismatched}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm">Groups: {totalGroups}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
