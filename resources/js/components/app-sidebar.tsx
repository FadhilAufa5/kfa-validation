import { Link } from "@inertiajs/react";
import {
  BookOpen,
  Folder,
  LayoutGrid,
  User,
  HandCoins,
  Store,
  History,
  Users,
} from "lucide-react";

import AppLogo from "./app-logo";
import { dashboard } from "@/routes";
import { type NavItem } from "@/types";

// import { NavFooter } from '@/components/nav-footer';
import { NavMain } from "@/components/nav-main";
import { NavPembelian } from "@/components/nav-pembelian";
import { NavPenjualan } from "@/components/nav-penjualan";
import { NavUy } from "@/components/nav-uy";
import { NavUser } from "@/components/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";


// 🌟 MENU UTAMA
const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: dashboard(),
    icon: LayoutGrid,
  },
];

// 🌟 MENU PEMBELIAN
const pembelianNavItems: NavItem[] = [
  {
    title: "Pembelian",
    href: "/pembelian",
    icon: HandCoins,
  },
  {
    title: "History Pembelian",
    href: "/historypembelian",
    icon: History,
  },
];

// 🌟 MENU PENJUALAN + USER MANAGEMENT
const penjualanNavItems: NavItem[] = [
  {
    title: "Penjualan",
    href: "/penjualan",
    icon: Store,
  },
  {
    title: "History Penjualan",
    href: "/historypenjualan",
    icon: History,
  },
];

const uyNavItems: NavItem[] = [
  {
    title: "User Management",
    href: "/users",
    icon: Users,
  },
  
]


// const footerNavItems: NavItem[] = [
//   {
//     title: 'Documentation',
//     href: 'https://laravel.com/docs/starter-kits#react',
//     icon: BookOpen,
//   },
// ];



export function AppSidebar() {
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
        <NavUy items={uyNavItems} />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
