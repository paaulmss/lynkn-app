import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./MessagesPage.css";
import { chatService, type ServerMessage } from "../../services/chatService";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axiosConfig";
import { toast } from "sonner";

import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import { Menu, Send, Loader2 } from "lucide-react";

interface HistoryPage { messages: ServerMessage[]; participants: string[]; hasMore: boolean; nextCursor: number | null; }
interface EventParticipation {
  id: number;
  title: string;
  max_particip: number;
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

  const [eventsError, setEventsError] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const activePostRef = useRef(activePostId);
  useEffect(() => { activePostRef.current = activePostId; }, [activePostId]);
  const messageBufferRef = useRef(new Map<number, ServerMessage>());
  const olderCursorRef = useRef<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let disposed = false;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await api.get<EventParticipation[]>('/chats', { signal: controller.signal });
        if (!disposed) {
          setMyEvents(response.data);
          setEventsError(false);
          setActivePostId((current) => current && !response.data.some((event) => event.id === current) ? null : current);
        }
      } catch {
        if (!disposed) setEventsError(true);
      } finally {
        if (!disposed) setIsLoadingEvents(false);
      }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 30000);
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    return () => {
      disposed = true; controller.abort(); window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!activePostId || !user?.id) return;
    let disposed = false;
    const controller = new AbortController();
    const buffer = new Map<number, ServerMessage>();
    messageBufferRef.current = buffer;
    olderCursorRef.current = null;
    const publish = () => {
      if (!disposed) setMessages([...buffer.values()].sort((a, b) =>
        a.id - b.id));
    };
    chatService.connect();
    const unsubscribe = chatService.onNewMessage((message) => {
      if (!disposed && message.post_id === activePostId) { buffer.set(message.id, message); publish(); }
    });
    chatService.joinPostChat(activePostId);
    const loadHistory = () => api.get<HistoryPage>(
      '/chats/' + activePostId + '/messages', { signal: controller.signal },
    ).then(({ data }) => {
      if (disposed) return;
      data.messages.forEach((message) => buffer.set(message.id, message));
      publish(); setActiveParticipants(data.participants); setChatError(false);
      const currentCursor = olderCursorRef.current;
      if (currentCursor === null || (data.nextCursor !== null && data.nextCursor < currentCursor)) {
        olderCursorRef.current = data.nextCursor;
        setHasMore(data.hasMore);
      }
    }).catch(() => { if (!disposed) setChatError(true); })
      .finally(() => { if (!disposed) setIsLoadingChat(false); });
    const offReady = chatService.onReady(({ postId }) => {
      if (postId === activePostId) void loadHistory();
    });
    void loadHistory();
    return () => { disposed = true; controller.abort(); offReady(); unsubscribe(); chatService.disconnect(); };
  }, [activePostId, user?.id]);

  const loadOlder = async () => {
    const postId = activePostId;
    const before = olderCursorRef.current;
    if (!postId || before === null || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const { data } = await api.get<HistoryPage>('/chats/' + postId + '/messages', { params: { before } });
      if (activePostRef.current !== postId) return;
      data.messages.forEach((message) => messageBufferRef.current.set(message.id, message));
      setMessages([...messageBufferRef.current.values()].sort((a, b) => a.id - b.id));
      olderCursorRef.current = data.nextCursor;
      setHasMore(data.hasMore);
    } catch { toast.error(t('common.error')); }
    finally { setIsLoadingOlder(false); }
  };

  const handleSelectEvent = (event: EventParticipation) => {
    if (event.id === activePostId) return;
    activePostRef.current = event.id;
    setMessages([]); setActiveParticipants([]); setChatError(false); setIsLoadingChat(true); setHasMore(false);
    setActivePostId(event.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePostId || !user || isSending) return;
    const content = newMessage; const postId = activePostId;
    setIsSending(true);
    try {
      const saved = await chatService.sendMessage(postId, content);
      if (activePostRef.current === postId) {
        messageBufferRef.current.set(saved.id, saved);
        setMessages((previous) => previous.some((message) => message.id === saved.id) ? previous : [...previous, saved]);
        setNewMessage((current) => current === content ? '' : current);
      }
    } catch { toast.error(t('messages.socket_error')); }
    finally { setIsSending(false); }
  };

  const activeEvent = myEvents.find((e) => e.id === activePostId);

  return (
    <div className={`explore-container messages-view ${!isDarkMode ? "light-mode" : ""}`}>
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
          <div className="navbar-page-title">{t("nav.messages")}</div>
        </header>

        <div className="messages-page-wrapper">
          <aside className="events-sidebar-chat">
            <header className="sidebar-header">
              <h2>{t("messages.sidebar_title")}</h2>
            </header>
            <div className="events-list">
              {eventsError ? (<div role="alert">{t("common.error")}</div>) : isLoadingEvents ? (
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
                    className={`event-item ${activePostId === event.id ? "active" : ""}`}
                    onClick={() => handleSelectEvent(event)}
                  >
                    <div className="event-avatar">
                      {event.title[0].toUpperCase()}
                    </div>
                    <div className="event-info">
                      <span className="event-name">{event.title}</span>
                      <span className="event-status">
                        {t("messages.chat_group")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">{t("messages.empty_events")}</div>
              )}
            </div>
          </aside>

          <section className="chat-area">
            {activePostId ? (
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
                    {hasMore && <button type="button" onClick={() => void loadOlder()} disabled={isLoadingOlder}>
                      {isLoadingOlder ? 'Cargando...' : 'Cargar mensajes anteriores'}
                    </button>}
                    {isLoadingChat && <Loader2 className="spin" />}
                    {chatError && <p role="alert">{t("common.error")}</p>}
                    {!isLoadingChat && !chatError && messages.length === 0 && <p>{t("messages.empty_chat", { defaultValue: "Todavia no hay mensajes." })}</p>}
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
                      maxLength={4000}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t("messages.input_placeholder")}
                    />
                    <button type="submit" disabled={!newMessage.trim() || isSending || isLoadingChat || chatError}>
                      <Send size={20} />
                    </button>
                  </form>
                </>
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
