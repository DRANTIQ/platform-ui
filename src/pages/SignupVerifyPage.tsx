import { Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";

export function SignupVerifyPage() {
  const email = sessionStorage.getItem("drantiq_pending_email");

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        email
          ? `We sent a confirmation link to ${email}. After confirming, sign in to create your workspace.`
          : "We sent a confirmation link to your email. After confirming, sign in to continue."
      }
      footer={
        <>
          Confirmed your email?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        Didn&apos;t receive it? Check spam or try signing up again with the same email.
      </p>
    </AuthLayout>
  );
}
