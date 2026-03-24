import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Crown, Vote, Users, Shield, Coins, ArrowRight, Globe, Lock, Zap, Network } from 'lucide-react';

export default function FoundersPortal() {
  return (
    <AppLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-[Manrope] text-gradient">Founders' Brain Portal</h1>
          <p className="text-muted-foreground mt-1">Tech X Brain Collective - Governance & Strategic Direction</p>
        </div>

        {/* Hero */}
        <Card className="card-neon mb-8 overflow-hidden">
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center"><Crown className="w-7 h-7 text-white" /></div>
              <div><h2 className="text-2xl font-bold">Collective Governance</h2><p className="text-sm text-muted-foreground">Shape the future of decentralized TBI recovery</p></div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">As a founder of the Tech X Brain Collective, you have direct governance power over the platform's direction, funding allocation, and policy decisions through our DAO structure on Flare Network.</p>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Vote, title: 'DAO Governance', desc: 'Create & vote on proposals', route: '/governance', color: 'text-purple-400 bg-purple-500/10' },
            { icon: Users, title: 'AI Agents', desc: 'Multi-agent AI system', route: '/agents', color: 'text-blue-400 bg-blue-500/10' },
            { icon: Shield, title: 'Insurance', desc: 'Alberta compliance', route: '/portal/insurance', color: 'text-green-400 bg-green-500/10' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link key={idx} to={item.route}>
                <Card className="card-neon group cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}><Icon className="w-6 h-6" /></div>
                      <div className="flex-1"><p className="font-semibold text-sm">{item.title}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Ecosystem */}
        <Card className="card-neon">
          <CardHeader><CardTitle>Flare Network Ecosystem</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Network, title: 'Flare Network', desc: 'Core settlement layer for verifiable AI and smart accounts' },
                { icon: Lock, title: 'TEE Private Compute', desc: 'Time-locked execution environments for sensitive data' },
                { icon: Coins, title: 'Multi-Sig Wallets', desc: 'Safe Autonomys integration for treasury management' },
                { icon: Globe, title: 'Cross-Chain', desc: 'XRPL, XPR, Bifrost, SparkDex.ai, Luminite DeFi' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                    <Icon className="w-5 h-5 text-primary mt-0.5" />
                    <div><p className="font-medium text-sm">{item.title}</p><p className="text-xs text-muted-foreground mt-1">{item.desc}</p></div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
