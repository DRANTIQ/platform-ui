import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { hasAuthHashInUrl, isPasswordRecoveryHash } from "../../lib/authRedirect";

/** Send implicit-grant hash fragments to the dedicated callback route. */
export function AuthHashRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasAuthHashInUrl()) return;
    if (isPasswordRecoveryHash()) {
      if (location.pathname !== "/reset-password") {
        navigate(`/reset-password${location.hash}`, { replace: true });
      }
      return;
    }
    if (location.pathname !== "/auth/callback") {
      navigate(`/auth/callback${location.hash}`, { replace: true });
    }
  }, [location.pathname, location.hash, navigate]);

  return null;
}
