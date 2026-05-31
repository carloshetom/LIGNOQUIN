'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FlaskConical, PlusCircle, FileText, Home, Leaf } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/ensayos', label: 'Ensayos', icon: FlaskConical },
  { href: '/ensayos/nuevo', label: 'Nuevo Ensayo', icon: PlusCircle },
  { href: '/informes', label: 'Informes', icon: FileText },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-lq-primary text-white flex flex-col shadow-xl print:hidden">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-green-700">
        <div className="flex items-center gap-3">
          <div className="bg-lq-accent rounded-full p-2">
            <Leaf size={22} className="text-lq-primary" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-wide">LIGNOQUIM</span>
            <p className="text-xs text-green-300 leading-none">Sistema de Ensayos</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-lq-secondary text-lq-primary shadow'
                  : 'text-green-200 hover:bg-green-700 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-green-700">
        <p className="text-xs text-green-400">Lignoquim S.A. © {new Date().getFullYear()}</p>
        <p className="text-xs text-green-500">v1.0 — Perú</p>
      </div>
    </aside>
  )
}
