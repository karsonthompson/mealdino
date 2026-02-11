import { auth } from '@/auth';
import Link from 'next/link';
import ButtonLogin from '@/components/ButtonLogin';
import TopNav from '@/components/TopNav';
import { checkAgentAccess } from '@/lib/agentAccess';
import AgentPageClient from './AgentPageClient';

export default async function AgentPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please log in to use Agent Mode.</p>
          <ButtonLogin session={null} />
        </div>
      </div>
    );
  }

  const access = await checkAgentAccess(session.user.id);
  const hasAgentAccess = access.allowed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800">
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <Link href="/dashboard">
                <h1 className="text-2xl sm:text-3xl font-bold text-green-400 cursor-pointer hover:text-green-300">MealDino</h1>
              </Link>
              <span className="ml-2 text-base sm:text-lg text-gray-300">🦕</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-8 w-full sm:w-auto">
              <TopNav
                hasSession={!!session?.user}
                activeHref="/agent"
                links={[
                  { href: '/recipes', label: 'Recipes' },
                  { href: '/plan', label: 'Plan' },
                  { href: '/shopping', label: 'Shopping' },
                  { href: '/agent', label: 'Agent' },
                  { href: '/dashboard', label: 'Dashboard' }
                ]}
              />
              <div className="hidden sm:flex sm:w-auto justify-center">
                <ButtonLogin session={session} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Agent <span className="text-green-400">Mode</span>
          </h2>
          <p className="text-gray-300 mt-2">
            Conversational planning assistant for meal plans, shopping, and cooking schedules.
          </p>
        </div>

        {!hasAgentAccess ? (
          <section className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl text-white font-semibold mb-2">Agent Mode is part of Pro</h3>
            <p className="text-gray-300 mb-4">{access.reason || 'Active subscription required'}</p>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 font-semibold text-gray-900 hover:bg-green-400"
            >
              Upgrade to Pro
            </Link>
          </section>
        ) : (
          <AgentPageClient />
        )}
      </main>
    </div>
  );
}
