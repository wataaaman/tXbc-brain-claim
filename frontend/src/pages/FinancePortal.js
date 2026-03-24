import React from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Coins, Gift, Wallet, QrCode, TrendingUp, ArrowUpRight, Shield, Sparkles } from 'lucide-react';

export default function FinancePortal() {
  return (
    <AppLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-[Manrope] text-gradient">Finance & Rewards Portal</h1>
          <p className="text-muted-foreground mt-1">Tokenized governance, airdrops, and decentralized funding</p>
        </div>

        <Card className="card-neon mb-8 overflow-hidden">
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center"><Coins className="w-7 h-7 text-white" /></div>
              <div><h2 className="text-2xl font-bold">Tokenomics & Incentives</h2><p className="text-sm text-muted-foreground">Flare Network Token Economy</p></div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">Token rewards for data contribution, platform development, and peer advocacy. All transactions transparent and verifiable on Flare Network.</p>
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            { icon: Gift, title: 'Airdrops', desc: 'Participation rewards for community engagement, data contribution, and platform development.', color: 'text-purple-400 bg-purple-500/10', tag: 'Coming Soon' },
            { icon: Wallet, title: 'Multi-Sig Treasury', desc: '100% transparent funding with multi-signature wallets and DAO voting on all disbursements.', color: 'text-blue-400 bg-blue-500/10', tag: 'Active' },
            { icon: QrCode, title: 'Flow Codes & Uniqco QR', desc: 'Frictionless transactions using QR codes for donations, payments, and identity verification.', color: 'text-green-400 bg-green-500/10', tag: 'Coming Soon' },
            { icon: TrendingUp, title: 'Decentralized Donations', desc: 'On-chain donations with full transparency. Every contribution tracked and verifiable.', color: 'text-orange-400 bg-orange-500/10', tag: 'Active' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="card-neon">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center shrink-0`}><Icon className="w-6 h-6" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{item.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${item.tag === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground'}`}>{item.tag}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* DeFi Integrations */}
        <Card className="card-neon">
          <CardHeader><CardTitle>DeFi & Cross-Chain Integrations</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['SparkDex.ai', 'Luminite DeFi', 'Firelight Vaults', 'Bifrost Bridge', 'FXRP-STXRP', 'XRPL', 'XPR Network', 'XAMAN'].map((name) => (
                <div key={name} className="p-3 rounded-xl bg-muted/50 border border-border/30 text-center">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Integrated</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
