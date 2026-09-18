"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger, 
  useSidebar,
} from "@/components/ui"
import { isMenuActive, type MenuItem } from "@/lib/rbac/menus";
import { usePathname } from "next/navigation";

function ResponsiveHeader({
  sidebar,
  menuItems,
}: {
  sidebar: React.ReactNode;
  menuItems: MenuItem[];
}) {
  const { openMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <> 
      <header className="flex lg:hidden sticky top-0 z-30 h-16 items-center gap-3 border-b border-slate-200 px-4 backdrop-blur">
        <button
          type="button"
          aria-label="Open sidebar"
          className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100"
          onClick={() => setOpenMobile(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-base font-bold text-slate-950">
          {menuItems.find((item) => isMenuActive(pathname, item.href))?.title ?? "Dashboard"}
        </span>
      </header>

      <div className={`fixed inset-0 z-40 lg:hidden ${openMobile ? "" : "pointer-events-none"}`} slot="mobile">
        <button
          type="button"
          aria-label="Close sidebar"
          className={`absolute inset-0 z-20 bg-slate-950/50 backdrop-blur-sm transition-opacity ${openMobile ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpenMobile(false)}
        />
        <div className={`absolute inset-y-0 z-20 left-0 transition-transform duration-200 ${openMobile ? "translate-x-0" : "-translate-x-full"}`}>
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute right-3 top-3 z-20 rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setOpenMobile(false)}
          >
            <X className="h-3 w-3" />
          </button>

          <SidebarTrigger className={`${openMobile ? "flex" : "hidden"} absolute -right-8 top-3 z-60 ml-auto bg-[#6D28D9] text-white shadow-xl shadow-[#4E2788]/20`} />

          <section data-slot="sidebar" slot="mobile">
            {sidebar}
          </section>
        </div>
      </div>
    </>
  )
}

export default function ResponsiveShell({
  children,
  sidebar,
  menuItems,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  menuItems: MenuItem[];
}) {
  // const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider className="bg-background" defaultOpen={true}>
      <div className="min-h-screen bg-background w-full" slot="main-screen">
        <ResponsiveHeader sidebar={sidebar} menuItems={menuItems} />

        <div className="flex min-h-screen" data-slot="sidebar-wrapper">
          <section className="hidden lg:flex" data-slot="sidebar" slot="desktop">
            {sidebar}
          </section>
          
          <SidebarInset
            data-slot="sidebar-inset"
            slot="body"
            className="flex min-h-screen min-w-0 flex-1 flex-col bg-background transition-[margin-left,width] duration-200 ease-linear md:peer-data-[state=collapsed]:ml-12 lg:pl-0"
          >
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
