import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MatchedGroupData {
    note: string;
}

interface ValidNotesDistributionChartProps {
    allMatchedGroups: MatchedGroupData[];
    maxNotes?: number;
}

export default function ValidNotesDistributionChart({
    allMatchedGroups,
    maxNotes = 5,
}: ValidNotesDistributionChartProps) {
    const notes = Array.from(
        new Set(allMatchedGroups.map((g) => g.note)),
    ).slice(0, maxNotes);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribusi Catatan Data Valid</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {notes.map((note) => {
                        const count = allMatchedGroups.filter(
                            (g) => g.note === note,
                        ).length;
                        const maxCount = Math.max(
                            ...notes.map(
                                (cat) =>
                                    allMatchedGroups.filter((g) => g.note === cat)
                                        .length,
                            ),
                            1,
                        );
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
