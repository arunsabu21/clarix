export default function DeleteAccountModal({
  open,
  onClose,
  deleteInput,
  setDeleteInput,
  deleting,
  deleteError,
  setDeleteError,
  handleDelete,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content delete-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">Delete Account?</h3>
        <p className="modal-desc">
          This action is permanent. Type
          <strong>"delete my account"</strong> to confirm.
        </p>
        <input
          type="text"
          className="profile-edit-input"
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          placeholder="delete my account"
        />

        

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="danger-btn"
            onClick={handleDelete}
            disabled={deleteInput !== "delete my account" || deleting}
          >
            {deleting ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}


