import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Building2, Home, Users, FolderKanban } from 'lucide-react';
import AppLogo from './app-logo';

const centralNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Tenants',
        href: '/tenants',
        icon: Building2,
    },
    {
        title: 'Clients',
        href: '/clients',
        icon: Users,
    },
    {
        title: 'Projects',
        href: '/projects',
        icon: FolderKanban,
    },
];

const tenantNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/tenant/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Properties',
        href: '/properties',
        icon: Home,
    },
];

export function AppSidebar() {
    const { tenancy } = usePage<SharedData>().props;
    const navItems = tenancy.initialized ? tenantNavItems : centralNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
