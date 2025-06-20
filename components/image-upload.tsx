"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Upload, Camera } from "lucide-react"

interface ImageUploadProps {
  onClose: () => void
}

export function ImageUpload({ onClose }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [question, setQuestion] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState("")

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append("image", selectedImage)
      formData.append("question", question)

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.text()
        setAnalysis(result)
      } else {
        setAnalysis("Error analyzing image. Please try again.")
      }
    } catch (error) {
      console.error("Error:", error)
      setAnalysis("Error analyzing image. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Upload Image & Ask Questions
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            {imagePreview ? (
              <div className="space-y-4">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full max-h-64 mx-auto rounded-lg"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedImage(null)
                    setImagePreview(null)
                    setAnalysis("")
                  }}
                >
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Upload an image</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload diagrams, equations, or any study material
                  </p>
                </div>
                <Input type="file" accept="image/*" onChange={handleImageSelect} className="max-w-xs mx-auto" />
              </div>
            )}
          </div>

          {/* Question Input */}
          {selectedImage && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ask a question about this image:</label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Explain this diagram, Solve this problem, What is this concept?"
                  className="w-full"
                />
              </div>

              <Button onClick={analyzeImage} disabled={isAnalyzing || !question.trim()} className="w-full">
                {isAnalyzing ? "Analyzing..." : "Analyze Image"}
              </Button>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && (
            <div className="space-y-2">
              <h3 className="font-medium">AI Analysis:</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="whitespace-pre-wrap">{analysis}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Upload images of diagrams, equations, or study materials</p>
            <p>• Ask specific questions about the content</p>
            <p>• Get detailed explanations and solutions</p>
            <p>• Supported formats: JPG, PNG, GIF, WebP</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
