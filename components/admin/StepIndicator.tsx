/**
 * @module StepIndicator
 * Renders the horizontal step-progress bar for the multi-step UploadForm.
 * Each step is clickable when it has already been completed, allowing
 * users to navigate backwards through the form.
 */

'use client'

import { Check } from 'lucide-react'
import { STEPS } from './upload-form-types'

interface StepIndicatorProps {
  currentStep: number
  onStepClick: (step: number) => void
  disabled?: boolean
}

export function StepIndicator({ currentStep, onStepClick, disabled }: StepIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      {STEPS.map((s, i) => (
        <div key={s.number} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!disabled && s.number < currentStep) onStepClick(s.number)
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentStep === s.number
                ? 'btn-gradient'
                : currentStep > s.number
                  ? 'bg-[#60A5FA]/15 text-[#93C5FD] cursor-pointer hover:bg-[#60A5FA]/25'
                  : 'text-muted-foreground bg-white/5'
            }`}
          >
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep > s.number ? 'bg-[#60A5FA] text-white' : ''
              }`}
            >
              {currentStep > s.number ? <Check className="h-3 w-3" /> : s.number}
            </span>
            {s.label}
          </button>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-8 ${currentStep > s.number ? 'bg-[#60A5FA]' : 'bg-border'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
