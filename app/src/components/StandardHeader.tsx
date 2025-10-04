'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LaLillyLogoNew from './LaLillyLogoNew';

interface StandardHeaderProps {
  backUrl?: string;
  backLabel?: string;
  title: string;
  rightElement?: React.ReactNode;
}

export default function StandardHeader({ backUrl, backLabel, title, rightElement }: StandardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {backUrl && (
              <Link
                href={backUrl}
                className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                aria-label={backLabel || "Go back"}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <Link
              href="/"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-md"
              aria-label="La-Lilly homepage"
            >
              <LaLillyLogoNew size="sm" variant="gradient" />
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-600 font-medium">
              {title}
            </div>
            {rightElement}
          </div>
        </div>
      </div>
    </header>
  );
}