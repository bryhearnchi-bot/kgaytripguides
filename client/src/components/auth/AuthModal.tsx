import React, { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';
import { useLocation } from 'wouter';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'sign_in' | 'sign_up' | 'forgotten_password';
}

export function AuthModal({ isOpen, onClose, defaultView = 'sign_in' }: AuthModalProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in - wait a moment for auth context to update, then redirect
        setTimeout(() => {
          navigate('/admin/trips');
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-[400px] animate-slide-up border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="relative p-6 sm:p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 pr-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {defaultView === 'sign_up' ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {defaultView === 'sign_up'
                ? 'Sign up to access your travel guides'
                : 'Login with your email and password'}
            </p>
          </div>

          {/* Auth Form */}
          <div className="safe-area-inset-bottom">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#ffffff',
                      brandAccent: '#e5e5e5',
                      brandButtonText: '#000000',
                      defaultButtonBackground: '#3a3a3a',
                      defaultButtonBackgroundHover: '#444444',
                      defaultButtonBorder: '#4a4a4a',
                      defaultButtonText: '#ffffff',
                      dividerBackground: '#4a4a4a',
                      inputBackground: '#1a1a1a',
                      inputBorder: '#3a3a3a',
                      inputBorderHover: '#4a4a4a',
                      inputBorderFocus: '#ffffff',
                      inputText: '#ffffff',
                      inputLabelText: '#e5e5e5',
                      inputPlaceholder: '#888888',
                      messageText: '#ffffff',
                      messageTextDanger: '#ef4444',
                      anchorTextColor: '#ffffff',
                      anchorTextHoverColor: '#e5e5e5',
                    },
                    space: {
                      spaceSmall: '0.5rem',
                      spaceMedium: '0.75rem',
                      spaceLarge: '1rem',
                      labelBottomMargin: '0.375rem',
                      anchorBottomMargin: '0.5rem',
                      emailInputSpacing: '0.625rem',
                      socialAuthSpacing: '0.75rem',
                      buttonPadding: '0.75rem 1rem',
                      inputPadding: '0.75rem 1rem',
                    },
                    fontSizes: {
                      baseBodySize: '14px',
                      baseInputSize: '14px',
                      baseLabelSize: '14px',
                      baseButtonSize: '14px',
                    },
                    fonts: {
                      bodyFontFamily: 'system-ui, -apple-system, sans-serif',
                      buttonFontFamily: 'system-ui, -apple-system, sans-serif',
                      inputFontFamily: 'system-ui, -apple-system, sans-serif',
                      labelFontFamily: 'system-ui, -apple-system, sans-serif',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '0.5rem',
                      buttonBorderRadius: '0.5rem',
                      inputBorderRadius: '0.5rem',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button',
                  input: 'auth-input',
                },
              }}
              providers={[]}
              redirectTo={`${window.location.origin}/auth/callback`}
              view={defaultView}
              showLinks={true}
              onlyThirdPartyProviders={false}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                    button_label: 'Sign In',
                    loading_button_label: 'Signing in...',
                    social_provider_text: 'Sign in with {{provider}}',
                    link_text: "Don't have an account? Sign up",
                  },
                  sign_up: {
                    email_label: 'Email',
                    password_label: 'Password',
                    button_label: 'Sign Up',
                    loading_button_label: 'Creating account...',
                    social_provider_text: 'Sign up with {{provider}}',
                    link_text: 'Already have an account? Sign in',
                  },
                  forgotten_password: {
                    email_label: 'Email',
                    button_label: 'Send Reset Instructions',
                    loading_button_label: 'Sending...',
                    link_text: 'Back to sign in',
                    confirmation_text: 'Check your email for the password reset link',
                  },
                },
              }}
            />

            <div className="mt-6 text-center text-xs text-gray-400">
              <p>By signing up, you agree to our</p>
              <div className="mt-1 space-x-2">
                <a href="/terms" className="text-white hover:text-gray-300 underline font-medium">
                  Terms of Service
                </a>
                <span>and</span>
                <a href="/privacy" className="text-white hover:text-gray-300 underline font-medium">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
