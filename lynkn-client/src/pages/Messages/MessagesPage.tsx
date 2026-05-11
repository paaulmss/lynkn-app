import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./MessagesPage.css";
import { chatService, type ServerMessage } from "../../services/chatService";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../api/supabaseClient";

import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import { Menu, Search, Filter, Send, Lock, Loader2 } from "lucide-react";

interface EventParticipation {
  id: number;
  title: string;
  isActive: boolean;
  max_particip: number;
}

interface ParticipantData {
  users: {
    username: string;
  } | null;
}

interface SupabaseResponse {
  post_id: number;
  posts: {
    id: number;
    title: string;
    is_chat_active: boolean;
    user_id: number;
    max_particip: number;
  } | null;
}

const MessagesPage = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  const { t } = useTranslation();
  const [activePostId, setActivePostId] = useState<number | null>(null);

  const [messages, setMessages] = useState<
    (ServerMessage & { type?: string })[]
  >([]);

  const [newMessage, setNewMessage] = useState("");
  const [myEvents, setMyEvents] = useState<EventParticipation[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<string[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDarkMode = localStorage.getItem("theme") !== "light";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchMyEvents = async () => {
      if (!user?.id) return;
      setIsLoadingEvents(true);

      const { data: participations, error: pError } = await supabase
        .from("participations")
        .select(
          `post_id, posts ( id, title, is_chat_active, user_id, max_particip )`,
        )
        .eq("user_id", user.id)
        .eq("status", "accepted");

      const { data: ownedPosts, error: oError } = await supabase
        .from("posts")
        .select(`id, title, is_chat_active, user_id, max_particip`)
        .eq("user_id", user.id);

      if (pError || oError) {
        console.error("Error cargando chats");
        setIsLoadingEvents(false);
        return;
      }

      const formattedParticipations = (
        (participations as unknown as SupabaseResponse[]) || []
      )
        .filter((p) => p.posts !== null)
        .map((p) => ({
          id: p.posts!.id,
          title: p.posts!.title,
          isActive:
            p.posts!.max_particip === 0 ? true : p.posts!.is_chat_active,
          max_particip: p.posts!.max_particip,
        }));

      const formattedOwned = (ownedPosts || []).map((p) => ({
        id: p.id,
        title: p.title,
        isActive: p.max_particip === 0 ? true : p.is_chat_active,
        max_particip: p.max_particip,
      }));

      const combined = [...formattedParticipations, ...formattedOwned];
      const uniqueEvents = Array.from(
        new Map(combined.map((item) => [item.id, item])).values(),
      );

      setMyEvents(uniqueEvents);
      setIsLoadingEvents(false);
    };

    fetchMyEvents();
  }, [user]);

  useEffect(() => {
    const loadChatData = async () => {
      if (!activePostId) {
        setMessages([]);
        setActiveParticipants([]);
        return;
      }

      const { data: msgData } = await supabase
        .from("messages")
        .select("*, users(username, foto_perfil)")
        .eq("post_id", activePostId)
        .order("sent_at", { ascending: true });

      if (msgData) setMessages(msgData);

      const { data: partData } = (await supabase
        .from("participations")
        .select(`users ( username )`)
        .eq("post_id", activePostId)
        .eq("status", "accepted")) as unknown as {
        data: ParticipantData[] | null;
      };

      if (partData) {
        const names = partData
          .map((p) => p.users?.username)
          .filter((name): name is string => Boolean(name));
        setActiveParticipants(names);
      }
    };

    loadChatData();
  }, [activePostId]);

  useEffect(() => {
    const channel = supabase
      .channel("chat_unlock_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          if (payload.new.is_chat_active || payload.new.max_particip === 0) {
            setMyEvents((prev) =>
              prev.map((ev) =>
                ev.id === payload.new.id ? { ...ev, isActive: true } : ev,
              ),
            );
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const currentEvent = myEvents.find((e) => e.id === activePostId);
    if (!activePostId || !currentEvent?.isActive) return;

    chatService.connect();
    chatService.joinPostChat(activePostId);
    chatService.onNewMessage((msg) => {
      if (msg.post_id === activePostId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => {
      chatService.offNewMessage();
      chatService.disconnect();
    };
  }, [activePostId, myEvents]);

  const handleSelectEvent = (event: EventParticipation) => {
    if (!event.isActive) return;
    setActivePostId(event.id);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePostId || !user) return;
    const senderId = typeof user.id === "string" ? Number(user.id) : user.id;
    chatService.sendMessage(activePostId, senderId, newMessage);
    setNewMessage("");
  };

  const activeEvent = myEvents.find((e) => e.id === activePostId);

  return (
    <div className={`explore-container ${!isDarkMode ? "light-mode" : ""}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="messages"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      <main
        className={`main-content messages-page-main ${isSidebarOpen ? "sidebar-active" : ""}`}
      >
        <header className="top-navbar">
          <button
            className="icon-btn menu-trigger"
            onClick={toggleSidebar}
            type="button"
          >
            <Menu color={isDarkMode ? "white" : "black"} size={24} />
          </button>
          <div className="search-bar">
            <Search size={18} color="var(--text-muted)" />
            <input type="text" placeholder={t("messages.search_placeholder")} />
            <Filter
              size={18}
              color="var(--text-muted)"
              className="filter-icon"
            />
          </div>
        </header>

        <div className="messages-page-wrapper">
          <aside className="events-sidebar-chat">
            <header className="sidebar-header">
              <h2>{t("messages.sidebar_title")}</h2>
            </header>
            <div className="events-list">
              {isLoadingEvents ? (
                <div className="loader-container">
                  <Loader2 className="spin" color="var(--text-main)" />
                  <small style={{ marginTop: "10px" }}>
                    {t("messages.loading_chats")}
                  </small>
                </div>
              ) : myEvents.length > 0 ? (
                myEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`event-item ${activePostId === event.id ? "active" : ""} ${!event.isActive ? "pending" : ""}`}
                    onClick={() => handleSelectEvent(event)}
                  >
                    <div className="event-avatar">
                      {event.isActive ? (
                        event.title[0].toUpperCase()
                      ) : (
                        <Lock size={16} />
                      )}
                    </div>
                    <div className="event-info">
                      <span className="event-name">{event.title}</span>
                      <span className="event-status">
                        {event.isActive
                          ? t("messages.chat_group")
                          : t("messages.pending_quota")}
                      </span>
                    </div>
                    {!event.isActive && (
                      <div className="status-badge">LOCK</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">{t("messages.empty_events")}</div>
              )}
            </div>
          </aside>

          <section className="chat-area">
            {activePostId ? (
              activeEvent?.isActive ? (
                <>
                  <header className="chat-header">
                    <div className="event-avatar small">
                      {activeEvent?.title[0].toUpperCase()}
                    </div>
                    <div className="chat-header-info">
                      <h3>{activeEvent?.title}</h3>
                      <span className="participant-names">
                        {activeParticipants.join(", ")}
                      </span>
                    </div>
                  </header>

                  <div className="messages-list" ref={scrollRef}>
                    {messages.map((m) =>
                      m.type === "system" ? (
                        <div key={m.id} className="system-msg-wrapper">
                          <span className="system-msg-text">
                            {m.content.startsWith("SYS_USER_JOINED:")
                              ?
                                t("chat.system.SYS_USER_JOINED", {
                                  name: m.content.split(":")[1],
                                })
                              : m.content.startsWith("SYS_USER_LEFT:")
                                ? t("chat.system.SYS_USER_LEFT", {
                                    name: m.content.split(":")[1],
                                  })
                                : m.content.startsWith("SYS_USER_KICKED:")
                                  ? t("chat.system.SYS_USER_KICKED", {
                                      name: m.content.split(":")[1],
                                    })
                                  :
                                    m.content}
                          </span>
                        </div>
                      ) : (
                        <div
                          key={m.id}
                          className={`message-wrapper ${Number(m.sender_id) === Number(user?.id) ? "mine" : "others"}`}
                        >
                          <div className="message-bubble">
                            {Number(m.sender_id) !== Number(user?.id) && (
                              <span className="sender-name">
                                {m.users?.username}
                              </span>
                            )}
                            <p>{m.content}</p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <form
                    className="message-input-container"
                    onSubmit={handleSendMessage}
                  >
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t("messages.input_placeholder")}
                    />
                    <button type="submit" disabled={!newMessage.trim()}>
                      <Send size={20} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="no-chat-selected">
                  <Lock
                    size={64}
                    className="lock-icon"
                    style={{
                      color: "var(--text-muted)",
                      opacity: 0.3,
                      marginBottom: "20px",
                    }}
                  />
                  <h3>{t("messages.chat_locked_title")}</h3>
                  <p>{t("messages.chat_locked_desc")}</p>
                </div>
              )
            ) : (
              <div className="no-chat-selected">
                <div
                  className="no-chat-icon"
                  style={{ color: "var(--text-muted)", opacity: 0.5 }}
                >
                  💬
                </div>
                <p>{t("messages.no_chat_selected")}</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {isCreatePostOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={() => setIsCreatePostOpen(false)}
        />
      )}
    </div>
  );
};

export default MessagesPage;
