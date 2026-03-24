import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTheme } from '../context/ThemeContext';
import { 
  Brain, Shield, ArrowRight, Sun, Moon, Zap, Users, Scale, HeartPulse,
  Coins, Crown, Globe, Lock, Bot, FileSearch, Video, CheckCircle2,
  ChevronRight, Sparkles, Network, Eye
} from 'lucide-react';

const phases = [
  {
    number: "01", title: "Awareness & Documentary", subtitle: "The Hero's Journey",
    description: "Launching the documentary using personal recovery data and AI to provide a new look at TBI recovery. Shifting the narrative for proper recognition.",
    color: "from-purple-500 to-violet-600", icon: Video,
    items: ["Problem Awareness & Dissemination", "Radical Vulnerability as Catalyst", "Hero's Journey Documentary Launch"]
  },
  {
    number: "02", title: "Alberta TBI Census", subtitle: "Identifying the Need",
    description: "Mapping Alberta's TBI population to identify service gaps. Researching connections between childhood brain injuries and later-life conditions.",
    color: "from-blue-500 to-cyan-500", icon: FileSearch,
    items: ["Comprehensive TBI Census", "Missing Links Research", "Youth Advocacy Focus"]
  },
  {
    number: "03", title: "Tech Infrastructure", subtitle: "Accountability & Funding",
    description: "Web3 DAC with multi-signature wallets for 100% invoice transparency. AI case management tools and verifiable data systems.",
    color: "from-emerald-500 to-teal-500", icon: Network,
    items: ["WCB AI Case Management", "Transparency Capital Funding", "Verifiable Data & Open Evidence"]
  },
  {
    number: "04", title: "The Healing Hub", subtitle: "Physical Integration",
    description: "Neurofeedback protocols, vision therapy, and forensic audits for holistic recovery. Partnering with Hockey Canada for brain sensor integration.",
    color: "from-orange-500 to-amber-500", icon: HeartPulse,
    items: ["Neurofeedback Arena Integration", "Sane State Protocol", "Vision Therapy & Forensic Audits"]
  }
];

const portals = [
  { icon: Crown, title: "Founders' Brain", desc: "DAO Governance Hub", color: "text-purple-400", route: "/portal/founders" },
  { icon: Brain, title: "Brain Injury Foundation", desc: "TBI Support Hub", color: "text-blue-400", route: "/portal/brain-injury" },
  { icon: Shield, title: "Insurance Portal", desc: "Alberta Compliance", color: "text-green-400", route: "/portal/insurance" },
  { icon: Scale, title: "Legal & Case Mgmt", desc: "Decentralized Law", color: "text-orange-400", route: "/portal/legal" },
  { icon: HeartPulse, title: "Health & Science", desc: "DeSci & Recovery", color: "text-red-400", route: "/portal/health" },
  { icon: Coins, title: "Finance & Rewards", desc: "Tokenomics & Airdrops", color: "text-yellow-400", route: "/portal/finance" },
];

