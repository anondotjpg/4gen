// components/BodyWrapper.jsx
'use client'
import { usePathname } from 'next/navigation'

export default function BodyWrapper({ children }) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'
  
  return (
    <body className={`${isHomePage ? 'custom-gradient' : 'custom-gradient2'} min-h-screen`}>
      <main className="">{children}</main>
    </body>
  )
}