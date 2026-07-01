import {
  integrationLabel,
  SCAN_FILTER_ALL,
  SCAN_FILTER_AWS,
  SCAN_FILTER_AZURE,
  scopeDisplayLabel,
} from "../../lib/integrationDisplay";
import { useEnvironmentScope } from "../../contexts/EnvironmentScopeContext";

type EnvironmentScopeSelectProps = {
  className?: string;
  compact?: boolean;
};

export function EnvironmentScopeSelect({ className = "", compact = false }: EnvironmentScopeSelectProps) {
  const { scope, setScope, integrations, hasAws, hasAzure, loading } = useEnvironmentScope();

  if (loading || integrations.length === 0) {
    return null;
  }

  if (integrations.length === 1) {
    return (
      <span className={`text-sm text-slate-600 ${className}`}>
        {scopeDisplayLabel(integrations[0].id, integrations)}
      </span>
    );
  }

  return (
    <label className={`flex items-center gap-2 text-sm text-slate-600 ${className}`}>
      {!compact && <span className="font-medium text-slate-500">Environment</span>}
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        className="max-w-[16rem] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 sm:max-w-xs"
        aria-label="Environment scope"
      >
        <option value={SCAN_FILTER_ALL}>{scopeDisplayLabel(SCAN_FILTER_ALL, integrations)}</option>
        {hasAws && <option value={SCAN_FILTER_AWS}>{scopeDisplayLabel(SCAN_FILTER_AWS, integrations)}</option>}
        {hasAzure && (
          <option value={SCAN_FILTER_AZURE}>{scopeDisplayLabel(SCAN_FILTER_AZURE, integrations)}</option>
        )}
        <optgroup label="Accounts">
          {integrations.map((integration) => (
            <option key={integration.id} value={integration.id}>
              {integrationLabel(integration)}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
