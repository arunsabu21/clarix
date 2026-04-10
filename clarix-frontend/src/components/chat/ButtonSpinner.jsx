

function ButtonSpinner() {
  return (
    <svg
      className="btn-spinner"
      viewBox="0 0 50 50"
      fill="none"
      width="18"
      height="18"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="5"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="31.4 94.2"
      />
    </svg>
  );
}

export default ButtonSpinner;
