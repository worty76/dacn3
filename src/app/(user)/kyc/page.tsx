"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Upload,
  Shield,
  FileText,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the document interface
interface UserDocument {
  id: string;
  documentType: string;
  fileName: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string;
  feedback?: string;
  status: string;
}

// Document status mapping
const statusMap = {
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    color: "bg-green-500",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-500",
  },
  rejected: {
    label: "Rejected",
    icon: AlertCircle,
    color: "bg-red-500",
  },
  required: {
    label: "Required",
    icon: Info,
    color: "bg-blue-500",
  },
};

// Calculate overall verification progress
const calculateProgress = (documents: UserDocument[]) => {
  if (!documents.length) return 0;

  const verified = documents.filter((doc) => doc.status === "verified").length;
  return (verified / documents.length) * 100;
};

export default function KYCVerificationPage() {
  const [activeTab, setActiveTab] = useState("documents");
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<{
    [key: string]: boolean;
  }>({});

  // Get token from auth store
  const { token } = useAuthStore();

  // Fetch documents when the component mounts
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/api/documents", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to load documents");
        }

        // Transform API documents to match our UI requirements
        const transformedDocuments = data.documents.map((doc: any) => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          isVerified: doc.isVerified,
          status: doc.isVerified
            ? "verified"
            : doc.submittedForVerification
            ? "pending"
            : "required",
          uploadedAt: new Date(doc.uploadedAt).toLocaleDateString(),
          verifiedAt: doc.verifiedAt
            ? new Date(doc.verifiedAt).toLocaleDateString()
            : undefined,
          feedback: doc.feedback || null,
        }));

        setDocuments(transformedDocuments);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [token]);

  // Function to download a document
  const handleDownloadDocument = async (documentId: string) => {
    if (!token) return;

    // Set downloading state for this document
    setIsDownloading((prev) => ({ ...prev, [documentId]: true }));

    try {
      // Create the download URL
      const downloadUrl = `http://localhost:8000/api/documents/download/${documentId}`;

      // Fetch the document with authentication
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      // Get the file blob
      const blob = await response.blob();

      // Create a download link and click it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "document";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading document:", err);
      setError(
        err instanceof Error ? err.message : "Failed to download document"
      );
    } finally {
      // Reset downloading state for this document
      setIsDownloading((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const verificationProgress = calculateProgress(documents);
  const isVerified = verificationProgress === 100;
  const hasRejected = documents.some((doc) => doc.status === "rejected");

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">
            Complete your identity verification to access all features
          </p>
        </div>

        <Link href="/kyc/upload">
          <Button size="default" className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            Upload KYC Document
          </Button>
        </Link>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Verification Status</CardTitle>
            <Badge
              variant={isVerified ? "default" : "outline"}
              className={isVerified ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {isVerified ? "Verified" : "Incomplete"}
            </Badge>
          </div>
          <CardDescription>
            {isVerified
              ? "Your identity has been verified successfully."
              : hasRejected
              ? "Some documents need attention."
              : "Your documents are being processed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(verificationProgress)}%</span>
            </div>
            <Progress value={verificationProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="info">Verification Process</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-6">
          {hasRejected && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                One or more of your documents has been rejected. Please review
                and resubmit.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.length > 0 ? (
                documents.map((doc) => {
                  const status = statusMap[doc.status];
                  const StatusIcon = status.icon;
                  const isDownloadingThis = isDownloading[doc.id] || false;

                  return (
                    <Card key={doc.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {doc.documentType}
                          </CardTitle>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <CardDescription className="truncate">
                          {doc.fileName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        </div>

                        <div className="mt-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Submitted on
                            </span>
                            <span>{doc.uploadedAt}</span>
                          </div>

                          {doc.status === "verified" && (
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">
                                Verified on
                              </span>
                              <span>{doc.verifiedAt}</span>
                            </div>
                          )}

                          {doc.status === "rejected" && (
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">
                                Rejected on
                              </span>
                              <span>{doc.verifiedAt}</span>
                            </div>
                          )}

                          {doc.feedback && (
                            <div className="mt-3 p-2 bg-muted/50 rounded-md text-xs">
                              {doc.feedback}
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-2">
                        {doc.status === "rejected" && (
                          <Button className="w-full" size="sm" asChild>
                            <Link href="/kyc/upload">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resubmit Document
                            </Link>
                          </Button>
                        )}

                        <Button
                          variant={
                            doc.status === "verified" ? "default" : "outline"
                          }
                          className="w-full"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.id)}
                          disabled={isDownloadingThis}
                        >
                          {isDownloadingThis ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <FileCheck className="h-4 w-4 mr-2" />
                              View Document
                            </>
                          )}
                        </Button>

                        {doc.status === "pending" && (
                          <Button
                            variant="outline"
                            className="w-full"
                            size="sm"
                            disabled
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Processing
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center text-center p-8">
                  <div className="rounded-full p-3 bg-muted mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">No Documents Found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't uploaded any documents yet. Start your
                    verification process by uploading your documents.
                  </p>
                  <Button asChild>
                    <Link href="/kyc/upload">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Link>
                  </Button>
                </div>
              )}

              {/* Upload New Document Card */}
              <Card className="border-dashed">
                <CardContent className="pt-6 flex flex-col items-center justify-center h-full min-h-[250px]">
                  <div className="rounded-full p-3 bg-muted/50 mb-4">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Upload New Document
                  </h3>
                  <p className="text-muted-foreground text-center text-sm mb-4">
                    ID card, Passport, or Proof of Address
                  </p>
                  <Button asChild>
                    <Link href="/kyc/upload">Select Document</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Verification Process Info Tab */}
        <TabsContent value="info" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>How Verification Works</CardTitle>
                <CardDescription>
                  Our KYC verification process ensures security while
                  maintaining your privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <div className="rounded-full p-3 bg-background mb-2">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">1. Submit Documents</h3>
                    <p className="text-xs text-muted-foreground">
                      Upload your identification documents securely
                    </p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <div className="rounded-full p-3 bg-background mb-2">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">2. Verification</h3>
                    <p className="text-xs text-muted-foreground">
                      Our team reviews your documents
                    </p>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                    <div className="rounded-full p-3 bg-background mb-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">3. Complete</h3>
                    <p className="text-xs text-muted-foreground">
                      Access all features once verified
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Blockchain Verification</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upon verification, a secure hash of your documents is stored
                    on the blockchain, ensuring your documents are verified
                    without exposing personal data.
                  </p>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Immutable verification record</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>
                        Privacy-preserving - your data is never stored on-chain
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Tamper-proof verification</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents</CardTitle>
                  <CardDescription>
                    Please provide the following documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10">
                      ID
                    </Badge>
                    <span className="text-sm">
                      Government issued ID card or Passport
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10">
                      Address
                    </Badge>
                    <span className="text-sm">
                      Utility bill or Bank statement
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10">
                      Photo
                    </Badge>
                    <span className="text-sm">Selfie with your ID</span>
                  </div>
                </CardContent>
              </Card>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>
                    How long does verification take?
                  </AccordionTrigger>
                  <AccordionContent>
                    Most verifications are completed within 24-48 hours. You
                    will receive an email once your verification is complete.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2">
                  <AccordionTrigger>
                    What if my document is rejected?
                  </AccordionTrigger>
                  <AccordionContent>
                    If your document is rejected, you'll receive specific
                    feedback on why. You can then resubmit an improved version
                    following the guidelines provided.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3">
                  <AccordionTrigger>How is my data protected?</AccordionTrigger>
                  <AccordionContent>
                    Your documents are encrypted and stored securely. Only hash
                    references are stored on blockchain, never your actual data
                    or documents.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">Need help?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Our support team is available to assist with your
                      verification process
                    </p>
                    <Link href="/support">
                      <Button variant="outline" size="sm" className="w-full">
                        Contact Support
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
