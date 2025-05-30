"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface BlockchainStatusProps {
  documentId: string;
  serverVerified?: boolean;
  blockchainTxHash?: string;
  verificationTxHash?: string;
  ipfsHash?: string;
}

export default function BlockchainStatus({
  documentId,
  serverVerified,
  blockchainTxHash,
  verificationTxHash,
  ipfsHash,
}: BlockchainStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusBadge = () => {
    if (blockchainTxHash && verificationTxHash) {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Blockchain Verified
        </Badge>
      );
    }

    if (blockchainTxHash && serverVerified) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Server Verified + On-Chain
        </Badge>
      );
    }

    if (blockchainTxHash) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          On-Chain (Pending Verification)
        </Badge>
      );
    }

    if (serverVerified) {
      return (
        <Badge
          variant="outline"
          className="bg-indigo-50 text-indigo-700 border-indigo-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Server Verified
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-gray-50 text-gray-700 border-gray-200"
      >
        <Clock className="h-3 w-3 mr-1" />
        Processing
      </Badge>
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh (in real app, this would refetch data)
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getBlockchainExplorerUrl = (txHash: string) => {
    // Return appropriate explorer URL based on network
    // For now, assume mainnet Ethereum
    return `https://etherscan.io/tx/${txHash}`;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Blockchain Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
        <CardDescription>
          Document verification status and blockchain records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {ipfsHash && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">IPFS Storage:</h4>
            <div className="p-2 bg-muted rounded text-xs font-mono break-all">
              {ipfsHash}
            </div>
            <p className="text-xs text-muted-foreground">
              Document is stored on IPFS for immutable access
            </p>
          </div>
        )}

        {(blockchainTxHash || verificationTxHash) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Transaction Records:</h4>
            <div className="space-y-1">
              {blockchainTxHash && (
                <div className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <div>
                    <div className="font-medium">Upload Transaction</div>
                    <div className="font-mono">
                      {blockchainTxHash.slice(0, 10)}...
                      {blockchainTxHash.slice(-8)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(
                        getBlockchainExplorerUrl(blockchainTxHash),
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {verificationTxHash && (
                <div className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <div>
                    <div className="font-medium">Verification Transaction</div>
                    <div className="font-mono">
                      {verificationTxHash.slice(0, 10)}...
                      {verificationTxHash.slice(-8)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      window.open(
                        getBlockchainExplorerUrl(verificationTxHash),
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {blockchainTxHash
              ? "This document is permanently recorded on the blockchain for verification and tamper-proof storage."
              : "Document will be added to blockchain upon verification."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
