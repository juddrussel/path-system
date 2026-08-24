import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import {
  Archive,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Layers,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL) ||
  "";

const FIELD_TYPES = [
  "Text Input",
  "Text Area",
  "Date",
  "Dropdown",
  "Number",
  "Checkbox",
  "File Upload",
];
let nextFieldId = 100;

async function apiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* empty response */
  }
  if (!res.ok)
    throw new Error(body?.message || `Request failed (${res.status})`);
  return body;
}

function generateCategoryCode(name, existingCodes) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let letters = words
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (letters.length < 2)
    letters = (name.replace(/[^a-zA-Z]/g, "").toUpperCase() + "XXX").slice(
      0,
      3,
    );
  letters = letters.slice(0, 4) || "CAT";
  let n = 1;
  let candidate;
  do {
    candidate = `${letters}-${String(n).padStart(3, "0")}`;
    n += 1;
  } while (existingCodes.includes(candidate));
  return candidate;
}

const statusTone = (status) =>
  ({
    Active: "active",
    Inactive: "inactive",
    Archived: "archived",
  })[status] || "inactive";

function FormFieldBuilder({ fields, setFields }) {
  const updateField = (id, patch) =>
    setFields((current) =>
      current.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  const addField = () => {
    nextFieldId += 1;
    setFields((current) => [
      ...current,
      {
        id: nextFieldId,
        name: `New field ${current.length + 1}`,
        fieldType: "Text Input",
        required: false,
      },
    ]);
  };
  const addChoice = (field) =>
    updateField(field.id, {
      options: [
        ...(field.options || []),
        `Option ${(field.options || []).length + 1}`,
      ],
    });
  const changeChoice = (field, choiceIndex, value) =>
    updateField(field.id, {
      options: (field.options || []).map((choice, index) =>
        index === choiceIndex ? value : choice,
      ),
    });
  const removeChoice = (field, choiceIndex) =>
    updateField(field.id, {
      options: (field.options || []).filter(
        (_, index) => index !== choiceIndex,
      ),
    });

  return (
    <section className="path-cat-form-fields">
      <div className="path-cat-section-heading">
        <div>
          <span className="path-cat-kicker">Form fields</span>
          <strong>Fields available when users submit this definition</strong>
        </div>
        <button type="button" className="path-cat-ghost" onClick={addField}>
          <Plus size={14} /> Add field
        </button>
      </div>
      {fields.length === 0 && (
        <div className="path-cat-empty-fields">
          No fields yet. Add a field to tailor this submission definition.
        </div>
      )}
      <div className="path-cat-builder-list">
        {fields.map((field, index) => (
          <div className="path-cat-builder-item" key={field.id}>
            <div className="path-cat-field-row">
              <span className="path-cat-order">{index + 1}</span>
              <input
                value={field.name}
                onChange={(event) =>
                  updateField(field.id, { name: event.target.value })
                }
                aria-label={`Field ${index + 1} label`}
              />
              <select
                value={field.fieldType}
                onChange={(event) =>
                  updateField(field.id, {
                    fieldType: event.target.value,
                    ...(event.target.value === "Dropdown" && !field.options
                      ? { options: [] }
                      : {}),
                    ...(event.target.value === "Checkbox" && !field.options
                      ? { options: [], multiSelect: true }
                      : {}),
                  })
                }
                aria-label={`Field ${index + 1} type`}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <label className="path-cat-required">
                <input
                  type="checkbox"
                  checked={Boolean(field.required)}
                  onChange={(event) =>
                    updateField(field.id, { required: event.target.checked })
                  }
                />
                <span>Required</span>
              </label>
              <button
                type="button"
                className="path-cat-icon-btn path-cat-delete-field"
                onClick={() =>
                  setFields((current) =>
                    current.filter((item) => item.id !== field.id),
                  )
                }
                aria-label={`Remove ${field.name || `field ${index + 1}`} `}
              >
                <X size={14} />
              </button>
            </div>
            {(field.fieldType === "Dropdown" ||
              field.fieldType === "Checkbox") && (
              <div className="path-cat-choice-editor">
                <div className="path-cat-choice-header">
                  <span>
                    {field.fieldType === "Dropdown"
                      ? "Dropdown choices"
                      : "Checkbox choices"}
                  </span>
                  {field.fieldType === "Checkbox" && (
                    <button
                      type="button"
                      className="path-cat-select-mode"
                      onClick={() =>
                        updateField(field.id, {
                          multiSelect: field.multiSelect === false,
                        })
                      }
                    >
                      {field.multiSelect === false
                        ? "Single selection"
                        : "Multiple selection"}
                    </button>
                  )}
                </div>
                {(field.options || []).map((option, choiceIndex) => (
                  <div
                    className="path-cat-choice-row"
                    key={`${field.id}-${choiceIndex}`}
                  >
                    <input
                      value={option}
                      onChange={(event) =>
                        changeChoice(field, choiceIndex, event.target.value)
                      }
                      aria-label={`Choice ${choiceIndex + 1}`}
                    />
                    <button
                      type="button"
                      className="path-cat-icon-btn"
                      onClick={() => removeChoice(field, choiceIndex)}
                      aria-label={`Remove choice ${choiceIndex + 1}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="path-cat-choice-add"
                  onClick={() => addChoice(field)}
                >
                  <Plus size={12} /> Add choice
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function DefinitionEditorModal({
  category,
  existingCodes,
  error,
  onClose,
  onSave,
}) {
  const isCreate = !category;
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [type, setType] = useState(category?.type || "Document");
  const [status, setStatus] = useState(
    category?.status === "Archived" ? "Active" : category?.status || "Active",
  );
  const [fields, setFields] = useState(category?.formFields || []);
  const code =
    category?.code ||
    (name.trim() ? generateCategoryCode(name, existingCodes) : "");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const save = () => {
    if (!name.trim()) return;
    const formFields = type === "Document" ? [] : fields;
    onSave({
      ...category,
      id: category?.id || Date.now(),
      name: name.trim(),
      code,
      description: description.trim(),
      type,
      status,
      formFields,
      fields: formFields.length,
      dateCreated:
        category?.dateCreated ||
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    });
  };

  return (
    <div
      className="path-cat-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="path-cat-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="definition-editor-title"
      >
        <header className="path-cat-modal-header">
          <div>
            <span className="path-cat-kicker">Document definitions</span>
            <h2 id="definition-editor-title">
              {isCreate
                ? "Create document definition"
                : "Edit document definition"}
            </h2>
            <p>
              Configure how this definition appears in submissions and workflow
              configuration.
            </p>
          </div>
          <button
            type="button"
            className="path-cat-icon-btn"
            onClick={onClose}
            aria-label="Close editor"
          >
            <X size={18} />
          </button>
        </header>
        <div className="path-cat-modal-body">
          <div className="path-cat-editor-grid">
            <label>
              <span>
                Document name <b>*</b>
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Student Dropping Form"
                autoFocus
              />
            </label>
            <label>
              <span>
                Document code <b>*</b>
              </span>
              <input
                value={code}
                readOnly
                disabled
                placeholder="Generated automatically"
              />
              <small>Generated automatically and remains immutable.</small>
            </label>
          </div>
          <label className="path-cat-editor-wide">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe this document definition."
            />
          </label>
          <div className="path-cat-editor-grid">
            <fieldset>
              <legend>
                Transaction type <b>*</b>
              </legend>
              <div className="path-cat-segmented">
                <button
                  type="button"
                  className={type === "Form" ? "active" : ""}
                  onClick={() => setType("Form")}
                >
                  Form
                </button>
                <button
                  type="button"
                  className={type === "Document" ? "active" : ""}
                  onClick={() => setType("Document")}
                >
                  Document
                </button>
              </div>
            </fieldset>
            <fieldset>
              <legend>Status</legend>
              <div className="path-cat-segmented">
                <button
                  type="button"
                  className={status === "Active" ? "active" : ""}
                  onClick={() => setStatus("Active")}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={status === "Inactive" ? "active" : ""}
                  onClick={() => setStatus("Inactive")}
                >
                  Inactive
                </button>
              </div>
            </fieldset>
          </div>
          {type === "Form" ? (
            <FormFieldBuilder fields={fields} setFields={setFields} />
          ) : (
            <div className="path-cat-document-note">
              <FileText size={17} />
              <div>
                <strong>Document submission definition</strong>
                <p>
                  This definition captures the document as a file. Custom form
                  fields are available when the transaction type is set to Form.
                </p>
              </div>
            </div>
          )}
          {error && <div className="path-cat-error">{error}</div>}
        </div>
        <footer className="path-cat-modal-actions">
          <button type="button" className="path-cat-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="path-cat-primary"
            onClick={save}
            disabled={!name.trim()}
          >
            {isCreate ? "Create definition" : "Save changes"}{" "}
            <CheckCircle2 size={15} />
          </button>
        </footer>
      </section>
    </div>
  );
}

function Metric({ label, value, sub, icon }) {
  return (
    <article className="path-cat-metric">
      <span className="path-cat-metric-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </article>
  );
}

export default function DocumentCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ usedThisMonth: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [editorCategory, setEditorCategory] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch("/api/categories");
      setCategories(data.categories || []);
      setStats(data.stats || { usedThisMonth: 0 });
    } catch (error) {
      setLoadError(error.message || "Failed to load document definitions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);
  useEffect(() => {
    if (
      categories.length &&
      !categories.some((category) => category.id === selectedId)
    )
      setSelectedId(categories[0].id);
  }, [categories, selectedId]);
  useEffect(() => {
    if (location.state?.openAddModal) {
      setIsCreateOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location.state?.editCategoryId != null && categories.length) {
      const target = categories.find(
        (category) =>
          category.id === location.state.editCategoryId ||
          category.name === location.state.editCategoryName,
      );
      if (target) setEditorCategory(target);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, categories, navigate, location.pathname]);

  const selected =
    categories.find((category) => category.id === selectedId) || null;
  const visibleCategories = useMemo(
    () =>
      categories.filter((category) =>
        `${category.name} ${category.code} ${category.description || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [categories, query],
  );
  const total = categories.length;
  const active = categories.filter(
    (category) => category.status === "Active",
  ).length;
  const configuredFields = categories.reduce(
    (sum, category) =>
      sum + (category.formFields?.length ?? category.fields ?? 0),
    0,
  );

  const saveExisting = async (updated) => {
    setActionError(null);
    try {
      const saved = await apiFetch(`/api/categories/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: updated.name,
          description: updated.description,
          type: updated.type,
          status: updated.status,
          formFields: updated.formFields,
        }),
      });
      setCategories((current) =>
        current.map((category) =>
          category.id === saved.id ? saved : category,
        ),
      );
      setEditorCategory(null);
    } catch (error) {
      setActionError(
        error.message || "Unable to save this document definition.",
      );
    }
  };
  const createCategory = async (created) => {
    setActionError(null);
    try {
      const saved = await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: created.name,
          description: created.description,
          type: created.type,
          status: created.status,
          formFields: created.formFields,
        }),
      });
      setCategories((current) => [saved, ...current]);
      setSelectedId(saved.id);
      setIsCreateOpen(false);
    } catch (error) {
      setActionError(
        error.message || "Unable to create this document definition.",
      );
    }
  };
  const archiveCategory = async (category) => {
    setActionError(null);
    try {
      await apiFetch(`/api/categories/${category.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Archived" }),
      });
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, status: "Archived" } : item,
        ),
      );
    } catch (error) {
      setActionError(
        error.message || "Unable to archive this document definition.",
      );
    }
  };
  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`))
      return;
    setActionError(null);
    try {
      await apiFetch(`/api/categories/${category.id}`, { method: "DELETE" });
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
    } catch (error) {
      setActionError(
        error.message || "Unable to delete this document definition.",
      );
    }
  };
  const closeEditor = () => {
    setEditorCategory(null);
    setIsCreateOpen(false);
    setActionError(null);
  };
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="path-cat-app">
      <style>{`${PATH_CATEGORY_CSS}${PATH_CATEGORY_SPACING_CSS}${PATH_CATEGORY_TYPOGRAPHY_CSS}`}</style>
      <Sidebar activePage="document-categories" />
      <main className="path-cat-main">
        <TopBar onLogout={logout} />
        <div className="path-cat-content">
          <section className="path-cat-hero">
            <div>
              <span className="path-cat-live">
                <i /> WORKSPACE TAXONOMY · DYNAMIC CONFIGURATION
              </span>
              <h1>Document definitions</h1>
              <p>
                Manage each document category and document type as one
                definition used across PATH.
              </p>
            </div>
            <button
              type="button"
              className="path-cat-primary"
              onClick={() => {
                setActionError(null);
                setIsCreateOpen(true);
              }}
            >
              <Plus size={16} /> New definition
            </button>
          </section>
          <section className="path-cat-metrics">
            <Metric
              label="Definitions"
              value={total}
              sub="Dynamic submission records"
              icon={<Layers size={18} />}
            />
            <Metric
              label="Active definitions"
              value={active}
              sub="Ready for workflow use"
              icon={<CheckCircle2 size={18} />}
            />
            <Metric
              label="Configured fields"
              value={configuredFields}
              sub="Across all definitions"
              icon={<FileText size={18} />}
            />
            <Metric
              label="Documents covered"
              value={stats.usedThisMonth || 0}
              sub="Submitted this month"
              icon={<BarChart3 size={18} />}
            />
          </section>
          {actionError && !editorCategory && !isCreateOpen && (
            <div className="path-cat-error">
              <span>{actionError}</span>
              <button type="button" onClick={() => setActionError(null)}>
                <X size={14} />
              </button>
            </div>
          )}
          {loadError && (
            <div className="path-cat-error">
              <span>Could not load definitions: {loadError}</span>
              <button
                type="button"
                className="path-cat-retry"
                onClick={loadCategories}
              >
                Retry
              </button>
            </div>
          )}
          <section className="path-cat-layout">
            <aside className="path-cat-library">
              <div className="path-cat-library-heading">
                <div>
                  <span className="path-cat-kicker">Document definitions</span>
                  <h2>Definition library</h2>
                </div>
                <b>{visibleCategories.length}</b>
              </div>
              <div className="path-cat-search">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search definitions"
                  aria-label="Search definitions"
                />
              </div>
              <div className="path-cat-list">
                {loading && (
                  <div className="path-cat-list-state">
                    Loading definitions…
                  </div>
                )}
                {!loading &&
                  visibleCategories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      className={`path-cat-list-item ${selected?.id === category.id ? "active" : ""}`}
                      onClick={() => setSelectedId(category.id)}
                    >
                      <span className="path-cat-list-icon">
                        <BookOpen size={15} />
                      </span>
                      <span>
                        <strong>{category.name}</strong>
                        <small>
                          {category.code} · {category.type} · {category.status}
                        </small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                {!loading && !visibleCategories.length && (
                  <div className="path-cat-list-state">
                    No definitions match your search.
                  </div>
                )}
              </div>
            </aside>
            <article className="path-cat-detail">
              {selected ? (
                <>
                  <header className="path-cat-detail-header">
                    <div>
                      <span className="path-cat-kicker">
                        Selected document definition
                      </span>
                      <h2>{selected.name}</h2>
                      <p>
                        {selected.description ||
                          "No description has been added yet."}
                      </p>
                      <span className="path-cat-code">
                        {selected.code} · {selected.type} ·{" "}
                        <em className={statusTone(selected.status)}>
                          {selected.status}
                        </em>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="path-cat-ghost"
                      onClick={() => {
                        setActionError(null);
                        setEditorCategory(selected);
                      }}
                    >
                      <Pencil size={13} /> Edit definition
                    </button>
                  </header>
                  <div className="path-cat-detail-stats">
                    <div>
                      <span>Documents covered</span>
                      <strong>
                        {selected.usedCount ?? selected.submissions ?? 0}
                      </strong>
                    </div>
                    <div>
                      <span>Workflow state</span>
                      <strong>{selected.status}</strong>
                    </div>
                    <div>
                      <span>Submission mode</span>
                      <strong>{selected.type}</strong>
                    </div>
                  </div>
                  <section className="path-cat-preview-fields">
                    <div className="path-cat-section-heading">
                      <div>
                        <span className="path-cat-kicker">
                          Configured fields
                        </span>
                        <strong>Fields available for this definition</strong>
                      </div>
                      <button
                        type="button"
                        className="path-cat-ghost"
                        onClick={() => {
                          setActionError(null);
                          setEditorCategory(selected);
                        }}
                      >
                        <Pencil size={13} /> Edit fields
                      </button>
                    </div>
                    {selected.type === "Document" ? (
                      <div className="path-cat-empty-fields">
                        This document definition accepts a file submission
                        without custom form fields.
                      </div>
                    ) : (
                      <div className="path-cat-field-chips">
                        {(selected.formFields || []).length ? (
                          selected.formFields.map((field) => (
                            <span key={field.id}>
                              <CheckCircle2 size={13} />{" "}
                              {field.name || "Untitled field"}
                              {field.required ? " · Required" : ""}
                            </span>
                          ))
                        ) : (
                          <div className="path-cat-empty-fields">
                            No form fields have been configured yet.
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                  <div className="path-cat-connected">
                    <ShieldCheck size={17} />
                    <div>
                      <strong>One definition, connected everywhere</strong>
                      <p>
                        This definition is reused by submissions, SLA policies,
                        filters, reporting, and audit history.
                      </p>
                    </div>
                  </div>
                  <footer className="path-cat-detail-actions">
                    <button
                      type="button"
                      className="path-cat-inline-action"
                      onClick={() => setSelectedId(selected.id)}
                    >
                      <Eye size={14} /> Viewing definition
                    </button>
                    {selected.status !== "Archived" && (
                      <button
                        type="button"
                        className="path-cat-inline-action"
                        onClick={() => archiveCategory(selected)}
                      >
                        <Archive size={14} /> Archive
                      </button>
                    )}
                    <button
                      type="button"
                      className="path-cat-inline-danger"
                      onClick={() => deleteCategory(selected)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </footer>
                </>
              ) : (
                <div className="path-cat-detail-empty">
                  <BookOpen size={24} />
                  <strong>Select a definition</strong>
                  <p>
                    Choose a document definition from the library to review its
                    configuration.
                  </p>
                </div>
              )}
            </article>
          </section>
        </div>
      </main>
      {(editorCategory || isCreateOpen) && (
        <DefinitionEditorModal
          category={editorCategory}
          existingCodes={categories.map((category) => category.code)}
          error={actionError}
          onClose={closeEditor}
          onSave={editorCategory ? saveExisting : createCategory}
        />
      )}
    </div>
  );
}

const PATH_CATEGORY_SPACING_CSS = `
.path-cat-content{box-sizing:border-box;width:100%;max-width:1540px;margin:0 auto;padding:38px clamp(34px,4vw,56px) 50px}
@media(max-width:900px){.path-cat-content{padding:30px 30px 42px}}
@media(max-width:640px){.path-cat-content{padding:20px 16px 34px}}
`;

const PATH_CATEGORY_TYPOGRAPHY_CSS = `
.path-cat-app,.path-cat-app button,.path-cat-app input,.path-cat-app textarea,.path-cat-app select{font-family:'DM Sans',sans-serif!important}
.path-cat-app h1,.path-cat-app h2,.path-cat-app h3,.path-cat-app h4,.path-cat-app .path-cat-metric strong,.path-cat-app .path-cat-list-item strong,.path-cat-app .path-cat-detail-stats strong,.path-cat-app .path-cat-detail-empty strong{font-family:'Manrope','DM Sans',sans-serif!important;letter-spacing:-.035em}
`;

const PATH_CATEGORY_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
.path-cat-app{display:flex;min-height:100vh;background:#f8f7ff;color:#2d2840;font-family:'DM Sans',sans-serif;font-size:14px}.path-cat-main{min-width:0;flex:1;display:flex;flex-direction:column;background:#f8f7ff}.path-cat-content{min-height:calc(100vh - 56px);padding:32px;overflow:auto;background:radial-gradient(circle at 94% 0,rgba(196,181,253,.22),transparent 28rem),#f8f7ff}.path-cat-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:8px 0 25px;padding-left:18px;border-left:2px solid #c4b5fd}.path-cat-live,.path-cat-kicker{display:block;color:#8b82a0;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}.path-cat-live{margin-bottom:11px}.path-cat-live i{display:inline-block;width:7px;height:7px;margin-right:8px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 0 4px #ede9fe}.path-cat-hero h1,.path-cat-detail h2,.path-cat-library h2,.path-cat-modal h2{margin:0;color:#2e2942;font-family:'Manrope',sans-serif;letter-spacing:-.045em}.path-cat-hero h1{font-size:31px;line-height:1.12}.path-cat-hero p{margin:9px 0 0;color:#777187;font-size:14px}.path-cat-primary{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:10px;padding:11px 16px;background:#7c3aed;color:#fff;font:700 13px 'DM Sans',sans-serif;box-shadow:0 8px 20px rgba(124,58,237,.22);cursor:pointer;transition:transform .16s ease,background .16s ease}.path-cat-primary:hover{background:#6d28d9;transform:translateY(-1px)}.path-cat-primary:active{transform:scale(.97)}.path-cat-primary:disabled{cursor:not-allowed;background:#c4b5fd;box-shadow:none}.path-cat-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}.path-cat-metric,.path-cat-library,.path-cat-detail{border:1px solid #e6e1ee;background:rgba(255,255,255,.9);box-shadow:0 10px 30px rgba(75,52,105,.045)}.path-cat-metric{position:relative;min-height:123px;padding:18px;border-radius:14px;overflow:hidden}.path-cat-metric:after{position:absolute;right:0;bottom:0;width:62px;height:3px;background:#c4b5fd;content:''}.path-cat-metric-icon{display:grid;width:31px;height:31px;margin-bottom:13px;border-radius:9px;place-items:center;background:#f0ebff;color:#7c3aed}.path-cat-metric>span:not(.path-cat-metric-icon){display:block;color:#827b91;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.path-cat-metric strong{display:block;margin-top:4px;font-family:'Manrope',sans-serif;font-size:25px;letter-spacing:-.04em}.path-cat-metric small{display:block;margin-top:4px;color:#9b95a7;font-size:11px}.path-cat-layout{display:grid;grid-template-columns:minmax(260px,.82fr) minmax(0,1.8fr);gap:19px}.path-cat-library,.path-cat-detail{min-height:535px;border-radius:15px}.path-cat-library{overflow:hidden}.path-cat-library-heading{display:flex;align-items:flex-start;justify-content:space-between;padding:19px 19px 14px;border-bottom:1px solid #eeeaf3}.path-cat-library h2{margin-top:4px;font-size:18px}.path-cat-library-heading b{display:grid;min-width:28px;height:28px;border-radius:9px;place-items:center;background:#f0ebff;color:#7c3aed;font-size:12px}.path-cat-search{display:flex;align-items:center;gap:8px;margin:13px;border:1px solid #e6e0ee;border-radius:9px;padding:9px 10px;background:#faf9fd;color:#9189a2}.path-cat-search input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#393348;font:13px 'DM Sans',sans-serif}.path-cat-list{padding:0 7px 10px}.path-cat-list-item{display:grid;width:100%;grid-template-columns:31px minmax(0,1fr) 16px;align-items:center;gap:9px;border:0;border-radius:10px;padding:10px;background:transparent;color:#8b8498;text-align:left;cursor:pointer;transition:background .16s,color .16s}.path-cat-list-item:hover{background:#faf8ff;color:#6d5a8c}.path-cat-list-item.active{background:linear-gradient(90deg,#ede9fe,#f7f4ff);color:#6d28d9}.path-cat-list-item.active .path-cat-list-icon{background:#7c3aed;color:#fff}.path-cat-list-icon{display:grid;width:29px;height:29px;border-radius:8px;place-items:center;background:#f0ecf8;color:#8b5cf6}.path-cat-list-item strong{display:block;overflow:hidden;color:#40394e;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.path-cat-list-item small{display:block;margin-top:3px;overflow:hidden;color:#938b9f;font-size:10.5px;text-overflow:ellipsis;white-space:nowrap}.path-cat-list-state{padding:30px 16px;color:#8d859b;font-size:12px;text-align:center}.path-cat-detail{padding:25px}.path-cat-detail-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.path-cat-detail h2{margin-top:6px;font-size:24px;line-height:1.2}.path-cat-detail-header p{max-width:610px;margin:8px 0;color:#777186;font-size:13px;line-height:1.55}.path-cat-code{color:#7f778d;font-size:11.5px;font-weight:600}.path-cat-code em{font-style:normal}.path-cat-code em.active{color:#059669}.path-cat-code em.inactive{color:#8a8394}.path-cat-code em.archived{color:#d97706}.path-cat-ghost,.path-cat-inline-action,.path-cat-inline-danger{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid #ded7e8;border-radius:8px;padding:8px 11px;background:#fff;color:#6746a5;font:700 12px 'DM Sans',sans-serif;white-space:nowrap;cursor:pointer;transition:background .16s,border .16s}.path-cat-ghost:hover,.path-cat-inline-action:hover{border-color:#c4b5fd;background:#f7f4ff}.path-cat-detail-stats{display:grid;grid-template-columns:repeat(3,1fr);margin:24px 0;border:1px solid #eeeaf3;border-radius:11px;overflow:hidden}.path-cat-detail-stats>div{padding:14px 16px;border-right:1px solid #eeeaf3}.path-cat-detail-stats>div:last-child{border-right:0}.path-cat-detail-stats span{display:block;color:#91899b;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.path-cat-detail-stats strong{display:block;margin-top:5px;color:#40384d;font-family:'Manrope',sans-serif;font-size:16px}.path-cat-preview-fields{padding:17px;border:1px solid #ece7f2;border-radius:12px;background:#fcfbfe}.path-cat-section-heading{display:flex;align-items:center;justify-content:space-between;gap:16px}.path-cat-section-heading strong{display:block;margin-top:4px;color:#494153;font-size:13px}.path-cat-field-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:15px}.path-cat-field-chips>span{display:inline-flex;align-items:center;gap:5px;border:1px solid #ddd5f2;border-radius:20px;padding:6px 9px;background:#f5f2fe;color:#6347a5;font-size:11.5px;font-weight:600}.path-cat-empty-fields{margin-top:14px;border:1px dashed #ded8e6;border-radius:9px;padding:15px;background:#fff;color:#898193;font-size:12px;text-align:center}.path-cat-connected{display:flex;gap:10px;margin-top:18px;border-left:3px solid #a78bfa;border-radius:7px;padding:11px 13px;background:#f7f4ff}.path-cat-connected svg{margin-top:2px;flex:none;color:#7c3aed}.path-cat-connected strong{color:#514165;font-size:12px}.path-cat-connected p{margin:4px 0 0;color:#827a8f;font-size:11.5px;line-height:1.45}.path-cat-detail-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.path-cat-inline-danger{border-color:#fde1e1;color:#b91c1c}.path-cat-inline-danger:hover{background:#fff6f6}.path-cat-detail-empty{display:grid;min-height:480px;place-content:center;justify-items:center;color:#91899e;text-align:center}.path-cat-detail-empty svg{margin-bottom:10px;color:#a78bfa}.path-cat-detail-empty strong{color:#645b70}.path-cat-detail-empty p{margin:4px 0;font-size:12px}.path-cat-error{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;border:1px solid #fecaca;border-radius:10px;padding:10px 12px;background:#fff6f6;color:#b91c1c;font-size:12px}.path-cat-error button{border:0;background:transparent;color:inherit;cursor:pointer}.path-cat-retry{border:1px solid #f0b9b9!important;border-radius:6px!important;padding:5px 8px!important;background:#fff!important;font-size:11px!important;font-weight:700}.path-cat-modal-backdrop{position:fixed;z-index:2000;inset:0;display:flex;align-items:center;justify-content:center;padding:25px;background:rgba(46,34,64,.38);backdrop-filter:blur(5px)}.path-cat-modal{display:flex;width:min(900px,100%);max-height:calc(100vh - 50px);flex-direction:column;overflow:hidden;border:1px solid #e2ddec;border-radius:16px;background:#fff;box-shadow:0 26px 70px rgba(42,26,62,.25)}.path-cat-modal-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:21px 24px 17px;border-bottom:1px solid #eeeaf3}.path-cat-modal h2{margin-top:5px;font-size:23px}.path-cat-modal-header p{margin:5px 0 0;color:#827a8e;font-size:12.5px}.path-cat-icon-btn{display:inline-grid;width:30px;height:30px;flex:none;border:0;border-radius:8px;place-items:center;background:transparent;color:#90889a;cursor:pointer}.path-cat-icon-btn:hover{background:#f3f0f8;color:#5c486f}.path-cat-modal-body{overflow:auto;padding:21px 24px 24px}.path-cat-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px;margin-bottom:17px}.path-cat-editor-grid label,.path-cat-editor-wide{display:block}.path-cat-editor-grid label>span,.path-cat-editor-wide>span,.path-cat-editor-grid legend{display:block;margin-bottom:6px;color:#594f62;font-size:12px;font-weight:700}.path-cat-editor-grid b{color:#7c3aed}.path-cat-editor-grid input,.path-cat-editor-wide textarea,.path-cat-field-row input,.path-cat-field-row select,.path-cat-choice-row input{box-sizing:border-box;width:100%;border:1px solid #dfd9e8;border-radius:8px;padding:9px 10px;outline:0;background:#fff;color:#393243;font:13px 'DM Sans',sans-serif;transition:border .16s,box-shadow .16s}.path-cat-editor-grid input:focus,.path-cat-editor-wide textarea:focus,.path-cat-field-row input:focus,.path-cat-field-row select:focus,.path-cat-choice-row input:focus{border-color:#a78bfa;box-shadow:0 0 0 3px rgba(167,139,250,.18)}.path-cat-editor-grid input:disabled{background:#f6f4f8;color:#91899b}.path-cat-editor-grid small{display:block;margin-top:5px;color:#9991a2;font-size:10.5px}.path-cat-editor-wide textarea{min-height:76px;resize:vertical}.path-cat-editor-grid fieldset{min-width:0;border:0;padding:0;margin:0}.path-cat-segmented{display:flex;gap:4px;border:1px solid #dfd9e8;border-radius:9px;padding:3px;background:#faf9fc}.path-cat-segmented button{min-width:0;flex:1;border:0;border-radius:6px;padding:7px 8px;background:transparent;color:#847b90;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.path-cat-segmented button.active{background:#7c3aed;color:#fff;box-shadow:0 2px 5px rgba(124,58,237,.2)}.path-cat-form-fields{margin-top:20px;border-top:1px solid #eeeaf3;padding-top:18px}.path-cat-builder-list{display:flex;flex-direction:column;gap:9px;margin-top:13px}.path-cat-builder-item{border:1px solid #e8e3ee;border-radius:10px;padding:9px;background:#fbfaff}.path-cat-field-row{display:grid;grid-template-columns:30px minmax(0,1fr) 154px 92px 30px;align-items:center;gap:8px}.path-cat-order{display:grid;width:25px;height:25px;border-radius:7px;place-items:center;background:#ece8f3;color:#786e86;font-size:11px;font-weight:700}.path-cat-required{display:flex;align-items:center;gap:6px;white-space:nowrap;color:#71687b;font-size:11.5px;font-weight:700}.path-cat-required input{accent-color:#7c3aed}.path-cat-delete-field{color:#b5acbe}.path-cat-choice-editor{margin:9px 0 0 33px;border:1px solid #ded6f1;border-radius:8px;padding:10px;background:#f7f4ff}.path-cat-choice-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;color:#6c50a6;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.path-cat-select-mode,.path-cat-choice-add{display:inline-flex;align-items:center;gap:4px;border:1px solid #cfc3eb;border-radius:6px;padding:4px 7px;background:#fff;color:#6d4dab;font:700 10.5px 'DM Sans',sans-serif;cursor:pointer}.path-cat-choice-row{display:flex;align-items:center;gap:5px;margin-top:5px}.path-cat-choice-row input{padding:6px 8px;font-size:11.5px}.path-cat-choice-add{margin-top:7px}.path-cat-document-note{display:flex;gap:11px;margin-top:20px;border:1px solid #dfd5f1;border-radius:10px;padding:14px;background:#f7f4ff}.path-cat-document-note svg{flex:none;color:#7c3aed}.path-cat-document-note strong{color:#59446e;font-size:12px}.path-cat-document-note p{margin:4px 0 0;color:#82788c;font-size:11.5px;line-height:1.45}.path-cat-modal-actions{display:flex;justify-content:flex-end;gap:9px;border-top:1px solid #eeeaf3;padding:14px 24px;background:rgba(255,255,255,.96)}
@media(max-width:900px){.path-cat-content{padding:24px}.path-cat-metrics{grid-template-columns:repeat(2,1fr)}.path-cat-layout{grid-template-columns:1fr}.path-cat-library{min-height:0}.path-cat-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.path-cat-detail{min-height:0}}
@media(max-width:640px){.path-cat-content{padding:18px 14px}.path-cat-hero{align-items:flex-start;flex-direction:column;margin-top:3px;padding-left:13px}.path-cat-hero h1{font-size:26px}.path-cat-hero p{font-size:12.5px}.path-cat-primary{width:100%}.path-cat-metrics{grid-template-columns:1fr 1fr;gap:9px}.path-cat-metric{min-height:107px;padding:14px}.path-cat-metric strong{font-size:21px}.path-cat-metric small{font-size:10px}.path-cat-list{grid-template-columns:1fr}.path-cat-detail{padding:18px}.path-cat-detail-header{flex-direction:column}.path-cat-ghost{width:100%}.path-cat-detail-stats{grid-template-columns:1fr}.path-cat-detail-stats>div{border-right:0;border-bottom:1px solid #eeeaf3}.path-cat-detail-stats>div:last-child{border-bottom:0}.path-cat-section-heading{align-items:flex-start;flex-direction:column}.path-cat-section-heading .path-cat-ghost{width:auto}.path-cat-detail-actions{flex-wrap:wrap;justify-content:stretch}.path-cat-detail-actions button{flex:1}.path-cat-modal-backdrop{align-items:flex-start;padding:10px}.path-cat-modal{max-height:calc(100vh - 20px);border-radius:13px}.path-cat-modal-header,.path-cat-modal-body{padding-right:16px;padding-left:16px}.path-cat-modal h2{font-size:20px}.path-cat-editor-grid{grid-template-columns:1fr;gap:13px}.path-cat-field-row{grid-template-columns:27px minmax(0,1fr) 28px}.path-cat-field-row select{grid-column:2/4}.path-cat-required{grid-column:1/3}.path-cat-delete-field{grid-column:3;grid-row:1}.path-cat-choice-editor{margin-left:0}.path-cat-modal-actions{padding:12px 16px}.path-cat-modal-actions .path-cat-ghost,.path-cat-modal-actions .path-cat-primary{width:auto;flex:1}}
`;
