'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

export default function TermsPage() {
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold font-headline">Terms & Conditions</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-destructive font-normal">
            Disclaimer: This is a template and not legal advice. Consult with a legal professional to ensure compliance with all applicable laws and regulations.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p><strong>Last updated:</strong> {lastUpdated || '...'}</p>
          
          <h2 className="font-bold text-foreground pt-2">1. Introduction</h2>
          <p>Welcome to SpinWin Rewards ("App", "we", "us", "our"). By using our App, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use the App.</p>

          <h2 className="font-bold text-foreground pt-2">2. User Accounts</h2>
          <p>You must create an account using Google Sign-In to use the App. You are responsible for maintaining the confidentiality of your account and are fully responsible for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.</p>

          <h2 className="font-bold text-foreground pt-2">3. Earning and Redeeming Points</h2>
          <p>You can earn points by spinning the wheel. Points can be redeemed for rewards as listed in the "Withdraw" section. We reserve the right to change the point values and rewards at any time without notice. Points have no cash value and cannot be transferred.</p>

          <h2 className="font-bold text-foreground pt-2">4. Referral Program</h2>
          <p>You can earn bonus points by referring new users with your unique referral code. The new user will also receive bonus points. You may not refer yourself or create multiple accounts to abuse the referral system. We reserve the right to invalidate points earned through fraudulent means.</p>

          <h2 className="font-bold text-foreground pt-2">5. Prohibited Conduct</h2>
          <p>You agree not to use the App to: (a) violate any local, state, national, or international law; (b) use any automated means (e.g., bots, scripts) to access the App or collect information; (c) interfere with the security or proper working of the App.</p>

          <h2 className="font-bold text-foreground pt-2">6. Termination</h2>
          <p>We may terminate or suspend your account and access to the App at our sole discretion, without prior notice or liability, for any reason, including if you breach these Terms.</p>

          <h2 className="font-bold text-foreground pt-2">7. Disclaimer of Warranties</h2>
          <p>The App is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, that the App will be uninterrupted, error-free, or secure.</p>

          <h2 className="font-bold text-foreground pt-2">8. Limitation of Liability</h2>
          <p>In no event shall SpinWin Rewards be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App.</p>

          <h2 className="font-bold text-foreground pt-2">9. Governing Law</h2>
          <p>These Terms shall be governed by the laws of the jurisdiction in which the App owner resides, without regard to its conflict of law provisions.</p>

          <h2 className="font-bold text-foreground pt-2">10. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms in the App. Your continued use of the App after any such changes constitutes your acceptance of the new Terms.</p>
        </CardContent>
      </Card>
    </div>
  );
}
