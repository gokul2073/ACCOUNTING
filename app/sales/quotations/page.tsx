import { redirect } from 'next/navigation';

export default function SalesQuotationsRedirect() {
  redirect('/sales/orders?tab=quotations');
}
