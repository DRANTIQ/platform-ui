export function AwsTrustPanel() {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
      <p className="text-sm font-semibold text-emerald-900">🔒 Read-only access</p>
      <ul className="mt-3 space-y-2 text-sm text-emerald-900/80">
        <li>We never modify your AWS environment</li>
        <li>No agents or workloads installed in your account</li>
        <li>Revoke access anytime by deleting the IAM role</li>
      </ul>
    </div>
  );
}
