import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Brain, Users, FileText, MessageSquare, Video, BookOpen, Upload, ArrowRight, Heart, Shield, Zap, CheckCircle2 } from 'lucide-react';

const resources = [
  { icon: BookOpen, title: 'WCB Policy Library', desc: 'Access all Alberta WCB policies for TBI claims', route: '/policies', color: 'text-blue-400 bg-blue-500/10' },
  { icon: FileText, title: 'Letter Generator', desc: 'Create professional WCB correspondence', route: '/documents', color: 'text-purple-400 bg-purple-500/10' },
  { icon: Upload, title: 'Evidence Manager', desc: 'IPFS-secured evidence storage', route: '/evidence', color: 'text-green-400 bg-green-500/10' },
  { icon: MessageSquare, title: 'AI Assistant', desc: 'Get AI-powered WCB guidance', route: '/assistant', color: 'text-cyan-400 bg-cyan-500/10' },
];

const tbiInfo = [
  { title: 'Group 1 - Mild TBI', items: ['Brief loss of consciousness (<30 min)', 'Transient confusion', 'Symptoms resolve quickly'], color: 'border-green-500/30', badge: 'bg-green-500/10 text-green-400' },
  { title: 'Group 2 - Moderate/Severe', items: ['Longer loss of consciousness (30+ min)', 'Persistent neurological deficits', 'Imaging confirmed pathology'], color: 'border-orange-500/30', badge: 'bg-orange-500/10 text-orange-400' },
];

export default function BrainInjuryPortal() {
  return (
    <AppLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-[Manrope] text-gradient">Brain Injury Foundation</h1>
          <p className="text-muted-foreground mt-1">Central hub for TBI survivors and families - Alberta</p>
        </div>

        {/* Hero Banner */}
        <Card className="card-neon mb-8 overflow-hidden">
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your External Brain</h2>
                <p className="text-sm text-muted-foreground">AI-powered support for navigating recovery</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              This platform serves as your "External Brain" - combining decentralized AI, legal frameworks, 
              insurance guidance, and community governance to support your TBI recovery journey.
            </p>
          </div>
        </Card>

        {/* TBI Classifications */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {tbiInfo.map((group, idx) => (
            <Card key={idx} className={`card-neon ${group.color}`}>
              <CardHeader>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${group.badge} mb-2 w-fit`}>
                  Policy 03 01 PART I
                </span>
                <CardTitle className="text-lg">{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access */}
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {resources.map((r, idx) => {
            const Icon = r.icon;
            return (
              <Link key={idx} to={r.route}>
                <Card className="card-neon group cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center`}><Icon className="w-6 h-6" /></div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Community */}
        <Card className="card-neon">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-400 mt-1" />
                <div><p className="font-medium text-sm">Peer Advocacy</p><p className="text-xs text-muted-foreground mt-1">Connect with other TBI survivors for support and guidance</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-blue-400 mt-1" />
                <div><p className="font-medium text-sm">Life Show Documentary</p><p className="text-xs text-muted-foreground mt-1">Follow recovery journeys through the PicVideo series</p></div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-cyan-400 mt-1" />
                <div><p className="font-medium text-sm">AI-Powered Analysis</p><p className="text-xs text-muted-foreground mt-1">Real-time document analysis and error detection</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
