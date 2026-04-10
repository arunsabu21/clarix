import "../../styles/Main.css";

function Loader({ text = "" }) {
  return (
    <div className="loader-overlay">
      <div className="loader-container">
        <svg
          className="loader-svg"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="25" cy="25" r="20" stroke="#e0dbd4" strokeWidth="4" />
          <circle
            cx="25"
            cy="25"
            r="20"
            stroke="#1a1a1a"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="31.4 94.2"
          />
        </svg>
        {text && <p className="loader-text">{text}</p>}
      </div>
    </div>
  );
}

export default Loader;
