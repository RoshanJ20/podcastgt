/**
 * @module UploadPage
 *
 * Admin page for uploading a new audio bulletin to the library.
 *
 * Key responsibilities:
 * - Renders the UploadForm component for creating new bulletins
 * - Provides the page heading and description
 */
import { UploadForm } from '@/components/admin/UploadForm'

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] gradient-text inline-block">Upload Technical Release</h1>
        <p className="text-muted-foreground mt-1">
          Add a new audio release to the library.
        </p>
      </div>
      <UploadForm />
    </div>
  )
}
