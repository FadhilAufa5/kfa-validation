import { Link, usePage } from '@inertiajs/react';
import { HandCoins, History, LayoutGrid, Store, Users, Activity, LayoutDashboard, Settings, Shield } from 'lucide-react';

import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import AppLogo from './app-logo';


import { NavMain } from '@/components/nav-main';
import { NavPembelian } from '@/components/nav-pembelian';
import { NavPenjualan } from '@/components/nav-penjualan';
import { NavUser } from '@/components/nav-user';
import { NavUy } from '@/components/nav-uy';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard ,
    },
];

const pembelianNavItems: NavItem[] = [
    {
        title: 'Pembelian',
        href: '/pembelian',
        icon: HandCoins,
    },
    {
        title: 'History Pembelian',
        href: '/history/pembelian',
        icon: History,
    },
];


const penjualanNavItems: NavItem[] = [
    {
        title: 'Penjualan',
        href: '/penjualan',
        icon: Store,
    },
    {
        title: 'History Penjualan',
        href: '/history/penjualan',
        icon: History,
    },
];

const uyNavItems: NavItem[] = [
    {
        title: 'User Management',
        href: '/users',
        icon: Users,
    },
    {
        title: 'Permission Management',
        href: '/permissions',
        icon: Shield,
    },
    {
        title: 'Log Aktivitas',
        href: '/activity-logs',
        icon: Activity,
    },
    {
        title: 'Validation Setting',
        href: '/validation-setting',
        icon: Settings,
    },
];

// const footerNavItems: NavItem[] = [
//   {
//     title: 'Documentation',
//     href: 'https://laravel.com/docs/starter-kits#react',
//     icon: BookOpen,
//   },
// ];

export function AppSidebar() {
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const isSuperAdmin = auth?.user?.role === 'super_admin';

    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* Header Logo */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Main Navigation */}
            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavPembelian items={pembelianNavItems} />
                <NavPenjualan items={penjualanNavItems} />
                {/* Only show User Management & Activity Logs for super_admin */}
                {isSuperAdmin && <NavUy items={uyNavItems} />}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
