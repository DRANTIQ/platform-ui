import {
  AWS_SETUP_DOC_URL,
  cloudFormationTemplateUrl,
  DRANTIQ_HUB_ACCOUNT_ID,
} from "../../lib/awsOnboarding";
import { CopyableValue } from "./CopyableValue";

export function AwsSetupGuide() {
  const templateUrl = cloudFormationTemplateUrl();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold text-slate-900">Set up in your AWS account</h3>
      <p className="mt-1 text-sm text-slate-600">
        Deploy a read-only IAM role in <strong>your</strong> account. You control the External ID and
        can review the template before deploying.
      </p>

      <CopyableValue
        label="Drantiq hub account ID"
        value={DRANTIQ_HUB_ACCOUNT_ID}
        hint="Use this as “Another AWS account” when creating the role, or as DrantiqHubAccountId in the template."
      />

      <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-slate-700">
        <li>
          <strong>Choose an External ID</strong> (min. 8 characters — UUID recommended). You will
          enter the same value in AWS and in the form below.
        </li>
        <li>
          <strong>Deploy the CloudFormation template</strong> in your AWS account (Console, CLI, or
          your IaC pipeline). When prompted, use your External ID and the hub account ID above.
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={templateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              View template
            </a>
            <a
              href={templateUrl}
              download="drantiq-readonly-role.yaml"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Download template
            </a>
          </div>
        </li>
        <li>
          <strong>Copy the Role ARN</strong> from the stack Outputs tab (e.g.{" "}
          <span className="font-mono text-xs">arn:aws:iam::…:role/DrantiqReadOnly</span>).
        </li>
        <li>
          <strong>Paste Role ARN and External ID</strong> below and click Connect.
        </li>
      </ol>

      <p className="mt-4 text-xs text-slate-500">
        Full guide with CLI and manual IAM steps:{" "}
        <a
          href={AWS_SETUP_DOC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 hover:underline"
        >
          AWS account onboarding documentation
        </a>
      </p>
    </div>
  );
}
