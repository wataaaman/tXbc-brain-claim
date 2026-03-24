import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import { Scale, Plus, FileText, AlertTriangle, Clock, CheckCircle2, RotateCcw, Shield } from 'lucide-react';
import axios from 'axios';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const caseTypeLabels = { wcb_appeal: 'WCB Appeal', insurance_dispute: 'Insurance Dispute', policy_review: 'Policy Review', advocacy: 'Advocacy' };
const statusColors = { open: 'bg-blue-500/10 text-blue-400', under_review: 'bg-yellow-500/10 text-yellow-400', closed: 'bg-green-500/10 text-green-400', reversed: 'bg-purple-500/10 text-purple-400' };

export default function LegalPortal() {
  const { token } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', case_type: 'wcb_appeal', description: '', priority: 'medium' });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchCases = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/legal/cases`, { headers });
      setCases(res.data.cases || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchCases(); }, []);

  const handleCreate = async () => {
    if (!newCase.title || !newCase.description) return;
    try {
      await axios.post(`${BACKEND}/api/legal/cases`, newCase, { headers });
      setShowCreate(false);
      setNewCase({ title: '', case_type: 'wcb_appeal', description: '', priority: 'medium' });
      fetchCases();
    } catch (err) { console.error(err); }
  };

  const handleReview = async (caseId) => {
    try {
      await axios.post(`${BACKEND}/api/legal/cases/${caseId}/review`, {}, { headers });
      fetchCases();
    } catch (err) { alert(err.response?.data?.detail || 'Review request failed'); }
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-[Manrope] text-gradient">Legal & Case Management</h1>
            <p className="text-muted-foreground mt-1">Decentralized law with policy review & reversal capability</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild><Button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 border-0"><Plus className="w-4 h-4 mr-2" /> New Case</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Legal Case</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><label className="text-sm font-medium mb-1.5 block">Title</label><input className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm" placeholder="Case title..." value={newCase.title} onChange={(e) => setNewCase({...newCase, title: e.target.value})} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Description</label><textarea className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm min-h-[100px]" placeholder="Case details..." value={newCase.description} onChange={(e) => setNewCase({...newCase, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium mb-1.5 block">Type</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm" value={newCase.case_type} onChange={(e) => setNewCase({...newCase, case_type: e.target.value})}>
                      <option value="wcb_appeal">WCB Appeal</option><option value="insurance_dispute">Insurance Dispute</option><option value="policy_review">Policy Review</option><option value="advocacy">Advocacy</option>
                    </select>
                  </div>
                  <div><label className="text-sm font-medium mb-1.5 block">Priority</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm" value={newCase.priority} onChange={(e) => setNewCase({...newCase, priority: e.target.value})}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 border-0">Create Case</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Banner */}
        <Card className="card-neon mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-primary mt-0.5" />
              <div><p className="font-medium text-sm">Policy Review with Reversal Capability</p><p className="text-xs text-muted-foreground mt-1">All cases support on-chain policy review. Decisions can be reversed through DAO governance if new evidence emerges.</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Cases */}
        {loading ? <div className="text-center py-12 text-muted-foreground">Loading cases...</div> : cases.length === 0 ? (
          <Card className="card-neon text-center py-12"><Scale className="w-12 h-12 text-primary/30 mx-auto mb-4" /><p className="text-muted-foreground">No legal cases yet.</p></Card>
        ) : (
          <div className="space-y-4">
            {cases.map((c) => (
              <Card key={c.case_id} className="card-neon">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">{caseTypeLabels[c.case_type] || c.case_type}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || statusColors.open}`}>{c.status}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.priority === 'high' || c.priority === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-muted text-muted-foreground'}`}>{c.priority}</span>
                      </div>
                      <h3 className="text-lg font-semibold">{c.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString()}</span>
                        {c.reversal_capability && <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reversal Enabled</span>}
                        {c.smart_contract_status && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {c.smart_contract_status}</span>}
                      </div>
                    </div>
                    {c.status === 'open' && (
                      <Button size="sm" variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/5" onClick={() => handleReview(c.case_id)}><FileText className="w-4 h-4 mr-1" /> Request Review</Button>
                    )}
                  </div>
                  {c.events && c.events.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <p className="text-xs font-medium mb-2">Case Timeline</p>
                      <div className="space-y-2">
                        {c.events.map((e, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>{e.description}</span>
                            <span className="ml-auto">{new Date(e.timestamp).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
