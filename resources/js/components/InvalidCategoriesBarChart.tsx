import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Info, Repeat2 } from 'lucide-react';
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

    const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    const mainCategories = sortedCategories.slice(0, maxCategories);
    const remainingCategories = sortedCategories.slice(maxCategories);
    const maxCount = Math.max(...Object.values(categoryCounts), 1);
    const totalCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    const remainingCount = remainingCategories.reduce((sum, [_, count]) => sum + count, 0);

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
                actionDescription: 'Tidak ditemukan data tidak valid.',
                categoryDefinition: '',
                icon: CheckCircle2,
                color: 'text-green-600',
                bgColor: 'bg-green-50 dark:bg-green-900/20',
            };
        }

        const lowerCategory = category.toLowerCase();
        if (lowerCategory.includes('missing')) {
            return {
                title: 'Perbaiki & Update IM',
                actionDescription: 'Lakukan perbaikan pada field yang kosong dan update data Internal Memo (IM).',
                categoryDefinition: 'ID Transaksi terdaftar, namun tidak memiliki value',
                icon: AlertTriangle,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            };
        } else if (lowerCategory.includes('discrepancy') || lowerCategory.includes('descrepancy')) {
            return {
                title: 'Evaluasi Transaksi',
                actionDescription: 'Lakukan evaluasi terhadap transaksi pada file yang diupload untuk mencocokkan selisih.',
                categoryDefinition: 'Terdapat perbedaan value dari file yang diupload dan IM',
                icon: Info,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            };
        } else if (lowerCategory.includes('im_invalid')) {
            return {
                title: 'Perbaiki & Update IM',
                actionDescription: 'Data IM tidak valid. Segera perbaiki data dan lakukan update Internal Memo (IM).',
                categoryDefinition: 'ID Transaksi tidak terdaftar di IM',
                icon: AlertTriangle,
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-900/20',
            };
        } else {
            return {
                title: 'Tinjau Data',
                actionDescription: `Silakan tinjau kembali data yang tidak valid.`,
                categoryDefinition: `Masalah dominan adalah '${category}'`,
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
                        <CardContent className="flex flex-col h-full">
                            <div className="flex-1 space-y-3">
                                {mainCategories.length > 0 ? (
                                    <>
                                        {mainCategories.map(([category, count]) => {
                                            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                                            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                            
                                            return (
                                                <div key={category} className="flex items-center gap-3">
                                                    <span className="w-28 truncate text-sm font-medium" title={category}>
                                                        {category}
                                                    </span>
                                                    <div className="relative h-8 flex-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                        <div
                                                            className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-gradient-to-r from-blue-500 to-blue-600 pr-3 transition-all duration-700 ease-out shadow-sm"
                                                            style={{
                                                                width: `${Math.max(barWidth, 2)}%`,
                                                            }}
                                                        >
                                                            <span className="text-xs font-semibold text-white drop-shadow">
                                                                {count} ({percentage.toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                        {barWidth < 15 && (
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                    {percentage.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {remainingCategories.length > 0 && (
                                            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-28 truncate text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        Lainnya
                                                    </span>
                                                    <div className="relative h-8 flex-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                        <div
                                                            className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-gradient-to-r from-gray-400 to-gray-500 pr-3 transition-all duration-700 ease-out shadow-sm"
                                                            style={{
                                                                width: `${Math.max((remainingCount / maxCount) * 100, 2)}%`,
                                                            }}
                                                        >
                                                            <span className="text-xs font-semibold text-white drop-shadow">
                                                                {remainingCount} ({((remainingCount / totalCount) * 100).toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                        {((remainingCount / maxCount) * 100) < 15 && (
                                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                    {((remainingCount / totalCount) * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground text-center px-3">
                                                    {remainingCategories.map(([cat, count]) => (
                                                        <span key={cat} className="inline-block mr-2 mb-1">
                                                            {cat} ({count})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-1 items-center justify-center">
                                        <div className="text-center">
                                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                            <div className="text-sm text-muted-foreground">
                                                Tidak ada data tidak valid
                                            </div>
                                        </div>
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
                                            {action.actionDescription}
                                        </li>
                                    </ul>
                                </div>

                                {dominantCategory && (
                                    <div className="bg-background/40 p-3 rounded border border-border/30">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold whitespace-nowrap">
                                                Isu Dominan:
                                            </span>
                                            <span className="text-xs font-bold truncate text-foreground">
                                                {dominantCategory}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold whitespace-nowrap">
                                                Penyebab Isu:
                                            </span>
                                            <span className="text-xs text-muted-foreground italic">
                                                {action.categoryDefinition}
                                            </span>
                                        </div>
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
