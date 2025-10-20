import { Link } from '@inertiajs/react';
import { Button, Card as FlowbiteCard } from 'flowbite-react';
import { motion } from 'framer-motion';
import React from 'react';

interface AppCardProps {
    title: string;
    description: string;
    href?: string;
    icon?: React.ElementType;
    color?: string;
    currentSelectedType?: string; // Added to accept selected type from parent
}

export function Card({
    title,
    description,
    href,
    icon: Icon,
    color = 'text-blue-500',
    currentSelectedType,
}: AppCardProps) {
    return (
        <>
            {/* Card utama */}
            <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <Link href={href || '#'}>
                    <FlowbiteCard className="h-full max-w-sm cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex h-full flex-col justify-between">
                            <div>
                                {Icon && (
                                    <div
                                        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-700 dark:to-gray-600`}
                                    >
                                        <Icon className={`h-7 w-7 ${color}`} />
                                    </div>
                                )}

                                <h5 className="mb-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                                    {title}
                                </h5>

                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                    {description}
                                </p>
                            </div>

                            <Button
                                type="button"
                                className="group mt-4 w-fit bg-blue-600 text-white hover:bg-blue-700"
                            >
                                <span className="flex items-center">
                                    Upload Dokumen
                                    <svg
                                        className="-mr-1 ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </span>
                            </Button>
                        </div>
                    </FlowbiteCard>
                </Link>
            </motion.div>
        </>
    );
}
