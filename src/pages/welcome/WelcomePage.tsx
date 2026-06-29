import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function WelcomePage() {
  const { workspaceName } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        Welcome to Drantiq{workspaceName ? `, ${workspaceName}` : ""}
      </h1>
      <p className="mt-3 text-slate-600">
        Let&apos;s connect your AWS account and run your first security scan. Most teams finish in
        under 5 minutes.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-slate-600">
        <li>✓ Read-only STS access — we never modify your resources</li>
        <li>✓ 35+ automated CIS AWS controls</li>
        <li>✓ Prioritized fixes ranked by business impact</li>
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
