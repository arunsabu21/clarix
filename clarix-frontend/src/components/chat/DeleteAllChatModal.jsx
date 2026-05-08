import { Loader2 } from "lucide-react";

export default function DeleteAllChatPopUp({
  open,
  title,
  description,
  confirmText = "Delete",
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">{title}</h3>

          {description && <p className="modal-desc">{description}</p>}

          <div className="modal-actions">
            <button className="delete-all-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="delete-all-btn modal-btn--danger"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className="spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
