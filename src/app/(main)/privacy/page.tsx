'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-xl font-bold font-headline">Privacy Policy</h1>
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
          <p>This Privacy Policy describes how SpinWin Rewards ("App", "we", "us", "our") collects, uses, and shares information about you when you use our mobile application. By using the App, you agree to the collection and use of information in accordance with this policy.</p>

          <h2 className="font-bold text-foreground pt-2">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Personal Information:</strong> When you register using Google Sign-In, we collect your name, email address, and profile picture URL as provided by Google. We also collect withdrawal information you provide, such as your full name and mobile number.</li>
            <li><strong>Usage Information:</strong> We collect information about your activity in the App, including points earned, spin history, withdrawal requests, and referral activity.</li>
            <li><strong>Device Information:</strong> We may collect basic information about your device, such as device model and operating system, to help us troubleshoot issues.</li>
          </ul>

          <h2 className="font-bold text-foreground pt-2">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Provide, maintain, and improve the App.</li>
            <li>Manage your account and process your withdrawal requests.</li>
            <li>Communicate with you about your account or our services.</li>
            <li>Monitor and prevent fraudulent activity.</li>
            <li>Personalize your experience within the App.</li>
          </ul>

          <h2 className="font-bold text-foreground pt-2">4. Data Sharing</h2>
          <p>We do not sell or rent your personal information to third parties. We may share your information with third-party service providers only to the extent necessary for them to perform services on our behalf, such as cloud hosting (Firebase). We may also disclose information if required by law.</p>

          <h2 className="font-bold text-foreground pt-2">5. Data Security</h2>
          <p>We use industry-standard security measures, including those provided by Google Firebase, to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>

          <h2 className="font-bold text-foreground pt-2">6. Your Rights</h2>
          <p>You can access and update your profile information within the App. You may also request the deletion of your account and associated data by contacting us. Please note that we may be required to retain certain information for legal or administrative purposes.</p>

          <h2 className="font-bold text-foreground pt-2">7. Children's Privacy</h2>
          <p>Our App is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13.</p>

          <h2 className="font-bold text-foreground pt-2">8. Changes to This Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the App. You are advised to review this Privacy Policy periodically for any changes.</p>
          
          <h2 className="font-bold text-foreground pt-2">9. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us via the "Contact Us" option in the profile section.</p>
        </CardContent>
      </Card>
    </div>
  );
}
