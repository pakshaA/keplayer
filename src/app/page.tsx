'use client'

import dynamic from 'next/dynamic'

const DynamicComponentWithNoSSR = dynamic(
  () => import('@/components/main/main').then(mod => mod.Main),
  { ssr: false }
)
export default function Home() {
  
  return (
    <>
      <DynamicComponentWithNoSSR />
    </>
  );
}
