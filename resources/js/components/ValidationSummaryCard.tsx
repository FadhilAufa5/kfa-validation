import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    FileCheck2,
    FileX2,
    Scale,
    XCircle,
    FileText,
    User,
    Tag,
    Divide,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ValidationSummaryCardProps {
    validationData: {
        fileName: string;
        role: string;
        category: string;
        score: number;
        matched: number;
        total: number;
        mismatched: number;
        invalidGroups: number;
        matchedGroups: number;
        isValid: boolean;
        roundingValue: number;
    };
}

export default function ValidationSummaryCard({
    validationData,
}: ValidationSummaryCardProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    // Animation effect for the score
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedScore(validationData.score);
        }, 300);
        return () => clearTimeout(timer);
    }, [validationData.score]);

    const totalGroups = validationData.invalidGroups + validationData.matchedGroups;
    const circumference = 2 * Math.PI * 100;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    const stats = [
        {
            title: 'Validation Status',
            value: validationData.isValid ? 'Valid' : 'Invalid',
            icon: validationData.isValid ? CheckCircle2 : XCircle,
            color: validationData.isValid ? 'text-green-600' : 'text-red-600',
            bgColor: validationData.isValid ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
        },
        {
            title: 'Total Records',
            value: validationData.total.toLocaleString('id-ID'),
            icon: Scale,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            subValue: `${totalGroups} Groups`,
        },
        {
            title: 'Matched Records',
            value: validationData.matched.toLocaleString('id-ID'),
            icon: FileCheck2,
            color: validationData.matched > 0 ? 'text-green-600' : 'text-muted-foreground',
            bgColor: validationData.matched > 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800',
            subValue: `${validationData.matchedGroups} Groups`,
        },
        {
            title: 'Mismatched Records',
            value: validationData.mismatched.toLocaleString('id-ID'),
            icon: FileX2,
            color: validationData.mismatched > 0 ? 'text-red-600' : 'text-muted-foreground',
            bgColor: validationData.mismatched > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800',
            subValue: `${validationData.invalidGroups} Groups`,
        },
    ];

    return (
        <Card className="overflow-hidden border shadow-sm bg-card text-card-foreground">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                    {/* Left Side: Validation Score Chart */}
                    <div className="relative flex w-full md:w-96 flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-border/50">
                        <div className="relative h-64 w-64 transition-all duration-500 ease-out hover:scale-105">
                            <svg className="h-full w-full -rotate-90 transform">
                                {/* Background Circle (Shadow) */}
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="100"
                                    stroke="currentColor"
                                    strokeWidth="24"
                                    fill="none"
                                    className="text-muted/20"
                                />
                                {/* Animated Progress Circle */}
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="100"
                                    stroke="currentColor"
                                    strokeWidth="24"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className={`transition-all duration-1000 ease-out ${validationData.score >= 80
                                        ? 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                        : validationData.score >= 50
                                            ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                                            : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                                        }`}
                                />
                            </svg>

                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-6xl font-black tracking-tight transition-colors duration-300 ${validationData.score >= 80 ? 'text-green-600 dark:text-green-400' :
                                    validationData.score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {animatedScore.toFixed(1)}%
                                </span>
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide mt-1">
                                    Score
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Information & Stats */}
                    <div className="flex-1 p-6 md:p-8">
                        {/* Header Info */}
                        <div className="mb-8 space-y-4">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3 mb-3">
                                    <FileText className="h-8 w-8 text-primary" />
                                    {validationData.fileName}
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1 text-sm md:text-base">
                                        <User className="h-4 w-4" />
                                        {validationData.role}
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 text-sm md:text-base border-primary/20 bg-primary/5 text-primary">
                                        <Tag className="h-4 w-4" />
                                        {validationData.category}
                                    </Badge>
                                    <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1.5 px-3 py-1 text-sm md:text-base">
                                        <Divide className="h-4 w-4" />
                                        Rounding: ±{validationData.roundingValue.toLocaleString('id-ID')}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            {stats.map((stat, index) => (
                                <div key={index} className={`rounded-xl p-4 ${stat.bgColor} border border-transparent hover:border-border transition-all duration-200 hover:shadow-sm`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {stat.title}
                                        </p>
                                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                                            {stat.value}
                                        </p>
                                        {stat.subValue && (
                                            <p className="text-sm text-muted-foreground mt-1 font-medium">
                                                {stat.subValue}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
