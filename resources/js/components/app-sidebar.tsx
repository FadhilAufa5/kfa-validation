import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, User, HandCoins, Store, History } from 'lucide-react';

import AppLogo from './app-logo';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';


import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavPembelian } from '@/components/nav-pembelian'; 
import { NavPenjualan } from '@/components/nav-penjualan'; 
import { NavUser } from '@/components/nav-user';


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
    icon: LayoutGrid,
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
    href: '/historypembelian',
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
    href: '/historypenjualan',
    icon: History,
  },
];

// ⚙️ Navigasi footer
// const footerNavItems: NavItem[] = [
//   {
//     title: 'Repository',
//     href: 'https://github.com/laravel/react-starter-kit',
//     icon: Folder,
//   },
//   {
//     title: 'Documentation',
//     href: 'https://laravel.com/docs/starter-kits#react',
//     icon: BookOpen,
//   },
// ];


export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
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

   
      <SidebarContent>
        <NavMain items={mainNavItems} />
        <NavPembelian items={pembelianNavItems} />
        <NavPenjualan items={penjualanNavItems} />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
