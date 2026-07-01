import { AZURE_SETUP_DOC_URL, armTemplateUrl } from "../../lib/azureOnboarding";

export function AzureSetupGuide() {
  const templateUrl = armTemplateUrl();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold text-slate-900">Set up in your Azure subscription</h3>
      <p className="mt-1 text-sm text-slate-600">
        Create a read-only service principal in <strong>your</strong> tenant, grant Reader on the
        subscription, then register the credentials below.
      </p>

      <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-slate-700">
        <li>
          <strong>Register an app</strong> in Microsoft Entra ID → App registrations → New
          registration. Note the <strong>Application (client) ID</strong> and{" "}
          <strong>Directory (tenant) ID</strong>.
        </li>
        <li>
          <strong>Create a client secret</strong> under Certificates &amp; secrets. Copy it now —
          you will enter it once in Drantiq.
        </li>
        <li>
          <strong>Assign Reader on the subscription</strong> using our ARM template or manually in
          Portal → Subscription → Access control (IAM).
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={templateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              View ARM template
            </a>
            <a
              href={templateUrl}
              download="drantiq-readonly-sp.json"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Download template
            </a>
          </div>
        </li>
        <li>
          <strong>Copy your subscription ID</strong> from Azure Portal → Subscriptions.
        </li>
        <li>
          See the full{" "}
          <a
            href={AZURE_SETUP_DOC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            Azure onboarding guide
          </a>{" "}
          for screenshots and verification steps.
        </li>
      </ol>
    </div>
  );
}
