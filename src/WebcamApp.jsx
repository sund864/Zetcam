import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone, Maximize2, SwitchCamera, VideoOff, RefreshCw, Battery, Mic, MicOff, Settings, Sun, LogOut, SunMoon, RotateCw } from 'lucide-react';
import Peer from 'peerjs';

// --- HELPER COMPONENT: Video Player (PC Side handles Color & Rotation) ---
const VideoPlayer = ({ stream, isLocal = false, lowLight = false, rotation = 0 }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full h-full overflow-hidden rounded-lg shadow-2xl bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{ 
          transform: `rotate(${rotation}deg) scale(${rotation % 180 !== 0 ? 1.3 : 1})`,
          transition: 'transform 0.3s ease-in-out',
          filter: lowLight ? 'brightness(1.3) contrast(1.15) saturate(1.2)' : 'none'
        }}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function WebcamApp() {
  const [role, setRole] = useState('select'); 
  const [roomId, setRoomId] = useState('');

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-amber-500/30 overflow-hidden">
      {role === 'select' && <RoleSelection setRole={setRole} setRoomId={setRoomId} />}
      {role === 'receiver' && <Receiver roomId={roomId} goBack={() => setRole('select')} />}
      {role === 'sender' && <Sender roomId={roomId} goBack={() => setRole('select')} />}
    </div>
  );
}

// --- SCREEN: Role Selection ---
function RoleSelection({ setRole, setRoomId }) {
  const handleSelectReceiver = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setRoomId(code);
    setRole('receiver');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-4xl mx-auto text-center">
      <div className="mb-12 space-y-4">
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent drop-shadow-sm">
          Zetcam Pro
        </h1>
        <p className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          Wireless high-fidelity streaming. Turn your phone into a premium webcam.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
        <button onClick={handleSelectReceiver} className="group flex flex-col items-center p-8 bg-stone-800 border border-stone-700 rounded-3xl hover:bg-stone-800 hover:border-amber-500 transition-all shadow-xl text-left w-full focus:ring-4 focus:ring-amber-500/50">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 text-stone-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg"><Monitor className="w-10 h-10" /></div>
          <h2 className="text-2xl font-bold mb-2">I am the PC</h2>
          <p className="text-stone-400 text-center">Receive video and control the camera remotely.</p>
        </button>

        <button onClick={() => setRole('sender')} className="group flex flex-col items-center p-8 bg-stone-800 border border-stone-700 rounded-3xl hover:bg-stone-800 hover:border-rose-500 transition-all shadow-xl text-left w-full focus:ring-4 focus:ring-rose-500/50">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-red-500 text-stone-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg"><Smartphone className="w-10 h-10" /></div>
          <h2 className="text-2xl font-bold mb-2">I am the Camera</h2>
          <p className="text-stone-400 text-center">Broadcast video. You'll need a code from the PC.</p>
        </button>
      </div>
    </div>
  );
}

