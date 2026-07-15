'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <h1 className="text-2xl font-bold">Signing you in...</h1>
        <p className="text-muted-foreground">Please wait while we complete the authentication.</p>
      </motion.div>
    </div>
  );
}
