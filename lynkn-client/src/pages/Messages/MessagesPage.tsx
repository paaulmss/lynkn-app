import React, { useEffect, useState, useRef } from 'react';
import './MessagesPage.css';
import { chatService, type ServerMessage } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../api/supabaseClient'; 

// Componentes
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import { Menu, Search, Filter, Send, Lock } from "lucide-react";

interface EventParticipation {
  id: number;
  title: string;
  isActive: boolean;
}

interface SupabaseResponse {
  post_id: number;
  posts: {
    id: number;
    title: string;
    is_chat_active: boolean;
    user_id: number;
  } | null;
}

const MessagesPage = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [myEvents, setMyEvents] = useState<EventParticipation[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<string[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. AUTO-SCROLL
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 2. CARGA DE EVENTOS
  useEffect(() => { 
    const fetchMyEvents = async () => {
      if (!user?.id) return;
      setIsLoadingEvents(true);
      
      // Consulta A: Eventos donde soy participante aceptado
      const { data: participations, error: pError } = await supabase
        .from('participations')
        .select(`post_id, posts ( id, title, is_chat_active, user_id )`)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      // Consulta B: Eventos que yo mismo he creado
      const { data: ownedPosts, error: oError } = await supabase
        .from('posts')
        .select(`id, title, is_chat_active, user_id`)
        .eq('user_id', user.id);

      if (pError || oError) {
          console.error('Error cargando chats');
          setIsLoadingEvents(false);
          return;
      }

      const formattedParticipations = (participations as unknown as SupabaseResponse[] || [])
        .filter(p => p.posts !== null)
        .map(p => ({ 
          id: p.posts!.id, 
          title: p.posts!.title,
          isActive: p.posts!.is_chat_active 
        }));

      const formattedOwned = (ownedPosts || []).map(p => ({
        id: p.id,
        title: p.title,
        isActive: p.is_chat_active
      }));

      // Combinar listas y eliminar duplicados por ID
      const combined = [...formattedParticipations, ...formattedOwned];
      const uniqueEvents = Array.from(new Map(combined.map(item => [item.id, item])).values());

      setMyEvents(uniqueEvents);
      setIsLoadingEvents(false);
    };

    fetchMyEvents(); 
  }, [user]); 

  // 3. CARGAR HISTORIAL Y PARTICIPANTES AL ACTIVAR CHAT
useEffect(() => {
  const loadChatData = async () => {
    if (!activePostId) {
      setMessages([]);
      setActiveParticipants([]);
      return;
    }

    // Cargar Mensajes
    const { data: msgData } = await supabase
      .from('messages')
      .select('*, users(username, foto_perfil)')
      .eq('post_id', activePostId)
      .order('sent_at', { ascending: true });
    
    if (msgData) setMessages(msgData);

    // Cargar Nombres de Participantes
    const { data: partData } = await supabase
      .from('participations')
      .select(`users ( username )`)
      .eq('post_id', activePostId)
      .eq('status', 'accepted') as { data: { users: { username: string } | { username: string }[] | null }[] | null };

    if (partData) {
      const names = partData.map(p => {
        if (Array.isArray(p.users)) {
          return p.users[0]?.username;
        }
        return p.users?.username;
      }).filter(Boolean) as string[];
      
      setActiveParticipants(names);
    }
  };

  loadChatData();
}, [activePostId]);
  // 4. REALTIME: DESBLOQUEO AUTOMATICO
  useEffect(() => {
    const channel = supabase
      .channel('chat_unlock_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.new.is_chat_active) {
            setMyEvents(prev => prev.map(ev => 
              ev.id === payload.new.id ? { ...ev, isActive: true } : ev
            ));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 5. WEBSOCKETS
  useEffect(() => {
    const currentEvent = myEvents.find(e => e.id === activePostId);
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
    setMessages([]); 
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePostId || !user) return;
    const senderId = typeof user.id === 'string' ? Number(user.id) : user.id;
    chatService.sendMessage(activePostId, senderId, newMessage);
    setNewMessage('');
  };

  const activeEvent = myEvents.find(e => e.id === activePostId);

  return (
    <div className="explore-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="messages"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      <main className={`main-content messages-page-main ${isSidebarOpen ? "sidebar-active" : ""}`}>
        <header className="top-navbar">
          <button className="icon-btn menu-trigger" onClick={toggleSidebar} type="button">
            <Menu color="white" size={24} />
          </button>
          <div className="search-bar">
            <Search size={18} color="#71717a" />
            <input type="text" placeholder="BUSCAR CHATS O MENSAJES..." />
            <Filter size={18} color="#71717a" className="filter-icon" />
          </div>
        </header>

        <div className="messages-page-wrapper">
          <aside className="events-sidebar-chat">
            <header className="sidebar-header">
              <h2>Tus Chats</h2>
            </header>
            <div className="events-list">
              {isLoadingEvents ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton-item">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-info">
                      <div className="skeleton-line short" />
                      <div className="skeleton-line long" />
                    </div>
                  </div>
                ))
              ) : myEvents.length > 0 ? (
                myEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className={`event-item ${activePostId === event.id ? 'active' : ''} ${!event.isActive ? 'pending' : ''}`}
                    onClick={() => handleSelectEvent(event)}
                  >
                    <div className="event-avatar">
                      {event.isActive ? event.title[0] : <Lock size={16} />}
                    </div>
                    <div className="event-info">
                      <span className="event-name">{event.title}</span>
                      <span className="event-status">
                        {event.isActive ? "Chat de grupo" : "Chat bloqueado (cupo incompleto)"}
                      </span>
                    </div>
                    {!event.isActive && <div className="status-badge">ESPERANDO</div>}
                  </div>
                ))
              ) : (
                <div className="empty-state">No tienes eventos activos</div>
              )}
            </div>
          </aside>

          <section className="chat-area">
            {activePostId ? (
              activeEvent?.isActive ? (
                <>
                  <header className="chat-header">
                    <div className="event-avatar small">{activeEvent?.title[0]}</div>
                    <div className="chat-header-info">
                      <h3>{activeEvent?.title}</h3>
                      <span className="participant-names">
                        {activeParticipants.length > 0 ? activeParticipants.join(", ") : "Cargando participantes..."}
                      </span>
                    </div>
                  </header>
                  
                  <div className="messages-list" ref={scrollRef}>
                    {messages.map((m) => (
                      <div key={m.id} className={`message-wrapper ${Number(m.sender_id) === Number(user?.id) ? 'mine' : 'others'}`}>
                        <div className="message-bubble">
                          {Number(m.sender_id) !== Number(user?.id) && (
                            <span className="sender-name">{m.users?.username}</span>
                          )}
                          <p>{m.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form className="message-input-container" onSubmit={handleSendMessage}>
                    <input 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                    />
                    <button type="submit" disabled={!newMessage.trim()}>
                      <Send size={20} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="no-chat-selected">
                   <Lock size={64} className="lock-icon" style={{ opacity: 0.2, marginBottom: '20px' }} />
                   <h3>Chat restringido</h3>
                   <p>El chat se abrirá automáticamente cuando se complete el cupo de participantes.</p>
                </div>
              )
            ) : (
              <div className="no-chat-selected">
                <div className="no-chat-icon">💬</div>
                <p>Selecciona un grupo para chatear</p>
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