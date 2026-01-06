import Link from 'next/link';
import { signIn } from '@/auth';

export default function ButtonLogin({ session }) {
  if (session) {
    return (
      <Link
        href="/dashboard"
        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <form action={async () => {
      "use server"
      await signIn()
    }}>
      <button
        type="submit"
        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        Sign In
      </button>
    </form>
  );
}