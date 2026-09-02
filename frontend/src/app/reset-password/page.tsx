import Link from "next/link";

export const metadata = {
  title: "Neelakannu Educational Trust - Reset Password",
  description: "Reset password page for Neelakannu Educational Trust",
};

export default function ResetPasswordPage() {
  return (
    <section className="min-h-screen bg-background">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50 dark:bg-[#0b1020]">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-center mb-4 dark:text-white">
              Reset Password
            </h2>
            <p className="text-muted-foreground text-center">
              Enter your new password
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-slate-300">New Password</label>
              <input
                type="password"
                placeholder="enter new password"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-[#131a2e] dark:text-white dark:border-white/15"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-slate-300">Confirm Password</label>
              <input
                type="password"
                placeholder="confirm password"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-[#131a2e] dark:text-white dark:border-white/15"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Reset Password
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Link expired? 
              <Link href="/forgot-password" className="underline underline-offset-2 font-medium text-primary hover:text-primary-foreground">
                Request new link
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
