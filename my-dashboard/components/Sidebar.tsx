"use client"

import { LayoutDashboard, MessageSquare, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  activeView: 'dashboard' | 'chat' | 'edge'
  setActiveView: (view: 'dashboard' | 'chat' | 'edge') => void
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col p-4">
      <h1 className="text-2xl font-bold mb-4">Menu</h1>
      <nav className="flex flex-col space-y-2">
        <Button
          variant={activeView === 'dashboard' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveView('dashboard')}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        <Button
          variant={activeView === 'chat' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveView('chat')}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat
        </Button>
        <Button
          variant={activeView === 'edge' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveView('edge')}
        >
          <Cpu className="mr-2 h-4 w-4" />
          Edge Device
        </Button>
      </nav>
    </div>
  )
}