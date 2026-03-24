import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { HeartPulse, Brain, Eye, Activity, Fingerprint, Beaker, Radio, Waves } from 'lucide-react';

export default function HealthPortal() {
  return (
    <AppLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-[Manrope] text-gradient">Health & Science Portal</h1>
          <p className="text-muted-foreground mt-1">Decentralized Science (DeSci), biometric ID, and health records</p>
        </div>

        <Card className="card-neon mb-8 overflow-hidden">
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center"><HeartPulse className="w-7 h-7 text-white" /></div>
              <div><h2 className="text-2xl font-bold">The Healing Hub</h2><p className="text-sm text-muted-foreground">Phase 4 - Physical Integration</p></div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">Integrating neurofeedback protocols, vision therapy, brain mapping, and decentralized health records for holistic TBI recovery.</p>
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            { icon: Brain, title: 'Neurofeedback Protocol', desc: 'Sane State protocol utilizing brain mapping and sound frequency to reduce reactivity, anxiety, and nausea.', color: 'text-purple-400 bg-purple-500/10' },
            { icon: Eye, title: 'Vision Therapy', desc: 'Specialized vision exercises and forensic file audits for holistic recovery progress tracking.', color: 'text-blue-400 bg-blue-500/10' },
            { icon: Activity, title: 'Hockey Arena Integration', desc: 'Partnering with Hockey Canada for immediate post-impact brain sensors and healing protocols.', color: 'text-green-400 bg-green-500/10' },
            { icon: Fingerprint, title: 'Biometric ID', desc: 'Decentralized biometric identification for seamless, secure authentication without seed phrases.', color: 'text-orange-400 bg-orange-500/10' },
            { icon: Beaker, title: 'DeSci Research', desc: 'Decentralized Science - connecting childhood brain injuries to later-life conditions like ADHD and Alzheimers.', color: 'text-cyan-400 bg-cyan-500/10' },
            { icon: Waves, title: 'Sound Frequency Therapy', desc: 'Brain mapping and sound frequency protocols for neurological rehabilitation and recovery.', color: 'text-red-400 bg-red-500/10' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="card-neon">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center shrink-0`}><Icon className="w-6 h-6" /></div>
                    <div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted-foreground mt-1">{item.desc}</p></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
