"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar({ isMenuOpen, setIsMenuOpen }: { isMenuOpen: boolean; setIsMenuOpen: (val: boolean) => void }) {
  const pathname = usePathname();

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-[60] flex flex-col h-full w-64 lg:w-72 bg-[#0c1324] border-r border-[#45464d]/15 shadow-2xl transition-transform duration-500 ease-in-out ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <Link href="/">
              <h2 className="text-xl lg:text-2xl font-black text-[#2fd9f4] font-headline cursor-pointer uppercase tracking-tighter">SNEYDER STUDIO</h2>
            </Link>
            <button onClick={() => setIsMenuOpen(false)} className="md:hidden text-slate-500">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="space-y-4 lg:space-y-6">
            <SidebarItem icon="home" label="Inicio" href="/" />
            <SidebarItem icon="person" label="Perfil de usuario" href="/" />
            <SidebarItem icon="admin_panel_settings" label="Administración" href="/admin" active={pathname === "/admin"} />
            <SidebarItem icon="inventory_2" label="Productos Activos" href="/admin/products" active={pathname === "/admin/products"} />
            <SidebarItem icon="shopping_cart" label="Mis pedidos" href="/" />
            <SidebarItem icon="build" label="Servicios" href="/" />
            <SidebarItem icon="psychology" label="Modelo de IA" href="/" />
            <SidebarItem icon="mail" label="Contacto" href="/" />
            <div className="pt-2 text-slate-500 font-headline text-[10px] uppercase tracking-widest">Legal</div>
            <SidebarItem icon="policy" label="Legal" href="/" />
          </nav>
        </div>
      </aside>

      {/* Overlay ONLY for mobile (sm) - Tablets (md) and up can see both */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[55] backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}

function SidebarItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-4 p-2 rounded cursor-pointer transition-all font-headline text-xs lg:text-sm uppercase tracking-widest ${
        active 
          ? "text-[#2fd9f4] border-l-2 border-[#2fd9f4] bg-tertiary/5 pl-4" 
          : "text-slate-500 hover:text-[#89ceff] hover:bg-[#0c1324]/50"
      }`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
