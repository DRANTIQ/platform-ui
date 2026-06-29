import type { OnboardingState } from "../types/platform";

export function isOnboardingComplete(state: string | undefined | null): boolean {
  return state === "ONBOARDING_COMPLETE";
}

export function welcomePathForState(state: string | undefined | null): string {
  switch (state as OnboardingState) {
    case "AWS_CONNECTED":
      return "/welcome/scan";
    case "FIRST_SCAN_STARTED":
      return "/welcome/scan";
    case "FIRST_SCAN_COMPLETE":
      return "/welcome/results";
    case "ONBOARDING_COMPLETE":
      return "/";
    case "WORKSPACE_CREATED":
    default:
      return "/welcome";
  }
}
