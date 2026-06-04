"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Trash2, Check, WifiOff } from "lucide-react"

interface LanguagePack {
  code: string
  name: string
  flag: string
  size: string
  isDownloaded?: boolean
  isDownloading?: boolean
  downloadProgress?: number
}

interface OfflineModePanelProps {
  packs: LanguagePack[]
  onDownloadPack: (code: string) => void
  onDeletePack: (code: string) => void
  isOnline: boolean
}

export function OfflineModePanel({ packs, onDownloadPack, onDeletePack, isOnline }: OfflineModePanelProps) {
  return (
    <Card className="p-6 border-border space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <WifiOff className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Offline Language Packs</h3>
          </div>
          <p className="text-sm text-muted-foreground">Download language packs to translate without internet</p>
        </div>
        {!isOnline && (
          <div className="text-xs bg-yellow-500/10 text-yellow-700 px-2 py-1 rounded-full font-medium">
            Offline
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {packs.map((pack) => (
          <div key={pack.code} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            <span className="text-2xl">{pack.flag}</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{pack.name}</p>
              <p className="text-xs text-muted-foreground">{pack.size} MB</p>
            </div>

            {pack.isDownloaded ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeletePack(pack.code)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : pack.isDownloading ? (
              <div className="flex items-center gap-2">
                <div className="w-16 bg-secondary rounded-full h-1">
                  <div
                    className="bg-primary h-1 rounded-full transition-all"
                    style={{ width: `${pack.downloadProgress || 0}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{pack.downloadProgress}%</span>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPack(pack.code)}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                <span className="hidden xs:inline">Download</span>
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground bg-card p-3 rounded-lg">
        <p className="font-medium mb-1">Tip:</p>
        <p>Download multiple language packs to access translations even when offline.</p>
      </div>
    </Card>
  )
}
