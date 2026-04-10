import { useRef, useState, useEffect } from 'react';
import { Camera, X, Smartphone } from 'lucide-react';
import QRCode from 'react-qr-code';
import { io, Socket } from "socket.io-client";
import './ReverifyModal.css';

interface ReverifyModalProps {
  onClose: () => void;
  onUpload: (image: string) => void;
}

const ReverifyModal = ({ onClose, onUpload }: ReverifyModalProps) => {
  const [mode, setMode] = useState<'options' | 'camera' | 'qr'>('options');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sessionId] = useState(() => `lynkn_reverify_${Date.now()}`);
  const [isReceiving, setIsReceiving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const socket: Socket = io(SERVER_URL, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    if (mode === 'qr') {
      socket.emit('join-session', sessionId);
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
  }, [mode, sessionId, SERVER_URL]);

  const startCamera = async () => {
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { 
      alert("No se pudo acceder a la cámara.");
      setMode('options');
    }
  };

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

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  return (
    <div className="modal-overlay blur">
      <div className="reverify-content">
        <header className="reverify-header">
          <h3>RE-VERIFICACIÓN</h3>
          <button onClick={() => { stopCamera(); onClose(); }} className="close-btn">
            <X size={20} />
          </button>
        </header>

        <div className="camera-box">
          {!capturedImage ? (
            <>
              {mode === 'options' && (
                <div className="verification-options">
                  <button className="btn-verify-opt" onClick={startCamera}>
                    <Camera size={20} /> USAR WEBCAM PC
                  </button>
                  <button className="btn-verify-opt" onClick={() => setMode('qr')}>
                    <Smartphone size={20} /> USAR MÓVIL (QR)
                  </button>
                </div>
              )}

              {mode === 'camera' && (
                <div className="video-wrapper">
                  <video ref={videoRef} autoPlay playsInline muted />
                  <div className="camera-ui-overlay">
                    <button onClick={takePhoto} className="capture-btn">CAPTURAR</button>
                    <button onClick={() => setMode('options')} className="btn-cancel-cam">VOLVER</button>
                  </div>
                </div>
              )}

              {mode === 'qr' && (
                <div className="qr-view">
                  {isReceiving ? (
                    <div className="loader-container">
                      <div className="loader"></div>
                      <p>RECIBIENDO IMAGEN...</p>
                    </div>
                  ) : (
                    <div className="qr-container">
                      <QRCode value={`${window.location.origin}/verify/${sessionId}`} size={180} />
                      <p>Escanea para abrir la cámara en tu móvil</p>
                    </div>
                  )}
                  <button className="btn-cancel" onClick={() => setMode('options')}>CANCELAR</button>
                </div>
              )}
            </>
          ) : (
            <div className="preview-wrapper">
              <img src={capturedImage} alt="Capture" />
              <div className="preview-actions">
                <button onClick={() => { setCapturedImage(null); setMode('options'); }} className="retry-btn">
                  REPETIR
                </button>
                <button onClick={() => onUpload(capturedImage)} className="confirm-btn">
                  ENVIAR A REVISIÓN
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