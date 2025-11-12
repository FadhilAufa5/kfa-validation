import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidNotesDistributionChartProps {
    noteCounts: Record<string, number>;
    maxNotes?: number;
}

export default function ValidNotesDistributionChart({
    noteCounts,
    maxNotes = 5,
}: ValidNotesDistributionChartProps) {
    const notes = Object.entries(noteCounts).slice(0, maxNotes);

    const maxCount = Math.max(...Object.values(noteCounts), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribusi Catatan Data Valid</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {notes.map(([note, count]) => {
                        return (
                            <div key={note} className="flex items-center gap-2">
                                <span className="w-24 truncate text-xs">{note}</span>
                                <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                                    <div
                                        className="flex h-6 items-center justify-end rounded-full bg-green-500 pr-2"
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
