import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Volume2, ShieldCheck, Play, Pause, Circle, HelpCircle } from 'lucide-react';

export function FormAnalysis() {
  const [liveMode, setLiveMode] = useState<'simulated' | 'webcam'>('simulated');
  const [isPlaying, setIsPlaying] = useState(true);
  const [repCount, setRepCount] = useState(8);
  const [isOptimal, setIsOptimal] = useState(true);
  const [keepChestUp, setKeepChestUp] = useState(true);
  
  // Angle parameter for simulated athlete (oscillating squatting motion)
  const [squatProgress, setSquatProgress] = useState(0); // 0 (standing) to 100 (deep squat)
  const animRef = useRef<number | null>(null);
  const directionRef = useRef<number>(1.2); // rate and directions

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);

  // Oscillating squat movement simulation
  useEffect(() => {
    if (liveMode === 'simulated' && isPlaying) {
      const update = () => {
        setSquatProgress((prev) => {
          let next = prev + directionRef.current;
          if (next >= 100) {
            next = 100;
            directionRef.current = -1.2; // Go back up
            setIsOptimal(true); // Optimal peak warning is green
            setKeepChestUp(false); // Trigger caution alert near bottom
            // Dynamic rep completed trigger
            setRepCount(r => r + 1);
          } else if (next <= 0) {
            next = 0;
            directionRef.current = 1.2; // Go down
            setKeepChestUp(true); // reset alert
          }
          return next;
        });
        animRef.current = requestAnimationFrame(update);
      };
      animRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [liveMode, isPlaying]);

  // Webcam setup
  useEffect(() => {
    if (liveMode === 'webcam') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraError(null);
        })
        .catch((err) => {
          setHasCameraError("Webcam access declined or unavailable. Showing high-end simulator.");
          setLiveMode('simulated');
        });
    } else {
      // Clean up webcam stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [liveMode]);

  // Trigonometric skeletal coordinates for athlete model
  const headY = 160 + squatProgress * 1.1;
  const neckY = 185 + squatProgress * 1.15;
  const torsoY = 270 + squatProgress * 1.2;
  const hipX = 195 - squatProgress * 0.15;
  const hipY = 270 + squatProgress * 1.25;
  const kneeX = 225 + squatProgress * 0.35;
  const kneeY = 325 + squatProgress * 0.55;
  const ankleX = 195;
  const ankleY = 380;
  
  const shoulderY = 195 + squatProgress * 1.15;
  const shoulderX = 172 - squatProgress * 0.05; // shoulder is left of neck center
  const elbowX = 150 + squatProgress * 0.1;
  const elbowY = 230 + squatProgress * 1.1;
  const wristX = 145 + squatProgress * 0.15;
  const wristY = 240 + squatProgress * 1.05;

  return (
    <div className="flex flex-col h-full text-left font-sans">
      {/* Top Banner Control Panel (Internal Interface Tool) */}
      <div className="bg-[#121212] p-3 rounded-t-2xl border-b border-[#222] flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-semibold">
        <span className="text-[#909090] shrink-0">SOURCE MODE:</span>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setLiveMode('simulated')}
            className={`px-3 py-1.5 rounded-lg transition ${
              liveMode === 'simulated' ? 'bg-[#C9A84C] text-[#080808] font-bold' : 'bg-[#222] text-[#F0F0F0] hover:bg-[#2e2e2e]'
            }`}
          >
            MOCK PRO ATHLETE
          </button>
          <button
            onClick={() => setLiveMode('webcam')}
            className={`px-3 py-1.5 rounded-lg transition ${
              liveMode === 'webcam' ? 'bg-[#C9A84C] text-[#080808] font-bold' : 'bg-[#222] text-[#F0F0F0] hover:bg-[#2e2e2e]'
            }`}
          >
            YOUR WEBCAM FEED
          </button>
        </div>
      </div>

      {/* Screen container */}
      <div className="relative flex-1 bg-[#090909] aspect-[390/490] rounded-b-2xl overflow-hidden border border-gold-base/15 select-none">
        
        {/* Full-bleed Gym Rack Backdrop or Live Video Element */}
        {liveMode === 'simulated' ? (
          <div className="absolute inset-0 bg-cover bg-center filter brightness-[0.22] contrast-[1.1]" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop')` }}>
            {/* Dumbbell racks representation in canvas background */}
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 top-0 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-60 filter brightness-[0.35]"
            />
          </div>
        )}

        {/* Top Header Indicators bar */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2 bg-[#080808]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gold-base/10">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse"></span>
            <span className="text-[9px] tracking-[0.15em] font-extrabold text-[#F0F0F0] font-mono leading-none">
              LIVE FORM ANALYSIS
            </span>
          </div>

          <div className="text-right">
            <p className="text-[9px] tracking-wider text-gold-base font-bold uppercase font-mono leading-none">SQUAT TARGET</p>
            <p className="text-4xl font-extrabold text-[#F0F0F0] tracking-tighter mt-1 font-mono gold-glow">
              REP <span className="text-gold-base">{repCount < 10 ? `0${repCount}` : repCount}</span>
            </p>
          </div>
        </div>

        {/* BRIGHT GOLD SKELETAL POSE OVERLAY (glowing canvas) */}
        <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
          <defs>
            <filter id="gold-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Golden Stick-figure / joints rendering based on squat progress coords */}
          <g filter="url(#gold-glow-filter)" stroke="#E8C76A" strokeWidth="3" strokeLinecap="round" fill="none">
            
            {/* Spine & Torso Core */}
            <line x1="195" y1={neckY} x2="195" y2={torsoY} stroke="#C9A84C" strokeWidth="4" />
            
            {/* Left Arm to Dumbbell or Bar (simulated bar loading) */}
            <line x1="195" y1={neckY} x2={shoulderX} y2={shoulderY} stroke="#C9A84C" />
            <line x1={shoulderX} y1={shoulderY} x2={elbowX} y2={elbowY} />
            <line x1={elbowX} y1={elbowY} x2={wristX} y2={wristY} />

            {/* Left Leg: Hip -> Knee -> Ankle */}
            <line x1="195" y1={torsoY} x2={hipX} y2={hipY} stroke="#C9A84C" />
            <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke="#E8C76A" strokeWidth="4" />
            <line x1={kneeX} y1={kneeY} x2={ankleX} y2={ankleY} stroke="#E8C76A" strokeWidth="4" />

            {/* Simulated barbell load line - across back neck */}
            {liveMode === 'simulated' && (
              <line x1="130" y1={neckY + 1} x2="260" y2={neckY + 1} stroke="#E8C76A" strokeWidth="5" opacity="0.8" />
            )}
          </g>

          {/* Joint Nodes (Points) */}
          <g fill="#080808" stroke="#E8C76A" strokeWidth="2.5" filter="url(#gold-glow-filter)">
            {/* Head node */}
            <circle cx="195" cy={headY} r="14" fill="#1A1A1A" stroke="#C9A84C" strokeWidth="2.5" />
            
            {/* Spinal neck node */}
            <circle cx="195" cy={neckY} r="4.5" />
            
            {/* Elbow joint */}
            <circle cx={elbowX} cy={elbowY} r="4" />
            
            {/* Wrist bar contact */}
            <circle cx={wristX} cy={wristY} r="4" />

            {/* Pelvic hip node */}
            <circle cx={hipX} cy={hipY} r="5" fill="#C9A84C" />

            {/* Patella knee joint */}
            <circle cx={kneeX} cy={kneeY} r="5.5" fill={isOptimal ? '#E8C76A' : '#F97316'} />

            {/* Base ankle joint */}
            <circle cx={ankleX} cy={ankleY} r="4" />
          </g>

          {/* Mechanical Angle Measurement Indicator */}
          <g transform={`translate(${kneeX + 15}, ${kneeY - 10})`} opacity="0.9">
            <rect x="0" y="0" width="48" height="18" rx="4" fill="#080808" stroke="#C9A84C" strokeWidth="1" />
            <text x="24" y="12" fill="#E8C76A" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              {Math.floor(75 + squatProgress * 0.45)}°
            </text>
          </g>
          
          {/* Virtual baseline tracking grids and alignment rays */}
          <line x1="100" y1={ankleY} x2="300" y2={ankleY} stroke="#555" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={ankleX} y1="100" x2={ankleX} y2="400" stroke="#C9A84C" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.4" />
        </svg>

        {/* HUD calibration crosshair indicator at backdrop */}
        <div className="absolute inset-0 border-[20px] border-black/10 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border border-white/5 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-t border-b border-light border-white/10 rotate-45"></div>
          </div>
        </div>

        {/* HUD Interactive controls inside video */}
        <div className="absolute top-[138px] left-4 flex flex-col gap-2 z-20">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-gold-base hover:bg-gold-base hover:text-black transition duration-200"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button 
            onClick={() => setRepCount(prev => Math.max(0, prev - 1))}
            className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#909090] hover:text-[#F0F0F0] text-xs font-mono font-bold"
            title="Decrement reps"
          >
            -1
          </button>
          <button 
            onClick={() => setRepCount(prev => prev + 1)}
            className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#909090] hover:text-[#F0F0F0] text-xs font-mono font-bold"
            title="Increment reps"
          >
            +1
          </button>
        </div>

        {/* FEEDBACK CHIPS: OVERLAID NEAR THE BOTTOM IN THE CAMERA FRAME */}
        <div className="absolute bottom-4 inset-x-4 flex flex-col gap-2.5 z-20">
          
          {/* Optimal green status chip */}
          {isOptimal && (
            <div className="flex items-center gap-2.5 bg-[#0A3D24]/85 border border-[#10B981]/30 px-3.5 py-3 rounded-xl transition duration-300">
              <span className="w-5 h-5 min-w-[20px] rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] font-bold text-xs select-none">
                ✓
              </span>
              <div className="text-left font-display">
                <p className="text-[9px] tracking-[0.1em] text-[#10B981] font-extrabold uppercase font-mono leading-none">OPTIMAL BIOMECHANICS</p>
                <p className="text-[11px] font-bold text-[#F0F0F0] mt-0.5">
                  OPTIMAL SQUAT DEPTH REACHED
                </p>
              </div>
            </div>
          )}

          {/* Corrective orange status chip */}
          {!keepChestUp && (
            <div className="flex items-center gap-2.5 bg-[#3E230B]/85 border border-[#F97316]/30 px-3.5 py-3 rounded-xl transition duration-300">
              <span className="w-5 h-5 min-w-[20px] rounded-full bg-[#F97316]/20 flex items-center justify-center text-[#F97316] font-extrabold text-[#F97316] text-xs select-none font-mono">
                !
              </span>
              <div className="text-left font-display">
                <p className="text-[9px] tracking-[0.1em] text-[#F97316] font-extrabold uppercase font-mono leading-none">CORRECTION ALERT</p>
                <p className="text-[11px] font-bold text-[#F0F0F0] mt-0.5">
                  KEEP CHEST UPRIGHT ON DESCENT
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Auxiliary Instructions */}
      <div className="bg-[#1A1A1A] rounded-xl p-3 border border-gold-base/15 flex items-center gap-2.5 text-xs text-[#909090] mt-3">
        <HelpCircle className="w-4 h-4 text-gold-base shrink-0" />
        <p className="leading-normal">
          AI tracking uses dynamic joint kinematic node projection. Position camera 6 to 8 feet away at profile height for best alignment accuracy.
        </p>
      </div>
    </div>
  );
}
