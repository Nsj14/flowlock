from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import os
from insightface.app import FaceAnalysis
from numpy.linalg import norm
import json

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the face analysis model (same as in original scripts)
try:
    print("Loading model...")
    face_app = FaceAnalysis(name="buffalo_l")
    face_app.prepare(ctx_id=0, det_size=(640, 640))
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    face_app = None

# Database path for storing user embedding
DB_PATH = "database/user.npy"

# Ensure the database directory exists
os.makedirs("database", exist_ok=True)

class ImageData(BaseModel):
    image: str  # Base64 encoded image string

def base64_to_cv2(base64_string: str):
    """Convert base64 image string from React to OpenCV Mat format"""
    # Remove header if present (e.g., "data:image/jpeg;base64,")
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    img_data = base64.b64decode(base64_string)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

@app.get("/status")
def status():
    """Endpoint to check if the user is already enrolled"""
    enrolled = os.path.exists(DB_PATH)
    return {"enrolled": enrolled}

@app.delete("/reset")
def reset():
    """Endpoint to remove the stored face and allow re-enrollment"""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        return {"success": True, "message": "Face data removed. You can now re-enroll."}
    return {"success": False, "message": "No face data found."}

@app.post("/register")
def register(data: ImageData):
    """Endpoint to register a new user face"""
    if face_app is None:
        raise HTTPException(status_code=500, detail="Face analysis model not initialized")

    img = base64_to_cv2(data.image)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image data")

    faces = face_app.get(img)

    if len(faces) == 0:
        return {"success": False, "message": "No face detected in the image."}
    
    if len(faces) > 1:
        return {"success": False, "message": "Multiple faces detected. Please make sure only you are in the frame."}

    # Save the embedding
    embedding = faces[0].embedding
    np.save(DB_PATH, embedding)
    
    return {"success": True, "message": "Face registered successfully."}

@app.post("/authenticate")
def authenticate(data: ImageData):
    """Endpoint to authenticate a user frame during the session"""
    if face_app is None:
        raise HTTPException(status_code=500, detail="Face analysis model not initialized")

    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=400, detail="No registered user found. Please enroll first.")

    stored_embedding = np.load(DB_PATH)
    
    img = base64_to_cv2(data.image)
    if img is None:
        return {"authenticated": False, "message": "Invalid image data"}

    faces = face_app.get(img)

    if len(faces) == 0:
        return {"authenticated": False, "message": "No face detected"}

    # Use the largest face/first face found
    new_embedding = faces[0].embedding

    similarity = np.dot(stored_embedding, new_embedding) / (
        norm(stored_embedding) * norm(new_embedding)
    )

    is_authenticated = bool(similarity > 0.6)  # numpy bool to native python bool

    return {
        "authenticated": is_authenticated, 
        "similarity": float(similarity),
        "message": "Unlocked" if is_authenticated else "Access Denied"
    }

if __name__ == "__main__":
    import uvicorn
    # Make sure to run the server on a port that doesn't conflict with Next.js
    uvicorn.run(app, host="127.0.0.1", port=8000)

