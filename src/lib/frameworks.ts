import { DEFAULT_FRAMEWORK_ID } from "./config";
import type { ComplianceFramework } from "../types/platform";

/** Show Drantiq assessment plus reference frameworks matching the scan cloud. */
export function frameworksForScanProvider(
  frameworks: ComplianceFramework[],
  provider?: string | null,
): ComplianceFramework[] {
  if (!provider) return frameworks;
  const cloud = provider.toLowerCase();
  return frameworks.filter((fw) => {
    if (fw.framework_id === DEFAULT_FRAMEWORK_ID) return true;
    const fwProvider = (fw.provider ?? "").toLowerCase();
    if (fwProvider === cloud) return true;
    if (fw.framework_id.toLowerCase().includes(cloud)) return true;
    return false;
  });
}

export function defaultFrameworkForProvider(
  frameworks: ComplianceFramework[],
  provider?: string | null,
): string {
  const filtered = frameworksForScanProvider(frameworks, provider);
  const primary = filtered.find((fw) => fw.framework_id === DEFAULT_FRAMEWORK_ID);
  return primary?.framework_id ?? filtered[0]?.framework_id ?? DEFAULT_FRAMEWORK_ID;
}
