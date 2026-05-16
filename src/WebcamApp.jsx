import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone, Maximize2, SwitchCamera, VideoOff, RefreshCw, Battery, Mic, MicOff, Settings, Sun, LogOut, SunMoon, RotateCw, Info, X } from 'lucide-react';
import Peer from 'peerjs';

// --- HELPER COMPONENT: Video Player ---
const VideoPlayer = ({ stream, isLocal = false, lowLight = false, rotation = 0 }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full h-full overflow-hidden rounded-lg shadow-[0_0_30px_rgba(255,20,147,0.15)] bg-black flex items-center justify-center">
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      setRole('receiver');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff3b3b]/30 overflow-hidden">
      {role === 'select' && <RoleSelection setRole={setRole} setRoomId={setRoomId} />}
      {role === 'receiver' && <Receiver roomId={roomId} goBack={() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        setRole('select');
      }} />}
      {role === 'sender' && <Sender roomId={roomId} goBack={() => setRole('select')} />}
    </div>
  );
}

// --- SCREEN: Role Selection (With Updated Sizing and Pinkish-White Glow) ---
function RoleSelection({ setRole, setRoomId }) {
  const [showGuide, setShowGuide] = useState(false);

  const handleSelectReceiver = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setRoomId(code);
    setRole('receiver');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 md:p-6 max-w-5xl mx-auto text-center relative">
      
      {/* HEADER: Logo with new pinkish-white shadow */}
      <div className="flex flex-col items-center mb-8 md:mb-12 space-y-4 md:space-y-6">
        <img 
          src="./logo.jpg" 
          alt="Zetcam" 
          className="w-48 md:w-64 rounded-3xl shadow-[0_0_25px_rgba(255,220,235,0.4)] transition-all" 
        />
        <div className="space-y-2 md:space-y-3">
          {/* Welcome text size updated to match "I am the PC" */}
          <h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-[#ff1493] to-[#ff3b3b] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,20,147,0.3)] leading-tight">
            Welcome to Zetcam
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium">Select a device mode to begin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-10">
        {/* PC Card with matching pinkish-white shadow */}
        <button onClick={handleSelectReceiver} className="group flex flex-col items-center p-6 md:p-8 bg-[#111] border border-[#222] rounded-3xl hover:bg-[#151515] hover:border-[#ff3b3b] transition-all shadow-[0_0_25px_rgba(255,220,235,0.4)] hover:shadow-[0_0_35px_rgba(255,220,235,0.6)] text-left w-full focus:ring-4 focus:ring-[#ff3b3b]/50">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#9933ff]/20 to-[#ff3b3b]/20 border border-[#ff3b3b]/50 text-[#ff3b3b] rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,59,59,0.5)]"><Monitor className="w-8 h-8 md:w-10 md:h-10" /></div>
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">I am the PC</h2>
          <p className="text-gray-400 text-sm md:text-base text-center">Receive video and control the camera remotely.</p>
        </button>

        {/* Camera Card with matching pinkish-white shadow */}
        <button onClick={() => setRole('sender')} className="group flex flex-col items-center p-6 md:p-8 bg-[#111] border border-[#222] rounded-3xl hover:bg-[#151515] hover:border-[#ff1493] transition-all shadow-[0_0_25px_rgba(255,220,235,0.4)] hover:shadow-[0_0_35px_rgba(255,220,235,0.6)] text-left w-full focus:ring-4 focus:ring-[#ff1493]/50">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#ff1493]/20 to-[#9933ff]/20 border border-[#ff1493]/50 text-[#ff1493] rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,20,147,0.5)]"><Smartphone className="w-8 h-8 md:w-10 md:h-10" /></div>
          <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">I am the Camera</h2>
          <p className="text-gray-400 text-sm md:text-base text-center">Broadcast video. You'll need a code from the PC.</p>
        </button>
      </div>

      <button 
        onClick={() => setShowGuide(true)} 
        className="flex items-center gap-2 px-6 py-3 bg-[#111] hover:bg-[#222] text-gray-300 hover:text-[#ff1493] border border-[#333] hover:border-[#ff1493] rounded-full font-bold transition-all shadow-[0_0_15px_rgba(255,220,235,0.1)] text-sm md:text-base"
      >
        <Info className="w-4 h-4 md:w-5 md:h-5" /> How to connect to OBS Studio
      </button>

      {/* OBS GUIDE MODAL */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[0_0_50px_rgba(255,20,147,0.2)] text-left relative animate-in fade-in zoom-in-95">
            
            <button 
              onClick={() => setShowGuide(false)} 
              className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-[#222] hover:bg-[#ff3b3b] text-gray-400 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">OBS Studio Setup Guide</h2>
            <p className="text-[#ff1493] font-medium mb-6 md:mb-8 text-sm md:text-base">Stream directly to your software without opening a browser window.</p>

            <div className="space-y-4 md:space-y-6 text-gray-300 text-sm md:text-base">
              <section>
                <h3 className="text-[#9933ff] font-bold text-base md:text-lg mb-1 md:mb-2">Step 1: Pick your Code</h3>
                <p>Decide on a permanent 5-digit number you will always use for OBS (e.g., <code className="bg-black border border-[#333] px-2 py-0.5 rounded text-[#ff3b3b]">77777</code>).</p>
              </section>

              <section>
                <h3 className="text-[#9933ff] font-bold text-base md:text-lg mb-1 md:mb-2">Step 2: Add Browser Source</h3>
                <p>Open OBS and select your streaming scene. Go to the <strong>Sources</strong> dock, click the <strong>+</strong> button, and select <strong>Browser</strong>. Name it "Zetcam".</p>
              </section>

              <section>
                <h3 className="text-[#9933ff] font-bold text-base md:text-lg mb-1 md:mb-2">Step 3: Configure the Link</h3>
                <p className="mb-2">In the properties window, set the following:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>URL:</strong> Copy your personalized link and paste it into OBS: <br/> <code className="bg-black border border-[#333] px-2 py-0.5 rounded text-[#ff3b3b] break-all block mt-1 select-all">https://sund864.github.io/Zetcam/?room=77777</code></li>
                  <li><strong>Width:</strong> <code className="text-white">1920</code> | <strong>Height:</strong> <code className="text-white">1080</code></li>
                  <li><strong>Custom CSS:</strong> Delete all text in this box.</li>
                  <li>Check the box for <strong>Control audio via OBS</strong> to route your phone microphone directly into your audio mixer.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-[#9933ff] font-bold text-base md:text-lg mb-1 md:mb-2">Step 4: Go Live</h3>
                <p>Open this app on your phone, tap <strong>I am the Camera</strong>, type in your code (e.g., 77777), and hit <strong>Go Live</strong>. Your video will instantly appear in OBS!</p>
              </section>
            </div>
            
            <button 
              onClick={() => setShowGuide(false)} 
              className="mt-6 md:mt-8 w-full py-3 md:py-4 bg-[#222] hover:bg-[#333] border border-[#444] rounded-xl font-bold text-white transition-all uppercase tracking-widest text-xs md:text-sm"
            >
              Got it, let's stream!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SCREEN: Receiver (PC) ---
function Receiver({ roomId, goBack }) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('Waiting for camera...');
  const [isPhoneSwitching, setIsPhoneSwitching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [lowLightMode, setLowLightMode] = useState(false);
  const [rotation, setRotation] = useState(0);
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
        if (data.type === 'PHONE_SWITCHING_START') setIsPhoneSwitching(true);
        if (data.type === 'STATE_SYNC') setPhoneState(data.state);
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
    <div className="flex flex-col h-screen w-full bg-[#050505] relative group" ref={containerRef}>
      <div className="flex-1 w-full h-full relative p-4">
        {remoteStream && !isPhoneSwitching ? (
          <VideoPlayer stream={remoteStream} isLocal={false} lowLight={lowLightMode} rotation={rotation} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isPhoneSwitching ? (
              <>
                <RefreshCw className="w-16 h-16 mb-6 opacity-80 animate-spin text-[#ff1493]" />
                <p className="text-2xl font-medium tracking-wide text-gray-400">
                  Cycling Phone Hardware...
                </p>
              </>
            ) : (
              <div className="bg-[#111]/90 backdrop-blur-xl p-10 md:p-16 rounded-[3rem] border border-[#333] shadow-[0_0_50px_rgba(255,20,147,0.15)] text-center animate-in zoom-in-95 duration-500">
                <div className="flex justify-center mb-6">
                  <Monitor className="w-12 h-12 text-[#ff3b3b] opacity-80 animate-pulse" />
                </div>
                <p className="text-[#ff1493] font-bold mb-3 text-sm uppercase tracking-[0.3em]">Waiting for Camera</p>
                <div className="text-7xl md:text-9xl font-mono font-black tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {roomId}
                </div>
                <p className="text-gray-400 mt-6 max-w-sm mx-auto text-base font-medium">Enter this code on your phone to connect.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`absolute inset-x-0 top-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent transition-opacity duration-300 ${remoteStream && !isPhoneSwitching ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} pointer-events-none`}>
        <button onClick={goBack} className="pointer-events-auto text-sm bg-white/10 hover:bg-[#ff3b3b] hover:text-white px-5 py-2.5 rounded-full backdrop-blur-md font-bold transition-all uppercase tracking-wider shadow-xl">← Leave Room</button>
      </div>

      {remoteStream && !isPhoneSwitching && (
        <div className="absolute top-6 right-6 flex flex-col items-end gap-3 z-50 pointer-events-auto">
          <button onClick={() => setShowSettings(!showSettings)} className="p-4 bg-[#111]/90 hover:bg-[#ff1493] hover:text-white backdrop-blur-xl rounded-full text-white border border-[#333] transition-all shadow-[0_0_20px_rgba(255,20,147,0.2)]">
            <Settings className="w-7 h-7" />
          </button>

          {showSettings && (
            <div className="bg-[#111]/95 backdrop-blur-xl border border-[#333] p-5 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-80 animate-in fade-in slide-in-from-top-4 flex flex-col gap-3">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider px-2 border-b border-[#333] pb-2">Remote Hardware</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => sendCommandToPhone('CMD_TOGGLE_LENS')} className="flex flex-col items-center gap-2 p-3 bg-[#222] hover:bg-[#333] rounded-2xl font-bold text-xs transition-all text-white border border-[#333]">
                  <SwitchCamera className="w-5 h-5 text-[#9933ff]" /> Switch Lens
                </button>
                <button onClick={() => sendCommandToPhone('CMD_TOGGLE_TORCH')} className={`flex flex-col items-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all border ${phoneState.torch ? 'bg-[#ff3b3b] text-white border-[#ff3b3b] shadow-[0_0_15px_rgba(255,59,59,0.4)]' : 'bg-[#222] hover:bg-[#333] text-white border-[#333]'}`}>
                  <Sun className="w-5 h-5" /> Flashlight
                </button>
                <button onClick={() => sendCommandToPhone('CMD_TOGGLE_MIC')} className={`flex flex-col items-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all border ${phoneState.mic ? 'bg-[#ff1493] text-white border-[#ff1493] shadow-[0_0_15px_rgba(255,20,147,0.4)]' : 'bg-[#222] hover:bg-[#333] text-white border-[#333]'}`}>
                  {phoneState.mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />} Audio
                </button>
                <button onClick={() => sendCommandToPhone('CMD_SET_QUALITY', { mode: phoneState.quality === 'high' ? 'performance' : 'high' })} className="flex flex-col items-center gap-2 p-3 bg-[#222] hover:bg-[#333] rounded-2xl font-bold text-xs transition-all text-white border border-[#333]">
                  <Monitor className="w-5 h-5 text-[#9933ff]" /> {phoneState.quality === 'high' ? '1080p Mode' : '720p 60fps'}
                </button>
              </div>

              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider px-2 border-b border-[#333] pb-2 mt-2">PC Visual Adjustments</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setLowLightMode(!lowLightMode)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl font-bold text-xs transition-all border ${lowLightMode ? 'bg-[#9933ff] text-white border-[#9933ff] shadow-[0_0_15px_rgba(153,51,255,0.4)]' : 'bg-[#222] hover:bg-[#333] text-white border-[#333]'}`}>
                  <SunMoon className="w-5 h-5" /> Color Correct
                </button>
                <button onClick={() => setRotation(prev => prev === 0 ? 90 : prev === 90 ? 180 : prev === 180 ? 270 : 0)} className="flex flex-col items-center gap-2 p-3 bg-[#222] hover:bg-[#333] rounded-2xl font-bold text-xs transition-all text-white border border-[#333]">
                  <RotateCw className="w-5 h-5 text-[#ff3b3b]" /> Rotate Feed
                </button>
              </div>
              
              <button onClick={handlePcDisconnect} className="mt-2 flex justify-center items-center gap-3 px-4 py-3 bg-[#ff3b3b]/10 hover:bg-[#ff3b3b] hover:text-white rounded-2xl font-bold text-sm transition-all text-[#ff3b3b] border border-[#ff3b3b]/30">
                <LogOut className="w-5 h-5" /> Disconnect Camera
              </button>
            </div>
          )}
        </div>
      )}

      {remoteStream && (
        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-40 pointer-events-auto">
          <button onClick={toggleFullScreen} className="bg-black/60 hover:bg-[#ff1493] hover:text-white backdrop-blur-md p-4 rounded-full text-white transition-all shadow-[0_0_15px_rgba(255,20,147,0.3)] border border-white/10" title="Toggle Fullscreen">
            <Maximize2 className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- SCREEN: Sender (Phone) ---
function Sender({ roomId, goBack }) {
  const [inputCode, setInputCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [localStream, setLocalStream] = useState(null);
  const [connected, setConnected] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [qualityMode, setQualityMode] = useState('high'); 

  const peerRef = useRef(null);
  const callRef = useRef(null);
  const dataConnRef = useRef(null); 
  const targetRoomIdRef = useRef(roomId);

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
          conn.send({ type: 'STATE_SYNC', state: { mic: micEnabled, torch: torchEnabled, quality: currentQuality } });
        });

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

  if (localStream) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-black relative">
        {batterySaver && (
          <div className="absolute inset-0 bg-black z-50 flex items-center justify-center cursor-pointer" onClick={() => setBatterySaver(false)}>
            <p className="text-[#ff1493] text-xl font-bold animate-pulse drop-shadow-[0_0_10px_rgba(255,20,147,0.8)]">Tap anywhere to wake screen</p>
          </div>
        )}

        <div className="flex-1 w-full h-full relative">
          <VideoPlayer stream={localStream} isLocal={true} />
          
          <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/80 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 text-sm font-bold shadow-[0_0_20px_rgba(255,59,59,0.3)]">
             <div className={`w-3 h-3 rounded-full ${connected ? 'bg-[#ff3b3b] animate-pulse shadow-[0_0_10px_rgba(255,59,59,0.8)]' : 'bg-[#9933ff]'}`}></div>
             <span className="tracking-widest uppercase text-white">{connected ? 'LIVE TO PC' : 'CONNECTING...'}</span>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent flex justify-center gap-6 items-center pb-safe">
          <button onClick={() => setBatterySaver(true)} className="p-4 bg-white/10 hover:bg-[#9933ff] hover:text-white text-white rounded-full transition-all shadow-xl backdrop-blur-md border border-white/20 flex items-center gap-2 px-6 font-bold text-xs uppercase tracking-wider">
            <Battery className="w-5 h-5" /> Battery Saver
          </button>

          <button onClick={() => { stopStream(); goBack(); }} className="p-4 bg-[#ff3b3b] hover:bg-[#ff1493] text-white rounded-full transition-all shadow-[0_0_20px_rgba(255,59,59,0.5)] border border-[#ff3b3b] flex items-center gap-2 px-6 font-bold text-xs uppercase tracking-wider">
            <LogOut className="w-5 h-5" /> Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 max-w-md mx-auto relative">
      <button onClick={goBack} className="absolute top-6 left-6 text-sm bg-[#111] hover:bg-[#222] border border-[#333] px-5 py-2.5 rounded-full font-bold transition-all uppercase tracking-wider text-white">← Back</button>
      <div className="w-full bg-[#111]/90 backdrop-blur-xl p-10 rounded-[2.5rem] border border-[#333] shadow-[0_0_40px_rgba(255,20,147,0.15)]">
        <div className="w-20 h-20 bg-gradient-to-br from-[#ff1493]/20 to-[#9933ff]/20 border border-[#ff1493]/50 text-[#ff1493] rounded-full flex items-center justify-center mb-6 mx-auto shadow-[0_0_20px_rgba(255,20,147,0.4)]"><Smartphone className="w-10 h-10" /></div>
        <h2 className="text-3xl font-extrabold text-center mb-2 text-white">Link Camera</h2>
        <p className="text-gray-400 text-center mb-10 text-sm font-medium">Enter the 5-digit code shown on your PC.</p>
        <form onSubmit={handleJoin} className="space-y-6">
          <input type="text" maxLength="5" placeholder="00000" value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#050505] border-2 border-[#333] focus:border-[#ff3b3b] focus:shadow-[0_0_15px_rgba(255,59,59,0.3)] rounded-2xl px-6 py-5 text-center text-5xl font-mono font-black tracking-[0.25em] text-white outline-none transition-all shadow-inner" required disabled={isConnecting} />
          {errorMsg && <div className="bg-[#ff3b3b]/10 border border-[#ff3b3b]/50 text-[#ff3b3b] p-4 rounded-2xl text-sm font-bold text-center">{errorMsg}</div>}
          <button type="submit" disabled={inputCode.length !== 5 || isConnecting} className="w-full bg-gradient-to-r from-[#ff1493] to-[#ff3b3b] hover:from-[#ff3b3b] hover:to-[#ff1493] disabled:from-[#333] disabled:to-[#333] disabled:text-gray-500 text-white font-extrabold text-lg py-5 rounded-2xl transition-all flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(255,20,147,0.4)] uppercase tracking-widest">
            {isConnecting ? <><RefreshCw className="w-6 h-6 animate-spin" /> Linking...</> : 'Go Live'}
          </button>
        </form>
      </div>
    </div>
  );
}