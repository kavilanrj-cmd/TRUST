/* Trust Impact statistics.
   There is currently no public backend endpoint for aggregate statistics,
   so these values are configurable here. Configure them from real records
   once backend reporting is available. */

const STATS = [
  { value: "2018", label: "Established", note: "Trust founded on 14th November 2018" },
  { value: "100+", label: "Students Supported", note: "Deserving students assisted" },
  { value: "₹X", label: "Scholarship Assistance", note: "Distributed since inception" },
  { value: "100%", label: "Commitment to Education", note: "Focused on student success" },
];

export function TrustImpact() {
  return (
    <section id="impact" aria-label="Trust impact statistics" className="bg-cream">
      <div className="container-trust section-pad">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="card-trust p-7 text-center transition-transform hover:-translate-y-1"
            >
              <p className="font-serif text-4xl font-bold text-navy">{stat.value}</p>
              <p className="mt-2 font-semibold text-gold-600">{stat.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Figures are configurable and updated as the trust publishes verified
          reporting data.
        </p>
      </div>
    </section>
  );
}
