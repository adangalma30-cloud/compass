import { Link } from "react-router-dom";
import Icon from "./Icon";

type AuthPromptProps = {
  title: string;
  message: string;
  onDismiss?: () => void;
  /**
   * When true the prompt is for a signed-in but unverified account, so it
   * offers the verification screen instead of sign-in links the user has
   * already completed.
   */
  needsVerification?: boolean;
};

export default function AuthPrompt({ title, message, onDismiss, needsVerification = false }: AuthPromptProps) {
  return (
    <div className="auth-prompt" role="alert">
      <div className="auth-prompt-icon">
        <Icon name={needsVerification ? "mail" : "user"} size={17} />
      </div>
      <div className="auth-prompt-copy">
        <strong>{title}</strong>
        <span>{message}</span>
        <div className="auth-prompt-actions">
          {needsVerification ? (
            <Link to="/verify-email">Verify email</Link>
          ) : (
            <>
              <Link to="/sign-in">Sign in</Link>
              <Link to="/sign-up">Create account</Link>
            </>
          )}
        </div>
      </div>
      {onDismiss && <button type="button" className="auth-prompt-dismiss" onClick={onDismiss} aria-label="Dismiss">×</button>}
    </div>
  );
}
