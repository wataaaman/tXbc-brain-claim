import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Plus,
  FileText,
  Upload,
  Calendar as CalendarIcon,
  AlertTriangle,
  FilePlus,
  Clock,
  ArrowLeft,
  ExternalLink,
  Download,
  Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const eventTypeColors = {
  'claim_created': 'bg-blue-500',
  'injury': 'bg-red-500',
  'letter': 'bg-green-500',
  'evidence': 'bg-orange-500',
  'event_medical': 'bg-purple-500',
  'event_communication': 'bg-indigo-500',
  'event_decision': 'bg-pink-500',
  'event_milestone': 'bg-teal-500'
};

const eventTypeIcons = {
  'claim_created': FilePlus,
  'injury': AlertTriangle,
  'letter': FileText,
  'evidence': Upload,
  'event_medical': CalendarIcon,
  'event_communication': FileText,
  'event_decision': FileText,
  'event_milestone': Clock
};

export default function ClaimTimeline() {
  const { claimId } = useParams();
  const [timeline, setTimeline] = useState([]);
  const [claim, setClaim] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Form state
  const [eventType, setEventType] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (claimId) {
      fetchTimeline();
    }
  }, [claimId]);

  const fetchTimeline = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/claims/${claimId}/full-timeline`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline);
        setClaim(data.claim);
        setStats(data.stats);
      } else {
        toast.error('Failed to load timeline');
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('event_type', eventType);
      formData.append('title', eventTitle);
      formData.append('description', eventDescription);
      formData.append('date', selectedDate.toISOString());

      const response = await fetch(`${API_URL}/api/claims/${claimId}/timeline`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        toast.success('Event added to timeline');
        setIsAddEventOpen(false);
        setEventType('');
        setEventTitle('');
        setEventDescription('');
        fetchTimeline();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add event');
      }
    } catch (error) {
      toast.error('Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPdf = async (letterId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/letters/${letterId}/pdf`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wcb-letter-${letterId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PDF downloaded');
      } else {
        toast.error('Failed to download PDF');
      }
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="page-container flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[Manrope] mb-2">
                Claim Timeline
              </h1>
              {claim && (
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="rounded-full text-base px-4 py-1">
                    {claim.claim_number}
                  </Badge>
                  <Badge className="rounded-full">{claim.injury_group}</Badge>
                  <Badge variant={claim.status === 'active' ? 'default' : 'secondary'} className="rounded-full">
                    {claim.status}
                  </Badge>
                </div>
              )}
            </div>
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full" data-testid="add-timeline-event-btn">
                  <Plus className="w-4 h-4 mr-2" /> Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Timeline Event</DialogTitle>
                  <DialogDescription>
                    Record an important event in your claim history
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType} required>
                      <SelectTrigger data-testid="event-type-select">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medical">Medical Appointment</SelectItem>
                        <SelectItem value="communication">WCB Communication</SelectItem>
                        <SelectItem value="decision">Decision/Ruling</SelectItem>
                        <SelectItem value="milestone">Milestone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input
                      placeholder="e.g., Specialist appointment"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      data-testid="event-title-input"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(selectedDate, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(d) => d && setSelectedDate(d)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Details about this event..."
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      rows={3}
                      data-testid="event-description-input"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Event'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="card-warm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.total_events || 0}</p>
              <p className="text-sm text-muted-foreground">Events</p>
            </CardContent>
          </Card>
          <Card className="card-warm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.total_letters || 0}</p>
              <p className="text-sm text-muted-foreground">Letters</p>
            </CardContent>
          </Card>
          <Card className="card-warm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.total_evidence || 0}</p>
              <p className="text-sm text-muted-foreground">Evidence Files</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="card-warm">
          <CardHeader>
            <CardTitle>Complete Claim History</CardTitle>
            <CardDescription>
              All events, letters, and evidence for this claim in chronological order
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Timeline Events</h3>
                <p className="text-muted-foreground">
                  Start adding events to track your claim journey
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[60vh]">
                <div className="relative pl-8">
                  {/* Vertical line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                  
                  {timeline.map((item, index) => {
                    const IconComponent = eventTypeIcons[item.type] || Clock;
                    const colorClass = eventTypeColors[item.type] || 'bg-gray-500';
                    
                    return (
                      <div key={item.id} className="relative mb-8 last:mb-0" data-testid={`timeline-item-${index}`}>
                        {/* Dot */}
                        <div className={`absolute -left-5 w-6 h-6 rounded-full ${colorClass} flex items-center justify-center`}>
                          <IconComponent className="w-3 h-3 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="ml-4 p-4 bg-muted/30 rounded-xl">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(item.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {item.type === 'letter' && item.letter_id && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-full"
                                  onClick={() => downloadPdf(item.letter_id)}
                                >
                                  <Download className="w-4 h-4 mr-1" /> PDF
                                </Button>
                              )}
                              {item.type === 'evidence' && item.ipfs_cid && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="rounded-full"
                                  asChild
                                >
                                  <a 
                                    href={`https://gateway.pinata.cloud/ipfs/${item.ipfs_cid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" /> View
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
