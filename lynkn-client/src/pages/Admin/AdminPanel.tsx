import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Check,
  Eye,
  EyeOff,
  FileText,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { TabPanel, TabView } from "primereact/tabview";
import { Tag } from "primereact/tag";
import api from "../../api/axiosConfig";
import { categoryService, getCategoryLabel } from "../../services/categoryService";
import type { EventCategory } from "../../types/category";
import "primereact/resources/themes/lara-dark-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./AdminPanel.css";

type VerificationStatus = "approved" | "pending" | "rejected" | "unverified";
type UserRole = "admin" | "user";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  status_verif: VerificationStatus;
  foto_perfil?: string;
  selfie_real_time?: string;
  bio?: string;
  verif_message?: string;
  created_at?: string;
}

interface AdminPost {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  category?: string;
  status?: string;
  is_visible?: boolean;
  moderation_status?: string;
  current_particip?: number;
  max_particip?: number;
  event_date?: string;
  users?: {
    username?: string;
    foto_perfil?: string;
    email?: string;
  };
}

interface DashboardData {
  totals: {
    users: number;
    admins: number;
    posts: number;
    visiblePosts: number;
    hiddenPosts: number;
    pendingVerifications: number;
    approvedUsers: number;
    rejectedUsers: number;
    participations: number;
    acceptedParticipations: number;
    pendingParticipations: number;
    messages: number;
    unreadNotifications: number;
    reports: number;
    reportedPosts: number;
  };
  userStatus: Record<string, number>;
  postVisibility: Record<string, number>;
  participationStatus: Record<string, number>;
  topPosts: AdminPost[];
  recentUsers: AdminUser[];
  recentPosts: AdminPost[];
  recentActivity: {
    id: string;
    type: "user" | "post" | "message" | "notification" | "report";
    title: string;
    detail: string;
    created_at?: string;
  }[];
}

interface AdminReport {
  id: number;
  post_id: number;
  reporter_id: number;
  reason?: string;
  created_at?: string;
  posts?: {
    id: number;
    title?: string;
    image_url?: string;
    report_count?: number;
    is_visible?: boolean;
    users?: {
      username?: string;
    };
  };
  users?: {
    username?: string;
    email?: string;
    foto_perfil?: string;
  };
}

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?seed=LYNKN";
const QUICK_RESPONSES = [
  "admin_dashboard.quick_notes.face_not_clear",
  "admin_dashboard.quick_notes.selfie_mismatch",
  "admin_dashboard.quick_notes.blurry_image",
  "admin_dashboard.quick_notes.close_face",
  "admin_dashboard.quick_notes.inappropriate",
];

