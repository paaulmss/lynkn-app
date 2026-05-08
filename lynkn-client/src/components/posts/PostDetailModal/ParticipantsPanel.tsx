import React from 'react';
import { Check, X, UserMinus } from 'lucide-react';

export interface Participant {
  id: number;
  status: string;
  user_id: number;
  users: {
    username: string;
    foto_perfil: string;
  };
}

interface ParticipantsPanelProps {
  participants: Participant[];
  onAction: (id: number, status: 'accepted' | 'rejected') => void;
  isFull: boolean;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ participants, onAction, isFull }) => {
  return (
    <div className="nomad-admin-panel">
      <h3 className="admin-panel-title">GESTIÓN DE ASISTENTES</h3>
      <div className="admin-list">
        {participants.length === 0 ? (
          <p className="no-participants">No hay solicitudes aún.</p>
        ) : (
          participants.map((p) => (
            <div key={p.id} className="admin-item">
              <div className="admin-user-info">
                <img 
                  src={p.users.foto_perfil || "https://api.dicebear.com/8.x/notionists/svg?seed=Pepe"} 
                  className="admin-mini-avatar" 
                  alt="avatar" 
                />
                <div className="admin-user-text">
                   <span>@{p.users.username}</span>
                   {p.status === 'rejected' && <span className="banned-label">BANEADO</span>}
                </div>
              </div>

              <div className="admin-actions-btns">
                {p.status === 'pending' && (
                  <>
                    <button 
                      className="btn-approve" 
                      title={isFull ? "Evento lleno" : "Aceptar"}
                      disabled={isFull}
                      onClick={() => onAction(p.id, 'accepted')}
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      className="btn-reject" 
                      title="Rechazar"
                      onClick={() => onAction(p.id, 'rejected')}
                    >
                      <X size={16} />
                    </button>
                  </>
                )}

                {p.status === 'accepted' && (
                  <>
                    <span className="status-badge accepted">ACEPTADO</span>
                    <button 
                      className="btn-kick" 
                      title="Expulsar del evento"
                      onClick={() => onAction(p.id, 'rejected')}
                    >
                      <UserMinus size={16} />
                    </button>
                  </>
                )}

                {p.status === 'rejected' && (
                  <span className="status-badge rejected">RECHAZADO</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ParticipantsPanel;