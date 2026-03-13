'use client'

import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Download, FileText, Eye, EyeOff, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface BulletinViewerProps {
  url: string
}

export function BulletinViewer({ url }: BulletinViewerProps) {
  const [expanded, setExpanded] = useState(false)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [containerWidth, setContainerWidth] = useState<number>(600)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width)
        }
      })
      observer.observe(node)
      return () => observer.disconnect()
    }
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  return (
    <div className="rounded-lg glass-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="p-2 rounded-lg bg-[#3B82F6]/15">
          <FileText className="h-5 w-5 text-[#3B82F6]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Bulletin</p>
          <p className="text-xs text-muted-foreground">
            {expanded
              ? `Page ${pageNumber} of ${numPages ?? '...'}`
              : 'View or download the full PDF report.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover-glow hover:border-[#8B5CF6]/30 transition-all flex items-center gap-1.5"
          >
            {expanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {expanded ? 'Hide' : 'View'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> PDF
          </a>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          {/* Page controls */}
          {numPages && numPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-2 border-b border-border bg-muted/30">
              <button
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium tabular-nums">
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                disabled={pageNumber >= numPages}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* PDF render area */}
          <div ref={containerRef} className="flex justify-center bg-muted/20 p-4 overflow-auto max-h-[600px]">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2" />
                  <p className="text-sm">Unable to load PDF preview.</p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#8B5CF6] underline mt-1"
                  >
                    Open in new tab
                  </a>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                width={Math.min(containerWidth - 32, 800)}
                renderAnnotationLayer={true}
                renderTextLayer={true}
              />
            </Document>
          </div>
        </div>
      )}
    </div>
  )
}
