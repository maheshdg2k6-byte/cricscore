import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Phone, Mail } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
const phoneSchema = z.string().min(10, 'Please enter a valid phone number').max(15);

type AuthMode = 'email' | 'phone';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithPhone, signUpWithPhone } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (forgotPassword) {
      try { emailSchema.parse(formData.email); } catch (e) {
        if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    if (authMode === 'email') {
      try { emailSchema.parse(formData.email); } catch (e) {
        if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
      }
    } else {
      try { phoneSchema.parse(formData.phone); } catch (e) {
        if (e instanceof z.ZodError) newErrors.phone = e.errors[0].message;
      }
    }
    try { passwordSchema.parse(formData.password); } catch (e) {
      if (e instanceof z.ZodError) newErrors.password = e.errors[0].message;
    }
    if (isSignUp) {
      try { nameSchema.parse(formData.fullName); } catch (e) {
        if (e instanceof z.ZodError) newErrors.fullName = e.errors[0].message;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    toast({ title: 'Reset email sent', description: 'Check your inbox for the password reset link.' });
    setForgotPassword(false);
  };

  const handleEmailSubmit = async () => {
    if (isSignUp) {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      if (error) {
        if (error.message.includes('already registered')) {
          toast({ title: 'Account exists', description: 'This email is already registered. Please sign in.', variant: 'destructive' });
        } else throw error;
      } else {
        toast({ title: 'Check your email', description: 'We sent you a verification link. Please verify your email before signing in.' });
      }
    } else {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({ title: 'Invalid credentials', description: 'Please check your email and password.', variant: 'destructive' });
        } else if (error.message.includes('Email not confirmed')) {
          toast({ title: 'Email not verified', description: 'Please check your email and verify your account first.', variant: 'destructive' });
        } else throw error;
      } else {
        navigate('/');
      }
    }
  };

  const handlePhoneSubmit = async () => {
    if (isSignUp) {
      const { error } = await signUpWithPhone(formData.phone, formData.password, formData.fullName);
      if (error) {
        if (error.message.includes('already registered')) {
          toast({ title: 'Account exists', description: 'This phone number is already registered. Please sign in.', variant: 'destructive' });
        } else throw error;
      } else {
        toast({ title: 'Account created!', description: 'You can now sign in with your phone number and password.' });
        setIsSignUp(false);
      }
    } else {
      const { error } = await signInWithPhone(formData.phone, formData.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({ title: 'Invalid credentials', description: 'Please check your phone number and password.', variant: 'destructive' });
        } else throw error;
      } else {
        toast({ title: 'Welcome!', description: 'Signed in successfully.' });
        navigate('/');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (forgotPassword) {
        await handleForgotPassword();
      } else if (authMode === 'email') {
        await handleEmailSubmit();
      } else {
        await handlePhoneSubmit();
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: 'Error', description: err.message || 'Something went wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
          <span className="text-4xl">🏏</span>
        </motion.div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Cricket Scorer</h1>
        <p className="text-muted-foreground text-center mb-8">Score matches, track stats, manage teams</p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-xl border border-border">
          {forgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-center mb-2">Reset Password</h2>
              <p className="text-sm text-muted-foreground text-center">Enter your email to receive a reset link.</p>
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input id="resetEmail" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={errors.email ? 'border-destructive' : ''} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Reset Link
              </Button>
              <button type="button" onClick={() => setForgotPassword(false)} className="w-full text-sm text-primary hover:underline">Back to Sign In</button>
            </form>
          ) : (
            <>
              {/* Auth Mode Toggle */}
              <div className="flex mb-6 bg-secondary rounded-xl p-1">
                <button type="button" onClick={() => { setAuthMode('email'); setErrors({}); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${authMode === 'email' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  <Mail className="w-4 h-4" /> Email
                </button>
                <button type="button" onClick={() => { setAuthMode('phone'); setErrors({}); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${authMode === 'phone' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  <Phone className="w-4 h-4" /> Phone
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" type="text" placeholder="Your name" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={errors.fullName ? 'border-destructive' : ''} />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                  </div>
                )}

                {authMode === 'phone' ? (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+91 9876543210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={errors.phone ? 'border-destructive' : ''} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    <p className="text-xs text-muted-foreground">Include country code (e.g., +91)</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={errors.email ? 'border-destructive' : ''} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={errors.password ? 'border-destructive' : ''} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>

                <div className="text-center">
                  <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }} className="text-sm text-primary hover:underline">
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                  </button>
                </div>

                {!isSignUp && authMode === 'email' && (
                  <button type="button" onClick={() => setForgotPassword(true)} className="w-full text-sm text-muted-foreground hover:text-foreground hover:underline">
                    Forgot password?
                  </button>
                )}

                {authMode === 'email' && (
                  <>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 mb-2">
                      ⚠️ <strong>APK users:</strong> Do not use "Continue with Google" — it may not work in the app. Please use Email or Phone Number to sign in.
                    </div>
                    <Button type="button" variant="outline" className="w-full h-12 text-base" onClick={async () => {
                      const { error } = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
                      if (error) toast({ title: 'Error', description: 'Failed to sign in with Google.', variant: 'destructive' });
                    }}>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </Button>
                  </>
                )}
              </form>
            </>
          )}
        </motion.div>

        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} onClick={() => navigate('/')} className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Continue as Guest →
        </motion.button>
      </motion.div>
    </div>
  );
};

export default AuthPage;
