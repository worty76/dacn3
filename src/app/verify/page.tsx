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
} from "lucide-react";
import Image from "next/image";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<{
    user: string;
    documents: Array<{
      type: string;
      verifiedAt: string;
      status: string;
    }>;
    expiredAt: string;
  } | null>(null);

  // Get verification parameters
  const verificationCode = searchParams.get("code");
  const expiresTimestamp = searchParams.get("expires");
  const includeDetails = searchParams.get("details") === "1";

  useEffect(() => {
    // In a real application, this would make an API request to validate the verification code
    const verifyCode = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!verificationCode || !expiresTimestamp) {
          throw new Error("Invalid verification link");
        }

        // Check if link has expired
        const expiresAt = parseInt(expiresTimestamp);
        if (isNaN(expiresAt) || Date.now() > expiresAt) {
          throw new Error("Verification link has expired");
        }

        // For demo purposes, we're simulating a successful verification
        // In a real app, this would check the code against your database

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock verification data
        setVerificationDetails({
          user: "J*** D**", // Redacted name for privacy
          documents: [
            {
              type: "Government ID",
              verifiedAt: new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 15
              ).toLocaleDateString(),
              status: "verified",
            },
            {
              type: "Proof of Address",
              verifiedAt: new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 10
              ).toLocaleDateString(),
              status: "verified",
            },
          ],
          expiredAt: new Date(parseInt(expiresTimestamp)).toLocaleDateString(),
        });

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
            <CardTitle>Verifying Documents</CardTitle>
            <CardDescription>
              Please wait while we check the verification status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
            <p>Verifying document authenticity...</p>
          </CardContent>
        </Card>
      ) : success ? (
        <Card>
          <CardHeader className="text-center border-b bg-muted/50">
            <div className="mx-auto mb-4 bg-green-500 text-white p-3 rounded-full">
              <CheckCircle size={32} />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Verification Successful
            </CardTitle>
            <CardDescription>
              These documents have been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-center space-x-1">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                Blockchain Verified Identity
              </span>
            </div>

            {includeDetails && verificationDetails && (
              <div className="space-y-4 border rounded-lg p-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Identity holder
                  </p>
                  <p className="font-medium">{verificationDetails.user}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Verified documents
                  </p>
                  <div className="space-y-2">
                    {verificationDetails.documents.map((doc, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-2 bg-muted/50 rounded"
                      >
                        <span>{doc.type}</span>
                        <div className="flex items-center">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <Lock className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                This verification is valid until{" "}
                {verificationDetails?.expiredAt}. The authenticity of these
                documents has been cryptographically verified.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex-col space-y-2 bg-muted/30">
            <div className="w-full pt-2 pb-4 text-center">
              <Image
                src="/blockchain-verified-badge.png"
                alt="Blockchain Verified"
                width={120}
                height={40}
                className="mx-auto opacity-90"
              />
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
            <CardDescription>
              We couldn't verify these documents
            </CardDescription>
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
