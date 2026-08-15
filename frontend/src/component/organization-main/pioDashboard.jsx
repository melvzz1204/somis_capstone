import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bell,
  CalendarClock,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import API from "../../api/axios";
import LogoutButton from "../logoutButton";
import MobileTabBar from "../mobileTabBar";
import NavCountBadge from "../navCountBadge";

const EMPTY_FORM = {
  title: "",
  content: "",
  category: "General",
  priority: "Normal",
  audience: "All Members",
  status: "Draft",
  publishAt: "",
  expiresAt: "",
  actionLabel: "",
  actionUrl: "",
};

const formatDate = (value) => {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const statusStyle = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Archived: "bg-amber-50 text-amber-800 border-amber-200",
};

export default function PioDashboard({ user: propsUser, org: propsOrg }) {
  const currentUser =
    propsUser || JSON.parse(localStorage.getItem("user") || "null");
  const currentOrg =
    propsOrg ||
    currentUser?.organization ||
    JSON.parse(localStorage.getItem("org") || "null");
  const [activeTab, setActiveTab] = useState("overview");
  const [announcements, setAnnouncements] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [libraryView, setLibraryView] = useState("active");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const orgName = currentOrg?.name || "Student Organization";
  const userName = currentUser?.name || "P.I.O.";
  const orgId = currentOrg?._id || currentOrg?.id || currentOrg;

  useEffect(() => {
    let isActive = true;

    API.get("/announcements?view=manage")
      .then((response) => {
        if (!isActive) return;
        setAnnouncements(response.data || []);
        setError("");
      })
      .catch((err) => {
        if (isActive) {
          setError(err.message || "Unable to load announcements.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [orgId]);

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return announcements.filter((item) => {
      const matchesLibrary =
        libraryView === "archived"
          ? item.status === "Archived"
          : item.status !== "Archived";
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.content, item.category, item.audience].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedQuery),
        );
      return matchesLibrary && matchesStatus && matchesQuery;
    });
  }, [announcements, query, statusFilter, libraryView]);

  const counts = useMemo(
    () =>
      announcements.reduce((result, item) => {
        result[item.status] = (result[item.status] || 0) + 1;
        return result;
      }, {}),
    [announcements],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      content: item.content || "",
      category: item.category || "General",
      priority: item.priority || "Normal",
      audience: item.audience || "All Members",
      status: item.status === "Archived" ? "Draft" : item.status || "Draft",
      publishAt: toDateTimeLocal(item.publishAt),
      expiresAt: toDateTimeLocal(item.expiresAt),
      actionLabel: item.actionLabel || "",
      actionUrl: item.actionUrl || "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const saveAnnouncement = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const payload = {
      ...form,
      publishAt: form.publishAt || null,
      expiresAt: form.expiresAt || null,
    };
    try {
      const response = editing
        ? await API.put(`/announcements/${editing._id}`, payload)
        : await API.post("/announcements", payload);
      const saved = response.data;
      setAnnouncements((current) =>
        editing
          ? current.map((item) => (item._id === saved._id ? saved : item))
          : [saved, ...current],
      );
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || "Unable to save announcement.");
    } finally {
      setIsSaving(false);
    }
  };

  const archiveAnnouncement = async (item) => {
    try {
      const response = await API.put(`/announcements/${item._id}`, {
        status: "Archived",
      });
      setAnnouncements((current) =>
        current.map((entry) =>
          entry._id === item._id ? response.data : entry,
        ),
      );
      setLibraryView("archived");
      setStatusFilter("All");
    } catch (err) {
      setError(err.message || "Unable to archive announcement.");
    }
  };

  const deleteAnnouncement = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`))
      return;
    try {
      await API.delete(`/announcements/${item._id}`);
      setAnnouncements((current) =>
        current.filter((entry) => entry._id !== item._id),
      );
    } catch (err) {
      setError(err.message || "Unable to delete announcement.");
    }
  };

  const activeAnnouncementCount = announcements.filter(
    (item) => item.status !== "Archived",
  ).length;
  const navItems = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    {
      id: "announcements",
      label: "Announcement Library",
      icon: <Bell size={16} />,
      count: activeAnnouncementCount,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-800 flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between bg-[#4A0E17] p-6 text-white">
        <div>
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <img
              src="/logo.png"
              alt="SOMIS logo"
              className="h-9 w-9 object-contain"
            />
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-[#D4AF37]">
                SOMIS
              </p>
              <p className="text-[10px] text-rose-200/70">P.I.O. Portal</p>
            </div>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs font-bold ${activeTab === item.id ? "bg-[#601520] text-[#D4AF37]" : "text-rose-100/75 hover:bg-[#601520] hover:text-white"}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <NavCountBadge count={item.count} />
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="space-y-4 border-t border-white/10 pt-5">
          <div>
            <p className="truncate text-xs font-bold">{userName}</p>
            <p className="truncate text-[10px] text-rose-200/70">
              {currentUser?.email || "No email provided"}
            </p>
          </div>
          <LogoutButton variant="button" showConfirmModal={true} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7A610D]">
                Public Information Officer Workspace
              </p>
              <h1 className="mt-1 text-lg font-extrabold text-[#4A0E17]">
                Welcome back, {userName}
              </h1>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                {orgName} · Publish clear, timely organization updates
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#4A0E17] px-3.5 text-xs font-bold text-white hover:bg-[#601520]"
            >
              <Plus size={16} /> New announcement
            </button>
          </div>
        </header>
        <MobileTabBar
          activeItem={activeTab}
          onChange={setActiveTab}
          items={navItems}
        />

        <main className="mx-auto max-w-6xl space-y-6 p-4 pb-24 sm:p-8 sm:pb-24 md:pb-8">
          {error && (
            <div className="flex items-center justify-between border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={15} />
              </button>
            </div>
          )}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  ["Published", counts.Published || 0, CheckCircle2],
                  ["Scheduled", counts.Scheduled || 0, CalendarClock],
                  ["Drafts", counts.Draft || 0, FileText],
                  ["Archived", counts.Archived || 0, Archive],
                ].map(([label, value, Icon]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <Icon size={18} className="text-[#7A610D]" />
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#4A0E17]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-extrabold text-[#4A0E17]">
                        Recent communications
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Keep members informed about requirements and activities.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("announcements")}
                      className="text-xs font-bold text-[#7A610D]"
                    >
                      View library
                    </button>
                  </div>
                  <div className="mt-5 divide-y divide-slate-100">
                    {announcements.slice(0, 4).map((item) => (
                      <AnnouncementRow
                        key={item._id}
                        item={item}
                        onEdit={openEdit}
                      />
                    ))}
                    {!isLoading && announcements.length === 0 && (
                      <EmptyState onCreate={openCreate} />
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-extrabold text-[#4A0E17]">
                    P.I.O. checklist
                  </h2>
                  <div className="mt-5 space-y-4 text-xs text-slate-600">
                    <p className="flex gap-3">
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-emerald-600"
                      />
                      Publish clearance issuance instructions before the
                      deadline.
                    </p>
                    <p className="flex gap-3">
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-emerald-600"
                      />
                      Use urgent priority only for time-sensitive notices.
                    </p>
                    <p className="flex gap-3">
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-emerald-600"
                      />
                      Add an action link when members must complete a task.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "announcements" && (
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-[#4A0E17]">
                      Announcement library
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Keep current notices separate from archived records.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={`Search ${libraryView === "archived" ? "archive" : "announcements"}`}
                      className="field-control text-xs"
                    />
                    {libraryView === "active" && (
                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(event.target.value)
                        }
                        className="field-control text-xs"
                      >
                        <option>All</option>
                        <option>Draft</option>
                        <option>Scheduled</option>
                        <option>Published</option>
                      </select>
                    )}
                  </div>
                </div>
                <div
                  className="mt-4 inline-flex rounded-lg bg-slate-100 p-1"
                  role="tablist"
                  aria-label="Announcement library status"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={libraryView === "active"}
                    onClick={() => {
                      setLibraryView("active");
                      setStatusFilter("All");
                    }}
                    className={`rounded-md px-4 py-2 text-xs font-black transition-all ${libraryView === "active" ? "bg-white text-[#4A0E17] shadow-sm" : "text-slate-500"}`}
                  >
                    Active{" "}
                    <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                      {announcements.length - (counts.Archived || 0)}
                    </span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={libraryView === "archived"}
                    onClick={() => {
                      setLibraryView("archived");
                      setStatusFilter("All");
                    }}
                    className={`rounded-md px-4 py-2 text-xs font-black transition-all ${libraryView === "archived" ? "bg-white text-[#4A0E17] shadow-sm" : "text-slate-500"}`}
                  >
                    Archive{" "}
                    <span className="ml-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
                      {counts.Archived || 0}
                    </span>
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {isLoading ? (
                  <div className="p-10 text-center text-xs text-slate-500">
                    Loading announcements...
                  </div>
                ) : filteredAnnouncements.length === 0 ? (
                  <EmptyState
                    onCreate={openCreate}
                    archived={libraryView === "archived"}
                  />
                ) : (
                  filteredAnnouncements.map((item) => (
                    <AnnouncementRow
                      key={item._id}
                      item={item}
                      onEdit={openEdit}
                      onArchive={archiveAnnouncement}
                      onDelete={deleteAnnouncement}
                      detailed
                    />
                  ))
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {isModalOpen && (
        <AnnouncementModal
          form={form}
          editing={editing}
          isSaving={isSaving}
          onChange={updateField}
          onClose={() => setIsModalOpen(false)}
          onSubmit={saveAnnouncement}
        />
      )}
    </div>
  );
}

function AnnouncementRow({
  item,
  onEdit,
  onArchive,
  onDelete,
  detailed = false,
}) {
  return (
    <article className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`status-pill border ${statusStyle[item.status] || statusStyle.Draft}`}
          >
            {item.status}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {item.category}
          </span>
          <span className="text-[10px] text-slate-400">{item.audience}</span>
        </div>
        <h3 className="mt-2 truncate text-sm font-extrabold text-slate-800">
          {item.title}
        </h3>
        <p
          className={`mt-1 text-xs leading-relaxed text-slate-500 ${detailed ? "max-w-3xl" : "line-clamp-2"}`}
        >
          {item.content}
        </p>
        <p className="mt-2 text-[10px] text-slate-400">
          {item.status === "Scheduled"
            ? `Publishes ${formatDate(item.publishAt)}`
            : item.status === "Published"
              ? `Published ${formatDate(item.publishedAt)}`
              : `Updated ${formatDate(item.updatedAt)}`}
        </p>
      </div>
      {detailed && (
        <div className="flex shrink-0 items-center gap-2">
          {item.status !== "Archived" && (
            <button
              onClick={() => onEdit(item)}
              className="icon-button"
              title="Edit announcement"
              aria-label="Edit announcement"
            >
              <Pencil size={15} />
            </button>
          )}
          {item.status !== "Archived" && (
            <button
              onClick={() => onArchive(item)}
              className="icon-button"
              title="Archive announcement"
              aria-label="Archive announcement"
            >
              <Archive size={15} />
            </button>
          )}
          <button
            onClick={() => onDelete(item)}
            className="icon-button text-rose-700"
            title="Delete announcement"
            aria-label="Delete announcement"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </article>
  );
}

function EmptyState({ onCreate, archived = false }) {
  return (
    <div className="p-10 text-center">
      <Bell size={24} className="mx-auto text-slate-300" />
      <p className="mt-3 text-xs font-bold text-slate-700">
        {archived ? "Archive is empty" : "No announcements found"}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {archived
          ? "Announcements you archive will be stored here."
          : "Create a notice to keep your organization informed."}
      </p>
      {!archived && (
        <button
          onClick={onCreate}
          className="mt-3 text-xs font-bold text-[#7A610D]"
        >
          Create your first announcement
        </button>
      )}
    </div>
  );
}

function AnnouncementModal({
  form,
  editing,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-base font-extrabold text-[#4A0E17]">
              {editing ? "Edit announcement" : "New announcement"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Write a notice your organization can act on.
            </p>
          </div>
          <button
            onClick={onClose}
            className="icon-button"
            aria-label="Close announcement form"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <div>
            <label className="field-label">Title</label>
            <input
              required
              name="title"
              value={form.title}
              onChange={onChange}
              className="field-control"
              placeholder="e.g. Clearance issuance schedule"
            />
          </div>
          <div>
            <label className="field-label">Message</label>
            <textarea
              required
              name="content"
              value={form.content}
              onChange={onChange}
              className="field-control min-h-32"
              placeholder="Provide the details members need to know."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={onChange}
                className="field-control"
              >
                <option>Clearance Issuance</option>
                <option>General</option>
                <option>Event</option>
                <option>Deadline</option>
                <option>Academic</option>
                <option>Emergency</option>
              </select>
            </div>
            <div>
              <label className="field-label">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={onChange}
                className="field-control"
              >
                <option>Normal</option>
                <option>Important</option>
                <option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="field-label">Audience</label>
              <select
                name="audience"
                value={form.audience}
                onChange={onChange}
                className="field-control"
              >
                <option>All Members</option>
                <option>Officers</option>
                <option>Students</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Publication</label>
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="field-control"
            >
              <option value="Draft">Save as draft</option>
              <option value="Scheduled">Schedule publication</option>
              <option value="Published">Publish now</option>
            </select>
          </div>
          {form.status === "Scheduled" && (
            <div>
              <label className="field-label">Publish at</label>
              <input
                required
                type="datetime-local"
                name="publishAt"
                value={form.publishAt}
                onChange={onChange}
                className="field-control"
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">
                Expires at{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="datetime-local"
                name="expiresAt"
                value={form.expiresAt}
                onChange={onChange}
                className="field-control"
              />
            </div>
            <div>
              <label className="field-label">
                Action URL{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="url"
                name="actionUrl"
                value={form.actionUrl}
                onChange={onChange}
                className="field-control"
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <label className="field-label">
              Action label{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              name="actionLabel"
              value={form.actionLabel}
              onChange={onChange}
              className="field-control"
              placeholder="e.g. View clearance form"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button disabled={isSaving} className="btn-primary">
              <Send size={15} />
              {isSaving
                ? "Saving..."
                : editing
                  ? "Save changes"
                  : "Save announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
