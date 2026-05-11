import React from 'react';
import { Check, X, UserMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  ownerId: number;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ 
  participants, 
  onAction, 
  isFull, 
  ownerId 
}) => {
  const { t } = useTranslation();

  const filteredParticipants = participants.filter(
    (p) => Number(p.user_id) !== Number(ownerId)
  );

  return (
    <div className="nomad-admin-panel animate-in">
      <h3 className="nomad-stat-label" style={{ marginBottom: '20px' }}>
        {t('admin_panel.title')}
      </h3>
      
      <div className="admin-list">
        {filteredParticipants.length === 0 ? (
          <p className="nomad-description" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
            {t('admin_panel.empty')}
          </p>
        ) : (
          filteredParticipants.map((p) => (
            <div key={p.id} className="admin-item">
              <div className="admin-user-info">
                <img 
                  src={p.users.foto_perfil || "https://api.dicebear.com/8.x/notionists/svg?seed=Pepe"} 
                  className="admin-mini-avatar" 
                  alt="avatar" 
                />
                <div className="admin-user-text">
                   <span className="nomad-username">@{p.users.username}</span>
                   {p.status === 'rejected' && (
                     <span className="status-badge-inline rejected">
                       {t('admin_panel.status.banned')}
                     </span>
                   )}
                </div>
              </div>

              <div className="admin-actions-btns">
                {/* SOLICITUD PENDIENTE */}
                {p.status === 'pending' && (
                  <div className="action-group">
                    <button 
                      className="btn-approve-action" 
                      disabled={isFull}
                      onClick={() => onAction(p.id, 'accepted')}
                      title={isFull ? t('admin_panel.tooltips.full') : t('admin_panel.tooltips.approve')}
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      className="btn-reject-action" 
                      onClick={() => onAction(p.id, 'rejected')}
                      title={t('admin_panel.tooltips.reject')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* YA ACEPTADO */}
                {p.status === 'accepted' && (
                  <div className="action-group">
                    <span className="status-badge-inline accepted">
                      {t('admin_panel.status.accepted')}
                    </span>
                    <button 
                      className="btn-kick-action" 
                      onClick={() => onAction(p.id, 'rejected')}
                      title={t('admin_panel.tooltips.kick')}
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                )}

                {/* RECHAZADO */}
                {p.status === 'rejected' && (
                  <span className="status-badge-inline rejected">
                    {t('admin_panel.status.rejected')}
                  </span>
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