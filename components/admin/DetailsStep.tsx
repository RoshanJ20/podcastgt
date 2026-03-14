/**
 * @module DetailsStep
 * Step 1 of the UploadForm wizard. Renders form fields for bulletin
 * metadata: title, description, domain, year, content type, and tags.
 * All field state is managed by the parent react-hook-form context.
 */

'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DOMAINS } from '@/lib/supabase/types'
import { X } from 'lucide-react'
import type { FormValues } from './upload-form-types'

export function DetailsStep() {
  const form = useFormContext<FormValues>()
  const [tagInput, setTagInput] = useState('')
  const tags = form.watch('tags')

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      form.setValue('tags', [...tags, t])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    form.setValue(
      'tags',
      tags.filter((t: string) => t !== tag)
    )
  }

  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
          Bulletin Details
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Basic information about the bulletin
        </p>
      </div>

      <FormField
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Bulletin title" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Brief overview of this bulletin..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        name="content_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="technical">Bulletin</SelectItem>
                <SelectItem value="learning_series">Learning Series</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <TagInput
        tagInput={tagInput}
        setTagInput={setTagInput}
        tags={tags}
        onAdd={addTag}
        onRemove={removeTag}
      />
    </div>
  )
}

/** Inline sub-component for the tag input + badge list. */
function TagInput({
  tagInput,
  setTagInput,
  tags,
  onAdd,
  onRemove,
}: {
  tagInput: string
  setTagInput: (v: string) => void
  tags: string[]
  onAdd: () => void
  onRemove: (tag: string) => void
}) {
  return (
    <div className="space-y-2">
      <FormLabel>Tags</FormLabel>
      <div className="flex gap-2">
        <Input
          placeholder="Add tag and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAdd()
            }
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-2 rounded-lg border border-border text-sm hover-glow hover:border-[#60A5FA]/30 transition-all"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag: string) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 cursor-pointer bg-[#60A5FA]/15 text-[#93C5FD] hover:bg-[#60A5FA]/25"
              onClick={() => onRemove(tag)}
            >
              {tag}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
