import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone, Maximize2, SwitchCamera, VideoOff, RefreshCw, Battery, Mic, MicOff, Settings, Sun, Compass } from 'lucide-react';
import Peer from 'peerjs';

// --- HELPER COMPONENT: Video Player ---
const VideoPlayer = ({ stream, isLocal = false, horizonAngle = 0, horizonLockEnabled = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const transformStyle = horizonLockEnabled 
    ? `rotate(${horizonAngle}deg) scale(1.3)` 
    : 'rotate(0deg) scale(1)';

  return (
    <div className="w-full h-full overflow-hidden rounded-lg shadow-2xl bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{ 
          transform: transformStyle, 
          transition: 'transform 0.1s linear'
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
        <button onClick={handleSelectReceiver} className="group flex flex-col items-center p-8 bg-stone-800 border border-stone-700 rounded-3xl hover:bg-stone-800 hover:border-amber-500 transition-all shadow-xl hover:shadow-amber-500/20 text-left w-full focus:ring-4 focus:ring-amber-500/50">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 text-stone-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg"><Monitor className="w-10 h-10" /></div>
          <h2 className="text-2xl font-bold mb-2">I am the PC</h2>
          <p className="text-stone-400 text-center">Receive the video stream on this device. Start here to get your code.</p>
        </button>

        <button onClick={() => setRole('sender')} className="group flex flex-col items-center p-8 bg-stone-800 border border-stone-700 rounded-3xl hover:bg-stone-800 hover:border-rose-500 transition-all shadow-xl hover:shadow-rose-500/20 text-left w-full focus:ring-4 focus:ring-rose-500/50">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-red-500 text-stone-900 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg"><Smartphone className="w-10 h-10" /></div>
          <h2 className="text-2xl font-bold mb-2">I am the Camera</h2>
          <p className="text-stone-400 text-center">Use this device's camera to broadcast. You'll need a code from the PC.</p>
        </button>
      </div>
    </div>
  );
}

// --- SCREEN: Receiver (PC) ---
function Receiver({ roomId, goBack }) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('Waiting for camera...');
  const [horizonAngle, setHorizonAngle] = useState(0);
  const [horizonLockEnabled, setHorizonLockEnabled] = useState(false);
  
  const peerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const peer = new Peer(`webcam-app-${roomId}`);
    peerRef.current = peer;

    peer.on('open', () => setStatus('Waiting for camera to connect...'));

    peer.on('call', (call) => {
      setStatus('Connecting to camera...');
      call.answer(); 
      call.on('stream', (stream) => {
        setRemoteStream(stream);
        setStatus('Connected');
      });
      call.on('close', () => {
        setStatus('Camera disconnected. Waiting...');
        setRemoteStream(null);
        setHorizonLockEnabled(false);
      });
    });

    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        if (data.type === 'HORIZON_DATA') {
          setHorizonLockEnabled(data.enabled);
          if (data.enabled) {
            setHorizonAngle(data.angle);
          } else {
            setHorizonAngle(0);
          }
        }
      });
    });

    return () => { if (peerRef.current) peerRef.current.destroy(); };
  }, [roomId]);

  const toggleFullScreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(e => console.error(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black relative group" ref={containerRef}>
      <div className="flex-1 w-full h-full relative p-4">
        {remoteStream ? (
          <VideoPlayer stream={remoteStream} isLocal={false} horizonAngle={horizonAngle} horizonLockEnabled={horizonLockEnabled} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-500">
            <Monitor className="w-20 h-20 mb-6 opacity-40 animate-pulse text-amber-500" />
            <p className="text-2xl font-medium tracking-wide">{status}</p>
          </div>
        )}
        
        {remoteStream && horizonLockEnabled && (
          <div className="absolute top-8 left-8 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/30 text-amber-500 text-sm font-bold shadow-xl">
             <Compass className="w-4 h-4 animate-spin-slow" />
             <span>Horizon Lock Active</span>
          </div>
        )}
      </div>

      <div className={`absolute inset-x-0 top-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${remoteStream ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <button onClick={goBack} className="text-sm bg-white/10 hover:bg-amber-500 hover:text-stone-900 px-5 py-2.5 rounded-full backdrop-blur-md font-bold transition-all uppercase tracking-wider">← Back</button>
        {!remoteStream && (
          <div className="bg-stone-900/80 backdrop-blur-xl p-8 rounded-3xl border border-stone-700 shadow-2xl text-center">
            <p className="text-amber-500 font-bold mb-2 text-sm uppercase tracking-widest">Pairing Code</p>
            <div className="text-7xl font-mono font-extrabold tracking-widest text-stone-100 drop-shadow-lg">{roomId}</div>
            <p className="text-stone-400 mt-4 max-w-xs text-sm">Enter this code on your phone.</p>
          </div>
        )}
      </div>

      {remoteStream && (
        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={toggleFullScreen} className="bg-black/60 hover:bg-amber-500 hover:text-black backdrop-blur-md p-4 rounded-full text-white transition-all shadow-lg border border-white/10"><Maximize2 className="w-8 h-8" /></button>
        </div>
      )}
    </div>
  );
}

// --- SCREEN: Sender (Phone) ---
function Sender({ goBack }) {
  const [inputCode, setInputCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [localStream, setLocalStream] = useState(null);
  const [connected, setConnected] = useState(false);
  
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [horizonLock, setHorizonLock] = useState(false);
  
  const [qualityMode, setQualityMode] = useState('high'); 
  const [showSettings, setShowSettings] = useState(false);

  const [exposureSupported, setExposureSupported] = useState(false);
  const [exposureSettings, setExposureSettings] = useState({ min: -3, max: 3, step: 0.1, val: 0 });

  const peerRef = useRef(null);
  const callRef = useRef(null);
  const dataConnRef = useRef(null); 
  const horizonLockRef = useRef(horizonLock); 

  const checkCameraCapabilities = (stream) => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track || !track.getCapabilities) return;

    try {
      const caps = track.getCapabilities();
      if (caps.exposureCompensation) {
        setExposureSupported(true);
        const settings = track.getSettings ? track.getSettings() : {};
        setExposureSettings({
          min: caps.exposureCompensation.min,
          max: caps.exposureCompensation.max,
          step: caps.exposureCompensation.step || 0.1,
          val: settings.exposureCompensation || 0
        });
      } else {
        setExposureSupported(false);
      }
    } catch (err) {
      console.warn("Failed to check camera capabilities", err);
      setExposureSupported(false);
    }
  };

  useEffect(() => {
    horizonLockRef.current = horizonLock;
    
    const handleOrientation = (event) => {
      if (!horizonLockRef.current || !dataConnRef.current) return;

      let angle = 0;
      const screenOrientation = window.orientation || window.screen?.orientation?.angle || 0;

      if (screenOrientation === 90) angle = event.beta;
      else if (screenOrientation === -90 || screenOrientation === 270) angle = -event.beta;
      else angle = event.gamma;

      dataConnRef.current.send({ type: 'HORIZON_DATA', enabled: true, angle: -angle });
    };

    if (horizonLock) {
      window.addEventListener('deviceorientation', handleOrientation);
    } else {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (dataConnRef.current) {
        dataConnRef.current.send({ type: 'HORIZON_DATA', enabled: false, angle: 0 });
      }
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [horizonLock]);

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

  const requestOptimizedStream = async (frontFacing, mode) => {
    const facingMode = frontFacing ? 'user' : 'environment';
    const baseConstraints = { audio: true }; 
    try {
      if (mode === 'high') {
        return await navigator.mediaDevices.getUserMedia({ ...baseConstraints, video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } });
      } else {
        return await navigator.mediaDevices.getUserMedia({ ...baseConstraints, video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } } });
      }
    } catch (e1) {
      return await navigator.mediaDevices.getUserMedia({ ...baseConstraints, video: { facingMode } });
    }
  };

  const startCameraAndConnect = async (roomIdToConnect) => {
    setErrorMsg('');
    setIsConnecting(true);

    try {
      const stream = await requestOptimizedStream(isFrontCamera, qualityMode);
      stream.getAudioTracks().forEach(track => track.enabled = micEnabled);
      setLocalStream(stream);
      
      setTimeout(() => checkCameraCapabilities(stream), 500);

      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const targetId = `webcam-app-${roomIdToConnect}`;
        
        const conn = peer.connect(targetId);
        dataConnRef.current = conn;
        
        conn.on('open', () => {
          setConnected(true);
          setIsConnecting(false);
        });
        
        conn.on('close', () => {
          setConnected(false);
          setErrorMsg("Disconnected from PC.");
        });

        const call = peer.call(targetId, stream);
        callRef.current = call;
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

  const toggleCamera = async () => {
    const newMode = !isFrontCamera;
    setIsFrontCamera(newMode);
    setTorchEnabled(false);
    refreshStream(newMode, qualityMode);
  };

  const handleQualityChange = (mode) => {
    setQualityMode(mode);
    setTorchEnabled(false);
    refreshStream(isFrontCamera, mode);
    setShowSettings(false);
  };

  const refreshStream = async (facing, mode) => {
    if (localStream && callRef.current) {
      try {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        const newStream = await requestOptimizedStream(facing, mode);
        newStream.getAudioTracks().forEach(track => track.enabled = micEnabled);
        setLocalStream(newStream);
        
        setTimeout(() => checkCameraCapabilities(newStream), 500);

        const sender = callRef.current.peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(newStream.getVideoTracks()[0]);
        
        oldVideoTrack.stop();
      } catch (err) { console.error("Failed to switch:", err); }
    }
  };

  const toggleMic = () => {
    const newMicState = !micEnabled;
    setMicEnabled(newMicState);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = newMicState);
    }
  };

  const toggleTorch = async () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities && track.getCapabilities();
    
    if (capabilities && capabilities.torch) {
      try {
        await track.applyConstraints({ advanced: [{ torch: !torchEnabled }] });
        setTorchEnabled(!torchEnabled);
      } catch (err) { console.error("Torch error:", err); }
    } else {
      alert("Flashlight is not supported on this camera lens.");
    }
  };

  const toggleHorizonLock = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setHorizonLock(!horizonLock);
        } else {
          alert("Gyroscope permission denied.");
        }
      } catch (error) {
        console.error(error);
        alert("Failed to access Gyroscope.");
      }
    } else {
      setHorizonLock(!horizonLock);
    }
  };

  const handleExposureChange = async (e) => {
    const val = parseFloat(e.target.value);
    setExposureSettings(prev => ({ ...prev, val }));
    
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ exposureCompensation: val }] });
      } catch (err) {
        console.error("Exposure change failed", err);
      }
    }
  };

  // --- RENDER LIVE CAMERA ---
  if (localStream) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-black relative">
        
        {batterySaver && (
          <div className="absolute inset-0 bg-black z-50 flex items-center justify-center cursor-pointer" onClick={() => setBatterySaver(false)}>
            <p className="text-stone-700 text-xl font-bold animate-pulse">Tap anywhere to wake</p>
          </div>
        )}

        <div className="flex-1 w-full h-full relative">
          <VideoPlayer stream={localStream} isLocal={true} />
          
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-sm font-bold shadow-xl">
               <div className={`w-3 h-3 rounded-full ${connected ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></div>
               <span className="tracking-wider uppercase">{connected ? 'LIVE' : 'Connecting'}</span>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => setShowSettings(!showSettings)} className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur rounded-full text-white border border-white/10 transition-all shadow-xl">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={() => setBatterySaver(true)} className="p-3 bg-black/50 hover:bg-amber-500 hover:text-black backdrop-blur rounded-full text-white border border-white/10 transition-all shadow-xl">
                <Battery className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="absolute top-20 right-6 bg-stone-900/95 backdrop-blur-xl border border-stone-700 p-4 rounded-3xl shadow-2xl w-72 z-40 animate-in fade-in slide-in-from-top-4">
              
              <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-3 px-2">Video Quality</h3>
              <div className="flex flex-col gap-2 mb-4">
                <button onClick={() => handleQualityChange('high')} className={`p-3 rounded-2xl text-sm font-bold text-left transition-all ${qualityMode === 'high' ? 'bg-amber-500 text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'}`}>
                  1080p High Quality
                </button>
                <button onClick={() => handleQualityChange('performance')} className={`p-3 rounded-2xl text-sm font-bold text-left transition-all ${qualityMode === 'performance' ? 'bg-amber-500 text-stone-900' : 'bg-stone-800 text-white hover:bg-stone-700'}`}>
                  720p Performance (60fps)
                </button>
              </div>

              <div className="border-t border-stone-800 pt-4 mt-2">
                <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-3 px-2">Exposure</h3>
                {exposureSupported ? (
                  <div className="px-2 pb-2">
                    <div className="flex justify-between text-xs text-stone-400 mb-2 font-bold uppercase tracking-widest">
                      <span>Dark</span>
                      <span>Light</span>
                    </div>
                    <input 
                      type="range" 
                      min={exposureSettings.min} 
                      max={exposureSettings.max} 
                      step={exposureSettings.step} 
                      value={exposureSettings.val}
                      onChange={handleExposureChange}
                      className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 px-2 italic font-medium">Not supported on this hardware.</p>
                )}
              </div>

            </div>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent flex justify-center gap-3 md:gap-6 items-center pb-safe">
          
          <button onClick={toggleMic} className={`p-4 rounded-full transition-all shadow-xl backdrop-blur-md ${micEnabled ? 'bg-white/20 text-white border-white/30' : 'bg-rose-500/20 text-rose-500 border-rose-500/30'} border focus:outline-none`}>
            {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button onClick={toggleHorizonLock} title="Horizon Lock" className={`p-4 rounded-full transition-all shadow-xl backdrop-blur-md ${horizonLock ? 'bg-amber-500 text-stone-900 border-amber-400' : 'bg-white/10 text-white border-white/20'} border focus:outline-none`}>
            <Compass className="w-6 h-6" />
          </button>

          <button onClick={() => { stopStream(); goBack(); }} className="p-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all shadow-rose-600/50 shadow-2xl border border-rose-500 focus:outline-none mx-2">
            <VideoOff className="w-8 h-8" />
          </button>

          <button onClick={toggleCamera} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all shadow-xl backdrop-blur-md border border-white/20 focus:outline-none">
            <SwitchCamera className="w-6 h-6" />
          </button>

          <button onClick={toggleTorch} className={`p-4 rounded-full transition-all shadow-xl backdrop-blur-md ${torchEnabled ? 'bg-amber-500 text-stone-900 border-amber-400' : 'bg-white/10 text-white border-white/20'} border focus:outline-none`}>
            <Sun className="w-6 h-6" />
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 max-w-md mx-auto relative">
      <button onClick={goBack} className="absolute top-6 left-6 text-sm bg-stone-800 hover:bg-stone-700 px-5 py-2.5 rounded-full font-bold transition-all border border-stone-700 uppercase tracking-wider">← Back</button>

      <div className="w-full bg-stone-800/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-stone-700 shadow-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-red-500 text-stone-900 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg"><Smartphone className="w-10 h-10" /></div>
        <h2 className="text-3xl font-extrabold text-center mb-2">Link Camera</h2>
        <p className="text-stone-400 text-center mb-10 text-sm font-medium">Enter the 5-digit code shown on your PC.</p>

        <form onSubmit={handleJoin} className="space-y-6">
          <input
            type="text" maxLength="5" placeholder="00000"
            value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-stone-900 border-2 border-stone-700 focus:border-rose-500 rounded-2xl px-6 py-5 text-center text-5xl font-mono font-black tracking-[0.25em] text-white outline-none transition-all shadow-inner"
            required disabled={isConnecting}
          />
          {errorMsg && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-2xl text-sm font-bold text-center">{errorMsg}</div>}
          <button
            type="submit" disabled={inputCode.length !== 5 || isConnecting}
            className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 disabled:from-stone-700 disabled:to-stone-700 disabled:text-stone-500 text-white font-extrabold text-lg py-5 rounded-2xl transition-all flex justify-center items-center gap-3 shadow-xl hover:shadow-rose-500/30 uppercase tracking-widest"
          >
            {isConnecting ? <><RefreshCw className="w-6 h-6 animate-spin" /> Linking...</> : 'Go Live'}
          </button>
        </form>
      </div>
    </div>
  );
}