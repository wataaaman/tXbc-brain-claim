import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Plus, 
  FileText, 
  Upload, 
  MessageSquare, 
  Clock,
  CalendarIcon,
  ArrowRight,
  BookOpen,
  Brain,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Form state
  const [claimNumber, setClaimNumber] = useState('');
  const [injuryGroup, setInjuryGroup] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

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
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/claims`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          claim_number: claimNumber,
          injury_type: 'TBI',
          injury_group: injuryGroup,
          injury_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
          description: description,
          status: 'active'
        })
      });

      if (response.ok) {
        toast.success('Claim created successfully');
        setIsCreateDialogOpen(false);
        setClaimNumber('');
        setInjuryGroup('');
        setDescription('');
        setSelectedDate(null);
        fetchClaims();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create claim');
      }
    } catch (error) {
      toast.error('Failed to create claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickActions = [
    { icon: FileText, label: 'Generate Letter', path: '/documents', color: 'bg-blue-500/10 text-blue-600' },
    { icon: Upload, label: 'Upload Evidence', path: '/evidence', color: 'bg-green-500/10 text-green-600' },
    { icon: MessageSquare, label: 'Ask AI Assistant', path: '/assistant', color: 'bg-purple-500/10 text-purple-600' },
    { icon: BookOpen, label: 'View Policies', path: '/policies', color: 'bg-orange-500/10 text-orange-600' },
  ];

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[Manrope] mb-2">
            Your Claims Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your WCB claims and access resources
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.path}>
                <Card className="card-warm hover:scale-[1.02] transition-transform cursor-pointer" data-testid={`quick-action-${action.label.toLowerCase().replace(' ', '-')}`}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Claims Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Claims List */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold font-[Manrope]">Your Claims</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full" data-testid="create-claim-btn">
                    <Plus className="w-4 h-4 mr-2" /> New Claim
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Claim</DialogTitle>
                    <DialogDescription>
                      Enter your WCB claim details below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateClaim} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="claim-number">Claim Number</Label>
                      <Input
                        id="claim-number"
                        placeholder="e.g., WCB-2024-12345"
                        value={claimNumber}
                        onChange={(e) => setClaimNumber(e.target.value)}
                        data-testid="claim-number-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="injury-group">TBI Classification</Label>
                      <Select value={injuryGroup} onValueChange={setInjuryGroup} required>
                        <SelectTrigger data-testid="injury-group-select">
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Group 1">Group 1 - Mild TBI</SelectItem>
                          <SelectItem value="Group 2">Group 2 - Moderate/Severe TBI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Injury</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start" data-testid="injury-date-btn">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Briefly describe your injury..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        data-testid="claim-description-input"
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full rounded-full" disabled={isSubmitting} data-testid="submit-claim-btn">
                        {isSubmitting ? 'Creating...' : 'Create Claim'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <Card className="card-warm">
                <CardContent className="p-8 text-center">
                  <div className="animate-pulse">Loading claims...</div>
                </CardContent>
              </Card>
            ) : claims.length === 0 ? (
              <Card className="card-warm">
                <CardContent className="p-8 text-center">
                  <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Claims Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first claim to start tracking your WCB process
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-full" data-testid="empty-create-claim-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Your First Claim
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <Card key={claim.claim_id} className="card-warm" data-testid={`claim-card-${claim.claim_id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{claim.claim_number}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            Injury Date: {claim.injury_date}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={claim.status === 'active' ? 'default' : 'secondary'}
                          className="rounded-full"
                        >
                          {claim.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="rounded-full">
                          {claim.injury_group}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{claim.injury_type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {claim.description}
                      </p>
                      <div className="flex gap-2">
                        <Link to={`/documents?claim=${claim.claim_id}`}>
                          <Button variant="outline" size="sm" className="rounded-full">
                            <FileText className="w-4 h-4 mr-1" /> Letters
                          </Button>
                        </Link>
                        <Link to={`/evidence?claim=${claim.claim_id}`}>
                          <Button variant="outline" size="sm" className="rounded-full">
                            <Upload className="w-4 h-4 mr-1" /> Evidence
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Policy Alert */}
            <Card className="card-warm border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Important Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Under <strong>Policy 01 02</strong>, you have the right to request your complete claim file including all medical records and correspondence.
                </p>
                <Link to="/documents">
                  <Button variant="link" className="p-0 h-auto text-primary">
                    Generate Request Letter <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="card-warm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Helpful Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/policies" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Policy Library</p>
                    <p className="text-xs text-muted-foreground">TBI classifications & rights</p>
                  </div>
                </Link>
                <Link to="/assistant" className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">AI Assistant</p>
                    <p className="text-xs text-muted-foreground">Get help with questions</p>
                  </div>
                </Link>
                <a 
                  href="https://www.openevidence.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Brain className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">OpenEvidence</p>
                    <p className="text-xs text-muted-foreground">Medical information platform</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
