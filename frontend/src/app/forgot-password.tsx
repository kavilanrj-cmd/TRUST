import Link from "next/link";

export const metadata = {
  title: "Neelakannu Educational Trust - Forgot Password",
  description: "Forgot password page for Neelakannu Educational Trust",
};

export default function ForgotPasswordPage() {
  return (
    <section className="min-h-screen bg-background">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-center mb-4">
              Forgot Password
            </h2>
            <p className="text-muted-foreground text-center">
              Enter your email address to receive a password reset link
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="enter your email"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Send Reset Link
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Remember your password? 
              <Link href="/login" className="underline underline-offset-2 font-medium text-primary hover:text-primary-foreground">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}