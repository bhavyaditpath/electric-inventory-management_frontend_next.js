'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/types/enums';
import { NAVIGATION } from '@/app/Constants/navigation.constants';

interface GlobalSearchOptions {
  searchQuery: string;
  userRole?: UserRole;
  isMobile?: boolean;
  mobileSearchOpen?: boolean;
}

export function useGlobalSearch({
  searchQuery,
  userRole,
  isMobile,
  mobileSearchOpen
}: GlobalSearchOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isMobile && !mobileSearchOpen) return;

    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();

      const inventoryPath =
        userRole === UserRole.ADMIN
          ? NAVIGATION.admin.inventory
          : NAVIGATION.branch.inventory;

      if (trimmed) {
        router.push(`${inventoryPath}?search=${encodeURIComponent(trimmed)}`);
        return;
      }

      if (pathname.startsWith(inventoryPath)) {
        router.push(inventoryPath);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, userRole, pathname, isMobile, mobileSearchOpen]);
}
