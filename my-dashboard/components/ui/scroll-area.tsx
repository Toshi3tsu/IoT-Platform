import React from "react"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ScrollArea({ children, ...props }: ScrollAreaProps) {
  return (
    <div {...props} className="overflow-y-auto max-h-80 pr-4">
      {children}
    </div>
  )
}