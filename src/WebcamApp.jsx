import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone, Maximize2, SwitchCamera, VideoOff, RefreshCw, AlertCircle, Link } from 'lucide-react';
import Peer from 'peerjs';

const VideoPlayer = ({ stream, isLocal = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className="w-full h-full object-contain bg-black rounded-lg shadow-xl"
    />
  );
};

export default function WebcamApp() {
  const [role, setRole] = useState('select'); 
  const [roomId, setRoomId] = useState('');

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500/30">
      {role === 'select' && <RoleSelection setRole={setRole} setRoomId={setRoomId} />}
      {role === 'receiver' && <Receiver roomId={roomId} goBack={() => setRole('select')} />}
      {role === 'sender' && <Sender roomId={roomId} goBack={() => setRole('select')} />}
    </div>
  );
}

function RoleSelection({ setRole, setRoomId }) {
  const handleSelectReceiver = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setRoomId(code);
    setRole('receiver');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-4xl mx-auto text-center">
      <div className="mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Wireless Webcam</h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">Turn your phone into a high-quality webcam for your PC instantly.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
        <button onClick={handleSelectReceiver} className="group flex flex-col items-center p-8 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-750 hover:border-blue-500 transition-all shadow-lg text-left w-full focus:ring-4 focus:ring-blue-500/50">
          <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Monitor className="w-8 h-8" /></div>
          <h2 className="text-2xl font-semibold mb-2">I am the PC</h2>
          <p className="text-slate-400 text-center">Receive the video stream on this device. Start here to get your code.</p>
        </button>

        <button onClick={() => setRole('sender')} className="group flex flex-col items-center p-8 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-750 hover:border-emerald-500 transition-all shadow-lg text-left w-full focus:ring-4 focus:ring-emerald-500/50">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Smartphone className="w-8 h-8" /></div>
          <h2 className="text-2xl font-semibold mb-2">I am the Camera</h2>
          <p className="text-slate-400 text-center">Use this device's camera to broadcast. You'll need a code from the PC.</p>
        </button>
      </div>
    </div>
  );
}

function Receiver({ roomId, goBack }) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('Waiting for camera...');
  const peerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const peer = new Peer(`webcam-app-${roomId}`);
    peerRef.current = peer;

    peer.on('open', () => {
      setStatus('Waiting for camera to connect...');
    });

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
      });
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        console.log("Data connection established");
      });
    });

    peer.on('error', (err) => {
      console.error(err);
      setStatus(`Network Error: ${err.type}`);
    });

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomId]);

  const toggleFullScreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(e => console.error(e));
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black relative group" ref={containerRef}>
      <div className="flex-1 w-full h-full relative">
        {remoteStream ? (
          <VideoPlayer stream={remoteStream} isLocal={false} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Monitor className="w-16 h-16 mb-4 opacity-50 animate-pulse" />
            <p className="text-xl font-medium">{status}</p>
          </div>
        )}
      </div>

      <div className={`absolute inset-x-0 top-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${remoteStream ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        <button onClick={goBack} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur font-medium transition-colors">← Back</button>
        {!remoteStream && (
          <div className="bg-slate-800/90 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-2xl text-center">
            <p className="text-slate-400 font-medium mb-2 text-sm uppercase tracking-wider">Pairing Code</p>
            <div className="text-6xl font-mono font-bold tracking-widest text-blue-400 drop-shadow-sm">{roomId}</div>
            <p className="text-slate-400 mt-4 max-w-xs text-sm">Enter this code on your phone.</p>
          </div>
        )}
      </div>

      {remoteStream && (
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={toggleFullScreen} className="bg-black/50 hover:bg-black/80 backdrop-blur p-3 rounded-full text-white transition-colors border border-white/10"><Maximize2 className="w-6 h-6" /></button>
        </div>
      )}
    </div>
  );
}

function Sender({ goBack }) {
  const [inputCode, setInputCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const peerRef = useRef(null);
  const callRef = useRef(null);

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

  useEffect(() => {
    return () => stopStream();
  }, []);

  const requestOptimizedStream = async (frontFacing) => {
    const facingMode = frontFacing ? 'user' : 'environment';
    try {
      return await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    } catch (e1) {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      } catch (e2) {
        return await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      }
    }
  };

  const startCameraAndConnect = async (roomIdToConnect) => {
    setErrorMsg('');
    setIsConnecting(true);

    try {
      const stream = await requestOptimizedStream(isFrontCamera);
      setLocalStream(stream);

      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const targetId = `webcam-app-${roomIdToConnect}`;
        
        const conn = peer.connect(targetId);
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
        if (err.type === 'peer-unavailable') {
          setErrorMsg("PC not found. Check the pairing code.");
        } else {
          setErrorMsg(err.message);
        }
      });

    } catch (err) {
      console.error(err);
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
    
    if (localStream && callRef.current) {
      try {
        const currentVideoTrack = localStream.getVideoTracks()[0];
        const newStream = await requestOptimizedStream(newMode);
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        setLocalStream(newStream);
        
        const sender = callRef.current.peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
        
        currentVideoTrack.stop();
      } catch (err) {
        setIsFrontCamera(!newMode);
      }
    }
  };

  if (localStream) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-black relative">
        <div className="flex-1 w-full h-full relative">
          <VideoPlayer stream={localStream} isLocal={true} />
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 text-sm font-medium">
             <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
             {connected ? 'LIVE' : 'Connecting...'}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-center pb-safe">
          <button onClick={() => { stopStream(); goBack(); }} className="p-4 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors backdrop-blur border border-red-500/50"><VideoOff className="w-6 h-6" /></button>
          <button onClick={toggleCamera} className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur border border-white/20"><SwitchCamera className="w-6 h-6" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 max-w-md mx-auto relative">
      <button onClick={goBack} className="absolute top-6 left-6 text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700">← Back</button>

      <div className="w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 mx-auto"><Smartphone className="w-8 h-8" /></div>
        <h2 className="text-2xl font-bold text-center mb-2">Connect Camera</h2>
        <p className="text-slate-400 text-center mb-8 text-sm">Enter the 5-digit code shown on your PC.</p>

        <form onSubmit={handleJoin} className="space-y-6">
          <input
            type="text" maxLength="5" placeholder="00000"
            value={inputCode} onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-xl px-6 py-4 text-center text-4xl font-mono font-bold tracking-[0.25em] text-white outline-none transition-colors"
            required disabled={isConnecting}
          />
          {errorMsg && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm text-center">{errorMsg}</div>}
          <button
            type="submit" disabled={inputCode.length !== 5 || isConnecting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg"
          >
            {isConnecting ? <><RefreshCw className="w-5 h-5 animate-spin" /> Connecting...</> : 'Start Camera'}
          </button>
        </form>
      </div>
    </div>
  );
}