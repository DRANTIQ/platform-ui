import { AWS_SETUP_DOC_URL, cloudFormationTemplateUrl } from "../../lib/awsOnboarding";

export function AwsSetupGuide() {
  const templateUrl = cloudFormationTemplateUrl();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold text-slate-900">Set up in your AWS account</h3>
      <p className="mt-1 text-sm text-slate-600">
        Deploy a read-only IAM role in <strong>your</strong> account. You choose the External ID
        and review the template before deploying.
      </p>

      <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-slate-700">
        <li>
          <strong>Get the Drantiq hub account ID</strong> from your Drantiq onboarding contact or
          the{" "}
          <a
            href={AWS_SETUP_DOC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            onboarding guide
          </a>
          . You need it for the IAM trust policy — it is not shown in this form.
        </li>
        <li>
          <strong>Choose an External ID</strong> (min. 8 characters — UUID recommended). Use the
          same value in AWS and in the form below.
        </li>
        <li>
          <strong>Deploy the CloudFormation template</strong> in your AWS account.
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
          <strong>Copy the Role ARN</strong> from the stack Outputs tab.
        </li>
        <li>
          <strong>Enter External ID and Role ARN</strong> below, then connect.
        </li>
      </ol>
    </div>
  );
}