const recoveryGap = {
  current: [
    { label: "Initial Diagnosis", value: '"Minor Concussion"' },
    { label: "Wait Time", value: "555 Days Delay" },
    { label: "Transparency", value: "Opaque / High Admin Costs" },
    { label: "Recovery", value: "Paperwork-Heavy Advocacy" },
  ],
  techx: [
    { label: "Initial Diagnosis", value: "Subdural Hematoma / Blunt Force" },
    { label: "Wait Time", value: "Real-Time AI File Analysis" },
    { label: "Transparency", value: "Multi-Sig Wallets / DAO Voting" },
    { label: "Recovery", value: "Neurofeedback & Vision Therapy" },
  ]
};

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [activePhase, setActivePhase] = useState(0);

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <header className="fixed top-0 w-full z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg font-[Manrope] text-gradient">Tech X Brain</span>
                <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Collective</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Link to="/login"><Button variant="ghost" className="hidden sm:flex">Sign In</Button></Link>
              <Link to="/login">
                <Button className="rounded-full h-11 px-6 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 border-0">
                  Launch App <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Powered by Flare Network</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20">Web3</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 font-[Manrope]">
            <span className="text-gradient-warm">Tech X Brain</span><br />
            <span className="text-foreground">Collective</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
            A decentralized "Healing Hub" leveraging Web3 transparency, AI, and neurofeedback for a phased, accountable TBI recovery roadmap.
          </p>
          <p className="text-sm text-muted-foreground mb-8">Brain Injury Foundation - Alberta Launch</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 border-0 shadow-lg shadow-purple-500/25">
                Enter the Collective <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#roadmap">
              <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-primary/30 hover:bg-primary/5">
                <Eye className="mr-2 w-5 h-5" /> View Roadmap
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {["Flare Network", "Verifiable AI", "Zero-Knowledge Proofs", "Multi-Sig Wallets", "IPFS Storage", "DAO Governance"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border/50 text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-[Manrope]"><span className="text-gradient">Decentralized Portals</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Access specialized modules designed for TBI survivors, their families, and the collective</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {portals.map((portal, idx) => {
              const Icon = portal.icon;
              return (
                <Link key={idx} to="/login">
                  <Card className="card-neon group cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Icon className={`w-6 h-6 ${portal.color}`} />
                      </div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {portal.title}
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{portal.desc}</p></CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-[Manrope]">Recovery Protocol <span className="text-gradient">Roadmap</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A phased, accountable approach to TBI recovery powered by technology</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {phases.map((phase, idx) => (
              <button key={idx} onClick={() => setActivePhase(idx)}
                className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                  activePhase === idx ? 'bg-gradient-to-r ' + phase.color + ' text-white shadow-lg' : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
              >Phase {phase.number}: {phase.title}</button>
            ))}
          </div>
          <div className="max-w-3xl mx-auto">
            <Card className="card-neon">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${phases[activePhase].color} flex items-center justify-center shadow-lg`}>
                    {React.createElement(phases[activePhase].icon, { className: "w-8 h-8 text-white" })}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">PHASE {phases[activePhase].number}</p>
                    <CardTitle className="text-2xl">{phases[activePhase].title}</CardTitle>
                    <p className="text-sm text-primary">{phases[activePhase].subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{phases[activePhase].description}</p>
                <div className="space-y-2 pt-2">
                  {phases[activePhase].items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border/30">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recovery Gap */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-[Manrope]">The Recovery <span className="text-gradient">Gap</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Current System vs Tech X Brain Reality</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-warm border-destructive/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Lock className="w-5 h-5 text-destructive" /></div>
                  <div><CardTitle className="text-lg text-destructive">Current System (WCB)</CardTitle><p className="text-xs text-muted-foreground">Broken & Opaque</p></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recoveryGap.current.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-destructive">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="card-warm border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div>
                  <div><CardTitle className="text-lg text-primary">Tech X Brain Reality</CardTitle><p className="text-xs text-muted-foreground">Transparent & Accountable</p></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recoveryGap.techx.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-primary">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Agents */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-[Manrope]">Decentralized <span className="text-gradient">AI Workforce</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Run multiple Agentic AI agents simultaneously</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Fetch.ai", desc: "Autonomous economic agents", icon: Bot },
              { name: "Heurist.ai", desc: "Advanced query processing", icon: FileSearch },
              { name: "Gaianet.ai", desc: "Privacy-preserving inference", icon: Globe },
              { name: "Baselight.ai", desc: "On-chain verifiable AI", icon: Zap },
              { name: "Zo.computer", desc: "Collaborative AI research", icon: Users },
              { name: "Autonomys Auto-Agent", desc: "Secure agent execution", icon: Shield },
            ].map((agent, idx) => {
              const Icon = agent.icon;
              return (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
                  <div><p className="font-medium text-sm">{agent.name}</p><p className="text-xs text-muted-foreground">{agent.desc}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Documentary */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="card-neon overflow-hidden">
            <div className="p-8 md:p-12 relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center"><Video className="w-6 h-6 text-white" /></div>
                <div><h3 className="text-xl font-bold font-[Manrope]">PicVideo Studio - "Life Show"</h3><p className="text-sm text-muted-foreground">Toronto Documentary Series</p></div>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Educational documentary series integrated directly into the DApp as a verifiable data stream. Using personal recovery data and AI-powered monthly analysis to provide an unprecedented look at TBI recovery.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Live Stream</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Verifiable Data</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">PicVideoStudio.com</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 font-[Manrope]">Join the <span className="text-gradient-warm">Collective</span></h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Be part of a decentralized community revolutionizing TBI recovery.</p>
          <Link to="/login"><Button size="lg" className="rounded-full h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 border-0 shadow-lg shadow-purple-500/25">Enter the Collective <ArrowRight className="ml-2 w-5 h-5" /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center"><Brain className="w-4 h-4 text-white" /></div>
              <div><span className="font-semibold text-gradient">Tech X Brain Collective</span><p className="text-xs text-muted-foreground">Brain Injury Foundation - Alberta</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              {[{ name: "Flare Network", url: "https://flare.network" }, { name: "PicVideo Studio", url: "https://picvideostudio.com" }, { name: "OpenEvidence", url: "https://www.openevidence.com/" }, { name: "Mintology", url: "https://mintology.app" }].map((link) => (
                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link.name}</a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/30 text-center"><p className="text-xs text-muted-foreground">Built on Flare Network - Decentralized, Transparent, Accountable</p></div>
        </div>
      </footer>
    </div>
  );
}
