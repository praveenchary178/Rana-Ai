'use client';
// Incoming calls now live on the Calls page. Old links and bookmarks land there with the same filter.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InboundPage() {
  const router = useRouter();
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set('direction', 'inbound');
    router.replace(`/calls?${q.toString()}`);
  }, [router]);
  return <div className='min-h-screen bg-paper p-10 text-[13px] text-ink-soft'>Opening Calls…</div>;
}
