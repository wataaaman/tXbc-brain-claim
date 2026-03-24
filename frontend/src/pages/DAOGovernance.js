import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import { Vote, Plus, CheckCircle2, XCircle, Minus, Clock, TrendingUp, Users, Sparkles } from 'lucide-react';
import axios from 'axios';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const categoryColors = {
  policy: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  funding: 'bg-green-500/10 text-green-400 border-green-500/20',
  technical: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  community: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function DAOGovernance() {
  const { token } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: '', description: '', category: 'policy', voting_period_days: 7 });
  const [creating, setCreating] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [propRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND}/api/governance/proposals`),
        axios.get(`${BACKEND}/api/governance/stats`)
      ]);
      setProposals(propRes.data.proposals || []);
      setStats(statsRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!newProposal.title || !newProposal.description) return;
    setCreating(true);
    try {
      await axios.post(`${BACKEND}/api/governance/proposals`, newProposal, { headers });
      setShowCreate(false);
      setNewProposal({ title: '', description: '', category: 'policy', voting_period_days: 7 });
      fetchData();
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleVote = async (proposalId, vote) => {
    try {
      await axios.post(`${BACKEND}/api/governance/proposals/${proposalId}/vote`, { vote }, { headers });
      fetchData();
    } catch (err) { alert(err.response?.data?.detail || 'Vote failed'); }
  };

  const getStatusBadge = (status) => {
    const styles = { active: 'bg-green-500/10 text-green-400', passed: 'bg-blue-500/10 text-blue-400', rejected: 'bg-red-500/10 text-red-400' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>{status}</span>;
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-[Manrope] text-gradient">DAO Governance</h1>
            <p className="text-muted-foreground mt-1">Tech X Brain Collective - Decentralized Decision Making</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 border-0"><Plus className="w-4 h-4 mr-2" /> New Proposal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Governance Proposal</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Title</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm" placeholder="Proposal title..." value={newProposal.title} onChange={(e) => setNewProposal({...newProposal, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Description</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm min-h-[120px]" placeholder="Describe your proposal..." value={newProposal.description} onChange={(e) => setNewProposal({...newProposal, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Category</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm" value={newProposal.category} onChange={(e) => setNewProposal({...newProposal, category: e.target.value})}>
                      <option value="policy">Policy</option>
                      <option value="funding">Funding</option>
                      <option value="technical">Technical</option>
                      <option value="community">Community</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Voting Period (days)</label>
                    <input type="number" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm" value={newProposal.voting_period_days} onChange={(e) => setNewProposal({...newProposal, voting_period_days: parseInt(e.target.value) || 7})} min={1} max={30} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 border-0">{creating ? 'Submitting...' : 'Submit Proposal'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Proposals', value: stats.total_proposals, icon: Vote, color: 'text-purple-400' },
              { label: 'Active Voting', value: stats.active_proposals, icon: Clock, color: 'text-green-400' },
              { label: 'Participation', value: stats.participation_rate, icon: Users, color: 'text-blue-400' },
              { label: 'Treasury', value: stats.treasury_balance, icon: TrendingUp, color: 'text-orange-400' },
            ].map((s, i) => (
              <Card key={i} className="card-neon">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                    <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Proposals */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading proposals...</div>
        ) : proposals.length === 0 ? (
          <Card className="card-neon text-center py-12">
            <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No proposals yet. Be the first to shape the collective!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => {
              const total = p.votes_for + p.votes_against + p.votes_abstain;
              const forPct = total > 0 ? Math.round((p.votes_for / total) * 100) : 0;
              const againstPct = total > 0 ? Math.round((p.votes_against / total) * 100) : 0;
              return (
                <Card key={p.proposal_id} className="card-neon">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryColors[p.category] || categoryColors.policy}`}>{p.category}</span>
                          {getStatusBadge(p.status)}
                        </div>
                        <h3 className="text-lg font-semibold mt-2">{p.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">by {p.proposer_name} · {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>For: {p.votes_for} ({forPct}%)</span>
                        <span>Against: {p.votes_against} ({againstPct}%)</span>
                        <span>Abstain: {p.votes_abstain}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                        <div className="h-full bg-green-500 transition-all" style={{width: `${forPct}%`}} />
                        <div className="h-full bg-red-500 transition-all" style={{width: `${againstPct}%`}} />
                      </div>
                    </div>
                    {p.status === 'active' && (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="rounded-full text-green-400 border-green-500/30 hover:bg-green-500/10" onClick={() => handleVote(p.proposal_id, 'for')}><CheckCircle2 className="w-4 h-4 mr-1" /> For</Button>
                        <Button size="sm" variant="outline" className="rounded-full text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => handleVote(p.proposal_id, 'against')}><XCircle className="w-4 h-4 mr-1" /> Against</Button>
                        <Button size="sm" variant="outline" className="rounded-full text-muted-foreground" onClick={() => handleVote(p.proposal_id, 'abstain')}><Minus className="w-4 h-4 mr-1" /> Abstain</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
