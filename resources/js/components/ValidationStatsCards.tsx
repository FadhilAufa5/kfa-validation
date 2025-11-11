import { CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCard {
    title: string;
    value: string;
    icon: LucideIcon;
    color?: string;
    groups?: number;
}

interface ValidationStatsCardsProps {
    stats: StatCard[];
}

export default function ValidationStatsCards({ stats }: ValidationStatsCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="rounded-lg border bg-card text-card-foreground shadow-sm"
                >
                    <div className="flex flex-row items-center justify-between p-3">
                        <div>
                            <CardTitle className="text-xs font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                        </div>
                        <stat.icon
                            className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`}
                        />
                    </div>
                    <div className="p-3 pt-0">
                        <div className={`text-lg font-bold ${stat.color || ''}`}>
                            {stat.value}
                        </div>
                        {stat.groups !== undefined && (
                            <div className="mt-1 flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                    {stat.groups.toLocaleString('id-ID')} Groups
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
