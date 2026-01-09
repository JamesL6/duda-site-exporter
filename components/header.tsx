'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FileArchive, LogOut } from 'lucide-react'

interface HeaderProps {
  email?: string
}

export function Header({ email }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <FileArchive className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Duda Exporter</h1>
        </div>
        <div className="flex items-center gap-4">
          {email && (
            <span className="text-sm text-muted-foreground">{email}</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
