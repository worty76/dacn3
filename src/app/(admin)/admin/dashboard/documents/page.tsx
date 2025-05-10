"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Check,
  Download,
  Eye,
  Filter,
  FileText,
  FileCheck,
  X,
  File,
  ExternalLink,
  FolderArchive,
  Loader2,
  AlertCircle, // Import AlertCircle from Lucide
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isViewing, setIsViewing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get token from auth store
  const { token } = useAuthStore();

  // Fetch documents when component mounts
  useEffect(() => {
    const fetchPendingDocuments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch(
          "http://localhost:8000/api/documents/pending",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to load documents");
        }

        setDocuments(
          data.documents.map((doc: any) => ({
            id: doc.id,
            name: doc.fileName,
            type: doc.documentType,
            submittedBy:
              typeof doc.submittedBy === "object"
                ? doc.submittedBy.name
                : doc.submittedBy,
            userId:
              typeof doc.submittedBy === "object"
                ? doc.submittedBy.id
                : undefined,
            userEmail:
              typeof doc.submittedBy === "object"
                ? doc.submittedBy.email
                : undefined,
            status: "pending",
            dateSubmitted: new Date(
              doc.submissionDate || doc.uploadedAt
            ).toLocaleDateString(),
            fileSize: `${(doc.fileSize / 1024).toFixed(1)} KB`,
            fileType: doc.mimeType,
            url: doc.ipfsUrl,
            ipfsHash: doc.ipfsHash,
          }))
        );
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load documents"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingDocuments();
  }, [token]);

  // Filter documents based on search term and filters
  const filteredDocuments = documents.filter((doc) => {
    // Search filter
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;

    // Type filter
    const matchesType = typeFilter === "all" || doc.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle document approval/rejection
  const processDocument = async (action: "verify" | "reject") => {
    if (!currentDoc || !token) {
      setIsReviewing(false);
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/admin-verify/${currentDoc.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            feedback: reviewComment,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} document`);
      }

      const result = await response.json();

      // Update documents list by removing the processed document
      setDocuments(documents.filter((doc) => doc.id !== currentDoc.id));

      // Show success message or notification
      console.log(
        `Document ${action === "verify" ? "verified" : "rejected"} successfully`
      );

      // Close the dialog and reset form
      setIsReviewing(false);
      setReviewComment("");
    } catch (err) {
      console.error(`Error ${action}ing document:`, err);
      setError(
        err instanceof Error ? err.message : `Failed to ${action} document`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle document approval
  const approveDocument = () => processDocument("verify");

  // Handle document rejection
  const rejectDocument = () => processDocument("reject");

  // Handle bulk approval
  const bulkApprove = async () => {
    setIsProcessing(true);

    try {
      // Process each selected document sequentially
      for (const docId of selectedDocs) {
        const doc = documents.find((d) => d.id === docId);
        if (doc) {
          await fetch(
            `http://localhost:8000/api/documents/admin-verify/${docId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "verify",
                feedback: "Bulk verified by admin.",
              }),
            }
          );
        }
      }

      // After all processed, remove these docs from the list
      setDocuments(documents.filter((doc) => !selectedDocs.includes(doc.id)));
      setSelectedDocs([]);
    } catch (error) {
      console.error("Error in bulk approval:", error);
      setError("Failed to process some documents. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle bulk rejection
  const bulkReject = async () => {
    setIsProcessing(true);

    try {
      // Process each selected document sequentially
      for (const docId of selectedDocs) {
        const doc = documents.find((d) => d.id === docId);
        if (doc) {
          await fetch(
            `http://localhost:8000/api/documents/admin-verify/${docId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "reject",
                feedback: "Bulk rejected by admin.",
              }),
            }
          );
        }
      }

      // After all processed, remove these docs from the list
      setDocuments(documents.filter((doc) => !selectedDocs.includes(doc.id)));
      setSelectedDocs([]);
    } catch (error) {
      console.error("Error in bulk rejection:", error);
      setError("Failed to process some documents. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Download document
  const downloadDocument = async (documentId: string) => {
    if (!token) return;

    try {
      // Use the established document download endpoint
      const downloadUrl = `http://localhost:8000/api/ipfs/download/${documentId}`;

      // Create fetch request with authentication
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

      // Get document info
      const doc = documents.find((d) => d.id === documentId);
      const fileName = doc ? doc.name : `document-${documentId}`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading document:", err);
      setError(
        err instanceof Error ? err.message : "Failed to download document"
      );
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Document Review</h1>
          <p className="text-sm text-muted-foreground">
            Review and verify user-submitted documents
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search documents..."
            className="w-full sm:w-[200px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setTypeFilter(value)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Passport">Passport</SelectItem>
              <SelectItem value="ID Card">ID Card</SelectItem>
              <SelectItem value="Proof of Address">Proof of Address</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedDocs.length > 0 && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-md my-4">
          <span className="text-sm font-medium">
            {selectedDocs.length} document{selectedDocs.length > 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={bulkApprove} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Approve All
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={bulkReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-1" />
              )}
              Reject All
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Pending Documents</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading documents..."
              : `Showing ${filteredDocuments.length} pending documents`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={
                        selectedDocs.length === filteredDocuments.length &&
                        filteredDocuments.length > 0
                      }
                      onCheckedChange={() => {
                        if (selectedDocs.length === filteredDocuments.length) {
                          setSelectedDocs([]);
                        } else {
                          setSelectedDocs(
                            filteredDocuments.map((doc) => doc.id)
                          );
                        }
                      }}
                      aria-label="Select all documents"
                    />
                  </TableHead>
                  <TableHead className="w-[180px]">Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={() => {
                            if (selectedDocs.includes(doc.id)) {
                              setSelectedDocs(
                                selectedDocs.filter((id) => id !== doc.id)
                              );
                            } else {
                              setSelectedDocs([...selectedDocs, doc.id]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        {doc.fileType?.includes("pdf") ? (
                          <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-red-500" />
                          </div>
                        ) : doc.fileType?.includes("image") ? (
                          <div className="h-8 w-8 rounded overflow-hidden">
                            <img
                              src={doc.url}
                              alt={doc.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                                (
                                  e.target as HTMLImageElement
                                ).parentElement!.innerHTML = `<div class="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                                  <svg class="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                </div>`;
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <span className="font-medium truncate max-w-[120px]">
                          {doc.name}
                        </span>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.submittedBy}</TableCell>
                      <TableCell>{doc.dateSubmitted}</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500">Pending</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentDoc(doc);
                              setIsViewing(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Document</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentDoc(doc);
                              setReviewComment("");
                              setIsReviewing(true);
                            }}
                          >
                            <FileCheck className="h-4 w-4" />
                            <span className="sr-only">Review Document</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Filter className="h-4 w-4" />
                                <span className="sr-only">More Options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => downloadDocument(doc.id)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  console.log("View user", doc.userId)
                                }
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View User Profile
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No pending documents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      {currentDoc && (
        <Dialog open={isViewing} onOpenChange={setIsViewing}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>
                {currentDoc.name} - Submitted by {currentDoc.submittedBy} on{" "}
                {currentDoc.dateSubmitted}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center bg-muted rounded-md min-h-[400px] p-4">
              {currentDoc.url ? (
                currentDoc.fileType?.includes("pdf") ? (
                  <div className="w-full h-[400px] flex flex-col items-center">
                    <div className="bg-red-100 rounded-full p-6 mb-4">
                      <FileText className="h-12 w-12 text-red-500" />
                    </div>
                    <p className="text-center mb-4 font-medium">
                      {currentDoc.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      This is a PDF document. You can view it in a new tab or
                      download it.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(currentDoc.url, "_blank")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View in New Tab
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadDocument(currentDoc.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : currentDoc.fileType?.includes("image") ? (
                  <img
                    src={currentDoc.url}
                    alt={currentDoc.name}
                    className="max-h-[400px] object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const container = (e.target as HTMLImageElement)
                        .parentElement;
                      if (container) {
                        container.innerHTML = `
                          <div class="flex flex-col items-center">
                            <div class="bg-gray-100 rounded-full p-6 mb-4">
                              <svg class="h-12 w-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            </div>
                            <p class="text-center mb-2 font-medium">${currentDoc.name}</p>
                            <p class="text-sm text-muted-foreground">Unable to preview this image. You can download it instead.</p>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="bg-gray-100 rounded-full p-6 mb-4">
                      <File className="h-12 w-12 text-gray-500" />
                    </div>
                    <p className="text-center mb-2 font-medium">
                      {currentDoc.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This file type cannot be previewed directly.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center">
                  <File className="h-16 w-16 mb-4 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    Unable to preview document.
                    <br />
                    {currentDoc.name} ({currentDoc.fileSize})
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewing(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewing(false);
                  setReviewComment("");
                  setIsReviewing(true);
                }}
              >
                Review Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Review Dialog */}
      {currentDoc && (
        <Dialog open={isReviewing} onOpenChange={setIsReviewing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Document</DialogTitle>
              <DialogDescription>
                {currentDoc.name} - Submitted by {currentDoc.submittedBy}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{currentDoc.type}</Badge>
                <span className="text-sm text-muted-foreground">
                  Submitted on {currentDoc.dateSubmitted}
                </span>
              </div>

              <div className="grid gap-2">
                <label htmlFor="comment" className="text-sm font-medium">
                  Add Comment:
                </label>
                <Textarea
                  id="comment"
                  placeholder="Add your review comments here..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReviewing(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={rejectDocument}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject Document
              </Button>
              <Button onClick={approveDocument} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Verify Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
