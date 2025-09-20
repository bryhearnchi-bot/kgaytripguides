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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-auto mobile-card animate-slide-up">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          {/* Mobile handle for iOS-style sheet */}
          <div className="sm:hidden absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <h2 className="mobile-heading-2 mt-4 sm:mt-0">
            {defaultView === 'sign_up' ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors touch-target mobile-focus"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 safe-area-inset-bottom">
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
                    spaceSmall: '0.75rem',
                    spaceMedium: '1.25rem',
                    spaceLarge: '1.75rem',
                    labelBottomMargin: '0.5rem',
                    anchorBottomMargin: '0.75rem',
                    emailInputSpacing: '0.75rem',
                    socialAuthSpacing: '1rem',
                    buttonPadding: '1rem 1.25rem',
                    inputPadding: '1rem 1.25rem',
                  },
                  fontSizes: {
                    baseBodySize: '16px',
                    baseInputSize: '16px',
                    baseLabelSize: '16px',
                    baseButtonSize: '16px',
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