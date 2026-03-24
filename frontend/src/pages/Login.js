import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Brain, Mail, ArrowRight, Loader2, Wallet, Apple, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Supported wallet list
const WalletIcons = () => (
  <div className="flex items-center justify-center gap-1 mt-1">
    <span className="text-[10px] text-muted-foreground">MetaMask</span>
    <span className="text-muted-foreground">•</span>
    <span className="text-[10px] text-muted-foreground">Rainbow</span>
    <span className="text-muted-foreground">•</span>
    <span className="text-[10px] text-muted-foreground">Coinbase</span>
    <span className="text-muted-foreground">•</span>
    <span className="text-[10px] text-muted-foreground">Trust</span>
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle, sendOTP, verifyOTP } = useAuth();
  
  // AppKit hooks for multi-wallet WalletConnect
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const { disconnect } = useDisconnect();
  
  const [isLoading, setIsLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAuthDone, setWalletAuthDone] = useState(false);
  
  // Email flow
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email');
  const [otpCode, setOtpCode] = useState('');

  // Watch for wallet connection and authenticate
  useEffect(() => {
    if (isConnected && address && !walletAuthDone && !walletLoading) {
      authenticateWithWallet(address);
    }
  }, [isConnected, address, walletAuthDone, walletLoading]);

  const authenticateWithWallet = async (walletAddress) => {
    setWalletLoading(true);
    try {
      // Get auth message from backend
      const msgRes = await fetch(`${API_URL}/api/auth/wallet/message?address=${walletAddress}`);
      if (!msgRes.ok) throw new Error('Failed to get auth message');
      
      const { message, nonce } = await msgRes.json();
      
      // Request signature
      let signature;
      if (walletProvider) {
        signature = await walletProvider.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
      } else if (window.ethereum) {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
      } else {
        throw new Error('No wallet provider');
      }
      
      // Verify with backend
      const verifyRes = await fetch(`${API_URL}/api/auth/wallet/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress, message, signature, nonce })
      });
      
      if (!verifyRes.ok) throw new Error('Verification failed');
      
      const data = await verifyRes.json();
      localStorage.setItem('token', data.token);
      setWalletAuthDone(true);
      toast.success('Wallet connected!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Wallet auth error:', error);
      toast.error(error.code === 4001 ? 'Cancelled' : error.message);
      await disconnect();
      setWalletAuthDone(false);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const result = await sendOTP(email);
      setStep('otp');
      toast.success('Code sent!');
      if (result.note) toast.info(result.note);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setIsLoading(true);
    try {
      await verifyOTP(email, otpCode);
      toast.success('Welcome!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = () => {
    open({ view: 'Connect' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-purple-500/5" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold font-[Manrope] block text-gradient">Tech X Brain</span>
              <span className="text-sm text-muted-foreground">Support Portal</span>
            </div>
          </Link>
        </div>

        <Card className="card-warm border-none shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-[Manrope]">Welcome</CardTitle>
            <CardDescription className="text-base">Sign in to manage your WCB claim</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Auth Buttons */}
            <div className="grid gap-3">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-14 rounded-xl text-base font-medium hover:bg-muted/50"
                onClick={() => loginWithGoogle()}
                data-testid="google-login-btn"
              >
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              {/* Apple */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-14 rounded-xl text-base font-medium hover:bg-muted/50"
                onClick={() => toast.info('Apple Sign-In coming soon')}
                data-testid="apple-login-btn"
              >
                <Apple className="w-6 h-6 mr-3" />
                Continue with Apple
              </Button>

              {/* WalletConnect Multi-Wallet */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 rounded-xl text-base font-medium hover:bg-muted/50 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-orange-500/10 border-purple-500/20 hover:border-purple-500/40"
                  onClick={handleWalletConnect}
                  disabled={walletLoading}
                  data-testid="wallet-connect-btn"
                >
                  {walletLoading ? (
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  ) : isConnected ? (
                    <CheckCircle2 className="w-6 h-6 mr-3 text-green-500" />
                  ) : (
                    <Wallet className="w-6 h-6 mr-3 text-purple-500" />
                  )}
                  {walletLoading ? 'Signing...' : isConnected ? 'Connected' : 'Connect Wallet'}
                </Button>
                <WalletIcons />
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Email Flow */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 text-base rounded-xl"
                      data-testid="email-input"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-xl text-base font-medium"
                  disabled={isLoading}
                  data-testid="continue-btn"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="ml-2 w-5 h-5" /></>}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Code sent to <strong>{email}</strong></p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-base">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono rounded-xl"
                    data-testid="otp-input"
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-xl text-base font-medium"
                  disabled={isLoading || otpCode.length !== 6}
                  data-testid="verify-btn"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Sign In <ArrowRight className="ml-2 w-5 h-5" /></>}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('email'); setOtpCode(''); }}>
                  Use different email
                </Button>
              </form>
            )}
          </CardContent>
          
          <CardFooter className="pt-0">
            <p className="text-xs text-center text-muted-foreground w-full">
              By signing in, you agree to our Terms of Service
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Visit our <Link to="/policies" className="text-primary hover:underline">Policy Library</Link>
        </p>
      </div>
    </div>
  );
}
