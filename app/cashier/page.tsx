import { redirect } from 'next/navigation';

/** Elektra «Ön Kasa» kısayolu — resepsiyon ön kasa merkezine yönlendirir. */
export default function CashierRedirectPage() {
  redirect('/reception?hub=onkasa');
}
