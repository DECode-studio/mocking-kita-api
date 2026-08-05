import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SignInView from '@/src/presentation/views/sign-in/SignInView';
import { ROUTES } from '@/src/core/constants/routes';

export default async function SignInPage() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get('mock-api-studio-auth')?.value;

  if (rawSession) {
    try {
      const session = JSON.parse(rawSession) as { token?: string };
      if (session?.token) {
        redirect(ROUTES.DASHBOARD);
      }
    } catch {
      // Fall through to the sign-in screen if the cookie is malformed.
    }
  }

  return <SignInView />;
}
