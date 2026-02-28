import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Trash2, 
  ExternalLink,
  FolderOpen,
  Loader2,
  HardDrive
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const evidenceTypes = [
  { value: 'medical_record', label: 'Medical Record' },
  { value: 'photograph', label: 'Photograph' },
  { value: 'incident_report', label: 'Incident Report' },
  { value: 'wage_documentation', label: 'Wage Documentation' },
  { value: 'treatment_history', label: 'Treatment History' },
  { value: 'other', label: 'Other' }
];

const getFileIcon = (fileType) => {
  if (fileType?.includes('image')) return Image;
  if (fileType?.includes('pdf')) return FileText;
  return File;
};

export default function EvidenceManager() {
  const [searchParams] = useSearchParams();
  const preSelectedClaim = searchParams.get('claim');
  
  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(preSelectedClaim || '');
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    if (selectedClaim) {
      fetchEvidence();
    } else {
      setEvidence([]);
    }
  }, [selectedClaim]);

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/claims`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setClaims(data);
        if (data.length > 0 && !selectedClaim) {
          setSelectedClaim(data[0].claim_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvidence = async () => {
    if (!selectedClaim) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/evidence/${selectedClaim}`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvidence(data);
      }
    } catch (error) {
      console.error('Failed to fetch evidence:', error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadFile || !selectedClaim || !uploadType) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('claim_id', selectedClaim);
      formData.append('description', uploadDescription);
      formData.append('evidence_type', uploadType);

      const response = await fetch(`${API_URL}/api/evidence/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        toast.success('Evidence uploaded successfully (MOCKED IPFS)');
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadDescription('');
        setUploadType('');
        fetchEvidence();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upload evidence');
      }
    } catch (error) {
      toast.error('Failed to upload evidence');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const selectedClaimData = claims.find(c => c.claim_id === selectedClaim);

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[Manrope] mb-2">
            Evidence Manager
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload and manage evidence files with decentralized storage
          </p>
        </div>

        {/* Notice Banner */}
        <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">IPFS Storage (MOCKED)</p>
              <p className="text-sm text-muted-foreground">
                Files are currently stored with simulated IPFS CIDs. To enable real IPFS storage via Pinata, 
                add your Pinata JWT key to the backend configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Claim Selection & Upload */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select value={selectedClaim} onValueChange={setSelectedClaim}>
              <SelectTrigger className="h-12" data-testid="evidence-claim-select">
                <SelectValue placeholder="Select a claim to manage evidence" />
              </SelectTrigger>
              <SelectContent>
                {claims.map((claim) => (
                  <SelectItem key={claim.claim_id} value={claim.claim_id}>
                    {claim.claim_number} - {claim.injury_group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button 
                className="h-12 rounded-full" 
                disabled={!selectedClaim}
                data-testid="upload-evidence-btn"
              >
                <Upload className="w-5 h-5 mr-2" /> Upload Evidence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Evidence</DialogTitle>
                <DialogDescription>
                  Add evidence files to your claim. Files will be stored securely.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="h-12"
                    data-testid="evidence-file-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Evidence Type</Label>
                  <Select value={uploadType} onValueChange={setUploadType} required>
                    <SelectTrigger data-testid="evidence-type-select">
                      <SelectValue placeholder="Select evidence type" />
                    </SelectTrigger>
                    <SelectContent>
                      {evidenceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe this evidence..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={3}
                    data-testid="evidence-description-input"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="w-full rounded-full" 
                    disabled={isUploading}
                    data-testid="submit-evidence-btn"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" /> Upload to IPFS
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Evidence Grid */}
        {!selectedClaim ? (
          <Card className="card-warm">
            <CardContent className="py-16 text-center">
              <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Claim</h3>
              <p className="text-muted-foreground">
                Choose a claim from the dropdown above to view and manage evidence
              </p>
            </CardContent>
          </Card>
        ) : evidence.length === 0 ? (
          <Card className="card-warm">
            <CardContent className="py-16 text-center">
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Evidence Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first evidence file for this claim
              </p>
              <Button 
                onClick={() => setIsUploadOpen(true)} 
                className="rounded-full"
                data-testid="empty-upload-btn"
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Evidence
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidence.map((item) => {
              const FileIcon = getFileIcon(item.file_type);
              return (
                <Card key={item.evidence_id} className="card-warm" data-testid={`evidence-card-${item.evidence_id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm truncate">
                          {item.file_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatFileSize(item.file_size)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="rounded-full capitalize">
                      {item.evidence_type.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">IPFS CID (MOCKED)</p>
                      <p className="text-xs font-mono truncate">{item.ipfs_cid}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(item.uploaded_at).toLocaleDateString()}
                      </span>
                      <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                        <a href={item.storage_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Claim Info */}
        {selectedClaimData && (
          <div className="mt-8">
            <Card className="card-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selected Claim Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Claim Number</p>
                    <p className="font-medium">{selectedClaimData.claim_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Classification</p>
                    <Badge variant="outline" className="rounded-full">
                      {selectedClaimData.injury_group}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Injury Date</p>
                    <p className="font-medium">{selectedClaimData.injury_date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
