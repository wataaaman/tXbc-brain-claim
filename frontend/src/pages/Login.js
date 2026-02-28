import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { Brain, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, sendOTP, verifyOTP } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  // OTP form
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(registerEmail, registerName, registerPassword);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await sendOTP(otpEmail);
      setOtpSent(true);
      toast.success('OTP sent to your email');
      if (result.note) {
        toast.info(result.note);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyOTP(otpEmail, otpCode);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1768214399550-c1ea16ce9123?w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold font-[Manrope]">NeuroClaim</span>
          </Link>
        </div>

        <Card className="card-warm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-[Manrope]">Welcome</CardTitle>
            <CardDescription>Sign in to manage your WCB claim</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                <TabsTrigger value="otp" data-testid="otp-tab">Email OTP</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-12"
                        data-testid="login-email-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 h-12"
                        data-testid="login-password-input"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-full text-base"
                    disabled={isLoading}
                    data-testid="login-submit-btn"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Sign In <ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Your full name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-10 h-12"
                        data-testid="register-name-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-10 h-12"
                        data-testid="register-email-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10 h-12"
                        data-testid="register-password-input"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-full text-base"
                    disabled={isLoading}
                    data-testid="register-submit-btn"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Create Account <ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* OTP Tab */}
              <TabsContent value="otp">
                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="otp-email"
                          type="email"
                          placeholder="your@email.com"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          className="pl-10 h-12"
                          data-testid="otp-email-input"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-full text-base"
                      disabled={isLoading}
                      data-testid="send-otp-btn"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Send OTP <ArrowRight className="ml-2 w-5 h-5" /></>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="space-y-2 text-center">
                      <Label>Enter the 6-digit code sent to {otpEmail}</Label>
                      <div className="flex justify-center">
                        <InputOTP 
                          maxLength={6} 
                          value={otpCode}
                          onChange={setOtpCode}
                          data-testid="otp-code-input"
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-full text-base"
                      disabled={isLoading || otpCode.length !== 6}
                      data-testid="verify-otp-btn"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Verify & Sign In <ArrowRight className="ml-2 w-5 h-5" /></>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost"
                      className="w-full"
                      onClick={() => setOtpSent(false)}
                      data-testid="change-email-btn"
                    >
                      Use different email
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-full text-base"
              onClick={handleGoogleLogin}
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to our Terms of Service
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
