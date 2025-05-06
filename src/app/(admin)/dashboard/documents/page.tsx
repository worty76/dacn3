"use client";

import { useState } from "react";
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

// Mock data for demonstration
const mockDocuments = [
  {
    id: "1",
    name: "Passport.pdf",
    type: "Passport",
    submittedBy: "John Doe",
    userId: "user-123",
    status: "pending",
    dateSubmitted: "2023-09-01",
    fileSize: "2.4 MB",
    fileType: "application/pdf",
    url: "#",
  },
  {
    id: "2",
    name: "Drivers_License.jpg",
    type: "ID Card",
    submittedBy: "Jane Smith",
    userId: "user-456",
    status: "pending",
    dateSubmitted: "2023-09-05",
    fileSize: "1.8 MB",
    fileType: "image/jpeg",
    url: "#",
  },
  {
    id: "3",
    name: "Bank_Statement.pdf",
    type: "Proof of Address",
    submittedBy: "Robert Johnson",
    userId: "user-789",
    status: "verified",
    dateSubmitted: "2023-09-10",
    fileSize: "3.2 MB",
    fileType: "application/pdf",
    url: "#",
    verifiedBy: "Admin User",
    verificationDate: "2023-09-12",
    comment: "All information is valid and matches our records.",
  },
  {
    id: "4",
    name: "National_ID.jpg",
    type: "ID Card",
    submittedBy: "Emily Davis",
    userId: "user-012",
    status: "rejected",
    dateSubmitted: "2023-09-15",
    fileSize: "1.5 MB",
    fileType: "image/jpeg",
    url: "#",
    rejectedBy: "Admin User",
    rejectionDate: "2023-09-16",
    comment: "Document is expired. Please submit a valid ID.",
  },
  {
    id: "5",
    name: "Utility_Bill.pdf",
    type: "Proof of Address",
    submittedBy: "Michael Wilson",
    userId: "user-345",
    status: "pending",
    dateSubmitted: "2023-09-20",
    fileSize: "1.1 MB",
    fileType: "application/pdf",
    url: "#",
  },
];

type DocumentStatus = "all" | "pending" | "verified" | "rejected";
type DocumentType = "all" | "Passport" | "ID Card" | "Proof of Address";

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus>("all");
  const [typeFilter, setTypeFilter] = useState<DocumentType>("all");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isViewing, setIsViewing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Filter documents based on search term and filters
  const filteredDocuments = mockDocuments.filter((doc) => {
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

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Toggle document selection
  const toggleDocSelection = (id: string) => {
    if (selectedDocs.includes(id)) {
      setSelectedDocs(selectedDocs.filter((docId) => docId !== id));
    } else {
      setSelectedDocs([...selectedDocs, id]);
    }
  };

  // Toggle all documents selection
  const toggleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocuments.map((doc) => doc.id));
    }
  };

  // Open document viewer
  const viewDocument = (doc: any) => {
    setCurrentDoc(doc);
    setIsViewing(true);
  };

  // Open document review dialog
  const reviewDocument = (doc: any) => {
    setCurrentDoc(doc);
    setReviewComment(doc.comment || "");
    setIsReviewing(true);
  };

  // Handle document approval
  const approveDocument = () => {
    // In a real app, you would make an API call to update the document status
    console.log(
      "Approving document",
      currentDoc.id,
      "with comment:",
      reviewComment
    );
    setIsReviewing(false);
    setReviewComment("");
  };

  // Handle document rejection
  const rejectDocument = () => {
    // In a real app, you would make an API call to update the document status
    console.log(
      "Rejecting document",
      currentDoc.id,
      "with comment:",
      reviewComment
    );
    setIsReviewing(false);
    setReviewComment("");
  };

  // Handle bulk approval
  const bulkApprove = () => {
    console.log("Bulk approving documents:", selectedDocs);
    setSelectedDocs([]);
  };

  // Handle bulk rejection
  const bulkReject = () => {
    console.log("Bulk rejecting documents:", selectedDocs);
    setSelectedDocs([]);
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
          <Select
            onValueChange={(value) => setStatusFilter(value as DocumentStatus)}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => setTypeFilter(value as DocumentType)}
          >
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
        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {selectedDocs.length} document{selectedDocs.length > 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={bulkApprove}>
              <Check className="h-4 w-4 mr-1" />
              Approve All
            </Button>
            <Button size="sm" variant="destructive" onClick={bulkReject}>
              <X className="h-4 w-4 mr-1" />
              Reject All
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Showing {filteredDocuments.length} of {mockDocuments.length}{" "}
                total documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          selectedDocs.length === filteredDocuments.length &&
                          filteredDocuments.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all documents"
                        // Replace the indeterminate prop with proper handling
                        ref={(checkbox) => {
                          if (checkbox) {
                            checkbox.indeterminate =
                              selectedDocs.length > 0 &&
                              selectedDocs.length < filteredDocuments.length;
                          }
                        }}
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
                            onCheckedChange={() => toggleDocSelection(doc.id)}
                          />
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[120px]">
                            {doc.name}
                          </span>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.submittedBy}</TableCell>
                        <TableCell>{doc.dateSubmitted}</TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewDocument(doc)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Document</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => reviewDocument(doc)}
                              disabled={doc.status !== "pending"}
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
                                  onClick={() =>
                                    console.log("Download", doc.id)
                                  }
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
                                <DropdownMenuItem
                                  onClick={() => console.log("Archive", doc.id)}
                                >
                                  <FolderArchive className="h-4 w-4 mr-2" />
                                  Archive
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
                        No documents found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          {/* Similar table but filtered for pending documents only */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Pending Documents</CardTitle>
              <CardDescription>Documents awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Table content similar to above but filtered */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified" className="mt-0">
          {/* Similar table but filtered for verified documents only */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Verified Documents</CardTitle>
              <CardDescription>
                Documents that have been approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Table content similar to above but filtered */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-0">
          {/* Similar table but filtered for rejected documents only */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Rejected Documents</CardTitle>
              <CardDescription>
                Documents that have been rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Table content similar to above but filtered */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <File className="h-16 w-16 mb-4 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Document preview would be displayed here in a production
                environment.
                <br />
                {currentDoc.name} ({currentDoc.fileSize}) -{" "}
                {currentDoc.fileType}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => console.log("Download", currentDoc.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Document
              </Button>
            </div>

            {currentDoc.status !== "pending" && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">Review Notes:</h4>
                <p className="text-sm text-muted-foreground border rounded-md p-2">
                  {currentDoc.comment || "No comments provided."}
                </p>
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  {currentDoc.status === "verified" ? (
                    <>
                      Verified by {currentDoc.verifiedBy} on{" "}
                      {currentDoc.verificationDate}
                    </>
                  ) : (
                    <>
                      Rejected by {currentDoc.rejectedBy} on{" "}
                      {currentDoc.rejectionDate}
                    </>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewing(false)}>
                Close
              </Button>
              {currentDoc.status === "pending" && (
                <Button
                  onClick={() => {
                    setIsViewing(false);
                    reviewDocument(currentDoc);
                  }}
                >
                  Review Document
                </Button>
              )}
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
              <Button variant="outline" onClick={() => setIsReviewing(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={rejectDocument}>
                <X className="h-4 w-4 mr-2" />
                Reject Document
              </Button>
              <Button onClick={approveDocument}>
                <Check className="h-4 w-4 mr-2" />
                Verify Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
