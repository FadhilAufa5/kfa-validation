import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowRight, CheckCircle2, Info, Repeat2 } from 'lucide-react';
import { useState } from 'react';

interface InvalidCategoriesBarChartProps {
    categoryCounts: Record<string, number>;
    maxCategories?: number;
}

export default function InvalidCategoriesBarChart({
    categoryCounts,
    maxCategories = 5,
}: InvalidCategoriesBarChartProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const categories = Object.entries(categoryCounts).slice(0, maxCategories);
    const maxCount = Math.max(...Object.values(categoryCounts), 1);

    // Determine the dominant category
    const getDominantCategory = () => {
        if (!categoryCounts || Object.keys(categoryCounts).length === 0) {
            return null;
        }
        return Object.entries(categoryCounts).reduce((a, b) =>
            a[1] > b[1] ? a : b
        )[0];
    };

    const dominantCategory = getDominantCategory();

    // Define actions based on category
    const getAction = (category: string | null) => {
        if (!category) {
            return {
                title: 'Tidak Ada Tindakan',
                description: 'Tidak ditemukan data tidak valid.',
                icon: CheckCircle2,
                color: 'text-green-600',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
            };
        }

        const lowerCategory = category.toLowerCase();
        if (lowerCategory.includes('missing')) {
            return {
                title: 'Perbaiki & Update IM',
                description: 'Lakukan perbaikan pada field yang kosong dan update data Internal Memo (IM).',
                icon: AlertTriangle,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            };
        } else if (lowerCategory.includes('discrepancy') || lowerCategory.includes('descrepancy')) {
            return {
                title: 'Evaluasi Transaksi',
                description: 'Lakukan evaluasi terhadap transaksi pada file yang diupload untuk mencocokkan selisih.',
                icon: Info,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            };
        } else if (lowerCategory.includes('im_invalid')) {
            return {
                title: 'Perbaiki & Update IM',
                description: 'Data IM tidak valid. Segera perbaiki data dan lakukan update Internal Memo (IM).',
                icon: AlertTriangle,
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
            };
        } else {
            return {
                title: 'Tinjau Data',
                description: `Masalah dominan adalah '${category}'. Silakan tinjau kembali data yang tidak valid.`,
                icon: Info,
                color: 'text-gray-600',
                bgColor: 'bg-gray-50 dark:bg-gray-800',
            };
        }
    };

    const action = getAction(dominantCategory);
    const ActionIcon = action.icon;

    return (
        <div
            className="relative w-full h-[300px] group [perspective:2000px]"
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
        >
            <div
                className={cn(
                    "relative w-full h-full",
                    "[transform-style:preserve-3d]",
                    "transition-all duration-700",
                    isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
                )}
            >
                {/* Front Face: Chart */}
                <div
                    className={cn(
                        "absolute inset-0 w-full h-full",
                        "[backface-visibility:hidden] [transform:rotateY(0deg)]",
                    )}
                >
                    <Card className="h-full overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="pb-2 relative">
                            <CardTitle className="flex justify-between items-center">
                                <span>Kategori Data Tidak Valid</span>
                                <Repeat2 className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {categories.length > 0 ? (
                                    categories.map(([category, count]) => (
                                        <div key={category} className="flex items-center gap-2">
                                            <span className="w-24 truncate text-xs" title={category}>
                                                {category}
                                            </span>
                                            <div className="relative h-6 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                                <div
                                                    className="flex h-6 items-center justify-end rounded-full bg-blue-500 pr-2 transition-all duration-500 ease-out"
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
                                    ))
                                ) : (
                                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                                        Tidak ada data tidak valid
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Back Face: Recommendation */}
                <div
                    className={cn(
                        "absolute inset-0 w-full h-full",
                        "[backface-visibility:hidden] [transform:rotateY(180deg)]",
                    )}
                >
                    <Card className={cn("h-full overflow-hidden border shadow-sm", action.bgColor)}>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ActionIcon className={cn("h-5 w-5", action.color)} />
                                <span>Rekomendasi Tindakan</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-between h-[calc(100%-4rem)]">
                            <div className="space-y-4 pt-2">
                                <div>
                                    <h3 className={cn("text-2xl font-black mb-3 uppercase tracking-tight", action.color)}>
                                        {action.title}
                                    </h3>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li className="text-sm font-medium text-muted-foreground leading-relaxed">
                                            {action.description}
                                        </li>
                                    </ul>
                                </div>

                                {dominantCategory && (
                                    <div className="bg-background/40 p-2 rounded border border-border/30 flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold whitespace-nowrap">
                                            Isu Dominan:
                                        </span>
                                        <span className="text-xs font-bold truncate text-foreground" title={dominantCategory}>
                                            {dominantCategory}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-auto pt-2 border-t border-border/20">
                                <Info className="w-3 h-3" />
                                <span>Arahkan kursor keluar untuk melihat grafik</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
