import { useNavigate } from "react-router-dom";
import { ConnectAwsForm } from "../../components/integrations/ConnectAwsForm";
import { useAuth } from "../../contexts/AuthContext";
import { updateOnboardingState } from "../../lib/api";

export function ConnectAwsPage() {
  const { authHeaders } = useAuth();
  const navigate = useNavigate();

  async function handleSuccess() {
    await updateOnboardingState(authHeaders, "AWS_CONNECTED");
    navigate("/welcome/scan");
  }

  return (
    <ConnectAwsForm
      authHeaders={authHeaders}
      onSuccess={handleSuccess}
      variant="page"
      showStepLabel
    />
  );
}
