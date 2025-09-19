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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User just signed in - wait a moment for auth context to update, then redirect
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {defaultView === 'sign_up' ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    brandButtonText: 'white',
                    defaultButtonBackground: 'white',
                    defaultButtonBackgroundHover: '#f3f4f6',
                    defaultButtonBorder: '#e5e7eb',
                    defaultButtonText: '#374151',
                    dividerBackground: '#e5e7eb',
                    inputBackground: 'white',
                    inputBorder: '#e5e7eb',
                    inputBorderHover: '#d1d5db',
                    inputBorderFocus: '#3b82f6',
                    inputText: '#111827',
                    inputLabelText: '#6b7280',
                    inputPlaceholder: '#9ca3af',
                    messageText: '#111827',
                    messageTextDanger: '#ef4444',
                    anchorTextColor: '#3b82f6',
                    anchorTextHoverColor: '#2563eb',
                  },
                  space: {
                    spaceSmall: '0.5rem',
                    spaceMedium: '1rem',
                    spaceLarge: '1.5rem',
                    labelBottomMargin: '0.5rem',
                    anchorBottomMargin: '0.5rem',
                    emailInputSpacing: '0.5rem',
                    socialAuthSpacing: '0.5rem',
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
            providers={['google', 'facebook', 'github']}
            redirectTo={`${window.location.origin}/auth/callback`}
            view={defaultView}
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Password',
                  button_label: 'Sign In',
                  loading_button_label: 'Signing in...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                  confirmation_text: 'Check your email for the confirmation link',
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Password',
                  button_label: 'Sign Up',
                  loading_button_label: 'Creating account...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                  confirmation_text: 'Check your email for the confirmation link',
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

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>By signing up, you agree to our</p>
            <div className="mt-1 space-x-2">
              <a href="/terms" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </a>
              <span>and</span>
              <a href="/privacy" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}