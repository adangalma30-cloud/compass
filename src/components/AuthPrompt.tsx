import { Link } from "react-router-dom";
import Icon from "./Icon";

type AuthPromptProps = {
  title: string;
  message: string;
  onDismiss?: () => void;
};

export default function AuthPrompt({ title, message, onDismiss }: AuthPromptProps) {
  return (
    <div className="auth-prompt" role="alert">
      <div className="auth-prompt-icon"><Icon name="user" size={17} /></div>
      <div className="auth-prompt-copy">
        <strong>{title}</strong>
        <span>{message}</span>
        <div className="auth-prompt-actions">
          <Link to="/sign-in">Sign in</Link>
          <Link to="/sign-up">Create account</Link>
        </div>
      </div>
      {onDismiss && <button type="button" className="auth-prompt-dismiss" onClick={onDismiss} aria-label="Dismiss">×</button>}
    </div>
  );
}