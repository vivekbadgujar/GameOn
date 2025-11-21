import React, { useState } from 'react';
import Link from 'next/link';
import { Home, Trophy, Video, Users, X } from 'lucide-react';

const navLinks = [
  { name: 'Home', to: '/', icon: <Home size={20} /> },
  { name: 'Tournaments', to: '/tournaments', icon: <Trophy size={20} /> },
  { name: 'Videos', to: '/videos', icon: <Video size={20} /> },
  { name: 'Players', to: '/players', icon: <Users size={20} /> },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="fixed bottom-6 right-6 z-40 md:hidden bg-glass p-3 rounded-full shadow-neon" onClick={() => setOpen(true)}>
        <span className="sr-only">Open menu</span>
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="2" rx="1" fill="#00eaff"/><rect x="4" y="15" width="16" height="2" rx="1" fill="#a259ff"/></svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <nav className="w-64 bg-glass h-full p-8 flex flex-col gap-6 shadow-xl animate-slideInLeft">
            <button className="self-end mb-4 p-2 rounded-full hover:bg-glass" onClick={() => setOpen(false)}>
              <X size={28} />
            </button>
            {navLinks.map(link => (
              <Link key={link.name} href={link.to} className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg text-secondary hover:text-primary hover:bg-glass font-medium transition-all" onClick={() => setOpen(false)}>
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
} 