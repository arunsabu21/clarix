import { useState, useRef, useEffect } from "react";
import { useProjects } from "../hooks/useProjects";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Message from "../components/common/Alert";
import {
  CirclePlus,
  ChevronDown,
  Search,
  EllipsisVertical,
  Loader2,
  Archive,
  Trash2,
  X,
  Check,
  Folder,
  Briefcase,
  Code2,
  Book,
  Heart,
  Rocket,
  Terminal,
  Camera,
  Music,
  Gamepad2,
  Coffee,
  Plane,
  Dumbbell,
  Shield,
  PenTool,
  GraduationCap,
} from "lucide-react";
import "../styles/Projects.css";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

const SORT_OPTIONS = [
  { label: "Activity", value: "-updated_at" },
  { label: "Name A-Z", value: "name" },
  { label: "Name Z-A", value: "-name" },
  { label: "Newest", value: "-created_at" },
  { label: "Oldest", value: "created_at" },
];

const PROJECT_ICONS = [
  { name: "folder", icon: Folder },
  { name: "briefcase", icon: Briefcase },
  { name: "code", icon: Code2 },
  { name: "book", icon: Book },
  { name: "heart", icon: Heart },
  { name: "rocket", icon: Rocket },
  { name: "terminal", icon: Terminal },
  { name: "camera", icon: Camera },
  { name: "music", icon: Music },
  { name: "game", icon: Gamepad2 },
  { name: "coffee", icon: Coffee },
  { name: "plane", icon: Plane },
  { name: "gym", icon: Dumbbell },
  { name: "security", icon: Shield },
  { name: "design", icon: PenTool },
  { name: "study", icon: GraduationCap },
];

function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder");
  const [color, setColor] = useState("#5c6bca");
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    setLoading(true);
    const result = await onCreate({ name: name.trim(), icon, color });
    if (result.success) {
      onClose();
    } else {
      console.log(result.error);
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="pro-modal-backdrop" onClick={onClose} />
      <div className="pro-modal">
        <div className="pro-modal-header">
          <h2>New project</h2>
          <button className="pro-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="pro-modal-body">
          {err && <div className="pro-modal-error">{err}</div>}
          <div className="pro-modal-field">
            <label>Icon</label>
            <div className="pro-icon-grid">
              {PROJECT_ICONS.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.name}
                    className={`pro-icon-btn ${icon === item.name ? "active" : ""}`}
                    onClick={() => setIcon(item.name)}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="pro-modal-field">
            <label>Color</label>
            <div className="pro-color-picker">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span>{color}</span>
            </div>
          </div>
          <div className="pro-modal-field">
            <label>
              Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              className="pro-modal-input"
              placeholder="e.g. Work, Personal, Research"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="pro-modal-footer">
            <button
              type="button"
              className="pro-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pro-modal-submit"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <CirclePlus size={14} />
              )}
              Create project
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function OptionMenu({ project, onArchive, onDelete, onClose }) {
  return (
    <>
      <div className="pro-options-backdrop" onClick={onClose} />
      <div className="pro-options-menu">
        <button
          className="pro-options-item"
          onClick={() => {
            onArchive(project.id);
            onClose();
          }}
        >
          <Archive size={13} />
          {project.is_archived ? "Unarchive" : "Archive"}
        </button>
        <div className="pro-options-divider" />
        <button
          className="pro-options-item pro-options-item--danger"
          onClick={() => {
            onDelete(project.id);
            onClose();
          }}
        >
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </>
  );
}

