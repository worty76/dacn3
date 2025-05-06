"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle, Clock, AlertCircle, X, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// Document upload status types
type Status =
  | "pending"
  | "verified"
  | "rejected"
  | "not_uploaded"
  | "uploading";

// Document types interface
interface Document {
  id: string;
  type: string;
  file: File | null;
  status: Status;
  uploadDate?: Date;
  feedback?: string;
  uploadProgress?: number;
  serverId?: string; // ID from server after successful upload
}

export default function KYCPage() {
  // Get token from auth store
  const { token } = useAuthStore();

  // State for tracking documents
  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", type: "Passport", file: null, status: "not_uploaded" },
    { id: "2", type: "Driver's License", file: null, status: "not_uploaded" },
  ]);

  // State for additional documents
  const [additionalDocs, setAdditionalDocs] = useState<Document[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Verification process steps
  const steps = ["Upload Documents", "Verification", "Completion"];

  // Upload document to server
  const uploadDocumentToServer = async (doc: Document) => {
    if (!doc.file || !token) return null;

    try {
      // Create form data
      const formData = new FormData();
      formData.append("document", doc.file);
      formData.append("documentType", doc.type);

      // Start upload
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload document");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Upload failed");
      }

      return result.document;
    } catch (error) {
      console.error("Document upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload document"
      );
      return null;
    }
  };

  // Handle document upload
  const handleFileUpload = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Update document with file and set status to uploading
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id === id) {
          return {
            ...doc,
            file: files[0],
            status: "uploading",
            uploadProgress: 0,
            uploadDate: new Date(),
          };
        }
        return doc;
      })
    );

    setIsUploading(true);
    setUploadError(null);

    // Find the document that was just updated
    const docToUpload = documents.find((d) => d.id === id);
    if (!docToUpload) return;

    // Update with the new file
    const updatedDoc = {
      ...docToUpload,
      file: files[0],
    };

    // Upload to server
    try {
      // Simulate progress (since fetch doesn't support progress events directly)
      const progressInterval = setInterval(() => {
        setDocuments((prev) =>
          prev.map((doc) => {
            if (
              doc.id === id &&
              doc.uploadProgress &&
              doc.uploadProgress < 90
            ) {
              return {
                ...doc,
                uploadProgress: doc.uploadProgress + 10,
              };
            }
            return doc;
          })
        );
      }, 300);

      const uploadedDoc = await uploadDocumentToServer(updatedDoc);

      clearInterval(progressInterval);

      if (uploadedDoc) {
        setDocuments((prev) =>
          prev.map((doc) => {
            if (doc.id === id) {
              return {
                ...doc,
                status: "pending",
                uploadProgress: 100,
                serverId: uploadedDoc.id,
              };
            }
            return doc;
          })
        );

        // Move to verification step after upload
        if (activeStep === 0) {
          setActiveStep(1);
        }
      } else {
        // Reset to not uploaded if server upload failed
        setDocuments((prev) =>
          prev.map((doc) => {
            if (doc.id === id) {
              return {
                ...doc,
                status: "not_uploaded",
                uploadProgress: undefined,
              };
            }
            return doc;
          })
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");

      // Reset status on error
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === id) {
            return {
              ...doc,
              status: "not_uploaded",
              uploadProgress: undefined,
            };
          }
          return doc;
        })
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle additional document upload
  const handleAdditionalFileUpload = async (
    id: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    // Update document with file and set status to uploading
    setAdditionalDocs((prev) =>
      prev.map((doc) => {
        if (doc.id === id) {
          return {
            ...doc,
            file: files[0],
            status: "uploading",
            uploadProgress: 0,
            uploadDate: new Date(),
          };
        }
        return doc;
      })
    );

    setIsUploading(true);
    setUploadError(null);

    // Find the document that was just updated
    const docToUpload = additionalDocs.find((d) => d.id === id);
    if (!docToUpload) return;

    // Update with the new file
    const updatedDoc = {
      ...docToUpload,
      file: files[0],
    };

    // Upload to server
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAdditionalDocs((prev) =>
          prev.map((doc) => {
            if (
              doc.id === id &&
              doc.uploadProgress &&
              doc.uploadProgress < 90
            ) {
              return {
                ...doc,
                uploadProgress: doc.uploadProgress + 10,
              };
            }
            return doc;
          })
        );
      }, 300);

      const uploadedDoc = await uploadDocumentToServer(updatedDoc);

      clearInterval(progressInterval);

      if (uploadedDoc) {
        setAdditionalDocs((prev) =>
          prev.map((doc) => {
            if (doc.id === id) {
              return {
                ...doc,
                status: "pending",
                uploadProgress: 100,
                serverId: uploadedDoc.id,
              };
            }
            return doc;
          })
        );
      } else {
        // Reset to not uploaded if server upload failed
        setAdditionalDocs((prev) =>
          prev.map((doc) => {
            if (doc.id === id) {
              return {
                ...doc,
                status: "not_uploaded",
                uploadProgress: undefined,
              };
            }
            return doc;
          })
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");

      // Reset status on error
      setAdditionalDocs((prev) =>
        prev.map((doc) => {
          if (doc.id === id) {
            return {
              ...doc,
              status: "not_uploaded",
              uploadProgress: undefined,
            };
          }
          return doc;
        })
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle submission for verification
  const handleSubmitForVerification = async () => {
    try {
      setIsSubmitting(true);
      setSubmissionError(null);

      // Collect all document IDs that have been uploaded
      const requiredDocIds = documents
        .filter((doc) => doc.serverId)
        .map((doc) => doc.serverId);

      const additionalDocIds = additionalDocs
        .filter((doc) => doc.serverId)
        .map((doc) => doc.serverId);

      const allDocumentIds = [...requiredDocIds, ...additionalDocIds];

      if (allDocumentIds.length === 0) {
        throw new Error("No documents have been uploaded");
      }

      // Call API to update documents status to "submitted for verification"
      const response = await fetch(
        "http://localhost:8000/api/documents/submit-verification",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentIds: allDocumentIds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to submit documents for verification"
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Submission failed");
      }

      // Update UI to show submission success
      setSubmissionSuccess(true);

      // Move to the completion step
      setActiveStep(2);
    } catch (error) {
      console.error("Error submitting for verification:", error);
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Failed to submit for verification"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status display helper
  const getStatusBadge = (status: Status, progress?: number) => {
    switch (status) {
      case "uploading":
        return (
          <div className="space-y-1">
            <Badge className="bg-blue-500 text-white flex items-center gap-1">
              <Upload className="h-3 w-3" /> Uploading...
            </Badge>
            {progress !== undefined && (
              <Progress value={progress} className="h-1 w-full" />
            )}
          </div>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500 text-white flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending Review
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground flex items-center gap-1"
          >
            Not Uploaded
          </Badge>
        );
    }
  };

  // Progress calculation
  const calculateProgress = () => {
    const totalDocs = documents.length;
    const uploadedDocs = documents.filter((doc) => doc.file !== null).length;
    return (uploadedDocs / totalDocs) * 100;
  };

  return (
    <div className="container py-8 mx-auto max-w-5xl">
      <div className="bg-card rounded-lg border shadow-sm p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>

        <p className="text-muted-foreground mb-8">
          Complete your KYC verification by uploading the required documents.
          This helps us verify your identity and comply with regulations.
        </p>

        {/* Progress tracker */}
        <div className="mb-10">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={cn(
                  "flex flex-col items-center flex-1",
                  index < activeStep
                    ? "text-primary"
                    : index === activeStep
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mb-2 border",
                    index < activeStep
                      ? "bg-primary text-primary-foreground border-primary"
                      : index === activeStep
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {uploadError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {submissionSuccess && (
          <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your documents have been successfully submitted for verification.
              We'll notify you once the verification process is complete.
            </AlertDescription>
          </Alert>
        )}

        {submissionError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submissionError}</AlertDescription>
          </Alert>
        )}

        {/* Required Documents */}
        <h2 className="text-xl font-semibold mb-4">Required Documents</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle>{doc.type}</CardTitle>
                {!doc.file && (
                  <CardDescription>
                    Please upload a clear, color image of your{" "}
                    {doc.type.toLowerCase()}.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {doc.file ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Filename: {doc.file.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Size: {(doc.file.size / 1024).toFixed(2)} KB
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Uploaded on: {doc.uploadDate?.toLocaleDateString()}
                    </div>
                    <div className="mt-2">
                      {getStatusBadge(doc.status, doc.uploadProgress)}
                    </div>
                    {doc.feedback && (
                      <Alert className="mt-2">
                        <AlertDescription>{doc.feedback}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter>
                <Label
                  htmlFor={`upload-${doc.id}`}
                  className="cursor-pointer w-full"
                >
                  <div className="flex w-full">
                    <Button
                      asChild
                      className="w-full"
                      disabled={doc.status === "uploading" || isUploading}
                    >
                      <div>
                        <Upload className="mr-2 h-4 w-4" />
                        {doc.status === "uploading"
                          ? "Uploading..."
                          : doc.file
                          ? "Upload Again"
                          : "Upload"}
                      </div>
                    </Button>
                  </div>
                  <input
                    id={`upload-${doc.id}`}
                    type="file"
                    className="sr-only"
                    accept="image/*, application/pdf"
                    onChange={(e) => handleFileUpload(doc.id, e.target.files)}
                    disabled={doc.status === "uploading" || isUploading}
                  />
                </Label>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Documents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Additional Documents (Optional)
            </h2>
            <Button
              variant="outline"
              onClick={() =>
                setAdditionalDocs((prev) => [
                  ...prev,
                  {
                    id: `additional-${prev.length + 1}`,
                    type: `Additional Document ${prev.length + 1}`,
                    file: null,
                    status: "not_uploaded",
                  },
                ])
              }
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Document
            </Button>
          </div>

          {additionalDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {additionalDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{doc.type}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          setAdditionalDocs((prev) =>
                            prev.filter((d) => d.id !== doc.id)
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {!doc.file && (
                      <CardDescription>
                        Upload any additional document that may help verify your
                        identity.
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {doc.file ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Filename: {doc.file.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Size: {(doc.file.size / 1024).toFixed(2)} KB
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(doc.status, doc.uploadProgress)}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter>
                    <Label
                      htmlFor={`upload-additional-${doc.id}`}
                      className="cursor-pointer w-full"
                    >
                      <div className="flex w-full">
                        <Button
                          asChild
                          className="w-full"
                          disabled={doc.status === "uploading" || isUploading}
                        >
                          <div>
                            <Upload className="mr-2 h-4 w-4" />
                            {doc.status === "uploading"
                              ? "Uploading..."
                              : doc.file
                              ? "Upload Again"
                              : "Upload"}
                          </div>
                        </Button>
                      </div>
                      <input
                        id={`upload-additional-${doc.id}`}
                        type="file"
                        className="sr-only"
                        accept="image/*, application/pdf"
                        onChange={(e) =>
                          handleAdditionalFileUpload(doc.id, e.target.files)
                        }
                        disabled={doc.status === "uploading" || isUploading}
                      />
                    </Label>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              If necessary, you can add more documents to help verify your
              identity.
            </p>
          )}
        </div>

        {/* Verification Information */}
        <Separator className="my-8" />

        <h2 className="text-xl font-semibold mb-4">Verification Process</h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="process">
            <AccordionTrigger>
              How does the verification process work?
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                Our verification process typically takes 1-3 business days to
                complete. Here's how it works:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  Upload your identification documents through this secure
                  portal.
                </li>
                <li>
                  Our verification team reviews your submissions for
                  authenticity.
                </li>
                <li>
                  You'll receive email notifications about your verification
                  status.
                </li>
                <li>
                  If additional information is needed, we'll contact you
                  directly.
                </li>
                <li>
                  Once verified, you'll have full access to all platform
                  features.
                </li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="documents">
            <AccordionTrigger>What documents are accepted?</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">
                We accept the following government-issued identification
                documents:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Passport (valid and not expired)</li>
                <li>Driver's License (valid and not expired)</li>
                <li>National ID Card</li>
                <li>Residence Permit</li>
              </ul>
              <p className="mt-4">
                Documents must be clear, in color, and show all corners of the
                ID. Both sides may be required.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="protection">
            <AccordionTrigger>How is my data protected?</AccordionTrigger>
            <AccordionContent>
              <p>
                Your privacy and security are our top priorities. All documents
                are encrypted during transmission and storage. We comply with
                GDPR and other applicable data protection regulations. Your
                information is only used for verification purposes and is not
                shared with third parties except as required by law.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            disabled={
              !documents.some((doc) => doc.serverId) ||
              isUploading ||
              isSubmitting ||
              documents.some((doc) => doc.status === "uploading") ||
              submissionSuccess
            }
            onClick={handleSubmitForVerification}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Submitting...
              </>
            ) : submissionSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Submitted
              </>
            ) : (
              "Submit for Verification"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
