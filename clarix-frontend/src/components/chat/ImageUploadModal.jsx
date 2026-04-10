import { useRef, useState } from "react";
import { X, Image, Camera } from "lucide-react";
import "../../styles/Chat.css";

function ImageUploadModal({ onClose, onSelect }) {
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState("upload");
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview({ url: URL.createObjectURL(file), file });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setPreview({ url: URL.createObjectURL(file), file });
  };

  const handleConfirm = () => {
    if (preview) {
      onSelect(preview);
      onClose();
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="upload-modal">
        {/* Header */}
        <div className="modal-header">
          <span>Upload Image</span>
          <button className="modal-close" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {mode === "upload" ? (
            preview ? (
              <div className="preview-wrapper">
                <img src={preview.url} alt="preview" className="preview-img" />
                <button
                  className="preview-remove"
                  onClick={() => setPreview(null)}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="dropzone-icon">
                  <Image size={20} color="#888" />
                </div>
                <p className="dropzone-title">Click to upload</p>
                <p className="dropzone-sub">or drag and drop</p>
                <p className="dropzone-hint">PNG, JPG, WEBP up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFile}
                />
              </div>
            )
          ) : (
            <div className="dropzone">
              <div className="dropzone-icon">
                <Camera size={20} color="#888" />
              </div>
              <p className="dropzone-title">Camera coming soon</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {/* Mode toggle */}
          <div className="mode-toggle">
            {[
              { id: "upload", icon: <Image size={13} />, label: "Upload" },
              { id: "camera", icon: <Camera size={13} />, label: "Camera" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`mode-btn ${mode === m.id ? "active" : ""}`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!preview}
            className={`attach-btn ${preview ? "ready" : ""}`}
          >
            Attach
          </button>
        </div>
      </div>
    </>
  );
}

export default ImageUploadModal;
