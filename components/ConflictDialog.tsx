"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircleIcon, MailIcon, AlertTriangleIcon } from "lucide-react"

interface ConflictDialogProps {
  open: boolean
  onClose: () => void
}

export default function ConflictDialog({ open, onClose }: ConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md border-vrz-green/20 bg-black">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vrz-green/10 border border-vrz-green/30">
              <AlertTriangleIcon className="size-5 text-vrz-green" />
            </div>
            <DialogTitle className="text-white text-base">
              Some Machines Are Reserved
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 leading-relaxed">
            Some machines are already reserved during this time. Contact us and
            we&apos;ll try to accommodate your private experience.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <a
            href="https://wa.me/96170000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-vrz-green/40 bg-vrz-green/10 px-4 py-3 text-sm font-medium text-vrz-green hover:bg-vrz-green/20 transition-colors"
          >
            <MessageCircleIcon className="size-4" />
            Message us on WhatsApp
          </a>
          <a
            href="mailto:bookings@vrz.lb"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 hover:border-white/20 hover:text-white transition-colors"
          >
            <MailIcon className="size-4" />
            Email bookings@vrz.lb
          </a>
        </div>

        <DialogFooter showCloseButton={false}>
          <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
