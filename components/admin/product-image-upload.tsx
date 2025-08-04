"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"

interface ProductImageUploadProps {
  productId: string
  currentImageUrl?: string
  onImageUploaded: (imageUrl: string) => void
}

export default function ProductImageUpload({ productId, currentImageUrl, onImageUploaded }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload JPEG, PNG, or WebP images only.")
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError("File too large. Please upload images smaller than 5MB.")
      return
    }

    setError(null)
    setUploading(true)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("productId", productId)

      const response = await fetch("/api/upload-product-image", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      onImageUploaded(result.imageUrl)
      setPreviewUrl(result.imageUrl)
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Upload failed")
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const removeImage = () => {
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-1">📸 Product Image Guidelines:</p>
        <ul className="text-xs space-y-1 ml-4">
          <li>
            • <strong>Recommended size:</strong> 800x800 pixels (square format)
          </li>
          <li>
            • <strong>Formats:</strong> JPEG, PNG, or WebP
          </li>
          <li>
            • <strong>Max file size:</strong> 5MB
          </li>
          <li>
            • <strong>Best results:</strong> Clean background, good lighting, product centered
          </li>
        </ul>
      </div>

      <Card>
        <CardContent className="p-4">
          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Product preview"
                  className="w-full max-w-xs mx-auto rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center">
                <Button type="button" variant="outline" onClick={handleClick} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  Change Image
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {uploading ? "Uploading..." : "Drop image here or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, or WebP up to 5MB</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  )
}
