'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import ProfileButton from '@/app/components/ProfileButton';

export function Header() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
      <ProfileButton />
    </div>
  );
} 