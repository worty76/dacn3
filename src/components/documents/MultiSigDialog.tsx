"use client";

import { useState } from "react";
import { ethers } from "ethers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Shield,
  Users,
  CreditCard,
  CheckCircle,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { toast } from "sonner";

interface MultiSigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    fileName: string;
    documentType: string;
  };
  onSuccess: () => void;
}

const MULTISIG_FEE = "0.02"; // ETH
const PAYMENT_RECEIVER =
  process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS ||
  "0x742d35Cc6634C0532925a3b8D4Ad45D5d8b4f123"; // Company treasury (should be in env)

export default function MultiSigDialog({
  isOpen,
  onClose,
  document,
  onSuccess,
}: MultiSigDialogProps) {
  const [requiredSignatures, setRequiredSignatures] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);

  const { wallet, sendTransaction } = useWallet();

  const handleEnableMultiSig = async () => {
    if (!wallet.isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if user has sufficient balance
      const balance = parseFloat(wallet.balance!);
      const required = parseFloat(MULTISIG_FEE) + 0.001; // Include gas estimate

      if (balance < required) {
        throw new Error(
          `Insufficient balance. Required: ${required.toFixed(
            4
          )} ETH, Available: ${balance.toFixed(4)} ETH`
        );
      }

      // Step 1: Send payment transaction from user's wallet
      toast.loading("Processing payment transaction...", { id: "payment" });

      const tx = await sendTransaction(PAYMENT_RECEIVER, MULTISIG_FEE);
      setPaymentTxHash(tx.hash);

      toast.success("Payment transaction confirmed!", { id: "payment" });

      // Step 2: Enable multi-sig on backend with payment proof
      toast.loading("Enabling multi-signature verification...", {
        id: "multisig",
      });

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        "http://localhost:8000/api/documents/enable-multisig",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: document.id,
            requiredSignatures,
            paymentTxHash: tx.hash,
            userWalletAddress: wallet.address,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Failed to enable multi-signature verification"
        );
      }

      toast.success("Multi-signature verification enabled!", {
        id: "multisig",
      });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      console.error("Error enabling multi-sig:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      toast.error("Failed to enable multi-signature verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setPaymentTxHash(null);
    onClose();
  };

  const canProceed = () => {
    if (!wallet.isConnected) return false;
    const balance = parseFloat(wallet.balance!);
    const required = parseFloat(MULTISIG_FEE) + 0.001;
    return balance >= required;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Enable Multi-Signature Verification
          </DialogTitle>
          <DialogDescription>
            Upgrade your document verification to require multiple admin
            signatures for enhanced security.
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <div className="space-y-4">
            {/* Wallet Connection Status */}
            <Card
              className={
                wallet.isConnected
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet
                      className={`h-4 w-4 ${
                        wallet.isConnected
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    />
                    <span className="font-medium">
                      {wallet.isConnected
                        ? "Wallet Connected"
                        : "Wallet Required"}
                    </span>
                  </div>
                  {!wallet.isConnected && <WalletConnectButton />}
                </div>
                {wallet.isConnected && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Address: {wallet.address}</p>
                    <p>Balance: {parseFloat(wallet.balance!).toFixed(4)} ETH</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-medium">{document.fileName}</p>
                <p className="text-sm text-gray-500">{document.documentType}</p>
              </CardContent>
            </Card>

            {/* Signature Requirements */}
            <div className="space-y-3">
              <Label htmlFor="signatures">Required Signatures</Label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Input
                  id="signatures"
                  type="number"
                  min="2"
                  max="5"
                  value={requiredSignatures}
                  onChange={(e) =>
                    setRequiredSignatures(Number(e.target.value))
                  }
                  className="w-20"
                />
                <span className="text-sm text-gray-500">admin signatures</span>
              </div>
              <p className="text-xs text-gray-500">
                Minimum 2, maximum 5 signatures required
              </p>
            </div>

            {/* Payment Details */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Payment Required</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-700"
                    >
                      {MULTISIG_FEE} ETH
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      • Multi-signature verification fee: {MULTISIG_FEE} ETH
                    </p>
                    <p>• Estimated gas fee: ~0.001 ETH</p>
                    <p>
                      • Total required: ~
                      {(parseFloat(MULTISIG_FEE) + 0.001).toFixed(4)} ETH
                    </p>
                  </div>
                  <p className="text-xs text-blue-600">
                    Payment will be sent to company treasury address
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Balance Warning */}
            {wallet.isConnected && !canProceed() && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient balance. You need at least{" "}
                  {(parseFloat(MULTISIG_FEE) + 0.001).toFixed(4)} ETH to
                  proceed.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Success State */}
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-700">
                Payment Successful!
              </h3>
              <p className="text-sm text-gray-600">
                Multi-signature verification has been enabled for your document.
              </p>
            </div>

            {/* Payment Confirmation */}
            {paymentTxHash && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Transaction Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Transaction Hash:</span>
                    <p className="font-mono text-xs break-all mt-1">
                      {paymentTxHash}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid:</span>
                    <span className="font-medium">{MULTISIG_FEE} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Required Signatures:</span>
                    <span className="font-medium">{requiredSignatures}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://sepolia.etherscan.io/tx/${paymentTxHash}`,
                        "_blank"
                      )
                    }
                    className="w-full mt-2"
                  >
                    View on Etherscan
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          {!success ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnableMultiSig}
                disabled={isLoading || !canProceed()}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {wallet.isConnected
                  ? `Pay ${MULTISIG_FEE} ETH & Enable`
                  : "Connect Wallet First"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
