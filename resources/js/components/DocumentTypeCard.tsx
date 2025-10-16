'use client';

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

export default function DocumentTypeCard({
    type,
    color = '#2563eb',
    icon = 'FileText',
    onClick,
}) {
    const Icon = Icons[icon] || Icons.FileText;

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={onClick}
        >
            <Card
                className="cursor-pointer p-4 text-center transition-shadow duration-300 hover:shadow-lg"
                style={{ borderColor: color, borderWidth: 2 }}
            >
                <CardHeader className="flex flex-col items-center justify-center space-y-2">
                    <div
                        className="rounded-full p-3"
                        style={{ backgroundColor: color + '20' }}
                    >
                        <Icon color={color} size={28} />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                        {type}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        Click to open or view
                    </CardDescription>
                </CardHeader>
            </Card>
        </motion.div>
    );
}
