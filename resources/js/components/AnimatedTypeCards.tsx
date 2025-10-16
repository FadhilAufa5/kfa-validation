'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

type TypeCardItem = {
    title: string;
    icon: LucideIcon;
    color?: string; // e.g. "text-blue-500"
    delay?: number;
    href?: string; // optional link for navigation
};

interface AnimatedTypeCardsProps {
    types: TypeCardItem[];
    onSelect?: (title: string) => void;
}

const MotionCard = motion(Card);

export function AnimatedTypeCards({ types, onSelect }: AnimatedTypeCardsProps) {
    // Determine grid layout based on number of cards
    const gridCols =
        types.length === 3
            ? 'sm:grid-cols-3'
            : types.length === 4
              ? 'sm:grid-cols-2'
              : 'sm:grid-cols-2';

    return (
        <div className={`grid grid-cols-1 ${gridCols} my-8 gap-4`}>
            {types.map((type, i) => {
                const Icon = type.icon;

                const content = (
                    <MotionCard
                        key={i}
                        className="cursor-pointer border-gray-200 transition-all duration-300 hover:shadow-lg dark:border-gray-800"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            delay: type.delay ?? i * 0.1,
                            duration: 0.4,
                            ease: 'easeOut',
                        }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => {
                            if (!type.href) onSelect?.(type.title);
                        }}
                    >
                        <CardContent className="flex flex-col items-center justify-center space-y-3 py-8">
                            <Icon
                                className={`h-12 w-12 ${type.color ?? 'text-blue-500'}`}
                            />
                            <h3 className="text-lg font-semibold">
                                {type.title}
                            </h3>
                        </CardContent>
                    </MotionCard>
                );

                // If href is provided, wrap with Link for navigation
                return type.href ? (
                    <Link key={i} href={type.href} className="block">
                        {content}
                    </Link>
                ) : (
                    content
                );
            })}
        </div>
    );
}
