'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    router.replace(params ? `/login?${params}` : '/login');
  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>Redirecting...</p>
    </div>
  );
}

export default function AdminLoginRedirect() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Redirecting...</p>
      </div>
    }>
      <RedirectContent />
    </Suspense>
  );
}
