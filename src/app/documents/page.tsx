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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Download,
  Trash2,
  MoreVertical,
  FileIcon,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  ipfsUrl?: string; // Add IPFS URL field
  ipfsHash?: string;
  previewUrl?: string;
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

  // Get token from auth store
  const { token } = useAuthStore();

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
      // Use the new dedicated download endpoint
      const downloadUrl = `http://localhost:8000/api/ipfs/download/${documentId}`;

      // Show a loading indicator
      const downloadingDoc = documents.find((doc) => doc.id === documentId);
      if (downloadingDoc) {
        console.log(`Starting download of ${downloadingDoc.fileName}...`);
      }

      // Create fetch request with authentication
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
          // Get file name from the document
          const fileName =
            downloadingDoc?.fileName || `document-${documentId}.file`;

          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);

          // Trigger download
          link.click();

          // Clean up
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
                                      // If image fails to load, replace with generic file icon
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
                                <span className="truncate max-w-[150px]">
                                  {doc.fileName}
                                </span>
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
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
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

          {/* PDF Viewer with improved styling for better viewing experience */}
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
                    // Fallback if image fails to load
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
    </div>
  );
}
