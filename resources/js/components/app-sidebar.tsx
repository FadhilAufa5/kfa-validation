import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    FileCheck,
    HandCoins,
    History,
    LayoutDashboard,
    Settings,
    Shield,
    Store,
    Users,
} from 'lucide-react';

import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import AppLogo from './app-logo';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';

import { NavMain } from '@/components/nav-main';
import { NavPembelian } from '@/components/nav-pembelian';
import { NavPenjualan } from '@/components/nav-penjualan';
import { NavReportManagement } from '@/components/nav-report-management';
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
        icon: LayoutDashboard,
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

const reportManagementNavItems: NavItem[] = [
    {
        title: 'Reports',
        href: '/report-management',
        icon: FileCheck,
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
    // Get filtered nav items based on permissions
    const visiblePembelianItems = pembelianNavItems.filter(item => {
        if (item.href === '/pembelian') return hasPermission('upload.pembelian');
        if (item.href === '/history/pembelian') return hasPermission('history.pembelian');
        return false;
    });

    const visiblePenjualanItems = penjualanNavItems.filter(item => {
        if (item.href === '/penjualan') return hasPermission('upload.penjualan');
        if (item.href === '/history/penjualan') return hasPermission('history.penjualan');
        return false;
    });

    const visibleUyItems = uyNavItems.filter(item => {
        if (item.href === '/users') return hasPermission('users.manage');
        if (item.href === '/permissions') return hasPermission('roles.manage');
        if (item.href === '/activity-logs') return hasPermission('logs.view');
        if (item.href === '/validation-setting') return hasPermission('settings.validation');
        return false;
    });

    // Check if user can see report management
    const canSeeReportManagement = hasAnyPermission(['roles.manage', 'users.manage']);

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
                
                {/* Show Pembelian section if user has any pembelian permissions */}
                {visiblePembelianItems.length > 0 && (
                    <NavPembelian items={visiblePembelianItems} />
                )}
                
                {/* Show Penjualan section if user has any penjualan permissions */}
                {visiblePenjualanItems.length > 0 && (
                    <NavPenjualan items={visiblePenjualanItems} />
                )}
                
                {/* Show Report Management if user has permission */}
                {canSeeReportManagement && (
                    <NavReportManagement items={reportManagementNavItems} />
                )}
                
                {/* Show Admin section if user has any admin permissions */}
                {visibleUyItems.length > 0 && (
                    <NavUy items={visibleUyItems} />
                )}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
