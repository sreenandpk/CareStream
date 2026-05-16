import { redirect } from 'next/navigation';

export default function Home() {
    // 🛡️ CLINICAL GUARD: Instantly route all traffic to the Authentication Nexus
    redirect('/login');
}
