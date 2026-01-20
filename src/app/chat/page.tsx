import { Suspense } from 'react';
import { getSession } from '@/lib/auth-server';
import { ChatClient } from './chat-client';
import { ChatSignInPrompt } from './chat-sign-in-prompt';

// Force dynamic rendering since we need to check authentication
export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const session = await getSession();
  const userEmail = session?.user?.email;

  // Show sign-in prompt if not authenticated
  if (!userEmail) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <ChatSignInPrompt />
      </div>
    );
  }

  // User is authenticated - show the chat interface
  return (
    <Suspense fallback={<div className="container mx-auto max-w-6xl p-6"><p>Loading chat...</p></div>}>
      <ChatClient />
    </Suspense>
  );
}
