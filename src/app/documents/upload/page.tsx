"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  X,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Document types for selection
const documentTypes = [
  { value: "Passport", label: "Passport" },
  { value: "Driver's License", label: "Driver's License" },
  { value: "National ID", label: "National ID Card" },
  { value: "Birth Certificate", label: "Birth Certificate" },
  { value: "Proof of Address", label: "Proof of Address" },
  { value: "Utility Bill", label: "Utility Bill" },
  { value: "Bank Statement", label: "Bank Statement" },
  { value: "Other", label: "Other Document" },
];

interface UploadedFile {
  file: File;
  type: string;
  preview?: string;
  id: string;
}

interface UploadProgress {
  [key: string]: number;
}

interface UploadResult {
  success: boolean;
  document?: any;
  error?: string;
}

export default function DocumentUploadPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  // State management
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [uploadResults, setUploadResults] = useState<{
    [key: string]: UploadResult;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    Array.from(files).forEach((file) => {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        setError(
          `Invalid file type: ${file.name}. Please upload images (JPEG, PNG, GIF) or PDF files.`
        );
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uploadedFile: UploadedFile = {
        file,
        type: "", // Will be set when user selects document type
        id: fileId,
      };

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setSelectedFiles((prev) => [...prev, uploadedFile]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(uploadedFile);
      }
    });

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }

    // Clear the input
    event.target.value = "";
    setError(null);
  };

  // Update document type for a file
  const updateFileType = (fileId: string, type: string) => {
    setSelectedFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, type } : file))
    );
  };

  // Remove a file
  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setUploadResults((prev) => {
      const newResults = { ...prev };
      delete newResults[fileId];
      return newResults;
    });
  };

  // Upload a single file
  const uploadSingleFile = async (
    uploadedFile: UploadedFile
  ): Promise<UploadResult> => {
    if (!token) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("document", uploadedFile.file);
    formData.append("documentType", uploadedFile.type);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const currentProgress = prev[uploadedFile.id] || 0;
          const newProgress = Math.min(currentProgress + 10, 90);
          return { ...prev, [uploadedFile.id]: newProgress };
        });
      }, 200);

      const response = await fetch(
        "http://localhost:8000/api/documents/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const result = await response.json();

      // Complete progress
      setUploadProgress((prev) => ({ ...prev, [uploadedFile.id]: 100 }));

      if (!result.success) {
        throw new Error(result.message || "Upload failed");
      }

      return {
        success: true,
        document: result.document,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  };

  // Upload all files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    // Validate that all files have document types
    const filesWithoutType = selectedFiles.filter((file) => !file.type);
    if (filesWithoutType.length > 0) {
      setError("Please select document type for all files");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of selectedFiles) {
        // Only upload if not already successfully uploaded
        if (!uploadResults[file.id] || !uploadResults[file.id].success) {
          const result = await uploadSingleFile(file);
          setUploadResults((prev) => ({ ...prev, [file.id]: result }));
        }
      }

      // Check if all uploads were successful
      const currentResults = { ...uploadResults };
      // Update with any new results from this upload session
      selectedFiles.forEach((file) => {
        if (!currentResults[file.id]) {
          // This shouldn't happen, but handle it gracefully
          currentResults[file.id] = {
            success: false,
            error: "Upload not completed",
          };
        }
      });

      const successfulUploads = Object.values(currentResults).filter(
        (result) => result.success
      ).length;
      const totalFiles = selectedFiles.length;

      if (successfulUploads === totalFiles) {
        setSuccess(
          `Successfully uploaded ${successfulUploads} document${
            successfulUploads > 1 ? "s" : ""
          }. Documents are now stored on IPFS and blockchain.`
        );

        // Redirect to documents page after a delay
        setTimeout(() => {
          router.push("/documents");
        }, 2000);
      } else {
        setError(
          `Uploaded ${successfulUploads} out of ${totalFiles} documents. Some uploads failed.`
        );
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to upload documents"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Get file size in readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Upload Documents</h1>
          <p className="text-muted-foreground">
            Upload your identity documents for verification. Files will be
            stored securely on IPFS and blockchain.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Documents</CardTitle>
          <CardDescription>
            Choose files to upload. Supported formats: JPEG, PNG, GIF, PDF.
            Maximum size: 10MB per file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-gray-900">
                    Click to upload files
                  </span>
                  <span className="text-sm text-gray-500 block">
                    or drag and drop files here
                  </span>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="sr-only"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Selected Files</h3>
                <div className="grid gap-4">
                  {selectedFiles.map((uploadedFile) => {
                    const progress = uploadProgress[uploadedFile.id] || 0;
                    const result = uploadResults[uploadedFile.id];

                    return (
                      <Card key={uploadedFile.id} className="p-4">
                        <div className="flex items-start gap-4">
                          {/* File Preview */}
                          <div className="shrink-0">
                            {uploadedFile.preview ? (
                              <img
                                src={uploadedFile.preview}
                                alt={uploadedFile.file.name}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* File Details */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm truncate max-w-xs">
                                  {uploadedFile.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(uploadedFile.file.size)}
                                </p>
                              </div>

                              {/* Status Badge */}
                              <div className="flex items-center gap-2">
                                {result?.success && (
                                  <Badge className="bg-green-500 text-white">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Uploaded
                                  </Badge>
                                )}
                                {result?.error && (
                                  <Badge variant="destructive">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                                {progress > 0 && progress < 100 && !result && (
                                  <Badge className="bg-blue-500 text-white">
                                    Uploading...
                                  </Badge>
                                )}

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFile(uploadedFile.id)}
                                  className="h-6 w-6 text-gray-400 hover:text-red-500"
                                  disabled={isUploading}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Document Type Selection */}
                            <div className="flex items-center gap-4">
                              <Label className="text-xs text-gray-600 shrink-0">
                                Document Type:
                              </Label>
                              <Select
                                value={uploadedFile.type}
                                onValueChange={(value) =>
                                  updateFileType(uploadedFile.id, value)
                                }
                                disabled={isUploading || result?.success}
                              >
                                <SelectTrigger className="w-48 h-8 text-xs">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {documentTypes.map((type) => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Progress Bar */}
                            {progress > 0 && progress < 100 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Uploading...</span>
                                  <span>{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>
                            )}

                            {/* Error Message */}
                            {result?.error && (
                              <p className="text-xs text-red-600">
                                {result.error}
                              </p>
                            )}

                            {/* Success Message */}
                            {result?.success && (
                              <div className="text-xs text-green-600 space-y-1">
                                <p>✓ Document uploaded successfully</p>
                                {result.document?.blockchainTxHash && (
                                  <p className="font-mono">
                                    Blockchain TX:{" "}
                                    {result.document.blockchainTxHash.slice(
                                      0,
                                      20
                                    )}
                                    ...
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              isUploading ||
              selectedFiles.some((file) => !file.type) ||
              selectedFiles.every(
                (file) => uploadResults[file.id]?.success === true
              )
            }
            className="min-w-32"
          >
            {isUploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Uploading...
              </>
            ) : selectedFiles.every(
                (file) => uploadResults[file.id]?.success === true
              ) ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                All Uploaded
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </>
            )}
          </Button>
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">
            Updated Blockchain Integration
          </CardTitle>
          <CardDescription>
            How your documents are securely processed with our new verification
            flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Step 1: IPFS Storage</h4>
              <p className="text-gray-600">
                Documents are immediately stored on IPFS for decentralized,
                immutable storage.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Step 2: Admin Verification</h4>
              <p className="text-gray-600">
                Our team reviews your documents for authenticity and compliance.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Step 3: Blockchain Storage</h4>
              <p className="text-gray-600">
                Only verified documents get their hashes recorded on Ethereum
                blockchain.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Privacy & Security</h4>
              <p className="text-gray-600">
                Document content stays private while verification status is
                publicly verifiable.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              ✨ New Verification Flow
            </h4>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Documents are now only stored on blockchain after admin
              verification, ensuring only legitimate documents are permanently
              recorded on the blockchain.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
