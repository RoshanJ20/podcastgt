/**
 * @module UploadForm
 * Multi-step wizard for creating and editing bulletins.
 * Orchestrates three steps -- Details, Files, and Review -- delegating
 * each to a dedicated sub-component. File upload logic lives in
 * {@link upload-form-helpers}.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Form } from '@/components/ui/form'
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react'

import {
  uploadFormSchema,
  EMPTY_FILES,
  type FormValues,
  type UploadFormProps,
  type UploadFiles,
} from './upload-form-types'
import { uploadAllFiles, saveBulletin } from './upload-form-helpers'
import { StepIndicator } from './StepIndicator'
import { DetailsStep } from './DetailsStep'
import { FilesStep } from './FilesStep'
import { ReviewStep } from './ReviewStep'

export function UploadForm({ editPodcast, onSuccess }: UploadFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  )
  const [files, setFiles] = useState<UploadFiles>({ ...EMPTY_FILES })

  const form = useForm<FormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: editPodcast
      ? {
          title: editPodcast.title,
          description: editPodcast.description ?? '',
          domain: editPodcast.domain,
          year: editPodcast.year,
          content_type: editPodcast.content_type,
          tags: editPodcast.tags,
        }
      : {
          year: new Date().getFullYear(),
          content_type: 'technical',
          tags: [],
        },
  })

  const tags = form.watch('tags')
  const values = form.watch()

  const nextStep = async () => {
    if (step === 1) {
      const valid = await form.trigger([
        'title',
        'domain',
        'year',
        'content_type',
      ])
      if (!valid) return
    }
    setStep((s) => Math.min(s + 1, 3))
  }

  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const onSubmit = async (formValues: FormValues) => {
    setLoading(true)
    setUploadProgress({})
    try {
      const fileUrls = await uploadAllFiles(files, setUploadProgress)
      const podcast = await saveBulletin(
        formValues,
        fileUrls,
        files,
        editPodcast?.id
      )

      toast.success(editPodcast ? 'Bulletin updated!' : 'Bulletin uploaded!')
      if (onSuccess) {
        onSuccess(podcast)
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <StepIndicator currentStep={step} onStepClick={setStep} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && <DetailsStep />}
          {step === 2 && <FilesStep files={files} onFilesChange={setFiles} />}
          {step === 3 && (
            <ReviewStep
              values={values}
              tags={tags}
              files={files}
              uploadProgress={uploadProgress}
            />
          )}

          <NavigationButtons
            step={step}
            loading={loading}
            isEdit={!!editPodcast}
            onNext={nextStep}
            onPrev={prevStep}
            onCancel={() => router.back()}
          />
        </form>
      </Form>
    </div>
  )
}

/** Bottom navigation bar with Back / Cancel / Next / Submit buttons. */
function NavigationButtons({
  step,
  loading,
  isEdit,
  onNext,
  onPrev,
  onCancel,
}: {
  step: number
  loading: boolean
  isEdit: boolean
  onNext: () => void
  onPrev: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {step > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover-glow hover:border-[#60A5FA]/30 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground transition-all"
        >
          Cancel
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={onNext}
            className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="btn-gradient px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Upload Bulletin'}
          </button>
        )}
      </div>
    </div>
  )
}
