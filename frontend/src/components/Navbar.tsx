'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ScanLine, Trophy, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pages that should show navbar
  const showNavbar = pathname === '/' || pathname === '/scan' || pathname === '/hazdex';

  if (!showNavbar) return null;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/scan', label: 'Scanner', icon: ScanLine },
    { href: '/hazdex', label: 'Hazdex', icon: Trophy },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-ink/80 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-hazard to-yellow-600 flex items-center justify-center font-display font-bold text-ink">
              C
            </div>
            <span className="font-display font-bold text-lg text-paper group-hover:text-hazard transition-colors">
              ChemSafe
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link key={link.href} href={link.href}>
                  <button
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm transition-all
                      flex items-center gap-2
                      ${
                        isActive
                          ? 'bg-hazard/10 text-hazard'
                          : 'text-steel hover:text-paper hover:bg-white/5'
                      }
                    `}
                  >
                    {Icon && <Icon size={16} />}
                    {link.label}
                  </button>
                </Link>
              );
            })}
            
            <div className="ml-2 pl-2 border-l border-white/10">
              <Link href="/login">
                <Button size="sm" variant="outline" className="border-white/20 hover:border-hazard/40">
                  <ShieldCheck size={16} />
                  Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-paper" />
            ) : (
              <Menu size={24} className="text-paper" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/10 bg-ink/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                
                return (
                  <Link key={link.href} href={link.href}>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        w-full px-4 py-3 rounded-lg font-medium text-sm transition-all
                        flex items-center gap-3
                        ${
                          isActive
                            ? 'bg-hazard/10 text-hazard'
                            : 'text-steel hover:text-paper hover:bg-white/5'
                        }
                      `}
                    >
                      {Icon && <Icon size={18} />}
                      {link.label}
                    </button>
                  </Link>
                );
              })}
              
              <div className="pt-2 border-t border-white/10">
                <Link href="/login">
                  <Button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                    variant="outline"
                  >
                    <ShieldCheck size={16} />
                    Workplace Login
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
