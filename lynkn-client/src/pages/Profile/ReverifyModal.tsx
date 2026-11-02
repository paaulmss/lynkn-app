import { selfieUrl } from '../../api/publicUrl';
import { useRef, useState, useEffect } from 'react';
import { Camera, X, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { io, Socket } from "socket.io-client";
import { toast } from 'sonner';
import { API_BASE_URL } from '../../api/axiosConfig';
import './ReverifyModal.css';

interface ReverifyModalProps {
  onClose: () => void;
  onUpload: (image: string) => void;
}

const ReverifyModal = ({ onClose, onUpload }: ReverifyModalProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'options' | 'camera' | 'qr'>('options');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [senderToken, setSenderToken] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const SERVER_URL = API_BASE_URL;

  const isDarkMode = localStorage.getItem("theme") !== "light";

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        t.stop();
        console.log("Cámara apagada:", t.label);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (mode !== 'qr') return;
    const socket: Socket = io(SERVER_URL, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    if (mode === 'qr') {
      socket.on('connect', () => {
        setSessionId(''); setSenderToken('');
      socket.emit('create-selfie-session', (result: { status: string; sessionId: string; token: string }) => {
          if (result.status === 'ok') { setSessionId(result.sessionId); setSenderToken(result.token); }
          else toast.error(t('common.error'));
        });
      });
      socket.on('receive-selfie', (imageBase64: string) => {
        setIsReceiving(true);
        setCapturedImage(imageBase64);
        setIsReceiving(false);
        setMode('options');
      });
    }

    return () => {
      socket.off('receive-selfie');
      socket.disconnect();
    };
  }, [mode, SERVER_URL, t]);

  useEffect(() => {
    if (mode !== 'camera') return;
    let disposed = false;
    let currentStream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then((stream) => {
      if (disposed) { stream.getTracks().forEach((track) => track.stop()); return; }
      currentStream = stream; streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(() => {
      if (!disposed) { toast.error(t('reverify.cam_error')); setMode('options'); }
    });
    const background = () => { if (document.hidden) setMode('options'); };
    document.addEventListener('visibilitychange', background);
    return () => {
      disposed = true;
      currentStream?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === currentStream) streamRef.current = null;
      document.removeEventListener('visibilitychange', background);
    };
  }, [mode, t]);
  const startCamera = () => setMode('camera');

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  return (
    <div className={`modal-overlay blur ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="reverify-content">
        <header className="reverify-header">
          <h3>{t('reverify.title')}</h3>
          <button onClick={() => { stopCamera(); onClose(); }} className="close-btn">
            <X size={20} color="var(--text-main)" />
          </button>
        </header>

        <div className="camera-box">
          {!capturedImage ? (
            <>
              {mode === 'options' && (
                <div className="verification-options">
                  <button className="btn-verify-opt" onClick={startCamera}>
                    <Camera size={20} /> {t('reverify.use_pc')}
                  </button>
                  <button className="btn-verify-opt" onClick={() => setMode('qr')}>
                    <Smartphone size={20} /> {t('reverify.use_mobile')}
                  </button>
                </div>
              )}

              {mode === 'camera' && (
                <div className="video-wrapper">
                  <video ref={videoRef} autoPlay playsInline muted />
                  <div className="camera-ui-overlay">
                    <button onClick={takePhoto} className="capture-btn">{t('reverify.capture')}</button>
                    <button onClick={() => { stopCamera(); setMode('options'); }} className="btn-cancel-cam">
                      {t('common.back')}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'qr' && (
                <div className="qr-view">
                  {isReceiving ? (
                    <div className="loader-container">
                      <div className="loader"></div>
                      <p>{t('reverify.receiving')}</p>
                    </div>
                  ) : (
                    <div className="qr-container">
                      <div className="qr-bg-wrapper">
                         {sessionId && senderToken && <QRCode
                            value={selfieUrl(sessionId, senderToken)}
                            size={180}
                            bgColor={isDarkMode ? "transparent" : "#ffffff"}
                            fgColor={isDarkMode ? "#00f2ff" : "#000000"}
                         />}
                      </div>
                      <p>{t('reverify.qr_desc')}</p>
                    </div>
                  )}
                  <button className="btn-cancel" onClick={() => setMode('options')}>{t('common.cancel')}</button>
                </div>
              )}
            </>
          ) : (
            <div className="preview-wrapper">
              <img src={capturedImage} alt="Capture" />
              <div className="preview-actions">
                <button onClick={() => { setCapturedImage(null); setMode('options'); }} className="retry-btn">
                  {t('reverify.retry')}
                </button>
                <button onClick={() => onUpload(capturedImage)} className="confirm-btn">
                  {t('reverify.send')}
                </button>
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ReverifyModal;
