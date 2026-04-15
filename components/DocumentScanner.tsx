import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  FileText, 
  CreditCard,
  BookOpen,
  Receipt,
  File,
  RotateCcw,
  Crop,
  Download,
  Share2,
  Trash2,
  Eye
} from 'lucide-react';
import { useHaptics, useCamera } from '../hooks/useNative';
import { ScannedDocument } from '../types';
import toast from 'react-hot-toast';

interface DocumentScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (document: ScannedDocument) => void;
  memberId?: string;
  memberName?: string;
}

type DocType = 'aadhaar' | 'pan' | 'passbook' | 'receipt' | 'other';

const docTypes: { id: DocType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'aadhaar', label: 'Aadhaar Card', icon: CreditCard, color: 'from-orange-500 to-orange-600' },
  { id: 'pan', label: 'PAN Card', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
  { id: 'passbook', label: 'Bank Passbook', icon: BookOpen, color: 'from-green-500 to-green-600' },
  { id: 'receipt', label: 'Receipt', icon: Receipt, color: 'from-purple-500 to-purple-600' },
  { id: 'other', label: 'Other Document', icon: File, color: 'from-gray-500 to-gray-600' },
];

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  isOpen,
  onClose,
  onSave,
  memberId,
  memberName
}) => {
  const { tap, notify } = useHaptics();
  const { takePhoto, pickFromGallery, hasPermission, requestPermission } = useCamera();
  
  const [step, setStep] = useState<'select' | 'capture' | 'preview'>('select');
  const [selectedType, setSelectedType] = useState<DocType | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectType = (type: DocType) => {
    tap('light');
    setSelectedType(type);
    setStep('capture');
  };

  const handleTakePhoto = async () => {
    tap('medium');
    
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Camera permission required');
        return;
      }
    }

    try {
      const photo = await takePhoto();
      if (photo) {
        setCapturedImage(`data:image/jpeg;base64,${photo}`);
        setStep('preview');
        processDocument(`data:image/jpeg;base64,${photo}`);
      }
    } catch (error) {
      toast.error('Failed to capture photo');
    }
  };

  const handlePickFromGallery = async () => {
    tap('light');
    
    try {
      const photo = await pickFromGallery();
      if (photo) {
        setCapturedImage(`data:image/jpeg;base64,${photo}`);
        setStep('preview');
        processDocument(`data:image/jpeg;base64,${photo}`);
      }
    } catch (error) {
      // Fallback to file input for web
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCapturedImage(result);
        setStep('preview');
        processDocument(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processDocument = async (imageData: string) => {
    setIsProcessing(true);
    
    // Simulate OCR processing
    // In production, you'd use a real OCR service like Google Vision, AWS Textract, etc.
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted data based on document type
    const mockData: Record<DocType, Record<string, string>> = {
      aadhaar: {
        'Name': memberName || 'Sample Name',
        'Aadhaar Number': 'XXXX XXXX ' + Math.floor(1000 + Math.random() * 9000),
        'DOB': '01/01/1990',
        'Address': 'Sample Address, City, State'
      },
      pan: {
        'Name': memberName || 'Sample Name',
        'PAN Number': 'ABCDE' + Math.floor(1000 + Math.random() * 9000) + 'F',
        'DOB': '01/01/1990',
        'Father\'s Name': 'Sample Father Name'
      },
      passbook: {
        'Account Holder': memberName || 'Sample Name',
        'Account Number': 'XXXX' + Math.floor(10000000 + Math.random() * 90000000),
        'Bank Name': 'Sample Bank',
        'IFSC Code': 'SBIN0001234'
      },
      receipt: {
        'Receipt No': 'RCP' + Math.floor(100000 + Math.random() * 900000),
        'Date': new Date().toLocaleDateString(),
        'Amount': '₹' + Math.floor(100 + Math.random() * 9900)
      },
      other: {
        'Document Type': 'Other',
        'Scanned Date': new Date().toLocaleDateString()
      }
    };

    setExtractedData(selectedType ? mockData[selectedType] : {});
    setIsProcessing(false);
    notify('success');
  };

  const handleSave = () => {
    if (!capturedImage || !selectedType) return;

    const document: ScannedDocument = {
      id: Date.now().toString(),
      type: selectedType,
      memberId,
      memberName,
      imageUrl: capturedImage,
      extractedData,
      createdAt: new Date().toISOString()
    };

    onSave?.(document);
    notify('success');
    toast.success('Document saved!');
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setStep('select');
    setSelectedType(null);
    setCapturedImage(null);
    setExtractedData({});
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  tap('light');
                  if (step === 'select') {
                    onClose();
                  } else {
                    handleReset();
                  }
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10"
              >
                {step === 'select' ? <X className="w-5 h-5" /> : <RotateCcw className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="font-bold text-lg">Document Scanner</h2>
                <p className="text-xs text-white/50">
                  {step === 'select' && 'Select document type'}
                  {step === 'capture' && `Capture ${selectedType}`}
                  {step === 'preview' && 'Review & Save'}
                </p>
              </div>
            </div>
            
            {step === 'preview' && (
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-primary text-white font-medium disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
          {/* Step 1: Select Document Type */}
          {step === 'select' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-white/60 text-sm mb-4">What type of document are you scanning?</p>
              
              {docTypes.map((doc, index) => (
                <motion.button
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelectType(doc.id)}
                  className="w-full p-4 rounded-2xl bg-surface border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${doc.color} flex items-center justify-center`}>
                    <doc.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{doc.label}</p>
                    <p className="text-xs text-white/50">Tap to scan</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Capture */}
          {step === 'capture' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-sm aspect-[3/4] bg-white/5 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/60 text-center px-4">
                  Position your {selectedType} card within the frame
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleTakePhoto}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary hover:bg-primary/80 transition-colors"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm font-medium">Take Photo</span>
                </button>
                
                <button
                  onClick={handlePickFromGallery}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Upload</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Step 3: Preview & Extract */}
          {step === 'preview' && capturedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Image Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-white/5">
                <img 
                  src={capturedImage} 
                  alt="Scanned document"
                  className="w-full object-contain max-h-64"
                />
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-white/80">Processing document...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Data */}
              {!isProcessing && Object.keys(extractedData).length > 0 && (
                <div className="bg-surface rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Extracted Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(extractedData).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <span className="text-white/60 text-sm">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleReset}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-xs">Retake</span>
                </button>
                <button
                  onClick={() => {
                    // Download functionality
                    const link = document.createElement('a');
                    link.href = capturedImage;
                    link.download = `${selectedType}_${Date.now()}.jpg`;
                    link.click();
                    toast.success('Downloaded!');
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-xs">Download</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary hover:bg-primary/80 disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                  <span className="text-xs">Save</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Quick Scanner Button
export const ScannerButton: React.FC<{
  memberId?: string;
  memberName?: string;
  onSave?: (doc: ScannedDocument) => void;
  className?: string;
}> = ({ memberId, memberName, onSave, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { tap } = useHaptics();

  return (
    <>
      <button
        onClick={() => { tap('light'); setIsOpen(true); }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors ${className}`}
      >
        <Camera className="w-4 h-4" />
        <span>Scan Document</span>
      </button>
      
      <DocumentScanner
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={onSave}
        memberId={memberId}
        memberName={memberName}
      />
    </>
  );
};
