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
        const transformedDocuments = data.documents.map((doc: any) => ({
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
          // For preview, we would typically get a URL from the server,
          // but since we're mocking, we'll use a placeholder
          previewUrl: "https://placehold.co/100x60",
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
      window.open(
        `http://localhost:8000/api/documents/download/${documentId}?token=${encodeURIComponent(
          token
        )}`,
        "_blank"
      );
    } catch (err) {
      console.error("Error downloading document:", err);
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
                                {doc.previewUrl ? (
                                  <img
                                    src={doc.previewUrl}
                                    alt={doc.fileName}
                                    className="h-10 w-16 rounded object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                    <FileIcon size={16} />
                                  </div>
                                )}
                                <span>{doc.fileName}</span>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewDocument?.fileName}</DialogTitle>
            <DialogDescription>
              Document Type: {previewDocument?.documentType} | Uploaded:{" "}
              {previewDocument?.uploadedAt}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {previewDocument?.previewUrl ? (
              <img
                src={previewDocument.previewUrl}
                alt={previewDocument.fileName}
                className="max-h-[300px] object-contain"
              />
            ) : (
              <div className="h-[200px] w-[200px] bg-muted flex items-center justify-center rounded">
                <FileIcon size={40} />
              </div>
            )}
          </div>
          <div className="flex justify-between">
            <Badge
              variant={getStatusBadgeVariant(previewDocument?.status || "")}
            >
              {previewDocument?.status?.toUpperCase()}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
