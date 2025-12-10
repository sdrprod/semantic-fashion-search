'use client';

import { SessionProvider } from 'next-auth/react';
import './admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="admin-layout">
        {children}
      </div>
    </SessionProvider>
  );
}
