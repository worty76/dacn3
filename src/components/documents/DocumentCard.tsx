"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileText,
  CheckCircle,
  Clock,
  MoreVertical,
  Shield,
  Users,
} from "lucide-react";
import MultiSigDialog from "./MultiSigDialog";

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  isVerified: boolean;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  ipfsUrl?: string;
  requiresMultiSig?: boolean;
  requiredSignatures?: number;
  currentSignatures?: number;
  isMultiSigComplete?: boolean;
}

interface DocumentCardProps {
  document: Document;
  onDownload: (documentId: string) => void;
  onRefresh?: () => void;
}

export default function DocumentCard({
  document,
  onDownload,
  onRefresh,
}: DocumentCardProps) {
  const [isMultiSigDialogOpen, setIsMultiSigDialogOpen] = useState(false);

  const getStatusBadge = () => {
    if (document.requiresMultiSig) {
      if (document.isMultiSigComplete || document.isVerified) {
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <Users className="h-3 w-3 mr-1" />
            Multi-Sig Verified
          </Badge>
        );
      } else {
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Shield className="h-3 w-3 mr-1" />
            Multi-Sig Pending ({document.currentSignatures || 0}/
            {document.requiredSignatures || 2})
          </Badge>
        );
      }
    } else if (document.isVerified) {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const canEnableMultiSig = () => {
    return !document.isVerified && !document.requiresMultiSig;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {document.documentType}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDownload(document.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              {canEnableMultiSig() && (
                <DropdownMenuItem onClick={() => setIsMultiSigDialogOpen(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Enable Multi-Sig (Premium)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium truncate">
                {document.fileName}
              </p>
              <p className="text-xs text-gray-500">
                Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center justify-between">
              {getStatusBadge()}
            </div>

            {document.requiresMultiSig && (
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Multi-Signature Verification
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  Requires {document.requiredSignatures || 2} admin signatures
                </p>
                <p className="text-xs text-blue-600">
                  Current: {document.currentSignatures || 0} signatures
                </p>
              </div>
            )}

            {document.verifiedAt && (
              <p className="text-xs text-green-600">
                Verified on {new Date(document.verifiedAt).toLocaleDateString()}
                {document.verifiedBy && ` by ${document.verifiedBy}`}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(document.id)}
                className="flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              {canEnableMultiSig() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMultiSigDialogOpen(true)}
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Multi-Sig
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <MultiSigDialog
        isOpen={isMultiSigDialogOpen}
        onClose={() => setIsMultiSigDialogOpen(false)}
        document={document}
        onSuccess={() => {
          setIsMultiSigDialogOpen(false);
          onRefresh?.();
        }}
      />
    </>
  );
}
