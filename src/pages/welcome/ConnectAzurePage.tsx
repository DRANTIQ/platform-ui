import { useNavigate } from "react-router-dom";
import { ConnectAzureForm } from "../../components/integrations/ConnectAzureForm";
import { useAuth } from "../../contexts/AuthContext";
import { updateOnboardingState } from "../../lib/api";

export function ConnectAzurePage() {
  const { authHeaders } = useAuth();
  const navigate = useNavigate();

  async function handleSuccess() {
    await updateOnboardingState(authHeaders, "AZURE_CONNECTED");
    navigate("/welcome/scan");
  }

  return (
    <ConnectAzureForm
      authHeaders={authHeaders}
      onSuccess={handleSuccess}
      variant="page"
      showStepLabel
    />
  );
}
