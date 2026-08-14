'use client'

import { signOut, useSession } from "next-auth/react";
import { useEffect } from 'react';

export default function PageSetting() {

    const { data: session, status } = useSession();
    const userRoles = session?.user?.roles || [];
    const isAuthorized = userRoles.includes('ADMIN') || userRoles.includes('MANAGER');
  
    useEffect(() => {
      if (status !== 'loading' && !isAuthorized) {
        void signOut({ callbackUrl: '/signin' })
      }
    }, [isAuthorized, status]);
  
    if (status === 'loading' || !isAuthorized) return null;
    
    return null;
}