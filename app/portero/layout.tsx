import { ReactNode } from "react"
import { ScanLine } from "lucide-react"

export default function PorteroLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      <header className="flex items-center justify-between px-6 py-4 bg-[#111] border-b border-zinc-800/80 sticky top-0 z-20 shadow-xl backdrop-blur-md bg-opacity-90">
        <div className="flex items-center gap-3 text-purple-500">
          <div className="p-2 bg-purple-500/10 rounded-xl">
            <ScanLine className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-widest uppercase">Escáner</h1>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-md mx-auto relative flex flex-col pb-safe">
        {children}
      </main>
    </div>
  )
}
