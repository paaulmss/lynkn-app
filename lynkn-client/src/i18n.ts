import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  es: {
    translation: {
      "nav": {
        "explore": "EXPLORAR",
        "requests": "MIS SOLICITUDES",
        "messages": "MENSAJES",
        "notifications": "NOTIFICACIONES",
        "settings": "AJUSTES",
        "profile": "MI PERFIL"
      },
      "common": {
        "save": "GUARDAR CAMBIOS",
        "back": "VOLVER",
        "cancel": "CANCELAR",
        "loading": "CARGANDO...",
        "delete": "ELIMINAR",
        "continue": "CONTINUAR",
        "or": "O",
        "error": "Error",
        "locked": "BLOQUEADO"
      },
      "home": {
        "login": "INICIA SESIÓN",
        "register": "REGÍSTRATE",
        "hero_title": "Encuentra tu próxima quedada.",
        "hero_subtitle": "Eventos reales, grupos cercanos y planes que salen de la pantalla.",
        "hero_tagline": "Conecta. Apúntate. Vive el plan.",
        "hero_footer": "Descubre planes por mapa, solicita unirte y chatea con tu grupo.",
        "manifesto_one_text": "Una red social pensada para",
        "manifesto_one_highlight": "quedar de verdad.",
        "manifesto_two_text": "Crea planes, limita plazas y activa conversaciones",
        "manifesto_two_highlight": "cuando el grupo se forma.",
        "legal_notice": "AVISO LEGAL",
        "terms": "TÉRMINOS",
        "privacy": "PRIVACIDAD",
        "copyright": "© 2026 LYNKN TECH, S.L."
      },
      "map": {
        "verified_member": "Miembro verificado",
        "connected": "CONECTADO",
        "mock_bio_explore": "Explorando Madrid",
        "mock_bio_design": "Diseño y café"
      },
      "auth": {
        "login": {
          "subtitle": "Acceso a quedadas y eventos cerca de ti.",
          "identifier_placeholder": "EMAIL O USUARIO",
          "password_placeholder": "CONTRASEÑA",
          "submit": "ENTRAR",
          "btn_verifying": "VERIFICANDO...",
          "btn_google": "CONTINUAR CON GOOGLE",
          "google_not_configured": "GOOGLE NO CONFIGURADO",
          "mode_password": "CONTRASEÑA",
          "no_account": "¿Aún no eres miembro?",
          "link_register": "SOLICITA ACCESO",
          "error_default": "Credenciales incorrectas"
        },
        // CENTRALIZAMOS TODOS LOS ERRORES AQUÍ
        "errors": {
          "ERR_UNDERAGE": "Debes ser mayor de 18 años para unirte.",
          "ERR_EMAIL_EXISTS": "Este correo electrónico ya está registrado.",
          "ERR_USERNAME_EXISTS": "Este nombre de usuario ya está en uso.",
          "ERR_INVALID_CREDENTIALS": "Email o contraseña incorrectos.",
          "ERR_PWD_SHORT": "La contraseña debe tener al menos 8 caracteres.",
          "ERR_GOOGLE_TOKEN_INVALID": "Error al validar la cuenta de Google.",
          "ERR_OTP_SESSION_INVALID": "No se pudo validar el código.",
          "ERR_BIRTH_REQUIRED": "La fecha de nacimiento es obligatoria.",
          "ERR_TERMS_REQUIRED": "Debes aceptar los términos y condiciones para registrarte.",
          "invalid_data": "Los datos introducidos no son válidos.",
          "invalid_credentials": "El correo/usuario y/o la contraseña no coinciden.",
        }
      },
      "register": {
        "step_basic": "DATOS BÁSICOS",
        "step_identity": "IDENTIDAD",
        "success": "Registro completado. Ya puedes iniciar sesión.",
        "placeholders": {
          "username": "USUARIO",
          "email": "EMAIL",
          "password": "CONTRASEÑA",
          "birth": "FECHA NACIMIENTO"
        },
        "pwd_strength": {
          "weak": "DÉBIL",
          "medium": "MEDIA",
          "strong": "FUERTE"
        },
        "errors": {
          "invalid_email": "Introduce un email válido (ejemplo@mail.com).",
          "birth_required": "La fecha de nacimiento es obligatoria.",
          "underage": "Debes tener al menos 18 años para unirte.",
          "avatar_required": "La foto de perfil es obligatoria.",
          "ai_no_face": "No se detecta un rostro claro.",
          "ai_no_match": "La identidad no coincide. Repite el selfie.",
          "ai_error": "Error en el escaneo.",
          "terms_required": "Debes aceptar los términos y condiciones para registrarte."
        },
        "terms": {
          "accept_prefix": "Acepto los",
          "link": "términos y condiciones de uso",
          "title": "Términos y condiciones de LYNKN",
          "intro": "LYNKN es una app para crear, descubrir y participar en quedadas reales. Al registrarte aceptas usarla de forma responsable y respetuosa.",
          "identity_title": "Identidad y verificación",
          "identity_text": "Puedes tener acceso limitado hasta completar la verificación de identidad. Las imágenes enviadas se usarán para revisar tu perfil y proteger a la comunidad.",
          "events_title": "Eventos y participación",
          "events_text": "Debes publicar planes reales, asistir con respeto y no suplantar a otras personas. Los organizadores pueden gestionar solicitudes y participantes.",
          "content_title": "Contenido permitido",
          "content_text": "No se permite contenido violento, sexual explícito, discriminatorio, ilegal, spam, amenazas ni datos personales de terceros sin permiso.",
          "privacy_title": "Datos y privacidad",
          "privacy_text": "Guardamos la aceptación de estos términos junto a tu cuenta y la fecha de aceptación para cumplir obligaciones de seguridad y trazabilidad.",
          "accept_action": "ACEPTAR TÉRMINOS"
        },
        "identity": {
          "biometric": "BIO-MÉTRICA",
          "scanning": "ESCANEANDO...",
          "verified": "IDENTIDAD VERIFICADA",
          "later_btn": "VERIFICAR IDENTIDAD MÁS TARDE",
          "later_confirm": "Si no te verificas ahora, no podrás unirte a eventos hasta que lo hagas desde tu perfil.",
          "receiving": "RECIBIENDO...",
          "finish": "FINALIZAR"
        }
      },
      "settings": {
        "title": "AJUSTES",
        "subtitle": "Gestiona tu experiencia, identidad y preferencias de eventos",
        "sec_identity": "IDENTIDAD Y SEGURIDAD",
        "status_verified": "CUENTA VERIFICADA",
        "status_pending": "VERIFICACIÓN PENDIENTE",
        "status_unverified": "IDENTIDAD NO VERIFICADA",
        "status_verified_desc": "Tu identidad ha sido confirmada con éxito.",
        "status_pending_desc": "Estamos revisando tu selfie. Esto tardará poco.",
        "status_unverified_desc": "Acceso limitado. No puedes unirte a eventos.",
        "sec_map": "MAPA Y NAVEGACIÓN",
        "interface_mode": "Modo de interfaz",
        "interface_desc": "Alternar entre tema claro y oscuro",
        "interface_lang": "Idioma de la interfaz",
        "verify_sent": "Verificación enviada a revisión.",
        "deleting_loader": "Eliminando cuenta...",
        "delete_success": "Cuenta eliminada correctamente.",
        "delete_error": "No se pudo eliminar la cuenta.",
        "languages": {
          "es": "Español (España)",
          "en": "English (US)"
        },
        "sec_danger": "ZONA DE PELIGRO",
        "delete_acc": "Eliminar cuenta definitivamente",
        "delete_acc_desc": "Esta acción es permanente y borrará todos tus datos.",
        "logout": "CERRAR SESIÓN"
      },
      "requests": {
        "title": "MIS SOLICITUDES",
        "subtitle": "Gestiona tus inscripciones y estados de eventos",
        "organized_by": "Organizado por",
        "btn_abandon": "ABANDONAR",
        "btn_cancel": "CANCELAR",
        "empty_title": "No tienes solicitudes activas",
        "empty_desc": "Explora el mapa y únete a nuevas experiencias.",
        "confirm_cancel": "¿Estás seguro de que quieres cancelar esta solicitud o abandonar el evento?"
      },
      "reverify": {
        "title": "RE-VERIFICACIÓN",
        "use_pc": "USAR WEBCAM PC",
        "use_mobile": "USAR MÓVIL (QR)",
        "capture": "CAPTURAR",
        "receiving": "RECIBIENDO IMAGEN...",
        "qr_desc": "Escanea para abrir la cámara en tu móvil",
        "retry": "REPETIR",
        "send": "ENVIAR A REVISIÓN",
        "cam_error": "No se pudo acceder a la cámara."
      },
      "profile": {
        "edit_btn": "Editar perfil",
        "reverify_btn": "Reintentar selfie",
        "upload_selfie": "Subir selfie",
        "verified": "VERIFICADO",
        "in_review": "EN REVISIÓN",
        "rejected": "RECHAZADO",
        "posts": "posts",
        "followers": "seguidores",
        "following": "seguidos",
        "follow": "SEGUIR",
        "unfollow": "SIGUIENDO",
        "unfollow_action": "DEJAR DE SEGUIR",
        "empty_follow_list": "No hay usuarios para mostrar.",
        "no_bio": "Sin biografía aún...",
        "no_location": "Ubicación no especificada",
        "rejected_title": "VERIFICACIÓN RECHAZADA",
        "admin_note": "NOTA DEL ADMINISTRADOR:",
        "rejected_desc": "Tu identidad no pudo ser confirmada. Por favor, revisa tus fotos.",
        "retry": "REINTENTAR",
        "view_posts": "POSTS",
        "view_favorites": "FAVORITOS",
        "view_map": "MAPA",
        "empty_posts": "Aún no hay publicaciones",
        "empty_posts_desc": "Tus quedadas y eventos aparecerán aquí.",
        "empty_favorites": "Aún no hay favoritos",
        "empty_favorites_desc": "Guarda quedadas para encontrarlas rápido después.",
        "upload_error": "Error al subir la verificación."
      },
      "edit_profile": {
        "title": "EDITAR PERFIL",
        "change_photo": "CAMBIAR FOTO",
        "username": "NOMBRE DE USUARIO",
        "location": "UBICACIÓN",
        "bio": "BIO",
        "username_placeholder": "Tu nombre público...",
        "location_placeholder": "Ej: Madrid, España",
        "bio_placeholder": "Cuéntanos un poco sobre ti...",
        "preview_alt": "Vista previa del perfil",
        "saving": "GUARDANDO...",
        "save_btn": "GUARDAR CAMBIOS",
        "err_size": "La imagen es demasiado grande. Máximo 2MB.",
        "err_username": "El nombre de usuario es obligatorio.",
        "err_moderation": "La IA ha detectado contenido no permitido en tu perfil.",
        "err_save": "No se pudieron guardar los cambios. Inténtalo de nuevo."
      },
      "delete_modal": {
        "title": "¿ELIMINAR EVENTO?",
        "title_step1": "¿ELIMINAR CUENTA?",
        "title_step2": "CONFIRMACIÓN FINAL",
        "warning": "Estás a punto de eliminar tu cuenta de LYNKN. Esta acción es irreversible y borrará todos tus posts, mensajes y datos de perfil.",
        "continue_q": "¿Deseas continuar con el proceso?",
        "instruction": "Para confirmar la eliminación permanente, escribe tu nombre de usuario:",
        "placeholder": "Escribe tu usuario aquí...",
        "btn_sure": "SÍ, ESTOY SEGURO",
        "btn_final": "ELIMINAR AHORA",
        "desc": "Estás a punto de borrar <strong>\"{{title}}\"</strong>. Esta acción es irreversible.",
        "confirm": "SÍ, ELIMINAR",
        "deleting": "ELIMINANDO..."
      },
      "messages": {
        "search_placeholder": "BUSCAR CHATS O MENSAJES...",
        "sidebar_title": "Chats de eventos",
        "empty_events": "No tienes eventos activos",
        "chat_group": "Chat de grupo",
        "pending_quota": "Esperando aceptación",
        "chat_locked_title": "Chat restringido",
        "chat_locked_desc": "Este chat se abrirá cuando el organizador acepte tu solicitud.",
        "no_chat_selected": "Selecciona un grupo para chatear",
        "input_placeholder": "Escribe un mensaje...",
        "loading_chats": "Cargando chats...",
        "socket_error": "No se pudo completar la acción del chat."
      },
      "sidebar": {
        "main_menu": "MENÚ PRINCIPAL",
        "explore": "Explorar",
        "profile": "Perfil",
        "messages": "Mensajes",
        "my_requests": "Mis solicitudes",
        "notifications": "Notificaciones",
        "actions": "ACCIONES",
        "new_post": "Crear quedada",
        "settings": "Ajustes",
        "logout": "Cerrar Sesión"
      },
      "notifications": {
        "nav_title": "NOTIFICACIONES",
        "title": "CENTRO DE NOTIFICACIONES",
        "subtitle": "Gestiona tus solicitudes y actividad reciente",
        "loading": "Cargando avisos...",
        "empty_title": "BANDEJA VACÍA",
        "empty_desc": "Te avisaremos cuando alguien quiera unirse a tus planes o tengas actividad nueva.",
        "types": {
          "default_user": "Un usuario",
          "default_activity": "una actividad",
          "join_request": "{{user}} quiere unirse a tu actividad {{post}}.",
          "accepted": "{{user}} ha aceptado tu solicitud para {{post}}. ¡Ya puedes ver la ubicación!",
          "rejected": "{{user}} ha rechazado tu solicitud para unirte a {{post}}.",
          "kicked": "Has sido expulsado de la actividad {{post}}. Ya no tienes acceso al chat.",
          "info_pending": "Has solicitado unirte a {{post}}. Esperando respuesta...",
          "post_deleted": "{{user}} ha cancelado el evento {{post}}. El grupo ha sido disuelto.",
          "default_update": "Nueva actualización de {{user}}."
        }
      },
      "chat": {
        "system": {
          "SYS_USER_JOINED": "{{name}} se ha unido al grupo",
          "SYS_USER_LEFT": "{{name}} ha salido del grupo",
          "SYS_USER_KICKED": "{{name}} ha sido expulsado por el organizador"
        }
      },
      "create_post": {
        "title": "NUEVA QUEDADA",
        "restricted": "ACCIÓN RESTRINGIDA",
        "restricted_desc": "Debes verificar tu identidad para crear quedadas en LYNKN.",
        "go_profile": "IR A MI PERFIL",
        "add_photo": "AÑADIR FOTO",
        "moderating": "MODERANDO...",
        "loc_label": "UBICACIÓN DEL EVENTO",
        "search_place": "Busca un lugar...",
        "loc_fixed": "Ubicación fijada",
        "loc_searching": "Localizando...",
        "participants": "PARTICIPANTES",
        "unlimited": "ILIMITADO",
        "limit_placeholder": "Ej: 20",
        "category": "CATEGORÍA",
        "post_title": "TÍTULO",
        "title_placeholder": "Ej: Tarde de tapas en Malasaña",
        "description": "DESCRIPCIÓN",
        "desc_placeholder": "Cuenta el plan, la hora y para quién encaja.",
        "submit": "PUBLICAR",
        "analyzing": "VERIFICANDO...",
        "success_title": "¡PUBLICADO!",
        "success_desc": "Tu quedada ya aparece en el mapa.",
        "err_size": "Imagen demasiado pesada",
        "err_size_desc": "El límite es de 3MB para la validación por IA.",
        "err_quota": "Define el aforo",
        "err_quota_desc": "Indica al menos 1 participante.",
        "err_missing": "Faltan datos",
        "err_missing_desc": "Completa título, descripción e imagen.",
        "err_location_not_found": "Ubicación no encontrada",
        "err_security": "Rechazado por Seguridad",
        "errors": {
          "image_required": "La imagen es obligatoria.",
          "inappropriate": "Contenido inapropiado detectado por la IA.",
          "processing": "No se pudo procesar la publicación.",
          "upload": "No se pudo subir la imagen."
        },
        "map_instruction": "Haz clic en el mapa para fijar el punto exacto",
        "searching": "Localizando...",
        "fixed": "Ubicación fijada"
      },
      "explore": {
        "search_placeholder": "BUSCAR EVENTOS, GRUPOS O DIRECCIONES...",
        "btn_map": "MAPA",
        "btn_posts": "POSTS",
        "details_btn": "VER DETALLES",
        "view_switch_label": "Cambiar vista de exploración",
        "filters": {
          "open": "Abrir filtros",
          "clear_search": "Limpiar búsqueda",
          "status": "Estado",
          "capacity": "Plazas",
          "category": "Categoría",
          "all": "Todos",
          "available": "Disponibles",
          "open_spots": "Por plaza",
          "unlimited": "Acceso ilimitado",
          "clear": "Limpiar filtros",
          "empty_title": "No hay quedadas con esos filtros",
          "empty_desc": "Prueba con otra búsqueda o limpia los filtros para ver más planes."
        },
        "profile_search": {
          "title": "Perfiles",
          "empty": "No hay perfiles con esa búsqueda."
        },
        "security": {
          "pending_title": "ACCESO EN REVISIÓN",
          "pending_desc": "Tu solicitud está siendo validada. El acceso se activará tras la aprobación.",
          "denied_title": "ACCESO DENEGADO",
          "denied_desc": "Tu identidad no pudo ser verificada. El acceso está restringido.",
          "reverify": "VOLVER A VERIFICAR"
        }
      },
      "post_card": {
        "unlimited": "ILIMITADO",
        "favorite_add": "Añadir a favoritos",
        "favorite_remove": "Quitar de favoritos",
        "status": {
          "pending": "PENDIENTE",
          "accepted": "ACEPTADO",
          "rejected": "RECHAZADO"
        }
      },
      "post_detail": {
        "total_spots": "TOTAL PLAZAS",
        "joined_people": "GENTE UNIDA",
        "loc_active": "Ubicación activa",
        "loc_restricted": "Ubicación exacta tras aceptar",
        "btn_delete": "ELIMINAR",
        "btn_manage": "GESTIONAR",
        "btn_hide": "OCULTAR",
        "unknown_user": "usuario",
        "favorites": "FAVORITOS",
        "unlimited_event": "EVENTO ILIMITADO",
        "spots_left": "{{count}} plazas disponibles",
        "toasts": {
          "request_sent": "Solicitud enviada",
          "request_error": "No se pudo enviar la solicitud",
          "deleted": "Evento eliminado",
          "delete_error": "Error al eliminar el post",
          "status_updated": "Estado actualizado",
          "action_error": "Error al procesar la acción"
        },
        "status": {
          "denied": "ACCESO DENEGADO",
          "joining": "Enviando...",
          "join": "SOLICITAR UNIRSE",
          "accepted": "INSCRITO - IR AL CHAT",
          "pending": "PENDIENTE"
        }
      },
      "admin_panel": {
        "title": "GESTIÓN DE ASISTENTES",
        "empty": "No hay solicitudes pendientes.",
        "status": {
          "accepted": "ACEPTADO",
          "rejected": "RECHAZADO",
          "banned": "BANEADO"
        },
        "tooltips": {
          "approve": "Aceptar",
          "reject": "Rechazar",
          "kick": "Expulsar",
          "full": "Evento lleno"
        }
      },
      "admin_dashboard": {
        "rail_label": "Admin OS",
        "pending_verifications_short": "verificaciones pendientes",
        "eyebrow": "Panel de control",
        "title": "Administración de comunidad y eventos",
        "search_placeholder": "Buscar usuarios, posts, estados...",
        "refresh": "Actualizar",
        "metrics": {
          "users": "Usuarios",
          "pending_verifications": "Verificaciones pendientes",
          "visible_posts": "Posts visibles",
          "participations": "Participaciones",
          "messages": "Mensajes",
          "reported_posts": "Posts reportados"
        },
        "tabs": {
          "overview": "Overview",
          "verification": "Verificación ({{count}})",
          "users": "Usuarios",
          "posts": "Posts",
          "reports": "Reportes ({{count}})"
        },
        "overview": {
          "verification_health": "Salud de verificación",
          "top_events": "Top eventos por asistencia",
          "attendees": "{{current}}/{{max}} asistentes",
          "quick_moderation": "Moderación rápida",
          "activity_feed": "Actividad reciente de la app",
          "hidden_posts": "posts ocultos",
          "received_reports": "reportes recibidos",
          "pending_requests": "solicitudes pendientes",
          "active_admins": "administradores activos"
        },
        "activity": {
          "user": "Usuario",
          "post": "Post",
          "message": "Chat",
          "notification": "Aviso",
          "report": "Reporte",
          "no_date": "Sin fecha",
          "empty": "Aún no hay actividad para mostrar."
        },
        "verification": {
          "empty_title": "Todo al día",
          "empty_desc": "No hay perfiles pendientes de revisión.",
          "profile": "Perfil",
          "selfie": "Selfie",
          "profile_alt": "Perfil de {{username}}",
          "selfie_alt": "Selfie de {{username}}",
          "note_placeholder": "Nota para el usuario si se rechaza..."
        },
        "quick_notes": {
          "face_not_clear": "La foto de perfil no muestra una cara clara.",
          "selfie_mismatch": "La selfie no coincide con la foto de perfil.",
          "blurry_image": "La imagen está borrosa o con poca luz.",
          "close_face": "Se necesita un primer plano del rostro.",
          "inappropriate": "Contenido inapropiado detectado."
        },
        "columns": {
          "user": "Usuario",
          "role": "Rol",
          "verification": "Verificación",
          "bio": "Bio",
          "post": "Post",
          "status": "Estado",
          "visibility": "Visibilidad",
          "attendance": "Asistencia",
          "actions": "Acciones",
          "reported_post": "Post reportado",
          "reported_by": "Reportado por",
          "reason": "Motivo",
          "action": "Acción"
        },
        "actions": {
          "approve": "Aprobar",
          "reject": "Rechazar",
          "show": "Mostrar",
          "hide": "Ocultar",
          "hide_post": "Ocultar post",
          "reject_profile": "Rechazar perfil"
        },
        "roles": {
          "user": "Usuario",
          "admin": "Admin"
        },
        "visibility": {
          "hidden": "Oculto",
          "visible": "Visible"
        },
        "empty": {
          "users": "No hay usuarios para mostrar",
          "posts": "No hay posts para mostrar",
          "reports": "No hay reportes pendientes",
          "no_bio": "Sin bio",
          "no_user": "sin usuario",
          "general": "general",
          "unknown_organizer": "organizador desconocido",
          "user": "usuario",
          "no_email": "sin email",
          "no_reason": "Sin motivo"
        },
        "reports": {
          "count": "{{count}} reportes"
        },
        "dialog": {
          "reject_title": "Confirmar rechazo",
          "reject_text": "Vas a rechazar la verificación de @{{username}}.",
          "reject_placeholder": "Motivo recomendado para que el usuario pueda corregirlo..."
        },
        "status_values": {
          "approved": "Aprobado",
          "pending": "Pendiente",
          "rejected": "Rechazado",
          "unverified": "Sin verificar",
          "accepted": "Aceptado",
          "active": "Activo",
          "hidden": "Oculto",
          "visible": "Visible",
          "unknown": "Desconocido"
        },
        "toasts": {
          "load_error": "No se pudieron cargar datos admin. Revisa sesión admin y backend.",
          "user_approved": "Usuario aprobado",
          "user_updated": "Usuario actualizado",
          "verification_error": "No se pudo actualizar la verificación",
          "role_updated": "Rol actualizado para @{{username}}",
          "role_error": "No se pudo actualizar el rol",
          "post_visible": "Post visible de nuevo",
          "post_hidden": "Post ocultado",
          "visibility_error": "No se pudo cambiar la visibilidad del post"
        }
      },
      "confirm_delete": {
        "title": "¿ELIMINAR PUBLICACIÓN?",
        "warning": "Estás a punto de borrar <strong>\"{{title}}\"</strong>. Esta acción eliminará permanentemente el chat, los participantes y las notificaciones asociadas.",
        "confirm": "SÍ, ELIMINAR TODO",
        "btn_loading": "ELIMINANDO..."
      },
      "verify_mobile": {
        "desc": "Captura un selfie para verificar tu identidad y acceder al círculo.",
        "btn_open": "ABRIR CÁMARA",
        "uploading": "SUBIENDO VERIFICACIÓN...",
        "success_title": "ENVIADO",
        "success_desc": "Ya puedes cerrar esta ventana y continuar en tu ordenador.",
        "err_sync": "Error de sincronización"
      }
    }
  },
  en: {
    translation: {
      "nav": {
        "explore": "EXPLORE",
        "requests": "MY REQUESTS",
        "messages": "MESSAGES",
        "notifications": "NOTIFICATIONS",
        "settings": "SETTINGS",
        "profile": "MY PROFILE"
      },
      "common": {
        "save": "SAVE CHANGES",
        "back": "BACK",
        "cancel": "CANCEL",
        "loading": "LOADING...",
        "delete": "DELETE",
        "continue": "CONTINUE",
        "or": "OR",
        "error": "Error",
        "locked": "LOCKED"
      },
      "home": {
        "login": "SIGN IN",
        "register": "SIGN UP",
        "hero_title": "Find your next meetup.",
        "hero_subtitle": "Real events, nearby groups and plans that move beyond the screen.",
        "hero_tagline": "Connect. Join. Live the plan.",
        "hero_footer": "Discover plans on the map, request to join and chat with your group.",
        "manifesto_one_text": "A social network built to",
        "manifesto_one_highlight": "meet for real.",
        "manifesto_two_text": "Create plans, limit spots and unlock conversations",
        "manifesto_two_highlight": "when the group is formed.",
        "legal_notice": "LEGAL NOTICE",
        "terms": "TERMS",
        "privacy": "PRIVACY",
        "copyright": "© 2026 LYNKN TECH, S.L."
      },
      "map": {
        "verified_member": "Verified member",
        "connected": "CONNECTED",
        "mock_bio_explore": "Exploring Madrid",
        "mock_bio_design": "Design and coffee"
      },
      "auth": {
        "login": {
          "subtitle": "Access meetups and events near you.",
          "identifier_placeholder": "EMAIL OR USERNAME",
          "password_placeholder": "PASSWORD",
          "submit": "SIGN IN",
          "btn_verifying": "VERIFYING...",
          "btn_google": "CONTINUE WITH GOOGLE",
          "google_not_configured": "GOOGLE NOT CONFIGURED",
          "mode_password": "PASSWORD",
          "no_account": "Not a member yet?",
          "link_register": "REQUEST ACCESS",
          "error_default": "Invalid credentials"
        },
        "errors": {
          "ERR_UNDERAGE": "You must be at least 18 years old to join.",
          "ERR_EMAIL_EXISTS": "This email address is already registered.",
          "ERR_USERNAME_EXISTS": "This username is already in use.",
          "ERR_INVALID_CREDENTIALS": "Invalid email or password.",
          "ERR_PWD_SHORT": "Password must be at least 8 characters long.",
          "ERR_GOOGLE_TOKEN_INVALID": "Error validating Google account.",
          "ERR_OTP_SESSION_INVALID": "Could not validate the code.",
          "ERR_BIRTH_REQUIRED": "Date of birth is required.",
          "ERR_TERMS_REQUIRED": "You must accept the terms and conditions to register.",
          "invalid_data": "The entered data is invalid.",
          "invalid_credentials": "The email/username and/or password do not match."
        }
      },
      "register": {
        "step_basic": "BASIC INFO",
        "step_identity": "IDENTITY",
        "success": "Registration complete. You can now sign in.",
        "placeholders": {
          "username": "USERNAME",
          "email": "EMAIL",
          "password": "PASSWORD",
          "birth": "DATE OF BIRTH"
        },
        "pwd_strength": {
          "weak": "WEAK",
          "medium": "MEDIUM",
          "strong": "STRONG"
        },
        "errors": {
          "invalid_email": "Enter a valid email (example@mail.com).",
          "birth_required": "Date of birth is required.",
          "underage": "You must be at least 18 years old to join.",
          "avatar_required": "Profile picture is required.",
          "ai_no_face": "No clear face detected.",
          "ai_no_match": "Identity does not match. Retake selfie.",
          "ai_error": "Scanning error.",
          "terms_required": "You must accept the terms and conditions to register."
        },
        "terms": {
          "accept_prefix": "I accept the",
          "link": "terms and conditions of use",
          "title": "LYNKN terms and conditions",
          "intro": "LYNKN is an app for creating, discovering and joining real-life meetups. By registering, you agree to use it responsibly and respectfully.",
          "identity_title": "Identity and verification",
          "identity_text": "You may have limited access until identity verification is complete. Submitted images are used to review your profile and protect the community.",
          "events_title": "Events and participation",
          "events_text": "You must publish real plans, participate respectfully and avoid impersonating other people. Organizers can manage requests and participants.",
          "content_title": "Allowed content",
          "content_text": "Violent, sexually explicit, discriminatory, illegal, spam, threatening content or third-party personal data without permission is not allowed.",
          "privacy_title": "Data and privacy",
          "privacy_text": "We store your acceptance of these terms with your account and the acceptance date for safety and traceability obligations.",
          "accept_action": "ACCEPT TERMS"
        },
        "identity": {
          "biometric": "BIO-METRIC",
          "scanning": "SCANNING...",
          "verified": "IDENTITY VERIFIED",
          "later_btn": "VERIFY IDENTITY LATER",
          "later_confirm": "If you don't verify now, you won't be able to join events until you do so from your profile.",
          "receiving": "RECEIVING...",
          "finish": "FINISH"
        }
      },
      "settings": {
        "title": "SETTINGS",
        "subtitle": "Manage your experience, identity and event preferences",
        "sec_identity": "IDENTITY & SECURITY",
        "status_verified": "VERIFIED ACCOUNT",
        "status_pending": "PENDING VERIFICATION",
        "status_unverified": "UNVERIFIED IDENTITY",
        "status_verified_desc": "Your identity has been successfully confirmed.",
        "status_pending_desc": "We are reviewing your selfie. This will take a while.",
        "status_unverified_desc": "Limited access. You cannot join events.",
        "sec_map": "MAP & NAVIGATION",
        "interface_mode": "Interface mode",
        "interface_desc": "Toggle between light and dark theme",
        "interface_lang": "Interface language",
        "verify_sent": "Verification sent for review.",
        "deleting_loader": "Deleting account...",
        "delete_success": "Account deleted successfully.",
        "delete_error": "Could not delete account.",
        "languages": {
          "es": "Spanish (Spain)",
          "en": "English (US)"
        },
        "sec_danger": "DANGER ZONE",
        "delete_acc": "Permanently delete account",
        "delete_acc_desc": "This action is permanent and will delete all your data.",
        "logout": "LOGOUT"
      },
      "requests": {
        "title": "MY REQUESTS",
        "subtitle": "Manage your registrations and event statuses",
        "organized_by": "Organized by",
        "btn_abandon": "LEAVE",
        "btn_cancel": "CANCEL",
        "empty_title": "No active requests",
        "empty_desc": "Explore the map and join new experiences.",
        "confirm_cancel": "Are you sure you want to cancel this request or leave the event?"
      },
      "reverify": {
        "title": "RE-VERIFICATION",
        "use_pc": "USE PC WEBCAM",
        "use_mobile": "USE MOBILE (QR)",
        "capture": "CAPTURE",
        "receiving": "RECEIVING IMAGE...",
        "qr_desc": "Scan to open camera on your phone",
        "retry": "RETRY",
        "send": "SEND TO REVIEW",
        "cam_error": "Could not access camera."
      },
      "profile": {
        "edit_btn": "Edit profile",
        "reverify_btn": "Retry selfie",
        "upload_selfie": "Upload selfie",
        "verified": "VERIFIED",
        "in_review": "IN REVIEW",
        "rejected": "REJECTED",
        "posts": "posts",
        "followers": "followers",
        "following": "following",
        "follow": "FOLLOW",
        "unfollow": "FOLLOWING",
        "unfollow_action": "UNFOLLOW",
        "empty_follow_list": "No users to show.",
        "no_bio": "No biography yet...",
        "no_location": "Location not specified",
        "rejected_title": "VERIFICATION REJECTED",
        "admin_note": "ADMINISTRATOR NOTE:",
        "rejected_desc": "Your identity could not be confirmed. Please check your photos.",
        "retry": "RETRY",
        "view_posts": "POSTS",
        "view_favorites": "FAVORITES",
        "view_map": "MAP",
        "empty_posts": "No posts yet",
        "empty_posts_desc": "Your meetups and events will appear here.",
        "empty_favorites": "No favorites yet",
        "empty_favorites_desc": "Save meetups to find them quickly later.",
        "upload_error": "Error uploading verification."
      },
      "edit_profile": {
        "title": "EDIT PROFILE",
        "change_photo": "CHANGE PHOTO",
        "username": "USERNAME",
        "location": "LOCATION",
        "bio": "BIO",
        "username_placeholder": "Your public name...",
        "location_placeholder": "E.g.: Madrid, Spain",
        "bio_placeholder": "Tell us a bit about yourself...",
        "preview_alt": "Profile preview",
        "saving": "SAVING...",
        "save_btn": "SAVE CHANGES",
        "err_size": "The image is too large. Max 2MB.",
        "err_username": "Username is required.",
        "err_moderation": "AI detected content that is not allowed in your profile.",
        "err_save": "Could not save changes. Please try again."
      },
      "delete_modal": {
        "title": "DELETE EVENT?",
        "title_step1": "DELETE ACCOUNT?",
        "title_step2": "FINAL CONFIRMATION",
        "warning": "You are about to delete your LYNKN account. This action is irreversible and will erase all your posts, messages, and profile data.",
        "continue_q": "Do you wish to continue?",
        "instruction": "To confirm permanent deletion, type your username:",
        "placeholder": "Type your username here...",
        "btn_sure": "YES, I AM SURE",
        "btn_final": "DELETE NOW",
        "desc": "You are about to delete <strong>\"{{title}}\"</strong>. This action is irreversible.",
        "confirm": "YES, DELETE",
        "deleting": "DELETING..."
      },
      "messages": {
        "search_placeholder": "SEARCH CHATS OR MESSAGES...",
        "sidebar_title": "Event chats",
        "empty_events": "No active events",
        "chat_group": "Group Chat",
        "pending_quota": "Waiting for approval",
        "chat_locked_title": "Restricted Chat",
        "chat_locked_desc": "This chat will open when the organizer accepts your request.",
        "no_chat_selected": "Select a group to chat",
        "input_placeholder": "Type a message...",
        "loading_chats": "Loading chats...",
        "socket_error": "Could not complete the chat action."
      },
      "sidebar": {
        "main_menu": "MAIN MENU",
        "explore": "EXPLORE",
        "profile": "MY PROFILE",
        "messages": "MESSAGES",
        "my_requests": "MY REQUESTS",
        "notifications": "NOTIFICATIONS",
        "actions": "ACTIONS",
        "new_post": "CREATE MEETUP",
        "settings": "SETTINGS",
        "logout": "LOGOUT"
      },
      "notifications": {
        "nav_title": "NOTIFICATIONS",
        "title": "NOTIFICATION CENTER",
        "subtitle": "Manage your requests and recent activity",
        "loading": "Loading notifications...",
        "empty_title": "EMPTY INBOX",
        "empty_desc": "We'll notify you when someone wants to join your plans or there's new activity.",
        "types": {
          "default_user": "A user",
          "default_activity": "an activity",
          "join_request": "{{user}} wants to join your activity {{post}}.",
          "accepted": "{{user}} accepted your request for {{post}}. You can now see the location!",
          "rejected": "{{user}} rejected your request to join {{post}}.",
          "kicked": "You have been kicked from {{post}}. You no longer have access to the chat.",
          "info_pending": "You requested to join {{post}}. Waiting for response...",
          "post_deleted": "{{user}} cancelled the event {{post}}. The group has been disbanded.",
          "default_update": "New update from {{user}}."
        }
      },
      "chat": {
        "system": {
          "SYS_USER_JOINED": "{{name}} has joined the group",
          "SYS_USER_LEFT": "{{name}} has left the group",
          "SYS_USER_KICKED": "{{name}} has been kicked by the organizer"
        }
      },
      "create_post": {
        "title": "NEW MEETUP",
        "restricted": "ACTION RESTRICTED",
        "restricted_desc": "You must verify your identity to create meetups on LYNKN.",
        "go_profile": "GO TO PROFILE",
        "add_photo": "ADD PHOTO",
        "moderating": "MODERATING...",
        "loc_label": "EVENT LOCATION",
        "search_place": "Search for a place...",
        "fixed": "Location set",
        "searching": "Locating...",
        "participants": "PARTICIPANTS",
        "unlimited": "UNLIMITED",
        "limit_placeholder": "E.g.: 20",
        "category": "CATEGORY",
        "post_title": "TITLE",
        "title_placeholder": "E.g.: Tapas evening in London",
        "description": "DESCRIPTION",
        "desc_placeholder": "Describe the plan, time and who it is for.",
        "submit": "POST",
        "analyzing": "VERIFYING...",
        "success_title": "PUBLISHED!",
        "success_desc": "Your meetup is now on the map.",
        "err_size": "Image too heavy",
        "err_size_desc": "The limit is 3MB for AI validation.",
        "err_quota": "Set capacity",
        "err_quota_desc": "Indicate at least 1 participant.",
        "err_missing": "Missing data",
        "err_missing_desc": "Complete title, description and image.",
        "err_location_not_found": "Location not found",
        "err_security": "Security Rejection",
        "errors": {
          "image_required": "Image is required.",
          "inappropriate": "Inappropriate content detected by AI.",
          "processing": "Could not process the post.",
          "upload": "Could not upload the image."
        },
        "map_instruction": "Click on the map to fix the exact location",
        "loc_searching": "Locating...",
        "loc_fixed": "Location set"
      },
      "explore": {
        "search_placeholder": "SEARCH EVENTS, GROUPS OR ADDRESSES...",
        "btn_map": "MAP",
        "btn_posts": "POSTS",
        "details_btn": "VIEW DETAILS",
        "view_switch_label": "Switch exploration view",
        "filters": {
          "open": "Open filters",
          "clear_search": "Clear search",
          "status": "Status",
          "capacity": "Capacity",
          "category": "Category",
          "all": "All",
          "available": "Available",
          "open_spots": "By spot",
          "unlimited": "Unlimited access",
          "clear": "Clear filters",
          "empty_title": "No meetups match those filters",
          "empty_desc": "Try another search or clear the filters to see more plans."
        },
        "profile_search": {
          "title": "Profiles",
          "empty": "No profiles match that search."
        },
        "security": {
          "pending_title": "ACCESS UNDER REVIEW",
          "pending_desc": "Your request is being validated. Access will be activated after approval.",
          "denied_title": "ACCESS DENIED",
          "denied_desc": "Your identity could not be verified. Access is restricted.",
          "reverify": "RE-VERIFY NOW"
        }
      },
      "post_card": {
        "unlimited": "UNLIMITED",
        "favorite_add": "Add to favorites",
        "favorite_remove": "Remove from favorites",
        "status": {
          "pending": "PENDING",
          "accepted": "ACCEPTED",
          "rejected": "REJECTED"
        }
      },
      "post_detail": {
        "total_spots": "TOTAL CAPACITY",
        "joined_people": "PEOPLE JOINED",
        "loc_active": "Location active",
        "loc_restricted": "Exact location after acceptance",
        "btn_delete": "DELETE",
        "btn_manage": "MANAGE",
        "btn_hide": "HIDE",
        "unknown_user": "user",
        "favorites": "FAVORITES",
        "unlimited_event": "UNLIMITED EVENT",
        "spots_left": "{{count}} spots left",
        "toasts": {
          "request_sent": "Request sent",
          "request_error": "Could not send the request",
          "deleted": "Event deleted",
          "delete_error": "Error deleting the post",
          "status_updated": "Status updated",
          "action_error": "Error processing the action"
        },
        "status": {
          "denied": "ACCESS DENIED",
          "joining": "Sending...",
          "join": "REQUEST TO JOIN",
          "accepted": "JOINED - OPEN CHAT",
          "pending": "PENDING"
        }
      },
      "admin_panel": {
        "title": "ATTENDEE MANAGEMENT",
        "empty": "No pending requests.",
        "status": {
          "accepted": "ACCEPTED",
          "rejected": "REJECTED",
          "banned": "BANNED"
        },
        "tooltips": {
          "approve": "Approve",
          "reject": "Reject",
          "kick": "Kick out",
          "full": "Event full"
        }
      },
      "admin_dashboard": {
        "rail_label": "Admin OS",
        "pending_verifications_short": "pending verifications",
        "eyebrow": "Control panel",
        "title": "Community and event administration",
        "search_placeholder": "Search users, posts, statuses...",
        "refresh": "Refresh",
        "metrics": {
          "users": "Users",
          "pending_verifications": "Pending verifications",
          "visible_posts": "Visible posts",
          "participations": "Participations",
          "messages": "Messages",
          "reported_posts": "Reported posts"
        },
        "tabs": {
          "overview": "Overview",
          "verification": "Verification ({{count}})",
          "users": "Users",
          "posts": "Posts",
          "reports": "Reports ({{count}})"
        },
        "overview": {
          "verification_health": "Verification health",
          "top_events": "Top events by attendance",
          "attendees": "{{current}}/{{max}} attendees",
          "quick_moderation": "Quick moderation",
          "activity_feed": "Recent app activity",
          "hidden_posts": "hidden posts",
          "received_reports": "received reports",
          "pending_requests": "pending requests",
          "active_admins": "active administrators"
        },
        "activity": {
          "user": "User",
          "post": "Post",
          "message": "Chat",
          "notification": "Notice",
          "report": "Report",
          "no_date": "No date",
          "empty": "No activity to show yet."
        },
        "verification": {
          "empty_title": "All caught up",
          "empty_desc": "There are no profiles pending review.",
          "profile": "Profile",
          "selfie": "Selfie",
          "profile_alt": "{{username}} profile",
          "selfie_alt": "{{username}} selfie",
          "note_placeholder": "Note for the user if rejected..."
        },
        "quick_notes": {
          "face_not_clear": "The profile photo does not show a clear face.",
          "selfie_mismatch": "The selfie does not match the profile photo.",
          "blurry_image": "The image is blurry or poorly lit.",
          "close_face": "A close-up of the face is needed.",
          "inappropriate": "Inappropriate content detected."
        },
        "columns": {
          "user": "User",
          "role": "Role",
          "verification": "Verification",
          "bio": "Bio",
          "post": "Post",
          "status": "Status",
          "visibility": "Visibility",
          "attendance": "Attendance",
          "actions": "Actions",
          "reported_post": "Reported post",
          "reported_by": "Reported by",
          "reason": "Reason",
          "action": "Action"
        },
        "actions": {
          "approve": "Approve",
          "reject": "Reject",
          "show": "Show",
          "hide": "Hide",
          "hide_post": "Hide post",
          "reject_profile": "Reject profile"
        },
        "roles": {
          "user": "User",
          "admin": "Admin"
        },
        "visibility": {
          "hidden": "Hidden",
          "visible": "Visible"
        },
        "empty": {
          "users": "No users to show",
          "posts": "No posts to show",
          "reports": "No pending reports",
          "no_bio": "No bio",
          "no_user": "no user",
          "general": "general",
          "unknown_organizer": "unknown organizer",
          "user": "user",
          "no_email": "no email",
          "no_reason": "No reason"
        },
        "reports": {
          "count": "{{count}} reports"
        },
        "dialog": {
          "reject_title": "Confirm rejection",
          "reject_text": "You are about to reject @{{username}}'s verification.",
          "reject_placeholder": "Recommended reason so the user can fix it..."
        },
        "status_values": {
          "approved": "Approved",
          "pending": "Pending",
          "rejected": "Rejected",
          "unverified": "Unverified",
          "accepted": "Accepted",
          "active": "Active",
          "hidden": "Hidden",
          "visible": "Visible",
          "unknown": "Unknown"
        },
        "toasts": {
          "load_error": "Could not load admin data. Check admin session and backend.",
          "user_approved": "User approved",
          "user_updated": "User updated",
          "verification_error": "Could not update verification",
          "role_updated": "Role updated for @{{username}}",
          "role_error": "Could not update the role",
          "post_visible": "Post visible again",
          "post_hidden": "Post hidden",
          "visibility_error": "Could not change post visibility"
        }
      },
      "confirm_delete": {
        "title": "DELETE POST?",
        "warning": "You are about to delete <strong>\"{{title}}\"</strong>. This action will permanently remove the chat, participants, and associated notifications.",
        "confirm": "YES, DELETE ALL",
        "btn_loading": "DELETING..."
      },
      "verify_mobile": {
        "desc": "Take a selfie to verify your identity and access the circle.",
        "btn_open": "OPEN CAMERA",
        "uploading": "UPLOADING VERIFICATION...",
        "success_title": "SENT",
        "success_desc": "You can now close this window and continue on your computer.",
        "err_sync": "Synchronization error"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    load: "languageOnly",
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
