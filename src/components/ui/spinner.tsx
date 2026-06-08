import { Hourglass } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Hourglass
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      style={{ animationDuration: "2s" }}
      {...props}
    />
  )
}

export { Spinner }
