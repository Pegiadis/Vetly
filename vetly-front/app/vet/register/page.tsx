import { redirect } from 'next/navigation';

/** Vets no longer register themselves: they ask for a demo and the team creates the account. */
export default function VetRegisterPage() {
  redirect('/for-vets#demo');
}
