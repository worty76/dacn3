"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  Copy,
  Share2,
  Info,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

type Document = {
  id: string;
  documentType: string;
  fileName: string;
  isVerified: boolean;
  status: string;
  uploadedAt: string;
};

export default function VerificationSharePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [shareExpiryDays, setShareExpiryDays] = useState("7");
  const [includeDetails, setIncludeDetails] = useState(false);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { token } = useAuthStore();
  const { toast } = useToast();

  // Fetch verified documents
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

        // Transform and filter for only verified documents
        const verifiedDocuments = data.documents
          .filter((doc: any) => doc.isVerified)
          .map((doc: any) => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            isVerified: doc.isVerified,
            status: "verified",
            uploadedAt: new Date(doc.uploadedAt).toLocaleDateString(),
          }));

        setDocuments(verifiedDocuments);
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

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const generateShareableLink = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        variant: "destructive",
        title: "No documents selected",
        description: "Please select at least one document to share",
      });
      return;
    }

    try {
      // In a real app, this would call your API to create a shareable verification
      // For demo purposes, we'll just create a mock link

      // Create a verification token (this would be done securely on the backend)
      const verificationCode = Math.random().toString(36).substring(2, 15);

      // Build the shareable link
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/verify?code=${verificationCode}&expires=${
        Date.now() + parseInt(shareExpiryDays) * 86400000
      }&details=${includeDetails ? "1" : "0"}`;

      setShareableLink(shareUrl);

      // Generate a QR code for the verification link (in a real app)
      // For demo, we'll use a placeholder image URL
      setQrCode(
        `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          shareUrl
        )}`
      );

      toast({
        title: "Verification link created!",
        description:
          "You can now share this link with others to verify your documents",
      });
    } catch (err) {
      console.error("Error generating link:", err);
      toast({
        variant: "destructive",
        title: "Failed to create shareable link",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  };

  const copyToClipboard = () => {
    if (!shareableLink) return;

    navigator.clipboard.writeText(shareableLink);
    toast({
      title: "Link copied to clipboard",
      description: "The verification link has been copied to your clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading your verified documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Share Verification</h1>
        <p className="text-muted-foreground mt-2">
          Create a secure link that allows others to verify your documents
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Documents to Share</CardTitle>
              <CardDescription>
                Choose which verified documents you want to include
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="p-6 text-center bg-muted rounded-md">
                  <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Verified Documents</h3>
                  <p className="text-muted-foreground mt-2">
                    You don't have any verified documents yet. Complete the
                    verification process first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border p-3 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={selectedDocuments.includes(doc.id)}
                          onCheckedChange={() => handleDocumentToggle(doc.id)}
                          id={`doc-${doc.id}`}
                        />
                        <div>
                          <Label
                            htmlFor={`doc-${doc.id}`}
                            className="font-medium"
                          >
                            {doc.documentType}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Verified on {doc.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Link Settings</CardTitle>
              <CardDescription>
                Configure how your verification will be shared
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Link expiration</Label>
                  <Select
                    value={shareExpiryDays}
                    onValueChange={setShareExpiryDays}
                  >
                    <SelectTrigger id="expiry">
                      <SelectValue placeholder="Select days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-details"
                  checked={includeDetails}
                  onCheckedChange={setIncludeDetails}
                />
                <Label htmlFor="include-details">
                  Include document details (document types and verification
                  dates)
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={generateShareableLink}
                disabled={isLoading || documents.length === 0}
                className="w-full"
              >
                <Share2 className="mr-2 h-4 w-4" /> Generate Verification Link
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Verification Link</CardTitle>
              <CardDescription>
                Share this link with anyone who needs to verify your documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shareableLink ? (
                <>
                  <div className="relative">
                    <Input value={shareableLink} readOnly className="pr-10" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Verification QR Code
                    </p>
                    {qrCode && (
                      <div className="flex justify-center">
                        <img
                          src={qrCode}
                          alt="Verification QR Code"
                          className="h-32 w-32"
                        />
                      </div>
                    )}
                  </div>

                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This link will expire in {shareExpiryDays} days. It
                      includes verification status for{" "}
                      {selectedDocuments.length} document
                      {selectedDocuments.length !== 1 ? "s" : ""}.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <div className="text-center p-6">
                  <QrCode className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Generate a verification link to share your verified
                    documents
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Verification Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                Sharing your verification allows others to confirm your identity
                without seeing your actual documents.
              </p>
              <p>
                Only the verification status is shared, keeping your sensitive
                information private.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                  <span>Privacy preserving verification</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                  <span>Set custom expiration dates</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                  <span>Control what information is visible</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