function Projects() {

  const {
    projects,
    loading,
    error,
    archived,
    setArchived,
    search,
    setSearch,
    setOrdering,
    createProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
  } = useProjects();

  const [showCreate, setShowCreate] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState("Activity");
  const [openMenuId, setOpenMenuId] = useState(null);

  const handleSort = (opt) => {
    setSortLabel(opt.label);
    setOrdering(opt.value);
    setSortOpen(false);
  };

  return (
    <>
      <Sidebar />
      <div id="#projectMain">
        <div id="project-content">
          {showCreate && (
            <NewProjectModal
              onClose={() => setShowCreate(false)}
              onCreate={createProject}
            />
          )}
          <div className="pro-sticky">
            <header className="pro-header pro-header-items-end pro-header-h">
              <div className="header-content header-content-padding">
                <h1 className="project-heading heading-desktop">
                  <span className="text-flow">Projects</span>
                </h1>
                <div></div>
                <div></div>
                <div className="pro-header-actions">
                  <span className="pro-sort">Sort by</span>
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <button
                      className="pro-btns"
                      onClick={() => setSortOpen(!sortOpen)}
                    >
                      <span className="sort-btn-inner"></span>
                      <span className="sort-btn-text">
                        {sortLabel}
                        <ChevronDown size={16} color="#73726c" />
                      </span>
                    </button>
                    {sortOpen && (
                      <>
                        <div
                          style={{ position: "fixed", inset: "0", zIndex: 10 }}
                          onClick={() => setSortOpen(false)}
                        />
                        <div className="pro-sort-dropdown">
                          {SORT_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              className="pro-sort-option"
                              onClick={() => handleSort(opt)}
                            >
                              {sortLabel === opt.label && (
                                <Check size={12} color="hsl(210 70.9% 51.6%)" />
                              )}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    className="pro-btns"
                    onClick={() => setArchived((v) => !v)}
                    style={{ opacity: archived ? 1 : 0.6 }}
                  >
                    <span className="sort-btn-inner" />
                    <span className="sort-btn-text">
                      <Archive size={14} />
                      {archived ? "Active" : "Archived"}
                    </span>
                  </button>
                  <button
                    className="pro-btns new-pro-btn"
                    onClick={() => setShowCreate(true)}
                  >
                    <CirclePlus size={16} />
                    New project
                  </button>
                </div>
              </div>
            </header>
            <div className="pro-mob-header pro-mob-header-min768 pro-mob-header-min1024">
              <h1 className="project-heading-mob project-heading-mob-min768">
                Projects
              </h1>
              <div role="search" style={{ width: "100%" }}>
                <label htmlFor="sr" className="sr-label">
                  Search your projects
                </label>
                <div className="sr-box">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Search size={16} color="#73726c" />
                  </div>
                  <input
                    id="sr"
                    type="text"
                    className="sr-input"
                    role="searchbox"
                    autoComplete="off"
                    placeholder="Search your projects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {search && (
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                      }}
                      onClick={() => setSearch("")}
                    >
                      <X size={14} color="#73726c" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <main className="pro-main-sec pro-main-sec-min768 pro-main-sec-min1024">
            {error && <div className="pro-error">{error}</div>}

            {loading && (
              <div className="pro-loading">
                <Loader2 size={20} className="spin" />
              </div>
            )}

            {!loading && projects?.length === 0 && (
              <div className="pro-empty">
                <p>{archived ? "No archived projects." : "No projects yet."}</p>
                {!archived && (
                  <button
                    className="pro-btns new-pro-btn"
                    onClick={() => setShowCreate(true)}
                  >
                    <CirclePlus size={15} /> New project
                  </button>
                )}
              </div>
            )}

            {!loading && projects?.length > 0 && (
              <ul
                role="list"
                aria-label="Projects"
                className="pro-ul pro-ul-min768"
              >
                {projects.map((project) => (
                  <li key={project.id} style={{ height: "100%" }}>
                    <div className="pro-card-base">
                      <Link
                        to={`/projects/${project.id}`}
                        className="pro-card"
                        style={{
                          borderLeftColor: project.color,
                          borderLeftWidth: 3,
                        }}
                      >
                        <div className="pro-name">
                          <span
                            style={{
                              marginRight: "8px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {(() => {
                              const found = PROJECT_ICONS.find(
                                (i) => i.name === project.icon,
                              );

                              const Icon = found?.icon || Folder;
                              return <Icon size={18} color={project.color} />;
                            })()}
                          </span>
                          <div className="text-flow pro-name-name">
                            {project.name}
                          </div>
                        </div>
                        <div className="flex-grow pro-desc">
                          {project.description || (
                            <span
                              style={{
                                color: "var(--color-text-muted)",
                                fontStyle: "italic",
                              }}
                            >
                              No description
                            </span>
                          )}
                        </div>
                        <div className="pro-foot-note">
                          <span>
                            {project.conversation_count} conversation
                            {project.conversation_count !== 1 ? "s" : ""}
                          </span>
                          <span>Updated {timeAgo(project.updated_at)}</span>
                        </div>
                      </Link>
                      <div className="pro-options">
                        <span>
                          <button
                            className="pro-option-button"
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenMenuId(
                                openMenuId === project.id ? null : project.id,
                              );
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <EllipsisVertical className="pro-option-icon" />
                            </span>
                          </button>
                          {openMenuId === project.id && (
                            <OptionMenu
                              project={project}
                              onArchive={
                                project.is_archived
                                  ? unarchiveProject
                                  : archiveProject
                              }
                              onDelete={deleteProject}
                              onClose={() => setOpenMenuId(null)}
                            />
                          )}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default Projects;
