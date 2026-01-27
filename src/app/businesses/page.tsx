// Redirect /businesses to /contacts for backwards compatibility
import { redirect } from 'next/navigation';

export default function BusinessesPage() {
  redirect('/contacts');
}
