'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BENEFITS = [
  'Secure, role-based access for enforcement staff',
  'Every notice recorded with a verifiable ID',
  'Works on any device in the field',
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      if (data.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.role === 'INSPECTOR') {
        router.push('/inspector');
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left / hero panel */}
      <aside className="flex flex-col bg-primary text-primary-on px-6 py-8 md:w-1/2 md:min-h-screen md:px-12 md:py-12 lg:px-16">
        <div className="flex flex-1 flex-col md:justify-center md:pb-16">
          <div className="max-w-md md:mx-auto md:max-w-[448px] md:py-12">
            <div className="mb-6 md:mb-10">
              <Image
                src="/suthra-punjab-logo.png"
                alt="Suthra Punjab"
                width={126}
                height={106}
                className="h-20 w-auto md:h-28"
                priority
              />
            </div>

            <h1 className="text-2xl md:text-[1.75rem] font-semibold leading-tight tracking-normal">
              Welcome to Suthra Punjab e-Challan
            </h1>
            <p className="mt-3 text-body text-primary-on/85">
              Digital warning notices for solid-waste enforcement across Punjab.
            </p>

            <ul className="mt-6 md:mt-8 space-y-3">
              {BENEFITS.map((item) => (
                <li key={item} className="flex gap-3 text-body text-primary-on/90">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary-on"
                    aria-hidden="true"
                    strokeWidth={2.5}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 md:mt-auto pt-6 text-caption text-primary-on/70 max-w-sm">
          Local Government &amp; Community Development Department · Government of the Punjab
        </p>
      </aside>

      {/* Right / form panel */}
      <main className="flex flex-1 flex-col justify-center bg-surface-page px-6 py-10 md:px-12 lg:px-20">
        <div className="w-full max-w-sm mx-auto md:mx-0">
          <h2 className="text-page-title text-ink">Sign in</h2>
          <p className="mt-2 text-body text-ink-secondary">
            Enter your credentials to continue.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-sm bg-danger-subtle border border-danger/20 px-4 py-3 text-body text-danger-text"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-body font-medium text-ink mb-1.5"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-body font-medium text-ink mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-ink-tertiary hover:text-ink-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? 'Signing in\u2026' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-caption text-ink-tertiary">
            Access is limited to authorized personnel
          </p>
        </div>
      </main>
    </div>
  );
}
