import { redirect } from 'next/navigation';

// To resolve a recurring Vercel build error, this page now explicitly
// redirects to the /earn page. This removes routing ambiguity.
export default function MainPage() {
  redirect('/earn');
}
