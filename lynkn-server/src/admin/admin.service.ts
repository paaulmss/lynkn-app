import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AdminService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  // Obtener usuarios pendientes de aprobación
  async getPendingUsers() {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, email, foto_perfil, selfie_real_time, status_verif, verif_message, role, created_at')
      .eq('status_verif', 'pending');

    if (error) throw error;
    return data;
  }

  async getDashboard() {
    const [usersRes, postsRes, participationsRes, messagesRes, notificationsRes] =
      await Promise.all([
        this.supabase
          .from('users')
          .select('id, username, email, role, status_verif, foto_perfil, created_at'),
        this.supabase
          .from('posts')
          .select('id, title, image_url, user_id, category, status, is_visible, moderation_status, current_particip, max_particip, event_date, created_at, users(username, foto_perfil)'),
        this.supabase
          .from('participations')
          .select('id, status, post_id, user_id'),
        this.supabase
          .from('messages')
          .select('id, post_id, sender_id, sent_at'),
        this.supabase
          .from('notifications')
          .select('id, type, is_read, created_at'),
      ]);

    const reportsRes = await this.supabase
      .from('post_reports')
      .select('id, post_id, reporter_id, reason, created_at');

    if (usersRes.error) throw usersRes.error;
    if (postsRes.error) throw postsRes.error;
    if (participationsRes.error) throw participationsRes.error;
    if (messagesRes.error) throw messagesRes.error;
    if (notificationsRes.error) throw notificationsRes.error;
    if (reportsRes.error) throw reportsRes.error;

    const users = usersRes.data || [];
    const posts = postsRes.data || [];
    const participations = participationsRes.data || [];
    const messages = messagesRes.data || [];
    const notifications = notificationsRes.data || [];
    const reports = reportsRes.data || [];

    const userStatus = users.reduce((acc, user: any) => {
      const key = user.status_verif || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const postVisibility = posts.reduce((acc, post: any) => {
      const key = post.is_visible === false ? 'hidden' : 'visible';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const participationStatus = participations.reduce((acc, participation: any) => {
      const key = participation.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPosts = [...posts]
      .sort((a: any, b: any) => Number(b.current_particip || 0) - Number(a.current_particip || 0))
      .slice(0, 5);

    const recentUsers = [...users]
      .sort((a: any, b: any) => Number(b.id || 0) - Number(a.id || 0))
      .slice(0, 6);

    const recentPosts = [...posts]
      .sort((a: any, b: any) => Number(b.id || 0) - Number(a.id || 0))
      .slice(0, 6);

    const recentActivity = [
      ...users.map((user: any) => ({
        id: `user-${user.id}`,
        type: 'user',
        title: `@${user.username}`,
        detail: `Nuevo usuario ${user.status_verif || 'sin estado'}`,
        created_at: user.created_at,
        numeric_id: user.id,
      })),
      ...posts.map((post: any) => ({
        id: `post-${post.id}`,
        type: 'post',
        title: post.title,
        detail: `Post de @${post.users?.username || 'usuario'} (${post.is_visible === false ? 'oculto' : 'visible'})`,
        created_at: post.created_at || post.event_date,
        numeric_id: post.id,
      })),
      ...messages.map((message: any) => ({
        id: `message-${message.id}`,
        type: 'message',
        title: `Chat del post #${message.post_id}`,
        detail: `Mensaje enviado por usuario #${message.sender_id}`,
        created_at: message.sent_at,
        numeric_id: message.id,
      })),
      ...notifications.map((notification: any) => ({
        id: `notification-${notification.id}`,
        type: 'notification',
        title: notification.type || 'Notificación',
        detail: notification.is_read ? 'Notificación leída' : 'Notificación sin leer',
        created_at: notification.created_at,
        numeric_id: notification.id,
      })),
      ...reports.map((report: any) => ({
        id: `report-${report.id}`,
        type: 'report',
        title: `Reporte del post #${report.post_id}`,
        detail: report.reason || 'Sin motivo indicado',
        created_at: report.created_at,
        numeric_id: report.id,
      })),
    ]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return Number(b.numeric_id || 0) - Number(a.numeric_id || 0);
      })
      .slice(0, 18);

    return {
      totals: {
        users: users.length,
        admins: users.filter((user: any) => user.role === 'admin').length,
        posts: posts.length,
        visiblePosts: posts.filter((post: any) => post.is_visible !== false).length,
        hiddenPosts: posts.filter((post: any) => post.is_visible === false).length,
        pendingVerifications: userStatus.pending || 0,
        approvedUsers: userStatus.approved || 0,
        rejectedUsers: userStatus.rejected || 0,
        participations: participations.length,
        acceptedParticipations: participationStatus.accepted || 0,
        pendingParticipations: participationStatus.pending || 0,
        messages: messages.length,
        unreadNotifications: notifications.filter((notification: any) => !notification.is_read).length,
        reports: reports.length,
        reportedPosts: new Set(reports.map((report: any) => report.post_id)).size,
      },
      userStatus,
      postVisibility,
      participationStatus,
      topPosts,
      recentUsers,
      recentPosts,
      recentActivity,
    };
  }

  async getUsers() {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, email, role, status_verif, foto_perfil, selfie_real_time, bio, verif_message, created_at')
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPosts() {
    const { data, error } = await this.supabase
      .from('posts')
      .select('*, users(username, foto_perfil, email)')
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getReports() {
    const { data: reports, error } = await this.supabase
      .from('post_reports')
      .select('id, post_id, reporter_id, reason, created_at')
      .order('id', { ascending: false });

    if (error) throw error;
    if (!reports?.length) return [];

    const postIds = Array.from(new Set(reports.map((report: any) => report.post_id).filter(Boolean)));
    const reporterIds = Array.from(new Set(reports.map((report: any) => report.reporter_id).filter(Boolean)));

    const [postsRes, usersRes] = await Promise.all([
      postIds.length
        ? this.supabase
            .from('posts')
            .select('id, title, image_url, report_count, is_visible, user_id')
            .in('id', postIds)
        : Promise.resolve({ data: [], error: null }),
      reporterIds.length
        ? this.supabase
            .from('users')
            .select('id, username, email, foto_perfil')
            .in('id', reporterIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (postsRes.error) throw postsRes.error;
    if (usersRes.error) throw usersRes.error;

    const postsById = new Map((postsRes.data || []).map((post: any) => [post.id, post]));
    const usersById = new Map((usersRes.data || []).map((user: any) => [user.id, user]));

    return reports.map((report: any) => ({
      ...report,
      posts: postsById.get(report.post_id) || null,
      users: usersById.get(report.reporter_id) || null,
    }));
  }

  // Aprobar o rechazar a un usuario
  async updateVerificationStatus(id: number, status: 'approved' | 'rejected' | 'pending' | 'unverified', message?: string) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ status_verif: status, verif_message: message || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserRole(id: number, role: 'admin' | 'user') {
    const { data, error } = await this.supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePostVisibility(id: number, isVisible: boolean) {
    const { data, error } = await this.supabase
      .from('posts')
      .update({ is_visible: isVisible })
      .eq('id', id)
      .select('*, users(username, foto_perfil, email)')
      .single();

    if (error) throw error;
    return data;
  }
}
