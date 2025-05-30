"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Download,
  MoreVertical,
  FileIcon,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  FileText,
  Shield,
  CreditCard,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";

// Document status options
const documentStatuses = {
  PENDING: "pending",
  PROCESSING: "processing",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

// Define the document interface to match API response
type Document = {
  id: string;
  documentType: string;
  fileName: string;
  uploadedAt: string;
  isVerified: boolean;
  submittedForVerification?: boolean;
  verifiedAt?: string;
  status?: string;
  ipfsUrl?: string;
  ipfsHash?: string;
  previewUrl?: string;
  requiresMultiSig?: boolean;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // New state for multi-sig dialog
  const [multiSigDialog, setMultiSigDialog] = useState<{
    isOpen: boolean;
    document: Document | null;
    isProcessing: boolean;
  }>({
    isOpen: false,
    document: null,
    isProcessing: false,
  });

  // Get token from auth store
  const { token } = useAuthStore();
  const { wallet } = useWallet();

  // Fetch documents when component mounts
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!token) {
          throw new Error("Authentication token not found. Please log in.");
        }

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

        // Transform the API response to match our document interface
        const transformedDocuments = data.documents.map((doc: any) => {
          // Use our dedicated proxy URL for IPFS content
          const proxyUrl = `http://localhost:8000/api/ipfs/content/${doc.ipfsHash}`;

          return {
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            uploadedAt: new Date(doc.uploadedAt).toLocaleDateString(),
            isVerified: doc.isVerified,
            status: doc.isVerified
              ? documentStatuses.VERIFIED
              : doc.submittedForVerification
              ? documentStatuses.PROCESSING
              : documentStatuses.PENDING,
            verifiedAt: doc.verifiedAt
              ? new Date(doc.verifiedAt).toLocaleDateString()
              : undefined,
            // Use the proxy URL for better compatibility
            ipfsUrl: proxyUrl,
            ipfsHash: doc.ipfsHash,
            previewUrl: proxyUrl,
            requiresMultiSig: doc.requiresMultiSig || false,
          };
        });

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

  const handleDeleteDocument = async (documentId: string) => {
    setDocumentToDelete(documentId);
    setOpenConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete || !token) {
      setOpenConfirmDialog(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }

      setDocuments(documents.filter((doc) => doc.id !== documentToDelete));
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete document"
      );
    } finally {
      setDocumentToDelete(null);
      setOpenConfirmDialog(false);
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    if (!token) return;

    try {
      const downloadUrl = `http://localhost:8000/api/documents/download/${documentId}`;
      const downloadingDoc = documents.find((doc) => doc.id === documentId);

      if (downloadingDoc) {
        console.log(`Starting download of ${downloadingDoc.fileName}...`);
      }

      fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const fileName =
            downloadingDoc?.fileName || `document-${documentId}.file`;

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
          console.log(`Download complete for ${fileName}`);
        })
        .catch((error) => {
          console.error("Download failed:", error);
          setError(`Download failed: ${error.message}`);
        });
    } catch (err) {
      console.error("Error initiating download:", err);
      setError(
        err instanceof Error ? err.message : "Failed to download document"
      );
    }
  };

  const handlePreviewDocument = (document: Document) => {
    setPreviewDocument(document);
    setPreviewOpen(true);
  };

  const handleEnableMultiSig = async (doc: Document) => {
    if (!wallet.isConnected) {
      setError(
        "Please connect your wallet first to enable multi-signature verification"
      );
      return;
    }

    setMultiSigDialog({
      isOpen: true,
      document: doc,
      isProcessing: false,
    });
  };

  const confirmEnableMultiSig = async () => {
    if (!multiSigDialog.document || !wallet.isConnected) return;

    setMultiSigDialog((prev) => ({ ...prev, isProcessing: true }));

    try {
      // Check wallet balance
      const balance = parseFloat(wallet.balance || "0");
      if (balance < 0.021) {
        throw new Error(
          "Insufficient balance. You need at least 0.021 ETH for multi-sig verification"
        );
      }

      // Check if window.ethereum exists
      if (!window.ethereum) {
        throw new Error("MetaMask or compatible wallet not found");
      }

      // Fixed: Use ethers.BrowserProvider correctly - window.ethereum is the provider, not a constructor
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();

      const tx = await signer.sendTransaction({
        to:
          process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
          "0x742F35Cc6681C17B4e9c93d4Fc8F3a5DB5b5f11D",
        value: ethers.parseEther("0.02"),
      });

      console.log("Payment transaction sent:", tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("Payment confirmed:", receipt);

      // Enable multi-sig on backend
      const response = await fetch(
        "http://localhost:8000/api/documents/enable-multisig",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: multiSigDialog.document.id,
            requiredSignatures: 2,
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

      // Update document in local state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === multiSigDialog.document?.id
            ? { ...d, status: "multisig-enabled", requiresMultiSig: true }
            : d
        )
      );

      setMultiSigDialog({ isOpen: false, document: null, isProcessing: false });

      // Show success message
      setError(null);
      console.log("Multi-signature verification enabled successfully!");
    } catch (err) {
      console.error("Error enabling multi-sig:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to enable multi-signature verification"
      );
    } finally {
      setMultiSigDialog((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case documentStatuses.PENDING:
        return "secondary";
      case documentStatuses.PROCESSING:
        return "outline";
      case documentStatuses.VERIFIED:
        return "default";
      case documentStatuses.REJECTED:
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Filter documents based on search term and active tab
  const filteredDocuments = documents.filter(
    (doc) =>
      (doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (activeTab === "all" || doc.status === activeTab)
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="text-muted-foreground">
            Manage and view your uploaded documents for verification.
          </p>
        </div>
        <Link href="/documents/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload New Document
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
            <CardTitle>Document Management</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value={documentStatuses.VERIFIED}>
                Verified
              </TabsTrigger>
              <TabsTrigger value={documentStatuses.PENDING}>
                Pending
              </TabsTrigger>
              <TabsTrigger value={documentStatuses.REJECTED}>
                Rejected
              </TabsTrigger>
              <TabsTrigger value={documentStatuses.PROCESSING}>
                Processing
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="rounded-md border">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading documents...</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                {doc.fileName.toLowerCase().endsWith(".pdf") ? (
                                  <div className="h-10 w-16 bg-red-50 border border-red-100 rounded flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-red-500" />
                                  </div>
                                ) : doc.previewUrl ? (
                                  <img
                                    src={doc.previewUrl}
                                    alt={doc.fileName}
                                    className="h-10 w-16 rounded object-cover"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                      const container = (
                                        e.target as HTMLImageElement
                                      ).parentElement;
                                      if (container) {
                                        container.innerHTML = `
                                          <div class="h-10 w-16 rounded bg-gray-100 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500">
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                              <polyline points="14 2 14 8 20 8"></polyline>
                                              <line x1="16" y1="13" x2="8" y2="13"></line>
                                              <line x1="16" y1="17" x2="8" y2="17"></line>
                                              <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                          </div>
                                        `;
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                    <FileIcon size={16} />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="truncate max-w-[150px]">
                                    {doc.fileName}
                                  </span>
                                  {doc.requiresMultiSig && (
                                    <div className="flex items-center gap-1">
                                      <Shield className="h-3 w-3 text-blue-600" />
                                      <span className="text-xs text-blue-600">
                                        Multi-Sig Enabled
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{doc.documentType}</TableCell>
                            <TableCell>{doc.uploadedAt}</TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(
                                  doc.status || ""
                                )}
                              >
                                {(doc.status || "").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handlePreviewDocument(doc)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDownloadDocument(doc.id)
                                    }
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>
                                  {doc.status === "pending" &&
                                    !doc.isVerified &&
                                    !doc.requiresMultiSig && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleEnableMultiSig(doc)
                                        }
                                      >
                                        <Shield className="mr-2 h-4 w-4" />
                                        Enable Multi-Sig (Premium)
                                      </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            {!isLoading && !error
                              ? "No documents found. Upload some documents to get started!"
                              : error
                              ? "Error loading documents."
                              : "Loading documents..."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDocument?.fileName}</DialogTitle>
            <DialogDescription>
              Document Type: {previewDocument?.documentType} | Uploaded:{" "}
              {previewDocument?.uploadedAt}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-[70vh] overflow-auto">
            {previewDocument?.previewUrl ? (
              previewDocument.fileName.toLowerCase().endsWith(".pdf") ? (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-md">
                  <div className="bg-red-50 border border-red-100 rounded-full p-6 mb-4">
                    <FileText className="h-12 w-12 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {previewDocument.fileName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center">
                    PDF document preview is available in a separate tab or by
                    downloading.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(previewDocument.previewUrl, "_blank")
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" /> View PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        previewDocument &&
                        handleDownloadDocument(previewDocument.id)
                      }
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>
              ) : (
                <img
                  src={previewDocument.previewUrl}
                  alt={previewDocument.fileName}
                  className="max-h-[70vh] max-w-full object-contain mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/300x400?text=Preview+Not+Available";
                    console.error(
                      "Failed to load image from:",
                      previewDocument.previewUrl
                    );
                  }}
                />
              )
            ) : (
              <div className="h-[200px] w-[200px] bg-muted flex items-center justify-center rounded mx-auto">
                <FileIcon size={40} />
              </div>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <Badge
              variant={getStatusBadgeVariant(previewDocument?.status || "")}
            >
              {previewDocument?.status?.toUpperCase()}
            </Badge>
            <div className="space-x-2">
              {previewDocument?.previewUrl &&
                !previewDocument.fileName.toLowerCase().endsWith(".pdf") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(previewDocument.previewUrl, "_blank")
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" /> Open in New Tab
                  </Button>
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  previewDocument && handleDownloadDocument(previewDocument.id)
                }
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-Sig Enable Dialog */}
      <Dialog
        open={multiSigDialog.isOpen}
        onOpenChange={(open) =>
          !multiSigDialog.isProcessing &&
          setMultiSigDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Enable Multi-Signature Verification
            </DialogTitle>
            <DialogDescription>
              Premium feature: Requires multiple admin signatures for enhanced
              security.
              <br />
              <strong>Cost: 0.02 ETH</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">What you get:</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Enhanced security with multiple admin approvals</li>
                <li>• Higher trust level for your verified documents</li>
                <li>• Premium verification badge</li>
                <li>• Blockchain transparency of all signatures</li>
              </ul>
            </div>

            {multiSigDialog.document && (
              <div className="border p-3 rounded">
                <p className="font-medium">
                  {multiSigDialog.document.fileName}
                </p>
                <p className="text-sm text-gray-500">
                  {multiSigDialog.document.documentType}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 p-3 rounded">
              <p className="text-sm text-yellow-800">
                <CreditCard className="inline h-4 w-4 mr-1" />
                Payment will be processed using your connected wallet:{" "}
                {wallet.address?.slice(0, 8)}...
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setMultiSigDialog((prev) => ({ ...prev, isOpen: false }))
              }
              disabled={multiSigDialog.isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEnableMultiSig}
              disabled={multiSigDialog.isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {multiSigDialog.isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Pay 0.02 ETH & Enable
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
