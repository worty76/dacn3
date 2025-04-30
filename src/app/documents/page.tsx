"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
} from "lucide-react";

// Mock data for document types
const documentTypes = [
  "National ID Card",
  "Passport",
  "Driver's License",
  "Birth Certificate",
  "Utility Bill",
  "Bank Statement",
];

// Document status options
const documentStatuses = {
  PENDING: "pending",
  PROCESSING: "processing",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

// Mock data for documents
const mockDocuments = [
  {
    id: "1",
    name: "National ID Card",
    type: "National ID Card",
    uploadDate: new Date(2023, 5, 15),
    status: documentStatuses.VERIFIED,
    previewUrl: "https://placehold.co/100x60",
  },
  {
    id: "2",
    name: "Utility Bill",
    type: "Utility Bill",
    uploadDate: new Date(2023, 6, 10),
    status: documentStatuses.PENDING,
    previewUrl: "https://placehold.co/100x60",
  },
  {
    id: "3",
    name: "Bank Statement",
    type: "Bank Statement",
    uploadDate: new Date(2023, 7, 5),
    status: documentStatuses.REJECTED,
    previewUrl: "https://placehold.co/100x60",
  },
  {
    id: "4",
    name: "Passport",
    type: "Passport",
    uploadDate: new Date(2023, 8, 1),
    status: documentStatuses.PROCESSING,
    previewUrl: "https://placehold.co/100x60",
  },
];

type Document = {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  status: string;
  previewUrl?: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
    setOpenConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      setDocuments(documents.filter((doc) => doc.id !== documentToDelete));
      setDocumentToDelete(null);
    }
    setOpenConfirmDialog(false);
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
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
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
                                  alt={doc.name}
                                  className="h-10 w-16 rounded object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                  <FileIcon size={16} />
                                </div>
                              )}
                              <span>{doc.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{doc.type}</TableCell>
                          <TableCell>
                            {doc.uploadDate.toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(doc.status)}>
                              {doc.status.toUpperCase()}
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
                                <DropdownMenuItem>
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
                          No documents found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
            <DialogTitle>{previewDocument?.name}</DialogTitle>
            <DialogDescription>
              Document Type: {previewDocument?.type} | Uploaded:{" "}
              {previewDocument?.uploadDate.toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {previewDocument?.previewUrl ? (
              <img
                src={previewDocument.previewUrl}
                alt={previewDocument.name}
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
              {previewDocument?.status.toUpperCase()}
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
