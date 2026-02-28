import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, 
  Wand2, 
  Copy, 
  Download, 
  Clock, 
  CheckCircle,
  Loader2,
  FileEdit,
  FileDown
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const letterTemplates = [
  {
    type: 'claim_file_request',
    title: 'Complete Claim File Request',
    description: 'Request your full WCB claim file under Policy 01 02',
    icon: FileText
  },
  {
    type: 'interim_relief_request',
    title: 'Interim Relief Request',
    description: 'Request temporary benefits under Policy 01 10',
    icon: FileText
  },
  {
    type: 'call_recordings_request',
    title: 'Call Recordings Request',
    description: 'Request call center audio recordings',
    icon: FileText
  }
];

export default function DocumentGenerator() {
  const [searchParams] = useSearchParams();
  const preSelectedClaim = searchParams.get('claim');
  
  const [claims, setClaims] = useState([]);
  const [letters, setLetters] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(preSelectedClaim || '');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // AI Draft
  const [aiPurpose, setAiPurpose] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [claimsRes, lettersRes] = await Promise.all([
        fetch(`${API_URL}/api/claims`, { credentials: 'include', headers }),
        fetch(`${API_URL}/api/letters`, { credentials: 'include', headers })
      ]);
      
      if (claimsRes.ok) setClaims(await claimsRes.json());
      if (lettersRes.ok) setLetters(await lettersRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLetter = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a letter template');
      return;
    }
    
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/letters/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          template_type: selectedTemplate,
          claim_id: selectedClaim || null,
          custom_data: {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedLetter(data.content);
        toast.success('Letter generated successfully');
        fetchData(); // Refresh letters list
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to generate letter');
      }
    } catch (error) {
      toast.error('Failed to generate letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiDraft = async () => {
    if (!aiPurpose) {
      toast.error('Please describe the purpose of your letter');
      return;
    }
    
    setIsAiGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('purpose', aiPurpose);
      if (selectedClaim) formData.append('claim_id', selectedClaim);
      if (aiContext) formData.append('additional_context', aiContext);

      const response = await fetch(`${API_URL}/api/letters/ai-draft`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedLetter(data.content);
        toast.success('AI letter drafted successfully');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to generate AI letter');
      }
    } catch (error) {
      toast.error('AI service error. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success('Letter copied to clipboard');
  };

  const downloadLetter = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wcb-letter-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Letter downloaded');
  };

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[Manrope] mb-2">
            Letter Generator
          </h1>
          <p className="text-lg text-muted-foreground">
            Generate professional letters to the WCB with proper policy citations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Letter Builder */}
          <div className="space-y-6">
            <Tabs defaultValue="templates">
              <TabsList className="w-full">
                <TabsTrigger value="templates" className="flex-1" data-testid="templates-tab">
                  <FileText className="w-4 h-4 mr-2" /> Templates
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex-1" data-testid="ai-tab">
                  <Wand2 className="w-4 h-4 mr-2" /> AI Draft
                </TabsTrigger>
              </TabsList>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-4 mt-4">
                {/* Claim Selection */}
                {claims.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Claim (Optional)</Label>
                    <Select value={selectedClaim} onValueChange={setSelectedClaim}>
                      <SelectTrigger data-testid="claim-select">
                        <SelectValue placeholder="Choose a claim to auto-fill details" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No claim selected</SelectItem>
                        {claims.map((claim) => (
                          <SelectItem key={claim.claim_id} value={claim.claim_id}>
                            {claim.claim_number} - {claim.injury_group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Template Selection */}
                <div className="space-y-2">
                  <Label>Letter Template</Label>
                  <div className="grid gap-3">
                    {letterTemplates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.type}
                          onClick={() => setSelectedTemplate(template.type)}
                          className={`p-4 rounded-xl text-left transition-all ${
                            selectedTemplate === template.type
                              ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                              : 'bg-card hover:bg-muted border border-border'
                          }`}
                          data-testid={`template-${template.type}`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-medium">{template.title}</p>
                              <p className={`text-sm ${
                                selectedTemplate === template.type 
                                  ? 'text-primary-foreground/80' 
                                  : 'text-muted-foreground'
                              }`}>
                                {template.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateLetter}
                  disabled={isGenerating || !selectedTemplate}
                  className="w-full h-12 rounded-full text-base"
                  data-testid="generate-letter-btn"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Generate Letter
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                {claims.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Claim (Optional)</Label>
                    <Select value={selectedClaim} onValueChange={setSelectedClaim}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a claim for context" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No claim selected</SelectItem>
                        {claims.map((claim) => (
                          <SelectItem key={claim.claim_id} value={claim.claim_id}>
                            {claim.claim_number} - {claim.injury_group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="ai-purpose">What do you need to write about?</Label>
                  <Textarea
                    id="ai-purpose"
                    placeholder="e.g., I need to request my complete claim file because I believe there are missing medical records..."
                    value={aiPurpose}
                    onChange={(e) => setAiPurpose(e.target.value)}
                    rows={4}
                    data-testid="ai-purpose-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-context">Additional Context (Optional)</Label>
                  <Textarea
                    id="ai-context"
                    placeholder="Any additional details the AI should know..."
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    rows={3}
                    data-testid="ai-context-input"
                  />
                </div>

                <Button 
                  onClick={handleAiDraft}
                  disabled={isAiGenerating || !aiPurpose}
                  className="w-full h-12 rounded-full text-base"
                  data-testid="ai-draft-btn"
                >
                  {isAiGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Previous Letters */}
            {letters.length > 0 && (
              <Card className="card-warm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Letters ({letters.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {letters.slice(0, 5).map((letter) => (
                        <button
                          key={letter.letter_id}
                          onClick={() => setGeneratedLetter(letter.content)}
                          className="w-full p-3 rounded-lg text-left hover:bg-muted transition-colors"
                          data-testid={`letter-${letter.letter_id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {letter.template_type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(letter.generated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Preview */}
          <div>
            <Card className="card-warm h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileEdit className="w-5 h-5" />
                    Letter Preview
                  </CardTitle>
                  {generatedLetter && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={copyToClipboard}
                        className="rounded-full"
                        data-testid="copy-letter-btn"
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={downloadLetter}
                        className="rounded-full"
                        data-testid="download-letter-btn"
                      >
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedLetter ? (
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <Textarea
                      value={generatedLetter}
                      onChange={(e) => setGeneratedLetter(e.target.value)}
                      className="min-h-[500px] font-mono text-sm resize-none border-none bg-muted/30 p-4"
                      data-testid="letter-preview"
                    />
                  </ScrollArea>
                ) : (
                  <div className="h-[calc(100vh-20rem)] flex items-center justify-center text-center">
                    <div>
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Letter Generated</h3>
                      <p className="text-muted-foreground max-w-sm">
                        Select a template or use AI to generate a professional letter to the WCB
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
