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
        "or": "O"
      },
      "auth": {
        "login": {
          "subtitle": "Acceso exclusivo al círculo.",
          "identifier_placeholder": "EMAIL O USUARIO",
          "password_placeholder": "CONTRASEÑA",
          "submit": "ENTRAR",
          "btn_verifying": "VERIFICANDO...",
          "btn_google": "CONTINUAR CON GOOGLE",
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
          "ERR_BIRTH_REQUIRED": "La fecha de nacimiento es obligatoria.",
          "invalid_data": "Los datos introducidos no son válidos.",
          "invalid_credentials": "El correo/usuario y/o la contraseña no coinciden.",
        }
      },
      "register": {
        "step_basic": "DATOS BÁSICOS",
        "step_identity": "IDENTIDAD",
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
          "ai_error": "Error en el escaneo."
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
        "subtitle": "Gestiona tu experiencia en Lynkn",
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
        "no_bio": "Sin biografía aún...",
        "no_location": "Ubicación no especificada",
        "rejected_title": "VERIFICACIÓN RECHAZADA",
        "admin_note": "NOTA DEL ADMINISTRADOR:",
        "rejected_desc": "Tu identidad no pudo ser confirmada. Por favor, revisa tus fotos.",
        "retry": "REINTENTAR",
        "view_posts": "POSTS",
        "view_map": "MAPA",
        "empty_posts": "Aún no hay publicaciones",
        "empty_posts_desc": "Tus capturas aparecerán aquí.",
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
        "saving": "GUARDANDO...",
        "save_btn": "GUARDAR CAMBIOS",
        "err_size": "La imagen es demasiado grande. Máximo 2MB.",
        "err_username": "El nombre de usuario es obligatorio.",
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
        "sidebar_title": "Tus Chats",
        "empty_events": "No tienes eventos activos",
        "chat_group": "Chat de grupo",
        "pending_quota": "Cupo incompleto",
        "chat_locked_title": "Chat restringido",
        "chat_locked_desc": "Este chat se abrirá cuando se complete el cupo.",
        "no_chat_selected": "Selecciona un grupo para chatear",
        "input_placeholder": "Escribe un mensaje...",
        "loading_chats": "Cargando chats..."
      },
      "sidebar": {
        "main_menu": "MENÚ PRINCIPAL",
        "explore": "Explorar",
        "profile": "Perfil",
        "messages": "Mensajes",
        "my_requests": "Mis solicitudes",
        "notifications": "Notificaciones",
        "actions": "ACCIONES",
        "new_post": "Nuevo Post",
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
        "title": "NUEVA PUBLICACIÓN",
        "restricted": "ACCIÓN RESTRINGIDA",
        "restricted_desc": "Debes verificar tu identidad para poder realizar publicaciones en LYNKN.",
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
        "post_title": "TÍTULO",
        "title_placeholder": "Ej: Graffiti en Malasaña",
        "description": "DESCRIPCIÓN",
        "desc_placeholder": "¿Qué lo hace especial?",
        "submit": "PUBLICAR",
        "analyzing": "VERIFICANDO...",
        "success_title": "¡PUBLICADO!",
        "success_desc": "Tu descubrimiento ya es parte del mapa.",
        "err_size": "Imagen demasiado pesada",
        "err_size_desc": "El límite es de 3MB para la validación por IA.",
        "err_quota": "Define el aforo",
        "err_quota_desc": "Indica al menos 1 participante.",
        "err_missing": "Faltan datos",
        "err_security": "Rechazado por Seguridad"
      },
      "explore": {
        "search_placeholder": "BUSCAR EVENTOS, GRUPOS...",
        "btn_map": "MAPA",
        "btn_posts": "POSTS",
        "details_btn": "VER DETALLES",
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
        "unlimited_event": "EVENTO ILIMITADO",
        "spots_left": "{{count}} plazas disponibles",
        "status": {
          "denied": "ACCESO DENEGADO",
          "joining": "Enviando...",
          "join": "SOLICITAR UNIRSE",
          "accepted": "INSCRITO - GESTIONAR",
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
        "or": "OR"
      },
      "auth": {
        "login": {
          "subtitle": "Exclusive access to the circle.",
          "identifier_placeholder": "EMAIL OR USERNAME",
          "password_placeholder": "PASSWORD",
          "submit": "SIGN IN",
          "btn_verifying": "VERIFYING...",
          "btn_google": "CONTINUE WITH GOOGLE",
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
          "ERR_BIRTH_REQUIRED": "Date of birth is required.",
          "invalid_data": "The entered data is invalid.",
          "invalid_credentials": "The email/username and/or password do not match."
        }
      },
      "register": {
        "step_basic": "BASIC INFO",
        "step_identity": "IDENTITY",
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
          "ai_error": "Scanning error."
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
        "subtitle": "Manage your Lynkn experience",
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
        "no_bio": "No biography yet...",
        "no_location": "Location not specified",
        "rejected_title": "VERIFICATION REJECTED",
        "admin_note": "ADMINISTRATOR NOTE:",
        "rejected_desc": "Your identity could not be confirmed. Please check your photos.",
        "retry": "RETRY",
        "view_posts": "POSTS",
        "view_map": "MAP",
        "empty_posts": "No posts yet",
        "empty_posts_desc": "Your captures will appear here.",
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
        "saving": "SAVING...",
        "save_btn": "SAVE CHANGES",
        "err_size": "The image is too large. Max 2MB.",
        "err_username": "Username is required.",
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
        "sidebar_title": "Your Chats",
        "empty_events": "No active events",
        "chat_group": "Group Chat",
        "pending_quota": "Quota incomplete",
        "chat_locked_title": "Restricted Chat",
        "chat_locked_desc": "This chat will open once the quota is full.",
        "no_chat_selected": "Select a group to chat",
        "input_placeholder": "Type a message...",
        "loading_chats": "Loading chats..."
      },
      "sidebar": {
        "main_menu": "MAIN MENU",
        "explore": "EXPLORE",
        "profile": "MY PROFILE",
        "messages": "MESSAGES",
        "my_requests": "MY REQUESTS",
        "notifications": "NOTIFICATIONS",
        "actions": "ACTIONS",
        "new_post": "NEW POST",
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
        "title": "NEW POST",
        "restricted": "ACTION RESTRICTED",
        "restricted_desc": "You must verify your identity to be able to post on LYNKN.",
        "go_profile": "GO TO PROFILE",
        "add_photo": "ADD PHOTO",
        "moderating": "MODERATING...",
        "loc_label": "EVENT LOCATION",
        "search_place": "Search for a place...",
        "loc_fixed": "Location set",
        "loc_searching": "Locating...",
        "participants": "PARTICIPANTS",
        "unlimited": "UNLIMITED",
        "limit_placeholder": "E.g.: 20",
        "post_title": "TITLE",
        "title_placeholder": "E.g.: Street art in London",
        "description": "DESCRIPTION",
        "desc_placeholder": "What makes it special?",
        "submit": "POST",
        "analyzing": "VERIFYING...",
        "success_title": "PUBLISHED!",
        "success_desc": "Your discovery is now part of the map.",
        "err_size": "Image too heavy",
        "err_size_desc": "The limit is 3MB for AI validation.",
        "err_quota": "Set capacity",
        "err_quota_desc": "Indicate at least 1 participant.",
        "err_missing": "Missing data",
        "err_security": "Security Rejection"
      },
      "explore": {
        "search_placeholder": "SEARCH EVENTS, GROUPS...",
        "btn_map": "MAP",
        "btn_posts": "POSTS",
        "details_btn": "VIEW DETAILS",
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
        "unlimited_event": "UNLIMITED EVENT",
        "spots_left": "{{count}} spots left",
        "status": {
          "denied": "ACCESS DENIED",
          "joining": "Sending...",
          "join": "REQUEST TO JOIN",
          "accepted": "JOINED - MANAGE",
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
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;