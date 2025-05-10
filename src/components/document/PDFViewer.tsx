"use client";

import { useState } from "react";
import { Loader2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  url: string;
  title?: string;
  className?: string;
}

const PDFViewer = ({ url, title, className = "" }: PDFViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Direct viewing PDF - most compatible method with iframe
  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load PDF document");
  };

  // Optional Google PDF viewer URL for alternative viewing
  const googlePdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    url
  )}&embedded=true`;

  return (
    <div className={`relative flex flex-col w-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>Loading PDF...</span>
          </div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center h-full py-8 gap-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground">{error}</p>
          <div className="flex space-x-4 mt-4">
            <Button
              variant="outline"
              onClick={() => window.open(url, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open PDF Directly
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(googlePdfViewerUrl, "_blank")}
            >
              Use Google Viewer
            </Button>
          </div>
        </div>
      ) : (
        <iframe
          src={url}
          title={title || "PDF Document"}
          className="w-full h-full min-h-[400px] border rounded-md"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default PDFViewer;
