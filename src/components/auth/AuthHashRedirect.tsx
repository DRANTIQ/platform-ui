import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { hasAuthHashInUrl } from "../../lib/authRedirect";

/** Send implicit-grant hash fragments to the dedicated callback route. */
export function AuthHashRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAuthHashInUrl() && location.pathname !== "/auth/callback") {
      navigate(`/auth/callback${location.hash}`, { replace: true });
    }
  }, [location.pathname, location.hash, navigate]);

  return null;
}
