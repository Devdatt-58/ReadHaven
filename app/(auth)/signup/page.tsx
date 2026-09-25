'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Account created but sign in failed. Please try logging in.');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (oauthError) {
      console.error('Google sign-in error:', oauthError);
      setError('Unable to start Google sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn('github', { callbackUrl: '/' });
    } catch (oauthError) {
      console.error('GitHub sign-in error:', oauthError);
      setError('Unable to start GitHub sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full rounded-xl border border-[#d9cec3] bg-[#fffdf9] px-4 py-3 text-sm text-[#3c2924] placeholder:text-[#9f8b78] transition focus:border-[#8b6f47] focus:outline-none focus:ring-4 focus:ring-[#cdbca6]/40';

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-3xl border border-[#eadfce] bg-white/95 shadow-[0_24px_64px_-34px_rgba(78,52,46,0.55)] backdrop-blur-sm">
        <div className="h-1.5 bg-gradient-to-r from-[#4e342e] via-[#8b6f47] to-[#b9a78f]" />

        <section className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="mb-7 text-center">
            <Link href="/" className="inline-flex text-3xl font-black tracking-tight text-[#4e342e]">
              ReadHaven
            </Link>
            <p className="mt-2 text-sm text-[#6f5a4a]">Create your account and start tracking your reads.</p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-[#4e342e]">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClasses}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-[#4e342e]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClasses}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-[#4e342e]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${inputClasses} pr-16`}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  aria-label={`${showPassword ? 'Hide' : 'Show'} password`}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-[#6f5a4a] transition hover:text-[#4e342e]"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#4e342e]">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`${inputClasses} pr-16`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  aria-label={`${showConfirmPassword ? 'Hide' : 'Show'} confirm password`}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-[#6f5a4a] transition hover:text-[#4e342e]"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#4e342e] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(78,52,46,0.75)] transition hover:bg-[#3d2924] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e4d8ca]" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6f47]">Or continue with</span>
            <div className="h-px flex-1 bg-[#e4d8ca]" />
          </div>

          <button
            onClick={handleGitHubSignIn}
            disabled={loading}
            className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl border border-[#d9cec3] bg-[#fffdf9] px-4 py-3 text-sm font-semibold text-[#4e342e] transition hover:bg-[#f6f1ea] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.41-4.04-1.41-.54-1.38-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.25 1.84 1.25 1.08 1.84 2.83 1.31 3.52 1 .1-.79.42-1.31.77-1.61-2.67-.31-5.47-1.36-5.47-6.03 0-1.34.47-2.44 1.24-3.3-.13-.31-.54-1.57.12-3.27 0 0 1.01-.33 3.3 1.26a11.4 11.4 0 0 1 6.01 0c2.28-1.59 3.29-1.26 3.29-1.26.66 1.7.25 2.96.12 3.27.77.86 1.24 1.96 1.24 3.3 0 4.69-2.8 5.71-5.49 6.01.43.38.82 1.1.82 2.23v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"
              />
            </svg>
            Continue with GitHub
          </button>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#d9cec3] bg-[#fffdf9] px-4 py-3 text-sm font-semibold text-[#4e342e] transition hover:bg-[#f6f1ea] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M21.35 11.1H12v2.96h5.35c-.24 1.5-1.93 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96s2.63-5.96 5.85-5.96c1.83 0 3.05.78 3.75 1.45l2.56-2.48C16.67 3.98 14.58 3 12 3 6.92 3 2.8 7.16 2.8 12.5S6.92 22 12 22c6.92 0 9.35-4.86 9.35-7.37 0-.5-.05-.9-.12-1.3Z"
              />
              <path
                fill="#34A853"
                d="M3.8 7.84 6.24 9.6a5.99 5.99 0 0 1 0 5.8L3.8 17.16A9.53 9.53 0 0 1 2.8 12.5c0-1.67.38-3.25 1-4.66Z"
              />
              <path
                fill="#FBBC05"
                d="M12 22c2.58 0 4.76-.85 6.34-2.32l-2.9-2.4c-.78.56-1.8.94-3.44.94-2.67 0-4.93-1.82-5.74-4.27L3.8 15.7C5.37 19.42 8.43 22 12 22Z"
              />
              <path
                fill="#EA4335"
                d="M18.34 19.68 15.44 17.3c1.26-.88 2.08-2.22 2.38-3.74H12V11.1h9.35c.1.55.15 1.08.15 1.72 0 2.5-.9 4.9-3.16 6.86Z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-[#6f5a4a]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#4e342e] hover:text-[#2f1f1a]">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
