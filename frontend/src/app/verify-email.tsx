import Link from "next/link";

export const metadata = {
  title: "Neelakannu Educational Trust - Verify Email",
  description: "Email verification page for Neelakannu Educational Trust",
};

export default function VerifyEmailPage() {
  return (
    <section className="min-h-screen bg-background">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-center mb-4">
              Email Verification
            </h2>
            <p className="text-muted-foreground text-center">
              A verification link has been sent to your email address
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <p className="text-muted-foreground text-center mb-4">
              Please check your email inbox for the verification message.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              If you did not receive the email, please{" "}
              <Link href="/register" className="underline underline-offset-2 font-medium text-primary hover:text-primary-foreground">
                register again
              </Link>{" "}
              or{" "}
              <Link href="/forgot-password" className="underline underline-offset-2 font-medium text-primary hover:text-primary-foreground">
                request a password reset
              </Link>.
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already verified?{" "}
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