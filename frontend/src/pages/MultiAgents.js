import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { Bot, Send, CheckCircle2, Loader2, Globe, Cpu, Users, Shield, Search, Zap } from 'lucide-react';
import axios from 'axios';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const agentIcons = { fetchai: Bot, heurist: Search, gaianet: Globe, baselight: Cpu, zo: Users, autonomys: Shield };
const agentColors = { fetchai: 'text-blue-400', heurist: 'text-purple-400', gaianet: 'text-cyan-400', baselight: 'text-yellow-400', zo: 'text-green-400', autonomys: 'text-orange-400' };

export default function MultiAgents() {
  const { token } = useAuth();
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);

  useEffect(() => {
    axios.get(`${BACKEND}/api/agents`).then(res => setAgents(res.data.agents || [])).catch(console.error);
  }, []);

  const toggleAgent = (agentId) => {
    setSelectedAgents(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]);
  };

  const selectAll = () => setSelectedAgents(agents.map(a => a.agent_id));
  const deselectAll = () => setSelectedAgents([]);

  const handleQuery = async () => {
    if (!query.trim() || selectedAgents.length === 0) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await axios.post(`${BACKEND}/api/agents/query`, { query, agent_ids: selectedAgents }, { headers: { Authorization: `Bearer ${token}` } });
      setResults(res.data.results || []);
      setQueryHistory(prev => [{ query, agents: selectedAgents.length, timestamp: new Date().toISOString() }, ...prev].slice(0, 10));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-[Manrope] text-gradient">Multi-AI Agent System</h1>
          <p className="text-muted-foreground mt-1">Select and run multiple decentralized AI agents simultaneously</p>
        </div>

        {/* Agent Selection */}
        <Card className="card-neon mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Select AI Agents</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={selectAll}>Select All</Button>
                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={deselectAll}>Clear</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agents.map((agent) => {
                const Icon = agentIcons[agent.agent_id] || Bot;
                const isSelected = selectedAgents.includes(agent.agent_id);
                return (
                  <button key={agent.agent_id} onClick={() => toggleAgent(agent.agent_id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      isSelected ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-border/50 hover:border-primary/30'
                    }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : agentColors[agent.agent_id] || 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.provider}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Query Input */}
        <Card className="card-neon mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <textarea className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm min-h-[80px] resize-none" placeholder="Enter your query for the AI agents..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button onClick={handleQuery} disabled={loading || !query.trim() || selectedAgents.length === 0} className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 border-0 self-end h-12 px-6">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Query</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{selectedAgents.length} agent(s) selected</p>
          </CardContent>
        </Card>

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Querying {selectedAgents.length} agents in parallel...</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Agent Responses ({results.length})</h2>
            {results.map((r, idx) => {
              const Icon = agentIcons[r.agent_id] || Bot;
              return (
                <Card key={idx} className="card-neon">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${agentColors[r.agent_id] || 'text-primary'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{r.agent_name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{r.provider}</p>
                      </div>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${r.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{r.status}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{r.response}</p>
                    </div>
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
