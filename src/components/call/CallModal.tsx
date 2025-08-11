'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MonitorX } from 'lucide-react'

type CallModalProps = {
  isOpen: boolean
  onClose: () => void
  roomId: string
  audioOnly?: boolean
  autoStartShare?: boolean
}

type SignalOffer = { sdp: string }
type SignalAnswer = { sdp: string }
type SignalIce = { candidate: RTCIceCandidateInit }

export function CallModal({ isOpen, onClose, roomId, audioOnly, autoStartShare }: CallModalProps) {
  const [status, setStatus] = useState<'idle' | 'camera' | 'calling' | 'connected'>('idle')
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const screenAudioSenderRef = useRef<RTCRtpSender | null>(null)
  const [includeScreenAudio, setIncludeScreenAudio] = useState(false)
  const wakeLockRef = useRef<any>(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [camEnabled, setCamEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const requestWakeLock = useCallback(async () => {
    try {
      if ((navigator as any).wakeLock && !wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null
        })
      }
    } catch {}
  }, [])

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    } catch {}
  }, [])
  const socketRef = useRef<Socket | null>(null)

  const signalingUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SIGNALING_URL) return process.env.NEXT_PUBLIC_SIGNALING_URL
    if (typeof window !== 'undefined') return window.location.origin
    return 'http://localhost:3000'
  }, [])

  const namespace = '' // using same server.js socket namespace

  const ensureSocket = useCallback(() => {
    if (socketRef.current) return socketRef.current
    const s = io(signalingUrl + namespace, { transports: ['websocket'] })
    socketRef.current = s

    s.on('connect', () => {
      s.emit('webrtc:join', { roomId })
    })

    s.on('webrtc:offer', async (payload: SignalOffer) => {
      if (!pcRef.current) await createPeerConnection()
      const pc = pcRef.current!
      await pc.setRemoteDescription({ type: 'offer', sdp: payload.sdp })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      s.emit('webrtc:answer', { roomId, sdp: answer.sdp })
      setStatus('calling')
    })

    s.on('webrtc:answer', async (payload: SignalAnswer) => {
      if (!pcRef.current) return
      await pcRef.current.setRemoteDescription({ type: 'answer', sdp: payload.sdp })
    })

    s.on('webrtc:ice-candidate', async (payload: SignalIce) => {
      try {
        if (pcRef.current && payload.candidate) {
          await pcRef.current.addIceCandidate(payload.candidate)
        }
      } catch {}
    })

    s.on('ready', () => {
      // Second peer joined – optionally auto-start call
    })

    return s
  }, [roomId, signalingUrl])

  const createPeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc:ice-candidate', { roomId, candidate: event.candidate })
      }
    }

    pc.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream()
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current
        }
      }
      remoteStreamRef.current.addTrack(event.track)
      setStatus('connected')
    }

    pcRef.current = pc
    return pc
  }, [roomId])

  const startCamera = useCallback(async () => {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } as MediaTrackConstraints,
      video: audioOnly ? false : { width: { ideal: 1280 }, height: { ideal: 720 } },
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    localStreamRef.current = stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
    }
    setStatus('camera')
    requestWakeLock()
    setMicEnabled(!!stream.getAudioTracks()[0]?.enabled)
    setCamEnabled(!!stream.getVideoTracks()[0]?.enabled)
  }, [audioOnly])

  const startCall = useCallback(async () => {
    ensureSocket()
    const pc = await createPeerConnection()
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!))
    }
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socketRef.current?.emit('webrtc:offer', { roomId, sdp: offer.sdp })
    setStatus('calling')
    requestWakeLock()
  }, [createPeerConnection, ensureSocket, roomId])

  const toggleScreenShare = useCallback(async () => {
    // Start or stop screen share by replacing video track
    const pc = pcRef.current
    if (!pc) return
    if (!screenStreamRef.current) {
      try {
        const s = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
          audio: includeScreenAudio ? ({ suppressLocalAudioPlayback: true } as any) : false,
        })
        screenStreamRef.current = s
        const screenTrack = s.getVideoTracks()[0]
        const sender = pc.getSenders().find((sr) => sr.track && sr.track.kind === 'video')
        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack)
          socketRef.current?.emit('webrtc:screen-share-start', { roomId })
          setIsScreenSharing(true)
          // If user chose to share system/tab audio and a track exists, publish it
          const screenAudio = s.getAudioTracks()[0]
          if (includeScreenAudio && screenAudio) {
            if (!screenAudioSenderRef.current) {
              screenAudioSenderRef.current = pc.addTrack(screenAudio, s)
            } else {
              await screenAudioSenderRef.current.replaceTrack(screenAudio)
            }
          }
          screenTrack.onended = async () => {
            // revert back to camera
            const camTrack = localStreamRef.current?.getVideoTracks()[0]
            if (camTrack && pcRef.current) {
              const sdr = pcRef.current.getSenders().find((sr) => sr.track && sr.track.kind === 'video')
              if (sdr) await sdr.replaceTrack(camTrack)
            }
            socketRef.current?.emit('webrtc:screen-share-stop', { roomId })
            setIsScreenSharing(false)
            // stop and unpublish screen audio if present
            try {
              if (screenAudioSenderRef.current) {
                const tr = screenAudioSenderRef.current.track
                try { pc.removeTrack(screenAudioSenderRef.current) } catch {}
                if (tr) tr.stop()
              }
            } catch {}
            screenAudioSenderRef.current = null
            screenStreamRef.current?.getTracks().forEach((t) => t.stop())
            screenStreamRef.current = null
          }
        }
      } catch {}
    } else {
      // stop screen share and switch back to camera
      const camTrack = localStreamRef.current?.getVideoTracks()[0]
      if (camTrack && pc.getSenders) {
        const sender = pc.getSenders().find((sr) => sr.track && sr.track.kind === 'video')
        if (sender) await sender.replaceTrack(camTrack)
      }
      socketRef.current?.emit('webrtc:screen-share-stop', { roomId })
      setIsScreenSharing(false)
      // remove screen audio sender if exists
      try {
        if (screenAudioSenderRef.current) {
          const tr = screenAudioSenderRef.current.track
          try { pc.removeTrack(screenAudioSenderRef.current) } catch {}
          if (tr) tr.stop()
        }
      } catch {}
      screenAudioSenderRef.current = null
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
    }
  }, [includeScreenAudio, roomId])

  const teardown = useCallback(() => {
    try {
      socketRef.current?.emit('webrtc:leave', { roomId })
      socketRef.current?.disconnect()
    } catch {}
    socketRef.current = null
    try {
      pcRef.current?.close()
    } catch {}
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    screenStreamRef.current = null
    remoteStreamRef.current = null
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setStatus('idle')
    releaseWakeLock()
  }, [roomId])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (status === 'camera' || status === 'calling' || status === 'connected')) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [status, requestWakeLock])

  useEffect(() => {
    if (!isOpen) return
    const s = ensureSocket()
    // Optionally auto-start full flow for screen share: camera -> call -> toggle share
    if (autoStartShare && !audioOnly) {
      ;(async () => {
        try {
          if (status === 'idle') await startCamera()
          await startCall()
          await new Promise((r) => setTimeout(r, 200))
          await toggleScreenShare()
        } catch {}
      })()
    }
    return () => {
      try { s.disconnect() } catch {}
    }
  }, [isOpen, ensureSocket, autoStartShare, audioOnly, status, startCamera, startCall, toggleScreenShare])

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) { teardown(); onClose() } }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{audioOnly ? 'Audio Call' : 'Video Call'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video ring-1 ring-border">
            {!audioOnly && <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />}
            {audioOnly && <div className="p-4 text-sm text-muted-foreground">Microphone active</div>}
            {!audioOnly && (
              <div className="absolute left-2 bottom-2 text-xs px-2 py-1 rounded-md bg-black/50 text-white">You {camEnabled ? '' : '(camera off)'}</div>
            )}
          </div>
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video ring-1 ring-border">
            {!audioOnly && <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />}
            {audioOnly && <div className="p-4 text-sm text-muted-foreground">Waiting for peer audio…</div>}
            {!audioOnly && (
              <div className="absolute left-2 bottom-2 text-xs px-2 py-1 rounded-md bg-black/50 text-white">Remote</div>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Status: {status}</div>
          <div className="flex items-center gap-2 rounded-full bg-accent/40 px-2 py-1">
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => {
              if (status === 'idle') startCamera();
            }} disabled={status !== 'idle'} title="Start camera/mic">
              <Mic className="h-5 w-5" />
            </Button>
            <Button variant="default" size="sm" className="h-10 px-4" onClick={startCall} disabled={status === 'idle'} title="Call">
              Call
            </Button>
          {!audioOnly && (
            <Button
              variant="secondary"
              onClick={async () => {
                // Start or stop screen share by replacing video track
                const pc = pcRef.current
                if (!pc) return
                if (!screenStreamRef.current) {
                  try {
                    const s = await (navigator.mediaDevices as any).getDisplayMedia({
                      video: true,
                      audio: includeScreenAudio ? ({
                        // Some browsers support these advanced opts; safe to cast
                        suppressLocalAudioPlayback: true,
                      } as any) : false,
                    })
                    screenStreamRef.current = s
                    const screenTrack = s.getVideoTracks()[0]
                    const sender = pc.getSenders().find((sr) => sr.track && sr.track.kind === 'video')
                    if (sender && screenTrack) {
                      await sender.replaceTrack(screenTrack)
                      socketRef.current?.emit('webrtc:screen-share-start', { roomId })
                      // If user chose to share system/tab audio and a track exists, publish it
                      const screenAudio = s.getAudioTracks()[0]
                      if (includeScreenAudio && screenAudio) {
                        if (!screenAudioSenderRef.current) {
                          screenAudioSenderRef.current = pc.addTrack(screenAudio, s)
                        } else {
                          await screenAudioSenderRef.current.replaceTrack(screenAudio)
                        }
                      }
                      screenTrack.onended = async () => {
                        // revert back to camera
                        const camTrack = localStreamRef.current?.getVideoTracks()[0]
                        if (camTrack && pcRef.current) {
                          const sdr = pcRef.current.getSenders().find((sr) => sr.track && sr.track.kind === 'video')
                          if (sdr) await sdr.replaceTrack(camTrack)
                        }
                        socketRef.current?.emit('webrtc:screen-share-stop', { roomId })
                        // stop and unpublish screen audio if present
                        try {
                          if (screenAudioSenderRef.current) {
                            const tr = screenAudioSenderRef.current.track
                            try { pc.removeTrack(screenAudioSenderRef.current) } catch {}
                            if (tr) tr.stop()
                          }
                        } catch {}
                        screenAudioSenderRef.current = null
                        screenStreamRef.current?.getTracks().forEach((t) => t.stop())
                        screenStreamRef.current = null
                      }
                    }
                  } catch {}
                } else {
                  // stop screen share and switch back to camera
                  const camTrack = localStreamRef.current?.getVideoTracks()[0]
                  if (camTrack && pc.getSenders) {
                    const sender = pc.getSenders().find((sr) => sr.track && sr.track.kind === 'video')
                    if (sender) await sender.replaceTrack(camTrack)
                  }
                  socketRef.current?.emit('webrtc:screen-share-stop', { roomId })
                  // remove screen audio sender if exists
                  try {
                    if (screenAudioSenderRef.current) {
                      const tr = screenAudioSenderRef.current.track
                      try { pc.removeTrack(screenAudioSenderRef.current) } catch {}
                      if (tr) tr.stop()
                    }
                  } catch {}
                  screenAudioSenderRef.current = null
                  screenStreamRef.current?.getTracks().forEach((t) => t.stop())
                  screenStreamRef.current = null
                }
              }}
            >
              {isScreenSharing ? 'Stop Share' : 'Share Screen'}
            </Button>
          )}
          {!audioOnly && (
            <Button
              variant={includeScreenAudio ? 'default' : 'outline'}
              onClick={() => setIncludeScreenAudio((v) => !v)}
              title="Include system/tab audio when screen sharing"
            >
              Screen Audio: {includeScreenAudio ? 'On' : 'Off'}
            </Button>
          )}
          <Button variant="destructive" size="sm" className="h-10 w-10 p-0" onClick={teardown} title="End call">✕</Button>
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  )
}


