import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Neelakannu Educational Trust - Student Application",
  description: "Student scholarship application form",
};

export default function StudentApplicationPage() {
  return (
    <section className="min-h-screen bg-background">
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-2xl space-y-8">
          {/* Progress indicator */}
          <nav className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
            <div className="flex-1 h-1 rounded-bg primary" aria-hidden="true" />
          </nav>

          {/* Form steps */}
          <form className="space-y-6">
            {/* Section A: Personal Details */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-medium mb-4">A. Personal Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus-primary focus-border-transparent"
                    required
                  >
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section B: Address */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-medium mb-4">B. Address</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address</label>
                  <input
                    type="text"
                    placeholder="Enter your street address"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    placeholder="Enter your city"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">District</label>
                  <input
                    type="text"
                    placeholder="Enter your district"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <select
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  >
                    <option value="">Select state</option>
                    <option>Tamil Nadu</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">PIN Code</label>
                <input
                  type="text"
                  placeholder="Enter PIN code (6 digits)"
                  className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                />
              </div>
            </div>

            {/* Section C: Parent/Guardian Details */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-medium mb-4">C. Parent/Guardian Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Parent/Guardian Name</label>
                  <input
                    type="text"
                    placeholder="Enter parent/guardian name"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Relationship</label>
                  <select
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Guardian</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Occupation</label>
                  <input
                    type="text"
                    placeholder="Enter occupation"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Number</label>
                  <input
                    type="tel"
                    placeholder="Enter contact number"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section D: Academic Details */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-medium mb-4">D. Academic Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">School/College Name</label>
                  <input
                    type="text"
                    placeholder="Enter your school/college name"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Course</label>
                  <input
                    type="text"
                    placeholder="Enter your course"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Education Level</label>
                  <select
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  >
                    <option value="">Select education level</option>
                    <option>High School</option>
                    <option>Undergraduate</option>
                    <option>Postgraduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Academic Year</label>
                  <input
                    type="text"
                    placeholder="Enter academic year"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Year of Study</label>
                <input
                  type="number"
                  placeholder="Enter year of study"
                  className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                  required
                  min={1}
                  max={6}
                />
              </div>
            </div>

            {/* Section E: Financial Details */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-xl font-medium mb-4">E. Financial Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Family Income (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter family income"
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Income Source</label>
                  <select
                    className="w-full px-4 py-3 border rounded-lg focus-ring-2 focus-primary focus-border-transparent"
                    required
                  >
                    <option value="">Select income source</option>
                    <option>Agriculture</option>
                    <option>Private Job</option>
                    <option>Government Job</option>
                    <option>Business</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-6 border-t flex justify-between">
              <button
                type="button"
                className="py-3 px-6 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Continue →
              </button>
            </div>
          </form>

          {/* Progress indicator at bottom */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Application progress: <strong>5 sections complete</strong></p>
          </div>
        </div>
      </div>
    </section>
  );
}