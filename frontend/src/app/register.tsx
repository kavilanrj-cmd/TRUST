import Link from "next/link";

export const metadata = {
  title: "Neelakannu Educational Trust - Register",
  description: "Register page for Neelakannu Educational Trust",
};

export default function RegisterPage() {
  return (
    <section className="min-h-screen bg-background">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-center mb-4">
              Create Account
            </h2>
            <p className="text-muted-foreground text-center">
              Sign up to apply for scholarships
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                placeholder="enter your full name"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="enter your email"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  placeholder="enter password"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="confirm password"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Create Account
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?
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