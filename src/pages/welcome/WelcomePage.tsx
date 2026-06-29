import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { welcomeTitle } from "../../lib/awsOnboarding";

export function WelcomePage() {
  const { email, workspaceName } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{welcomeTitle(email, workspaceName)}</h1>
      {workspaceName && (
        <p className="mt-1 text-sm text-slate-500">{workspaceName} workspace</p>
      )}
      <p className="mt-4 text-lg font-medium text-slate-800">
        Secure your AWS account in under 5 minutes.
      </p>
      <p className="mt-2 text-slate-600">
        We&apos;ll connect using read-only access, analyze your environment, and show you exactly
        what to fix first.
      </p>
      <ul className="mt-6 space-y-3 text-sm text-slate-700">
        <li className="flex gap-2">
          <span className="text-emerald-600">✓</span>
          <span>Read-only AWS access — we never modify your resources</span>
        </li>
        <li className="flex gap-2">
          <span className="text-emerald-600">✓</span>
          <span>Identify security risks automatically</span>
        </li>
        <li className="flex gap-2">
          <span className="text-emerald-600">✓</span>
          <span>Prioritized fixes with step-by-step remediation</span>
        </li>
      </ul>
      <button
        type="button"
        onClick={() => navigate("/welcome/connect-aws")}
        className="mt-8 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Get started
      </button>
    </div>
  );
}
