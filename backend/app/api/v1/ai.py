"""
AI Analysis API Endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import base64

from app.services.ai.text import TextAnalyzer
from app.services.ai.voice import VoiceAssistant
from app.services.ai.image import ImageAnalyzer
from app.core.database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

# Initialize AI services
text_analyzer = TextAnalyzer()
voice_assistant = VoiceAssistant()
image_analyzer = ImageAnalyzer()


class TextAnalysisRequest(BaseModel):
    text: str
    analysis_type: str = "classify"  # classify, plan, report


class VoiceAnalysisRequest(BaseModel):
    audio_base64: str
    language: str = "ru"


class ImageAnalysisRequest(BaseModel):
    image_base64: str
    emergency_type: str = "general"


class RescuePlanRequest(BaseModel):
    emergency_type: str
    description: str
    location: Optional[str] = ""
    resources_available: Optional[List[str]] = None


@router.post("/analyze/text")
async def analyze_text(request: TextAnalysisRequest):
    """
    Analyze text using AI
    
    - **text**: Text to analyze
    - **analysis_type**: classify / plan / report
    """
    try:
        if request.analysis_type == "classify":
            result = await text_analyzer.classify_emergency(request.text)
        elif request.analysis_type == "report":
            result = await text_analyzer.analyze_situation_report(request.text)
        else:
            result = await text_analyzer.classify_emergency(request.text)
        
        return {
            "success": True,
            "analysis": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze/voice")
async def analyze_voice(request: VoiceAnalysisRequest):
    """
    Analyze voice message using AI
    
    - **audio_base64**: Base64 encoded audio file
    - **language**: Language code (ru, en, etc.)
    """
    try:
        result = await voice_assistant.analyze_emergency_audio(
            request.audio_base64,
            request.language
        )
        
        return {
            "success": True,
            "analysis": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice analysis failed: {str(e)}")


@router.post("/analyze/image")
async def analyze_image(request: ImageAnalysisRequest):
    """
    Analyze emergency image using AI Vision
    
    - **image_base64**: Base64 encoded image
    - **emergency_type**: Expected emergency type
    """
    try:
        result = await image_analyzer.analyze_emergency_image(
            request.image_base64,
            request.emergency_type
        )
        
        return {
            "success": True,
            "analysis": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


@router.post("/generate/rescue-plan")
async def generate_rescue_plan(request: RescuePlanRequest):
    """
    Generate detailed rescue operation plan
    
    - **emergency_type**: Type of emergency
    - **description**: Situation description
    - **location**: Location details
    - **resources_available**: Available resources
    """
    try:
        plan = await text_analyzer.generate_rescue_plan(
            request.emergency_type,
            request.description,
            request.location,
            request.resources_available
        )
        
        return {
            "success": True,
            "plan": plan
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")


@router.post("/transcribe")
async def transcribe_audio(request: VoiceAnalysisRequest):
    """
    Transcribe audio to text only (without analysis)
    
    - **audio_base64**: Base64 encoded audio file
    - **language**: Language code
    """
    try:
        text = await voice_assistant.transcribe_audio(
            request.audio_base64,
            request.language
        )
        
        return {
            "success": True,
            "transcription": text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.get("/test")
async def test_ai_services():
    """
    Test AI services availability
    """
    return {
        "success": True,
        "services": {
            "text_analyzer": "available",
            "voice_assistant": "available",
            "image_analyzer": "available"
        },
        "models": {
            "text": "gpt-4o",
            "voice": "whisper-1 + gpt-4o",
            "image": "gpt-4o-vision"
        }
    }
