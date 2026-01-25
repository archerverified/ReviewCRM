'use client';

export default function VerifyEmailsPage() {
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Verify Emails</h1>
        <p className="text-gray-600 mt-1">
          Validate and classify email addresses from your leads
        </p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <iframe
          src="https://brainzey.com"
          className="w-full h-full border-0"
          title="Brainzey Email Verification"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
