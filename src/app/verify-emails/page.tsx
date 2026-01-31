'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';

export default function VerifyEmailsPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : 'h-[calc(100vh-2rem)]'}`}>
      {/* Header */}
      <div className="relative overflow-hidden bg-clay-800 rounded-lg p-6 text-white mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-clay-900/50 to-clay-700/30" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-clay-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-clay-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Verify Emails</h1>
                <p className="text-white/70 text-sm mt-0.5">
                  Validate and classify email addresses with Brainzey
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLoading(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all duration-200 text-sm font-medium"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
              <a
                href="https://brainzey.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-clay-800 rounded-lg hover:bg-clay-50 transition-all duration-200 shadow-lg shadow-black/20 text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <CheckCircle className="w-4 h-4 text-status-green-dot" />
                Good
              </div>
              <div className="text-2xl font-bold mt-1">Deliverable</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <AlertTriangle className="w-4 h-4 text-status-yellow-dot" />
                Risky
              </div>
              <div className="text-2xl font-bold mt-1">Catch-All</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <XCircle className="w-4 h-4 text-status-red-dot" />
                Bad
              </div>
              <div className="text-2xl font-bold mt-1">Invalid</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <HelpCircle className="w-4 h-4 text-clay-400" />
                Unknown
              </div>
              <div className="text-2xl font-bold mt-1">Unverified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 bg-white rounded-xl border border-clay-200 overflow-hidden shadow-sm relative">
        {isLoading && (
          <div className="absolute inset-0 bg-clay-50 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-clay-200 border-t-clay-600 rounded-full animate-spin" />
              <p className="text-clay-500 text-sm">Loading Brainzey...</p>
            </div>
          </div>
        )}
        <iframe
          src="https://brainzey.com"
          className="w-full h-full border-0"
          title="Brainzey Email Verification"
          allow="clipboard-read; clipboard-write"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
