import { redirect } from 'next/navigation';

/**
 * This page is the single entry point for the root URL ('/').
 * It immediately redirects the user to the '/earn' page.
 * This approach resolves a recurring Vercel build error caused by
 * ambiguous routing between this file and the (main) route group.
 */
export default function RootPage() {
  redirect('/earn');
}