const statusSeverity = (status?: string) => {
  if (status === "approved" || status === "accepted" || status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected" || status === "hidden") return "danger";
  return "info";
};

const buildFallbackDashboard = (
  users: AdminUser[],
  posts: AdminPost[],
  reports: AdminReport[],
): DashboardData => {
  const userStatus = users.reduce((acc, user) => {
    const key = user.status_verif || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const postVisibility = posts.reduce((acc, post) => {
    const key = post.is_visible === false ? "hidden" : "visible";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totals: {
      users: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      posts: posts.length,
      visiblePosts: posts.filter((post) => post.is_visible !== false).length,
      hiddenPosts: posts.filter((post) => post.is_visible === false).length,
      pendingVerifications: userStatus.pending || 0,
      approvedUsers: userStatus.approved || 0,
      rejectedUsers: userStatus.rejected || 0,
      participations: posts.reduce((total, post) => total + Number(post.current_particip || 0), 0),
      acceptedParticipations: 0,
      pendingParticipations: 0,
      messages: 0,
      unreadNotifications: 0,
      reports: reports.length,
      reportedPosts: new Set(reports.map((report) => report.post_id)).size,
    },
    userStatus,
    postVisibility,
    participationStatus: {},
    topPosts: [...posts]
      .sort((a, b) => Number(b.current_particip || 0) - Number(a.current_particip || 0))
      .slice(0, 5),
    recentUsers: users.slice(0, 6),
    recentPosts: posts.slice(0, 6),
    recentActivity: [
      ...users.slice(0, 6).map((user) => ({
        id: `user-${user.id}`,
        type: "user" as const,
        title: `@${user.username}`,
        detail: user.email,
        created_at: user.created_at,
      })),
      ...posts.slice(0, 6).map((post) => ({
        id: `post-${post.id}`,
        type: "post" as const,
        title: post.title,
        detail: post.users?.username ? `@${post.users.username}` : "Post",
        created_at: post.event_date,
      })),
    ],
  };
};

const AdminPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [verificationNotes, setVerificationNotes] = useState<Record<number, string>>({});
  const [rejectUser, setRejectUser] = useState<AdminUser | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    const safeGet = async <T,>(url: string, fallback: T): Promise<T> => {
      try {
        const response = await api.get<T>(url);
        return response.data;
      } catch (error) {
        console.error(`Error cargando ${url}:`, error);
        return fallback;
      }
    };

    try {
      const [dashboardData, usersData, postsData, reportsData] = await Promise.all([
        safeGet<DashboardData | null>("/admin/dashboard", null),
        safeGet<AdminUser[]>("/admin/users", []),
        safeGet<AdminPost[]>("/admin/posts", []),
        safeGet<AdminReport[]>("/admin/reports", []),
      ]);

      let pendingData = await safeGet<AdminUser[]>("/admin/pending", []);
      if (!pendingData.length) {
        pendingData = await safeGet<AdminUser[]>("/auth/admin/pending", []);
      }

      setUsers(usersData);
      setPosts(postsData);
      setReports(reportsData);
      setPendingUsers(pendingData);
      setDashboard(dashboardData || buildFallbackDashboard(usersData, postsData, reportsData));

      if (!dashboardData && !usersData.length && !postsData.length) {
        toast.error(t("admin_dashboard.toasts.load_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    categoryService.getCategories().then(setCategories);
  }, []);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.slug, category])), [categories]);

  const filteredUsers = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.username, user.email, user.role, user.status_verif]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [globalSearch, users]);

  const filteredPosts = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) return posts;
    return posts.filter((post) =>
      [post.title, post.description, post.category, getCategoryLabel(categoryMap.get(post.category || ""), i18n.language), post.status, post.users?.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [categoryMap, globalSearch, i18n.language, posts]);

  const handleVerify = async (
    user: AdminUser,
    status: VerificationStatus,
    message = verificationNotes[user.id] || "",
  ) => {
    try {
      await api.patch(`/admin/verify/${user.id}`, { status, message });
      toast.success(status === "approved" ? t("admin_dashboard.toasts.user_approved") : t("admin_dashboard.toasts.user_updated"));
      setVerificationNotes((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setRejectUser(null);
      await loadDashboard();
    } catch (error) {
      console.error("Error verificando usuario:", error);
      toast.error(t("admin_dashboard.toasts.verification_error"));
    }
  };

  const handleRoleChange = async (user: AdminUser, role: UserRole) => {
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role });
      toast.success(t("admin_dashboard.toasts.role_updated", { username: user.username }));
      await loadDashboard();
    } catch (error) {
      console.error("Error actualizando rol:", error);
      toast.error(t("admin_dashboard.toasts.role_error"));
    }
  };

  const handlePostVisibility = async (post: AdminPost) => {
    try {
      const nextVisibility = post.is_visible === false;
      await api.patch(`/admin/posts/${post.id}/visibility`, { is_visible: nextVisibility });
      toast.success(nextVisibility ? t("admin_dashboard.toasts.post_visible") : t("admin_dashboard.toasts.post_hidden"));
      await loadDashboard();
    } catch (error) {
      console.error("Error cambiando visibilidad:", error);
      toast.error(t("admin_dashboard.toasts.visibility_error"));
    }
  };

  const metricCards = dashboard
    ? [
        { label: t("admin_dashboard.metrics.users"), value: dashboard.totals.users, icon: Users, tone: "cyan" },
        { label: t("admin_dashboard.metrics.pending_verifications"), value: dashboard.totals.pendingVerifications, icon: ShieldCheck, tone: "amber" },
        { label: t("admin_dashboard.metrics.visible_posts"), value: dashboard.totals.visiblePosts, icon: FileText, tone: "green" },
        { label: t("admin_dashboard.metrics.participations"), value: dashboard.totals.participations, icon: Activity, tone: "orange" },
        { label: t("admin_dashboard.metrics.messages"), value: dashboard.totals.messages, icon: BarChart3, tone: "blue" },
        { label: t("admin_dashboard.metrics.reported_posts"), value: dashboard.totals.reportedPosts, icon: AlertTriangle, tone: "red" },
      ]
    : [];

  const statusLabel = (status?: string) =>
    t(`admin_dashboard.status_values.${status || "unknown"}`, {
      defaultValue: status || t("admin_dashboard.status_values.unknown"),
    });

  const userAvatarTemplate = (user: AdminUser) => (
    <div className="admin-user-cell">
      <Avatar image={user.foto_perfil || DEFAULT_AVATAR} shape="circle" />
      <div>
        <strong>@{user.username}</strong>
        <span>{user.email}</span>
      </div>
    </div>
  );

  const postTemplate = (post: AdminPost) => (
    <div className="admin-post-cell">
      <img src={post.image_url || DEFAULT_AVATAR} alt={post.title} />
      <div>
        <strong>{post.title}</strong>
        <span>
          @{post.users?.username || t("admin_dashboard.empty.no_user")} · {getCategoryLabel(categoryMap.get(post.category || ""), i18n.language) || post.category || t("admin_dashboard.empty.general")}
        </span>
      </div>
    </div>
  );

  const statusTemplate = (status?: string) => (
    <Tag value={statusLabel(status)} severity={statusSeverity(status)} />
  );

  const activityMeta = {
    user: { icon: UserPlus, label: t("admin_dashboard.activity.user") },
    post: { icon: FileText, label: t("admin_dashboard.activity.post") },
    message: { icon: MessageCircle, label: t("admin_dashboard.activity.message") },
    notification: { icon: Bell, label: t("admin_dashboard.activity.notification") },
    report: { icon: AlertTriangle, label: t("admin_dashboard.activity.report") },
  };

  const formatActivityDate = (value?: string) => {
    if (!value) return t("admin_dashboard.activity.no_date");
    return new Intl.DateTimeFormat(i18n.language.startsWith("es") ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  return (
    <main className="admin-dashboard">
      <aside className="admin-rail">
        <div className="admin-brand">LYNKN</div>
        <span>{t("admin_dashboard.rail_label")}</span>
        <div className="admin-rail-stat">
          <strong>{dashboard?.totals.pendingVerifications || 0}</strong>
          <small>{t("admin_dashboard.pending_verifications_short")}</small>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p>{t("admin_dashboard.eyebrow")}</p>
            <h1>{t("admin_dashboard.title")}</h1>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-search p-input-icon-left">
              <i className="pi pi-search" aria-hidden="true" />
              <InputText
                value={globalSearch}
                onChange={(event) => setGlobalSearch(event.target.value)}
                placeholder={t("admin_dashboard.search_placeholder")}
              />
            </span>
            <Button
              icon={<RefreshCw size={16} />}
              label={t("admin_dashboard.refresh")}
              outlined
              onClick={loadDashboard}
              loading={loading}
            />
          </div>
        </header>

        <section className="admin-metrics-grid">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className={`admin-metric-card tone-${metric.tone}`} key={metric.label}>
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
                <Icon size={24} />
              </article>
            );
          })}
        </section>

        <TabView className="admin-tabs">
          <TabPanel header={t("admin_dashboard.tabs.overview")}>
            <div className="admin-overview-grid">
              <section className="admin-panel-card">
                <h2>{t("admin_dashboard.overview.verification_health")}</h2>
                {Object.entries(dashboard?.userStatus || {}).map(([status, count]) => (
                  <div className="admin-progress-row" key={status}>
                    <span>{statusLabel(status)}</span>
                    <strong>{count}</strong>
                    <div>
                      <i style={{ width: `${Math.min(100, (count / Math.max(1, dashboard?.totals.users || 1)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </section>

              <section className="admin-panel-card">
                <h2>{t("admin_dashboard.overview.top_events")}</h2>
                <div className="admin-top-list">
                  {(dashboard?.topPosts || []).map((post) => (
                    <div className="admin-top-item" key={post.id}>
                      <img src={post.image_url || DEFAULT_AVATAR} alt={post.title} />
                      <div>
                        <strong>{post.title}</strong>
                        <span>{t("admin_dashboard.overview.attendees", { current: post.current_particip || 0, max: post.max_particip || "∞" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="admin-panel-card">
                <h2>{t("admin_dashboard.overview.quick_moderation")}</h2>
                <div className="admin-health-list">
                  <span><strong>{dashboard?.totals.hiddenPosts || 0}</strong> {t("admin_dashboard.overview.hidden_posts")}</span>
                  <span><strong>{dashboard?.totals.reports || 0}</strong> {t("admin_dashboard.overview.received_reports")}</span>
                  <span><strong>{dashboard?.totals.pendingParticipations || 0}</strong> {t("admin_dashboard.overview.pending_requests")}</span>
                  <span><strong>{dashboard?.totals.admins || 0}</strong> {t("admin_dashboard.overview.active_admins")}</span>
                </div>
              </section>

              <section className="admin-panel-card admin-activity-card">
                <h2>{t("admin_dashboard.overview.activity_feed")}</h2>
                <div className="admin-activity-list">
                  {(dashboard?.recentActivity || []).map((activity) => {
                    const meta = activityMeta[activity.type];
                    const Icon = meta.icon;
                    return (
                      <article className={`admin-activity-item activity-${activity.type}`} key={activity.id}>
                        <div className="admin-activity-icon">
                          <Icon size={20} />
                        </div>
                        <div className="admin-activity-copy">
                          <span>{meta.label}</span>
                          <p>
                            <strong>{activity.title}</strong>
                            {" "}
                            {activity.detail}
                          </p>
                          <time>{formatActivityDate(activity.created_at)}</time>
                        </div>
                      </article>
                    );
                  })}
                  {(!dashboard?.recentActivity || dashboard.recentActivity.length === 0) && (
                    <div className="admin-activity-empty">
                      <Activity size={28} />
                      <p>{t("admin_dashboard.activity.empty")}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </TabPanel>

          <TabPanel header={t("admin_dashboard.tabs.verification", { count: pendingUsers.length })}>
            {pendingUsers.length === 0 ? (
              <div className="admin-empty-state">
                <ShieldCheck size={42} />
                <h2>{t("admin_dashboard.verification.empty_title")}</h2>
                <p>{t("admin_dashboard.verification.empty_desc")}</p>
              </div>
            ) : (
              <div className="verification-grid">
                {pendingUsers.map((user) => (
                  <article className="verification-card" key={user.id}>
                    <header>
                      {userAvatarTemplate(user)}
                      {statusTemplate(user.status_verif)}
                    </header>
                    <div className="verification-compare">
                      <figure>
                        <span>{t("admin_dashboard.verification.profile")}</span>
                        <img src={user.foto_perfil || DEFAULT_AVATAR} alt={t("admin_dashboard.verification.profile_alt", { username: user.username })} />
                      </figure>
                      <figure>
                        <span>{t("admin_dashboard.verification.selfie")}</span>
                        <img src={user.selfie_real_time || DEFAULT_AVATAR} alt={t("admin_dashboard.verification.selfie_alt", { username: user.username })} />
                      </figure>
                    </div>
                    <div className="quick-notes">
                      {QUICK_RESPONSES.map((note) => (
                        <button
                          type="button"
                          key={note}
                          onClick={() => setVerificationNotes((prev) => ({ ...prev, [user.id]: t(note) }))}
                        >
                          {t(note)}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={verificationNotes[user.id] || ""}
                      onChange={(event) => setVerificationNotes((prev) => ({ ...prev, [user.id]: event.target.value }))}
                      placeholder={t("admin_dashboard.verification.note_placeholder")}
                    />
                    <footer>
                      <Button
                        icon={<Check size={16} />}
                        label={t("admin_dashboard.actions.approve")}
                        severity="success"
                        onClick={() => handleVerify(user, "approved")}
                      />
                      <Button
                        icon={<X size={16} />}
                        label={t("admin_dashboard.actions.reject")}
                        severity="danger"
                        outlined
                        onClick={() => setRejectUser(user)}
                      />
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </TabPanel>

          <TabPanel header={t("admin_dashboard.tabs.users")}>
            <DataTable
              value={filteredUsers}
              paginator
              rows={10}
              loading={loading}
              emptyMessage={t("admin_dashboard.empty.users")}
              className="admin-table"
              responsiveLayout="scroll"
            >
              <Column header={t("admin_dashboard.columns.user")} body={userAvatarTemplate} sortable field="username" />
              <Column header={t("admin_dashboard.columns.role")} body={(user: AdminUser) => (
                <Dropdown
                  value={user.role}
                  options={[
                    { label: t("admin_dashboard.roles.user"), value: "user" },
                    { label: t("admin_dashboard.roles.admin"), value: "admin" },
                  ]}
                  onChange={(event) => handleRoleChange(user, event.value)}
                />
              )} />
              <Column header={t("admin_dashboard.columns.verification")} body={(user: AdminUser) => statusTemplate(user.status_verif)} sortable field="status_verif" />
              <Column header={t("admin_dashboard.columns.bio")} body={(user: AdminUser) => <span className="admin-muted-cell">{user.bio || t("admin_dashboard.empty.no_bio")}</span>} />
            </DataTable>
          </TabPanel>

          <TabPanel header={t("admin_dashboard.tabs.posts")}>
            <DataTable
              value={filteredPosts}
              paginator
              rows={10}
              loading={loading}
              emptyMessage={t("admin_dashboard.empty.posts")}
              className="admin-table"
              responsiveLayout="scroll"
            >
              <Column header={t("admin_dashboard.columns.post")} body={postTemplate} sortable field="title" />
              <Column header={t("admin_dashboard.columns.status")} body={(post: AdminPost) => statusTemplate(post.status || post.moderation_status)} />
              <Column header={t("admin_dashboard.columns.visibility")} body={(post: AdminPost) => (
                <Tag value={post.is_visible === false ? t("admin_dashboard.visibility.hidden") : t("admin_dashboard.visibility.visible")} severity={post.is_visible === false ? "danger" : "success"} />
              )} />
              <Column header={t("admin_dashboard.columns.attendance")} body={(post: AdminPost) => `${post.current_particip || 0}/${post.max_particip || "∞"}`} />
              <Column header={t("admin_dashboard.columns.actions")} body={(post: AdminPost) => (
                <Button
                  icon={post.is_visible === false ? <Eye size={16} /> : <EyeOff size={16} />}
                  label={post.is_visible === false ? t("admin_dashboard.actions.show") : t("admin_dashboard.actions.hide")}
                  outlined
                  severity={post.is_visible === false ? "success" : "warning"}
                  onClick={() => handlePostVisibility(post)}
                />
              )} />
            </DataTable>
          </TabPanel>

          <TabPanel header={t("admin_dashboard.tabs.reports", { count: reports.length })}>
            <DataTable
              value={reports}
              paginator
              rows={10}
              loading={loading}
              emptyMessage={t("admin_dashboard.empty.reports")}
              className="admin-table"
              responsiveLayout="scroll"
            >
              <Column header={t("admin_dashboard.columns.reported_post")} body={(report: AdminReport) => (
                <div className="admin-post-cell">
                    <img src={report.posts?.image_url || DEFAULT_AVATAR} alt={report.posts?.title || t("admin_dashboard.columns.post")} />
                  <div>
                    <strong>{report.posts?.title || `Post #${report.post_id}`}</strong>
                    <span>@{report.posts?.users?.username || t("admin_dashboard.empty.unknown_organizer")} · {t("admin_dashboard.reports.count", { count: report.posts?.report_count || 0 })}</span>
                  </div>
                </div>
              )} />
              <Column header={t("admin_dashboard.columns.reported_by")} body={(report: AdminReport) => (
                <div className="admin-user-cell">
                  <Avatar image={report.users?.foto_perfil || DEFAULT_AVATAR} shape="circle" />
                  <div>
                    <strong>@{report.users?.username || t("admin_dashboard.empty.user")}</strong>
                    <span>{report.users?.email || t("admin_dashboard.empty.no_email")}</span>
                  </div>
                </div>
              )} />
              <Column header={t("admin_dashboard.columns.reason")} body={(report: AdminReport) => <span className="admin-muted-cell">{report.reason || t("admin_dashboard.empty.no_reason")}</span>} />
              <Column header={t("admin_dashboard.columns.action")} body={(report: AdminReport) => (
                <Button
                  icon={report.posts?.is_visible === false ? <Eye size={16} /> : <EyeOff size={16} />}
                  label={report.posts?.is_visible === false ? t("admin_dashboard.actions.show") : t("admin_dashboard.actions.hide_post")}
                  outlined
                  severity={report.posts?.is_visible === false ? "success" : "warning"}
                  onClick={() =>
                    handlePostVisibility({
                      id: report.post_id,
                      title: report.posts?.title || "",
                      is_visible: report.posts?.is_visible,
                    })
                  }
                />
              )} />
            </DataTable>
          </TabPanel>
        </TabView>
      </section>

      <Dialog
        header={t("admin_dashboard.dialog.reject_title")}
        visible={Boolean(rejectUser)}
        onHide={() => setRejectUser(null)}
        className="admin-dialog"
        modal
      >
        {rejectUser && (
          <div className="reject-dialog-content">
            <p>{t("admin_dashboard.dialog.reject_text", { username: rejectUser.username })}</p>
            <textarea
              value={verificationNotes[rejectUser.id] || ""}
              onChange={(event) => setVerificationNotes((prev) => ({ ...prev, [rejectUser.id]: event.target.value }))}
              placeholder={t("admin_dashboard.dialog.reject_placeholder")}
            />
            <div className="dialog-actions">
              <Button label={t("common.cancel")} outlined onClick={() => setRejectUser(null)} />
              <Button
                label={t("admin_dashboard.actions.reject_profile")}
                severity="danger"
                onClick={() => handleVerify(rejectUser, "rejected", verificationNotes[rejectUser.id] || "")}
              />
            </div>
          </div>
        )}
      </Dialog>
    </main>
  );
};

export default AdminPanel;
