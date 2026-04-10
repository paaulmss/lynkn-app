import React from 'react';
import { Check, X } from 'lucide-react';

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
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ participants, onAction }) => {
  return (
    <div className="nomad-admin-panel">
      <h3 className="admin-panel-title">SOLICITUDES DE ACCESO</h3>
      <div className="admin-list">
        {participants.map((p) => (
          <div key={p.id} className="admin-item">
            <div className="admin-user-info">
              <img src={p.users.foto_perfil || "https://api.dicebear.com/8.x/notionists/svg?seed=Pepe"} className="admin-mini-avatar" alt="avatar" />
              <span>@{p.users.username}</span>
            </div>
            <div className="admin-actions-btns">
              {p.status === 'pending' ? (
                <>
                  <button className="btn-approve" onClick={() => onAction(p.id, 'accepted')}><Check size={16} /></button>
                  <button className="btn-reject" onClick={() => onAction(p.id, 'rejected')}><X size={16} /></button>
                </>
              ) : (
                <span className={`status-badge ${p.status}`}>{p.status.toUpperCase()}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantsPanel;