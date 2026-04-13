import CheckIcon from "../icons/CheckIcon";
function AuthSuccess({ email }) {
  return (
    <div className="login-success">
      <div className="success-box">
        <div className="success-icon">
          <CheckIcon />
        </div>

        <h3>Authentication successful</h3>

        <p className="success-email">{email}</p>

        <small className="success-sub">You will be redirected shortly...</small>
      </div>
    </div>
  );
}

export default AuthSuccess;
