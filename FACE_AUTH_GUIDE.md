# Face Authentication Guide

## Overview
OptiLeave now supports face authentication for both registration and login, providing a secure and convenient way to access your account.

## Features
- **Face Registration**: Capture your face during account creation
- **Face Login**: Login using facial recognition instead of password
- **Secure Storage**: Face descriptors are stored securely in the database
- **Fallback Authentication**: Traditional password login is still available

## How to Use

### Registration with Face ID
1. Navigate to `/register` page
2. Fill in your details (name, email, password, team)
3. Click "Register with Face ID"
4. Allow camera access when prompted
5. Position your face in the frame
6. Click "Capture Face" when ready
7. Your face will be registered and you'll be redirected to login

### Login with Face ID
1. Navigate to `/login` page
2. Enter your email address
3. Click "Face ID Login" button
4. Allow camera access when prompted
5. Look at the camera for verification
6. Click "Verify Face" to authenticate
7. You'll be logged in automatically upon successful verification

### Traditional Login
You can still use email and password to login:
1. Enter your email and password
2. Click "Sign In"

## Technical Details

### Frontend
- **Library**: @vladmandic/face-api
- **Models Used**:
  - Tiny Face Detector (fast detection)
  - Face Landmark 68 (facial landmarks)
  - Face Recognition (descriptor generation)
- **Component**: `FaceAuth.tsx` handles camera and face detection
- **Storage**: Face descriptors stored as Float32Array (128 dimensions)

### Backend
- **Database**: Face descriptors stored in PostgreSQL as JSON
- **Endpoints**:
  - `POST /api/auth/register` - Register with face data
  - `POST /api/auth/get-face-descriptor` - Retrieve face data for login
  - `POST /api/auth/face-login` - Authenticate using face
- **Security**: Face matching uses Euclidean distance with threshold of 0.6

### Models Location
Face detection models are stored in `frontend/public/models/`:
- tiny_face_detector_model
- face_landmark_68_model
- face_recognition_model

To download models manually:
```bash
cd frontend
npm run download-models
```

## Browser Requirements
- Modern browser with WebRTC support
- Camera access permissions
- HTTPS (required for camera access in production)

## Privacy & Security
- Face descriptors are mathematical representations, not actual images
- No photos are stored, only numerical descriptors
- Descriptors cannot be reverse-engineered to recreate faces
- All data is encrypted in transit and at rest

## Troubleshooting

### Camera Not Working
- Ensure browser has camera permissions
- Check if another app is using the camera
- Try refreshing the page

### Face Not Detected
- Ensure good lighting
- Remove glasses if possible
- Position face clearly in frame
- Look directly at camera

### Face Not Recognized
- Try better lighting conditions
- Ensure face is clearly visible
- Re-register if recognition consistently fails

## Future Enhancements
- Multi-face registration for better accuracy
- Liveness detection to prevent spoofing
- Face update/re-registration feature
- Admin dashboard for face auth management