// --- SCREEN: Receiver (PC Side - The Master Controller) ---
function Receiver({ roomId, goBack }) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('Waiting for camera...');
  const [isPhoneSwitching, setIsPhoneSwitching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // PC Local Effects
  const [lowLightMode, setLowLightMode] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Synced Phone State (Received from phone)
  const [phoneState, setPhoneState] = useState({ mic: false, torch: false, quality: 'high' });
  
  const peerRef = useRef(null);
  const activeCallRef = useRef(null);
  const activeDataConnRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const peer = new Peer(`webcam-app-${roomId}`);
    peerRef.current = peer;

    peer.on('open', () => setStatus('Waiting for camera to connect...'));

    peer.on('call', (call) => {
      setStatus('Connecting to camera...');
      activeCallRef.current = call;
      call.answer(); 
      call.on('stream', (stream) => {
        setRemoteStream(stream);
        setStatus('Connected');
        setIsPhoneSwitching(false); 
      });
      call.on('close', () => {
        setStatus('Camera disconnected. Waiting...');
        setRemoteStream(null);
      });
    });

    peer.on('connection', (conn) => {
      activeDataConnRef.current = conn;
      conn.on('data', (data) => {
        if (data.type === 'PHONE_SWITCHING_START') {
          setIsPhoneSwitching(true);
        }
        if (data.type === 'STATE_SYNC') {
          setPhoneState(data.state);
        }
      });
    });

    return () => { if (peerRef.current) peerRef.current.destroy(); };
  }, [roomId]);

  const sendCommandToPhone = (cmd, payload = {}) => {
    if (activeDataConnRef.current && activeDataConnRef.current.open) {
      activeDataConnRef.current.send({ type: cmd, ...payload });
    }
  };

  const handlePcDisconnect = () => {
    if (activeCallRef.current) activeCallRef.current.close();
    if (activeDataConnRef.current) activeDataConnRef.current.close();
    setRemoteStream(null);
    setStatus('Connection ended by PC. Waiting for camera...');
    setShowSettings(false);
  };

  const toggleFullScreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(e => console.error(e));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black relative group" ref={containerRef}>
      <div className="flex-1 w-full h-full relative p-4">
        {remoteStream && !isPhoneSwitching ? (
          <VideoPlayer stream={remoteStream} isLocal={false} lowLight={lowLightMode} rotation={rotation} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500">
            <RefreshCw className={`w-16 h-16 mb-6 opacity-40 ${isPhoneSwitching ? 'animate-spin text-amber-500' : ''}`} />
            <p className="text-2xl font-medium tracking-wide">
              {isPhoneSwitching ? 'Cycling Phone Hardware...' : status}
            </p>
          </div>
        )}
      </div>

      <div className={`absolute inset-x-0 top-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${remoteStream && !isPhoneSwitching ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <button onClick={goBack} className="text-sm bg-white/10 hover:bg-amber-500 hover:text-stone-900 px-5 py-2.5 rounded-full backdrop-blur-md font-bold transition-all uppercase tracking-wider shadow-xl">← Leave Room</button>
        {!remoteStream && (
          <div className="bg-stone-900/80 backdrop-blur-xl p-8 rounded-3xl border border-stone-700 shadow-2xl text-center">
            <p className="text-amber-500 font-bold mb-2 text-sm uppercase tracking-widest">Pairing Code</p>
            <div className="text-7xl font-mono font-extrabold tracking-widest text-stone-100 drop-shadow-lg">{roomId}</div>
            <p className="text-stone-400 mt-4 max-w-xs text-sm">Enter this code on your phone.</p>
          </div>
        )}
      </div>

      {/* The Master PC Settings Menu */}
      {remoteStream && !isPhoneSwitching && (
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3 z-50">
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="p-4 bg-stone-900/80 hover:bg-amber-500 hover:text-black backdrop-blur-xl rounded-full text-white border border-stone-700 transition-all shadow-2xl"
            title="Remote Controls"
          >
            <Settings className="w-7 h-7" />
          </button>

          {showSettings && (
            <div className="bg-stone-900/95 backdrop-blur-xl border border-stone-700 p-5 rounded-3xl shadow-2xl w-80 animate-in fade-in slide-in-from-top-4 flex flex-col gap-3">
              
              <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider px-2 border-b border-stone-800 pb-2">Remote Hardware</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => sendCommandToPhone('CMD_TOGGLE_LENS')} className="flex flex-col items-center gap-2 p-3 bg-stone-800 hover:bg-stone-700 rounded-2xl font-bold text-xs transition-all text-white">
                  <SwitchCamera className="w-5 h-5 text-amber-500" /> Switch Lens
                </button>
                <button onClick={() => sendCommandToPhone('CMD_TOGGLE_TORCH')} className={`flex flex-col items-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all ${phoneState.torch ? 'bg-amber-500 text-stone-900' : 'bg-stone-800 hover:bg-stone-700 text-white'}`}>
                  <Sun className="w-5 h-5" /> Flashlight
                </button>
                <button onClick={() => sendCommandToPhone('CMD_TOGGLE_MIC')} className={`flex flex-col items-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all ${phoneState.mic ? 'bg-amber-500 text-stone-900' : 'bg-stone-800 hover:bg-stone-700 text-white'}`}>
                  {phoneState.mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />} Audio
                </button>
                <button onClick={() => sendCommandToPhone('CMD_SET_QUALITY', { mode: phoneState.quality === 'high' ? 'performance' : 'high' })} className="flex flex-col items-center gap-2 p-3 bg-stone-800 hover:bg-stone-700 rounded-2xl font-bold text-xs transition-all text-white">
                  <Monitor className="w-5 h-5 text-emerald-400" /> {phoneState.quality === 'high' ? '1080p Mode' : '720p 60fps'}
                </button>
              </div>

              <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider px-2 border-b border-stone-800 pb-2 mt-2">PC Visual Adjustments</h3>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setLowLightMode(!lowLightMode)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all ${lowLightMode ? 'bg-indigo-500 text-white' : 'bg-stone-800 hover:bg-stone-700 text-white'}`}>
                  <SunMoon className="w-5 h-5" /> Color Correct
                </button>
                <button onClick={() => setRotation(prev => prev === 0 ? 90 : prev === 90 ? 180 : prev === 180 ? 270 : 0)} className="flex flex-col items-center gap-2 p-3 bg-stone-800 hover:bg-stone-700 rounded-2xl font-bold text-xs transition-all text-white">
                  <RotateCw className="w-5 h-5 text-sky-400" /> Rotate Feed
                </button>
              </div>
              
              <button onClick={handlePcDisconnect} className="mt-2 flex justify-center items-center gap-3 px-4 py-3 bg-rose-600/20 hover:bg-rose-600 hover:text-white rounded-2xl font-bold text-sm transition-all text-rose-500 border border-rose-500/30">
                <LogOut className="w-5 h-5" /> Disconnect Camera
              </button>
            </div>
          )}
        </div>
      )}

      {/* Persistent Fullscreen Toggle */}
      {remoteStream && (
        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40">
          <button onClick={toggleFullScreen} className="bg-black/60 hover:bg-amber-500 hover:text-black backdrop-blur-md p-4 rounded-full text-white transition-all shadow-lg border border-white/10" title="Toggle Fullscreen">
            <Maximize2 className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- SCREEN: Sender (Phone Side - Stripped Down for Stability) ---
function Sender({ roomId, goBack }) {
  const [inputCode, setInputCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [localStream, setLocalStream] = useState(null);
  const [connected, setConnected] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  
  // Phone State (Controlled by PC commands)
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [qualityMode, setQualityMode] = useState('high'); 

  const peerRef = useRef(null);
  const callRef = useRef(null);
  const dataConnRef = useRef(null); 
  const targetRoomIdRef = useRef(roomId);

  // Sync state back to PC whenever it changes
  useEffect(() => {
    if (dataConnRef.current && dataConnRef.current.open) {
      dataConnRef.current.send({
        type: 'STATE_SYNC',
        state: { mic: micEnabled, torch: torchEnabled, quality: qualityMode }
      });
    }
  }, [micEnabled, torchEnabled, qualityMode, connected]);

  const stopStream = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  useEffect(() => { return () => stopStream(); }, []);

  const requestOptimizedStream = async (facing, mode) => {
    const facingMode = facing ? 'user' : 'environment';
    const baseConstraints = { audio: true }; 
    try {
      if (mode === 'high') return await navigator.mediaDevices.getUserMedia({ ...baseConstraints, video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } });
      else return await navigator.mediaDevices.getUserMedia({ ...baseConstraints, video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } } });
    } catch (e1) {
      return await navigator.mediaDevices.getUserMedia({ ...baseConstraints, video: { facingMode } });
    }
  };

  const startCameraAndConnect = async (roomIdToConnect, overrideFacing = null, overrideQuality = null) => {
    setErrorMsg('');
    setIsConnecting(true);
    targetRoomIdRef.current = roomIdToConnect;
    
    const currentFacing = overrideFacing !== null ? overrideFacing : isFrontCamera;
    const currentQuality = overrideQuality !== null ? overrideQuality : qualityMode;

    try {
      const stream = await requestOptimizedStream(currentFacing, currentQuality);
      stream.getAudioTracks().forEach(track => track.enabled = micEnabled);
      setLocalStream(stream);

      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const targetId = `webcam-app-${roomIdToConnect}`;
        const conn = peer.connect(targetId);
        dataConnRef.current = conn;
        
        conn.on('open', () => {
          setConnected(true);
          setIsConnecting(false);
          // Send initial state sync
          conn.send({ type: 'STATE_SYNC', state: { mic: micEnabled, torch: torchEnabled, quality: currentQuality } });
        });

        // Command Listener from PC
        conn.on('data', (data) => {
          if (data.type === 'CMD_TOGGLE_LENS') executeCameraSwitch();
          if (data.type === 'CMD_TOGGLE_MIC') toggleMic(stream);
          if (data.type === 'CMD_TOGGLE_TORCH') toggleTorch(stream);
          if (data.type === 'CMD_SET_QUALITY') executeQualityChange(data.mode);
        });
        
        conn.on('close', () => {
          setConnected(false);
          setErrorMsg("PC disconnected the session.");
          stopStream(); 
        });

        const call = peer.call(targetId, stream);
        callRef.current = call;
        call.on('close', () => {
          setConnected(false);
          setErrorMsg("Webcam stream stopped by PC.");
          stopStream();
        });
      });

      peer.on('error', (err) => {
        setIsConnecting(false);
        stopStream();
        setErrorMsg(err.type === 'peer-unavailable' ? "PC not found. Check the pairing code." : err.message);
      });

    } catch (err) {
      setIsConnecting(false);
      stopStream();
      setErrorMsg(err.name === 'NotAllowedError' ? "Camera permission denied." : err.message);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputCode.length === 5) startCameraAndConnect(inputCode);
  };

  // --- Hardware Controllers ---
  const executeCameraSwitch = () => {
    setIsFrontCamera(prev => {
      const nextMode = !prev;
      setTorchEnabled(false);
      if (dataConnRef.current && dataConnRef.current.open) dataConnRef.current.send({ type: 'PHONE_SWITCHING_START' });
      setIsConnecting(true);
      stopStream(); 
      setTimeout(() => startCameraAndConnect(targetRoomIdRef.current, nextMode, qualityMode), 300);
      return nextMode;
    });
  };

  const executeQualityChange = (newMode) => {
    setQualityMode(newMode);
    setTorchEnabled(false);
    if (dataConnRef.current && dataConnRef.current.open) dataConnRef.current.send({ type: 'PHONE_SWITCHING_START' });
    setIsConnecting(true);
    stopStream();
    setTimeout(() => startCameraAndConnect(targetRoomIdRef.current, isFrontCamera, newMode), 300);
  };

  const toggleMic = (activeStream) => {
    setMicEnabled(prev => {
      const newState = !prev;
      if (activeStream) activeStream.getAudioTracks().forEach(track => track.enabled = newState);
      return newState;
    });
  };

  const toggleTorch = async (activeStream) => {
    if (!activeStream) return;
    const track = activeStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities && track.getCapabilities();
    if (capabilities && capabilities.torch) {
      setTorchEnabled(prev => {
        const newState = !prev;
        track.applyConstraints({ advanced: [{ torch: newState }] }).catch(e => console.log(e));
        return newState;
      });
    }
  };

  // --- RENDER LIVE CAMERA (Ultra Minimal UI to prevent freezing) ---
  if (localStream) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-black relative">
        {batterySaver && (
          <div className="absolute inset-0 bg-black z-50 flex items-center justify-center cursor-pointer" onClick={() => setBatterySaver(false)}>
            <p className="text-stone-700 text-xl font-bold animate-pulse">Tap anywhere to wake screen</p>
          </div>
        )}

        <div className="flex-1 w-full h-full relative">
          <VideoPlayer stream={localStream} isLocal={true} />
          
          <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/80 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 text-sm font-bold shadow-2xl">
             <div className={`w-3 h-3 rounded-full ${connected ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
             <span className="tracking-widest uppercase">{connected ? 'LIVE TO PC' : 'CONNECTING...'}</span>
          </div>
        </div>

        {/* Minimal Control Bar */}
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent flex justify-center gap-6 items-center pb-safe">
          <button onClick={() => setBatterySaver(true)} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all shadow-xl backdrop-blur-md border border-white/20 flex items-center gap-2 px-6 font-bold text-xs uppercase tracking-wider">
            <Battery className="w-5 h-5" /> Battery Saver
          </button>

          <button onClick={() => { stopStream(); goBack(); }} className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-rose-600/50 shadow-2xl border border-rose-500 flex items-center gap-2 px-6 font-bold text-xs uppercase tracking-wider">
            <LogOut className="w-5 h-5" /> Disconnect
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER CONNECTION FORM ---
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 max-w-md mx-auto relative">
      <button onClick={goBack} className="absolute top-6 left-6 text-sm bg-stone-800 hover:bg-stone-700 px-5 py-2.5 rounded-full font-bold transition-all border border-stone-700 uppercase tracking-wider">← Back</button>
      <div className="w-full bg-stone-800/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-stone-700 shadow-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-red-500 text-stone-900 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg"><Smartphone className="w-10 h-10" /></div>
        <h2 className="text-3xl font-extrabold text-center mb-2">Link Camera</h2>
        <p className="text-stone-400 text-center mb-10 text-sm font-medium">Enter the 5-digit code shown on your PC.</p>
        <form onSubmit={handleJoin} className="space-y-6">
          <input type="text" maxLength="5" placeholder="00000" value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))} className="w-full bg-stone-900 border-2 border-stone-700 focus:border-rose-500 rounded-2xl px-6 py-5 text-center text-5xl font-mono font-black tracking-[0.25em] text-white outline-none transition-all shadow-inner" required disabled={isConnecting} />
          {errorMsg && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-2xl text-sm font-bold text-center">{errorMsg}</div>}
          <button type="submit" disabled={inputCode.length !== 5 || isConnecting} className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:from-stone-700 disabled:to-stone-700 disabled:text-stone-500 text-white font-extrabold text-lg py-5 rounded-2xl transition-all flex justify-center items-center gap-3 shadow-xl hover:shadow-rose-500/30 uppercase tracking-widest">
            {isConnecting ? <><RefreshCw className="w-6 h-6 animate-spin" /> Linking...</> : 'Go Live'}
          </button>
        </form>
      </div>
    </div>
  );
}