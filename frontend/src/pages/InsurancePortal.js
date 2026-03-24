import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Heart, Car, Home, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const typeIcons = { health: Heart, life: Shield, vehicle: Car, house: Home };
const typeColors = { health: 'text-red-400 bg-red-500/10', life: 'text-blue-400 bg-blue-500/10', vehicle: 'text-green-400 bg-green-500/10', house: 'text-orange-400 bg-orange-500/10' };

export default function InsurancePortal() {
  const [types, setTypes] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [activeType, setActiveType] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${BACKEND}/api/insurance/types`),
      axios.get(`${BACKEND}/api/insurance/compliance`)
    ]).then(([t, c]) => {
      setTypes(t.data.insurance_types || []);
      setCompliance(c.data);
    }).catch(console.error);
  }, []);

  return (
    <AppLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-[Manrope] text-gradient">Insurance Portal</h1>
          <p className="text-muted-foreground mt-1">Alberta Federal/Provincial insurance compliance - Health, Life, Vehicle, House</p>
        </div>

        {/* Insurance Types */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {types.map((t) => {
            const Icon = typeIcons[t.type_id] || Shield;
            const colors = typeColors[t.type_id] || typeColors.health;
            return (
              <Card key={t.type_id} className={`card-neon cursor-pointer transition-all ${activeType === t.type_id ? 'border-primary' : ''}`} onClick={() => setActiveType(activeType === t.type_id ? null : t.type_id)}>
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-xl ${colors} flex items-center justify-center mb-3`}><Icon className="w-6 h-6" /></div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Type Details */}
        {activeType && (
          <Card className="card-neon mb-8">
            <CardHeader><CardTitle>{types.find(t => t.type_id === activeType)?.name} - Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-sm">Alberta Regulations</h4>
                  <div className="space-y-2">
                    {types.find(t => t.type_id === activeType)?.alberta_regulations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/30">
                        <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-sm">Coverage Areas</h4>
                  <div className="space-y-2">
                    {types.find(t => t.type_id === activeType)?.coverage_areas.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/30">
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        <span className="text-sm">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance */}
        {compliance && (
          <Card className="card-neon">
            <CardHeader><CardTitle>Alberta Compliance Checklist</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
                  <p className="text-xs text-muted-foreground">Jurisdiction</p>
                  <p className="font-semibold">{compliance.jurisdiction}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
                  <p className="text-xs text-muted-foreground">Next Audit</p>
                  <p className="font-semibold">{compliance.next_audit}</p>
                </div>
              </div>
              <div className="space-y-3">
                {compliance.compliance_requirements?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      {r.status === 'mapped' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : r.status === 'in_progress' ? <Clock className="w-5 h-5 text-yellow-400" /> : <AlertCircle className="w-5 h-5 text-muted-foreground" />}
                      <span className="text-sm">{r.requirement}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.smart_contract && <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">Smart Contract</span>}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'mapped' ? 'bg-green-500/10 text-green-400' : r.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
