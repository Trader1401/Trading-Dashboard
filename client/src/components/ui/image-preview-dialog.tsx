import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, Loader2 } from "lucide-react";

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export default function ImagePreviewDialog({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title = "Chart Preview" 
}: ImagePreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleOpenExternal = () => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Original
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-[70vh] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Loading image...</p>
              </div>
            </div>
          )}
          
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Unable to preview this image
                </p>
                <Button variant="outline" onClick={handleOpenExternal}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in New Tab
                </Button>
              </div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Trade Chart"
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: isLoading ? 'none' : 'block' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}