import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useTheme } from '../context/ThemeContext';
import { 
  Brain, 
  FileText, 
  Shield, 
  MessageSquare, 
  ArrowRight,
  BookOpen,
  Upload,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Policy Library',
    description: 'Easy access to all WCB policies for TBI claims, including Group 1 and Group 2 classifications.'
  },
  {
    icon: FileText,
    title: 'Letter Generator',
    description: 'Create professional letters to WCB with proper policy citations and formatting.'
  },
  {
    icon: Upload,
    title: 'Evidence Manager',
    description: 'Securely store and organize your claim evidence with decentralized storage.'
  },
  {
    icon: MessageSquare,
    title: 'AI Assistant',
    description: 'Get answers to your WCB questions and help drafting letters with AI support.'
  }
];

const benefits = [
  'Understand your TBI classification (Group 1 or Group 2)',
  'Track your claim timeline and important dates',
  'Generate request letters for your complete claim file',
  'Store evidence securely with IPFS technology',
  'Get AI-powered guidance on WCB policies'
];

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [showVideoAsk, setShowVideoAsk] = useState(false);

  useEffect(() => {
    // Show VideoAsk widget after a short delay
    const timer = setTimeout(() => setShowVideoAsk(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg font-[Manrope]">NeuroClaim Support</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
                data-testid="landing-theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Link to="/login">
                <Button variant="ghost" data-testid="login-nav-btn">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button className="rounded-full h-11 px-6" data-testid="get-started-btn">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Supporting Injured Workers in Alberta</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 font-[Manrope]">
            Navigate Your WCB Claim with <span className="text-primary">Confidence</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            A supportive platform designed for workers with traumatic brain injuries. 
            Understand your rights, manage your claim, and get the benefits you deserve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg" data-testid="hero-get-started">
                Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg" data-testid="learn-more-btn">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* TBI Information Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 font-[Manrope]">
              Understanding TBI Classifications
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Alberta WCB classifies traumatic brain injuries into two groups under Policy 03 01 PART I
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-warm">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <CardTitle className="text-xl">Group 1 - Mild TBI</CardTitle>
                <CardDescription>Minor concussion type injuries</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    Brief loss of consciousness (less than 30 minutes)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    Transient confusion
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    Symptoms that resolve quickly
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="card-warm">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-orange-600">2</span>
                </div>
                <CardTitle className="text-xl">Group 2 - Moderate/Severe TBI</CardTitle>
                <CardDescription>More serious brain injuries</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    Longer loss of consciousness (30+ minutes)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    Persistent neurological deficits
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    Imaging confirmed intracranial pathology
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 font-[Manrope]">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tools designed with cognitive accessibility in mind
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="card-warm text-center">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 font-[Manrope]">
              How We Help You
            </h2>
          </div>
          <div className="grid gap-4">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border/50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 font-[Manrope]">
            Ready to Take Control of Your Claim?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join other injured workers who are using NeuroClaim Support to navigate the WCB process.
          </p>
          <Link to="/login">
            <Button size="lg" className="rounded-full h-14 px-8 text-lg" data-testid="cta-get-started">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">NeuroClaim Support</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Supporting injured workers with traumatic brain injuries in Alberta.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.openevidence.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                OpenEvidence
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* VideoAsk Widget */}
      {showVideoAsk && (
        <div className="fixed bottom-6 right-6 z-50" data-testid="videoask-container">
          {/* VideoAsk Embed - Replace YOUR_VIDEOASK_ID with actual ID */}
          <div className="relative">
            <a 
              href="https://www.videoask.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-600 shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              data-testid="videoask-widget"
            >
              <MessageSquare className="w-7 h-7 text-white" />
            </a>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Video Help</p>
        </div>
      )}
    </div>
  );
}
