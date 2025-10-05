"""
Voice Assistant Service - OpenAI Whisper integration
"""
import base64
import io
from typing import Dict, Any
from openai import OpenAI

from app.core.config import settings


class VoiceAssistant:
    """Voice recognition and analysis service"""
    
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
    
    async def transcribe_audio(self, audio_base64: str, language: str = "ru") -> str:
        """
        Transcribe audio to text using Whisper
        
        Args:
            audio_base64: Base64 encoded audio file
            language: Language code (ru, en, etc.)
            
        Returns:
            str: Transcribed text
        """
        try:
            # Decode base64 audio
            audio_data = base64.b64decode(audio_base64)
            audio_file = io.BytesIO(audio_data)
            audio_file.name = "audio.mp3"
            
            # Transcribe using Whisper
            transcript = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language
            )
            
            return transcript.text
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")
    
    async def analyze_emergency_audio(
        self,
        audio_base64: str,
        language: str = "ru"
    ) -> Dict[str, Any]:
        """
        Analyze emergency audio and extract information
        
        Args:
            audio_base64: Base64 encoded audio
            language: Language code
            
        Returns:
            dict: Emergency analysis results
        """
        # Step 1: Transcribe audio
        text = await self.transcribe_audio(audio_base64, language)
        
        # Step 2: Analyze text for emergency information
        analysis = await self.analyze_emergency_text(text)
        
        return {
            "transcription": text,
            **analysis
        }
    
    async def analyze_emergency_text(self, text: str) -> Dict[str, Any]:
        """
        Analyze text to extract emergency information with enhanced AI
        
        Args:
            text: Transcribed text
            
        Returns:
            dict: Detailed emergency analysis
        """
        try:
            system_prompt = """Ты - AI ассистент экстренных служб спасения. Проанализируй голосовое сообщение о ЧС.

Задачи:
1. Определи ТИП ЧС: fire, medical, police, water_rescue, mountain_rescue, search_rescue, ecological, general
2. Оцени ПРИОРИТЕТ (1-5):
   1 = критический (угроза жизни сейчас)
   2 = высокий (срочная помощь нужна)
   3 = средний (требуется помощь)
   4 = низкий (мониторинг)
   5 = информационный
3. Извлеки ключевую информацию:
   - Количество пострадавших
   - Местоположение (улица, дом, ориентиры)
   - Состояние пострадавших
   - Особые опасности
   - Эмоциональное состояние звонящего

Ответь СТРОГО в JSON:
{
  "emergency_type": "type",
  "priority": 1-5,
  "severity": "low/medium/high/critical",
  "description": "краткое описание ситуации",
  "location_info": "информация о местоположении из текста",
  "victim_count": число или null,
  "victim_condition": "описание состояния",
  "caller_state": "спокоен/взволнован/паника/травмирован",
  "hazards": ["опасность1", "опасность2"],
  "recommendations": ["действие1", "действие2"],
  "required_resources": ["ресурс1", "ресурс2"],
  "immediate_actions": ["немедленное действие 1"],
  "keywords": ["ключевое слово1"],
  "confidence": 0.0-1.0,
  "time_sensitive": true/false
}"""
            
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Транскрипция вызова: {text}"}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            result["model_used"] = "gpt-4o"
            result["analysis_type"] = "voice"
            return result
            
        except Exception as e:
            print(f"❌ Voice Analysis Error: {str(e)}")
            # Enhanced fallback response
            return {
                "emergency_type": "general",
                "priority": 3,
                "severity": "medium",
                "description": text,
                "location_info": "Не определено",
                "victim_count": None,
                "victim_condition": "Не определено",
                "caller_state": "не определен",
                "hazards": ["Требуется уточнение"],
                "recommendations": ["Сохраняйте спокойствие", "Ожидайте прибытия спасателей"],
                "required_resources": ["Базовая команда"],
                "immediate_actions": ["Отправить спасателей"],
                "keywords": [],
                "confidence": 0.5,
                "time_sensitive": True,
                "error": str(e)
            }
    
    async def generate_voice_response(self, text: str) -> bytes:
        """
        Generate voice response using TTS
        
        Args:
            text: Text to convert to speech
            
        Returns:
            bytes: Audio data
        """
        try:
            response = self.client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text
            )
            
            return response.content
        except Exception as e:
            raise Exception(f"TTS generation failed: {str(e)}")
    
    async def get_emergency_guidance(self, emergency_type: str) -> str:
        """
        Get AI-powered emergency guidance
        
        Args:
            emergency_type: Type of emergency
            
        Returns:
            str: Step-by-step guidance
        """
        prompts = {
            "fire": "Дай пошаговую инструкцию что делать при пожаре до прибытия пожарных",
            "medical": "Дай пошаговую инструкцию первой помощи пострадавшему",
            "water_rescue": "Дай инструкцию что делать при спасении на воде",
            "general": "Дай общие рекомендации при чрезвычайной ситуации"
        }
        
        prompt = prompts.get(emergency_type, prompts["general"])
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Ты - эксперт по чрезвычайным ситуациям. Давай четкие, краткие инструкции."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            return response.choices[0].message.content
        except Exception as e:
            return "Сохраняйте спокойствие. Помощь уже в пути. Следуйте указаниям оператора."
