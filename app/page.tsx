import dynamic from 'next/dynamic';

// ssr: false prevents Supabase client from being instantiated during prerender
const HomeClient = dynamic(() => import('./HomeClient'), { ssr: false });

export default function Home() {
  return <HomeClient />;
}
