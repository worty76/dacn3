"use client";

import { useState, useRef } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, Upload, FileIcon } from "lucide-react";

// Document types for selection
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

// Type for document object
type Document = {
  id: string;
  name: string;
  type: string;
  file: File;
  uploadDate: Date;
  status: string;
  previewUrl?: string;
};

export default function DocumentUploadPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      const file = files[0];

      // Check file type
      const fileType = file.type;
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];

      if (!validTypes.includes(fileType)) {
        alert("Invalid file type. Please upload a PDF, JPG, or PNG file.");
        return;
      }

      // Create preview URL for images
      const previewUrl = fileType.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      // Create new document object
      const newDocument: Document = {
        id: Date.now().toString(),
        name: documentName || file.name,
        type: documentType,
        file: file,
        uploadDate: new Date(),
        status: documentStatuses.PENDING,
        previewUrl,
      };

      // Add to documents array
      setDocuments((prev) => [...prev, newDocument]);

      // Reset form
      setDocumentName("");
      setDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Document Verification
        </h1>
        <p className="text-muted-foreground">
          Please upload the required documents for identity verification. We
          accept PDF, JPG, and PNG files.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <input
              ref={fileInputRef}
              accept=".pdf,.jpg,.jpeg,.png"
              id="file-upload"
              type="file"
              className="sr-only"
              onChange={handleFileChange}
            />
            <Label htmlFor="file-upload">
              <Button variant="secondary" className="cursor-pointer" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </span>
              </Button>
            </Label>
          </div>
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {doc.previewUrl && (
                        <div className="md:w-1/4 flex justify-center items-start">
                          <img
                            src={doc.previewUrl}
                            alt={doc.name}
                            className="max-h-[100px] object-contain"
                          />
                        </div>
                      )}
                      <div
                        className={`${
                          doc.previewUrl ? "md:w-3/4" : "w-full"
                        } space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{doc.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Type: {doc.type}</div>
                          <div>Uploaded: {doc.uploadDate.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center pt-2">
                          <span className="text-sm mr-2">Status:</span>
                          <Badge variant={getStatusBadgeVariant(doc.status)}>
                            {doc.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
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
    </div>
  );
}
