'use client'

import { useEffect, useRef, useState } from 'react'

interface FaceAuthProps {
  mode: 'login' | 'register'
  onSuccess: (faceDescriptor: Float32Array) => void
  onCancel: () => void
  existingDescriptor?: Float32Array
}

export default function FaceAuth({ mode, onSuccess, onCancel, existingDescriptor }: FaceAuthProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [status, setStatus] = useState<string>('Initializing...')
  const [error, setError] = useState<string>('')
  const [capturing, setCapturing] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const faceApiRef = useRef<any>(null)

  useEffect(() => {
    loadFaceApi()
    return () => {
      stopCamera()
    }
  }, [])

  const loadFaceApi = async () => {
    try {
      // Dynamically import face-api to avoid SSR issues
      const faceapi = await import('@vladmandic/face-api')
      faceApiRef.current = faceapi
      await loadModels(faceapi)
    } catch (err) {
      console.error('Error loading face-api:', err)
      setError('Failed to load face detection library')
      setStatus('Error loading library')
    }
  }

  const loadModels = async (faceapi: any) => {
    try {
      setStatus('Loading face detection models...')
      const MODEL_URL = '/models'
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      
      setModelsLoaded(true)
      setStatus('Models loaded. Starting camera...')
      await startCamera()
    } catch (err) {
      console.error('Error loading models:', err)
      setError('Failed to load face detection models')
      setStatus('Error loading models')
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setStatus(mode === 'register' ? 'Position your face in the frame' : 'Look at the camera to login')
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Failed to access camera. Please grant camera permissions.')
      setStatus('Camera access denied')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded || capturing || !faceApiRef.current) return

    const faceapi = faceApiRef.current
    setCapturing(true)
    setStatus('Detecting face...')
    setError('')

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setError('No face detected. Please position your face clearly in the frame.')
        setStatus('No face detected')
        setCapturing(false)
        return
      }

      // Draw detection on canvas
      if (canvasRef.current && videoRef.current) {
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        }
        faceapi.matchDimensions(canvasRef.current, displaySize)
        const resizedDetection = faceapi.resizeResults(detection, displaySize)
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          faceapi.draw.drawDetections(canvasRef.current, resizedDetection)
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection)
        }
      }

      if (mode === 'register') {
        setStatus('Face captured successfully!')
        setTimeout(() => {
          stopCamera()
          onSuccess(detection.descriptor)
        }, 1000)
      } else {
        // Login mode - compare with existing descriptor
        if (!existingDescriptor) {
          setError('No face data found for this account')
          setCapturing(false)
          return
        }

        const distance = faceapi.euclideanDistance(detection.descriptor, existingDescriptor)
        const threshold = 0.6 // Lower is more strict

        if (distance < threshold) {
          setStatus('Face recognized! Logging in...')
          setTimeout(() => {
            stopCamera()
            onSuccess(detection.descriptor)
          }, 1000)
        } else {
          setError(`Face not recognized. Please try again. (Match: ${((1 - distance) * 100).toFixed(1)}%)`)
          setStatus('Face not recognized')
          setCapturing(false)
        }
      }
    } catch (err) {
      console.error('Error capturing face:', err)
      setError('Error processing face. Please try again.')
      setStatus('Error processing face')
      setCapturing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold gradient-text">
            {mode === 'register' ? 'Register Your Face' : 'Face Login'}
          </h2>
          <button
            onClick={() => {
              stopCamera()
              onCancel()
            }}
            className="text-2xl text-black/60 hover:text-black transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-black"
            onLoadedMetadata={() => {
              if (videoRef.current && canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth
                canvasRef.current.height = videoRef.current.videoHeight
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Status:</span>
            <span className="text-sm text-black/60">{status}</span>
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={captureFace}
            disabled={!modelsLoaded || capturing}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {capturing ? 'Processing...' : mode === 'register' ? 'Capture Face' : 'Verify Face'}
          </button>
          <button
            onClick={() => {
              stopCamera()
              onCancel()
            }}
            className="px-6 py-3 rounded-lg bg-white border border-black/10 font-semibold hover:bg-black/5 transition-all"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-xs text-black/60 text-center">
          <p>• Ensure good lighting</p>
          <p>• Look directly at the camera</p>
          <p>• Remove glasses if possible</p>
        </div>
      </div>
    </div>
  )
}
