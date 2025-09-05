from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import datetime
import os
from contextlib import asynccontextmanager

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        # Using service account key file
        cred = credentials.Certificate("auth-key.json")  # Place your JSON file in the same directory
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

# Pydantic models
class TranscriptionCreate(BaseModel):
    text: str
    duration: float  # in seconds

class TranscriptionResponse(BaseModel):
    id: str
    text: str
    duration: float
    created: str
    uid: str

class TranscriptionUpdate(BaseModel):
    text: Optional[str] = None
    duration: Optional[float] = None

# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Firebase on startup
    global db
    db = initialize_firebase()
    yield

# Initialize FastAPI
app = FastAPI(
    title="Transcription API",
    description="API for managing user transcriptions with Firebase Firestore",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],  # Add your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global database client
db = None

# Authentication dependency
async def verify_firebase_token(authorization: str = Header(...)):
    """Verify Firebase ID token from Authorization header"""
    try:
        # Extract token from "Bearer <token>" format
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        token = authorization.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# Helper function to convert Firestore timestamp to string
def format_timestamp(timestamp):
    if hasattr(timestamp, 'timestamp'):
        return datetime.fromtimestamp(timestamp.timestamp()).isoformat()
    return timestamp

@app.get("/")
async def root():
    return {"message": "Transcription API is running"}

@app.post("/transcriptions", response_model=TranscriptionResponse)
async def create_transcription(
    transcription: TranscriptionCreate,
    uid: str = Depends(verify_firebase_token)
):
    """Create a new transcription for the authenticated user"""
    try:
        # Create transcription document
        transcription_data = {
            "text": transcription.text,
            "duration": transcription.duration,
            "created": firestore.SERVER_TIMESTAMP,
            "uid": uid
        }
        
        # Add to Firestore
        doc_ref = db.collection("transcriptions").add(transcription_data)
        doc_id = doc_ref[1].id
        
        # Get the created document to return with server timestamp
        created_doc = db.collection("transcriptions").document(doc_id).get()
        doc_data = created_doc.to_dict()
        
        return TranscriptionResponse(
            id=doc_id,
            text=doc_data["text"],
            duration=doc_data["duration"],
            created=format_timestamp(doc_data["created"]),
            uid=doc_data["uid"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create transcription: {str(e)}")

@app.get("/transcriptions", response_model=list[TranscriptionResponse])
async def get_user_transcriptions(
    uid: str = Depends(verify_firebase_token),
    limit: Optional[int] = 50
):
    """Get all transcriptions for the authenticated user"""
    try:
        # Query transcriptions for the user
        query = db.collection("transcriptions").where("uid", "==", uid).limit(limit)
        docs = query.stream()
        
        transcriptions = []
        for doc in docs:
            data = doc.to_dict()
            transcriptions.append(TranscriptionResponse(
                id=doc.id,
                text=data["text"],
                duration=data["duration"],
                created=format_timestamp(data["created"]),
                uid=data["uid"]
            ))
        
        return transcriptions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transcriptions: {str(e)}")

@app.get("/transcriptions/{transcription_id}", response_model=TranscriptionResponse)
async def get_transcription(
    transcription_id: str,
    uid: str = Depends(verify_firebase_token)
):
    """Get a specific transcription by ID"""
    try:
        doc_ref = db.collection("transcriptions").document(transcription_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Transcription not found")
        
        data = doc.to_dict()
        
        # Verify ownership
        if data["uid"] != uid:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return TranscriptionResponse(
            id=doc.id,
            text=data["text"],
            duration=data["duration"],
            created=format_timestamp(data["created"]),
            uid=data["uid"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transcription: {str(e)}")

@app.put("/transcriptions/{transcription_id}", response_model=TranscriptionResponse)
async def update_transcription(
    transcription_id: str,
    transcription: TranscriptionUpdate,
    uid: str = Depends(verify_firebase_token)
):
    """Update a specific transcription"""
    try:
        doc_ref = db.collection("transcriptions").document(transcription_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Transcription not found")
        
        data = doc.to_dict()
        
        # Verify ownership
        if data["uid"] != uid:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update only provided fields
        update_data = {}
        if transcription.text is not None:
            update_data["text"] = transcription.text
        if transcription.duration is not None:
            update_data["duration"] = transcription.duration
        
        if update_data:
            doc_ref.update(update_data)
            
            # Get updated document
            updated_doc = doc_ref.get()
            updated_data = updated_doc.to_dict()
            
            return TranscriptionResponse(
                id=transcription_id,
                text=updated_data["text"],
                duration=updated_data["duration"],
                created=format_timestamp(updated_data["created"]),
                uid=updated_data["uid"]
            )
        
        # Return existing data if no updates
        return TranscriptionResponse(
            id=transcription_id,
            text=data["text"],
            duration=data["duration"],
            created=format_timestamp(data["created"]),
            uid=data["uid"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update transcription: {str(e)}")

@app.delete("/transcriptions/{transcription_id}")
async def delete_transcription(
    transcription_id: str,
    uid: str = Depends(verify_firebase_token)
):
    """Delete a specific transcription"""
    try:
        doc_ref = db.collection("transcriptions").document(transcription_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Transcription not found")
        
        data = doc.to_dict()
        
        # Verify ownership
        if data["uid"] != uid:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete the document
        doc_ref.delete()
        
        return {"message": "Transcription deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete transcription: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)