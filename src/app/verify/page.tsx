"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Lock,
  FileText,
  Eye,
} from "lucide-react";
import Image from "next/image";

// Update the document verification interface to match the new API response
interface DocumentVerification {
  id: string;
  documentType: string;
  fileName: string;
  uploadedAt?: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  submittedBy?: string;
  ipfsHash?: string;
  previewUrl?: string; // Add this field to store the document preview URL
}

interface VerificationResponse {
  success: boolean;
  user: {
    name: string;
  };
  documents: DocumentVerification[];
  expiresAt: string;
  includeDetails: boolean;
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [verificationData, setVerificationData] =
    useState<VerificationResponse | null>(null);

  // Get verification parameters
  const verificationCode = searchParams.get("code");
  const expiresTimestamp = searchParams.get("expires");
  const includeDetails = searchParams.get("details") === "1";

  useEffect(() => {
    // Function to verify the code by calling our API
    const verifyCode = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!verificationCode) {
          throw new Error("Invalid verification code");
        }

        // Check if link has expired client-side as well
        if (
          expiresTimestamp &&
          new Date(parseInt(expiresTimestamp)) < new Date()
        ) {
          throw new Error("Verification link has expired");
        }

        // Call API to verify the code
        const response = await fetch(
          `http://localhost:8000/api/verify/share?code=${verificationCode}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Verification failed");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Verification failed");
        }

        // Set verification data from API response
        setVerificationData(data);
        setSuccess(true);
      } catch (err) {
        console.error("Verification error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to verify documents"
        );
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyCode();
  }, [verificationCode, expiresTimestamp]);

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      {loading ? (
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle>Verifying Document</CardTitle>
            <CardDescription>
              Please wait while we check the verification status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
            <p>Verifying document authenticity...</p>
          </CardContent>
        </Card>
      ) : success && verificationData ? (
        <Card>
          <CardHeader className="text-center border-b bg-muted/50">
            <div className="mx-auto mb-4 bg-green-500 text-white p-3 rounded-full">
              <CheckCircle size={32} />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Verification Successful
            </CardTitle>
            <CardDescription>
              {verificationData.documents.length > 1
                ? "These documents have been successfully verified"
                : "This document has been successfully verified"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-center space-x-1">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                Blockchain Verified{" "}
                {verificationData.documents.length > 1
                  ? "Documents"
                  : "Document"}
              </span>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              {verificationData.user && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Document Owner
                  </p>
                  <p className="font-medium">{verificationData.user.name}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {verificationData.documents.length > 1
                    ? "Verified Documents"
                    : "Document Information"}
                </p>
                <div className="space-y-3">
                  {verificationData.documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="border rounded-md overflow-hidden"
                    >
                      <div className="bg-muted p-3 flex justify-between items-center">
                        <span className="font-medium">{doc.documentType}</span>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      </div>

                      <div className="p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <span className="text-muted-foreground">
                            Document Name:
                          </span>
                          <span>{doc.fileName}</span>

                          {doc.uploadedAt && (
                            <>
                              <span className="text-muted-foreground">
                                Uploaded on:
                              </span>
                              <span>
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}

                          {verificationData.includeDetails &&
                            doc.verifiedAt && (
                              <>
                                <span className="text-muted-foreground">
                                  Verified on:
                                </span>
                                <span>
                                  {new Date(
                                    doc.verifiedAt
                                  ).toLocaleDateString()}
                                </span>

                                {doc.verifiedBy && (
                                  <>
                                    <span className="text-muted-foreground">
                                      Verified by:
                                    </span>
                                    <span>{doc.verifiedBy}</span>
                                  </>
                                )}

                                {doc.ipfsHash && (
                                  <>
                                    <span className="text-muted-foreground">
                                      Document Hash:
                                    </span>
                                    <span className="font-mono text-xs truncate">
                                      {doc.ipfsHash}
                                    </span>
                                  </>
                                )}
                              </>
                            )}
                        </div>

                        {/* Add document preview if available */}
                        {doc.previewUrl && (
                          <div className="mt-4 p-4 border-t">
                            <h4 className="font-medium mb-2 text-sm">
                              Document Preview
                            </h4>
                            {doc.fileName.toLowerCase().endsWith(".pdf") ? (
                              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-md">
                                <div className="bg-red-50 border border-red-100 rounded-full p-3 mb-2">
                                  <FileText className="h-8 w-8 text-red-500" />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(doc.previewUrl, "_blank")
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" /> View PDF
                                </Button>
                              </div>
                            ) : (
                              <img
                                src={doc.previewUrl}
                                alt={doc.fileName}
                                className="max-h-60 mx-auto rounded-md"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://placehold.co/300x200?text=Preview+Not+Available";
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Lock className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                This verification is valid until{" "}
                {new Date(verificationData.expiresAt).toLocaleDateString()}. The
                authenticity of{" "}
                {verificationData.documents.length > 1
                  ? "these documents"
                  : "this document"}{" "}
                has been cryptographically verified.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex-col space-y-2 bg-muted/30">
            <div className="w-full pt-2 pb-4 text-center">
              <div className="mx-auto w-36 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                <p className="text-white font-bold text-sm">BlockVerify</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Secured by Blockchain Identity Platform
              </p>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader className="text-center border-b bg-muted/50">
            <div className="mx-auto mb-4 bg-red-500 text-white p-3 rounded-full">
              <XCircle size={32} />
            </div>
            <CardTitle className="text-2xl text-red-700">
              Verification Failed
            </CardTitle>
            <CardDescription>We couldn't verify this document</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Verification Error</AlertTitle>
              <AlertDescription>
                {error || "This verification link is invalid or has expired."}
              </AlertDescription>
            </Alert>

            <div className="mt-6 p-4 border border-dashed rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                If you believe this is an error, please contact the document
                owner and request a new verification link.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
