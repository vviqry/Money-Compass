import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle, authError } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-violet-500/5 dark:bg-violet-500/3 blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/3 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center shadow-xl"
      >
        <img
          src="/logo.png"
          alt="CashFlow Logo"
          className="mx-auto mb-4 h-14 w-14 rounded-2xl object-cover shadow-lg shadow-blue-500/20"
        />
        <h1 className="text-xl font-semibold text-foreground">Money Compass</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Login untuk sinkronkan catatan keuangan lo di semua perangkat.
        </p>

        <Button
          onClick={signInWithGoogle}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-2 shadow-lg shadow-violet-500/20"
        >
          <GoogleIcon className="h-4 w-4" />
          Lanjut dengan Google
        </Button>

        {authError && (
          <p className="mt-3 text-xs text-red-500">{authError}</p>
        )}
      </motion.div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.43 3.58v2.98h3.93c2.3-2.12 3.62-5.24 3.62-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.93-2.98c-1.08.72-2.46 1.16-4 1.16-3.08 0-5.68-2.08-6.62-4.87H1.32v3.06C3.29 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.38 14.4c-.24-.72-.38-1.48-.38-2.4s.14-1.68.38-2.4V6.54H1.32C.48 8.24 0 10.06 0 12s.48 3.76 1.32 5.46l4.06-3.06z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.29 2.7 1.32 6.54l4.06 3.06C6.32 6.85 8.92 4.77 12 4.77z"
      />
    </svg>
  );
}
