"""
Image Analysis Service - OpenAI Vision integration
"""
import base64
from typing import Dict, Any
from openai import OpenAI

from app.core.config import settings


class ImageAnalyzer:
    """Image analysis service for emergency situations"""
    
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
    
    async def analyze_emergency_image(
        self,
        image_base64: str,
        emergency_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Analyze emergency image with enhanced AI vision
        
        Args:
            image_base64: Base64 encoded image
            emergency_type: Expected emergency type
            
        Returns:
            dict: Detailed analysis results
        """
        try:
            prompts_by_type = {
                "fire": """Проанализируй изображение пожара ДЕТАЛЬНО:
1. Размер и интенсивность (малый/средний/большой/критический)
2. Тип пожара (лесной, строение, транспорт, промышленный)
3. Видимость дыма (цвет, плотность, направление)
4. Наличие людей или животных в опасности
5. Близость к зданиям/лесу/инфраструктуре
6. Доступность для спасателей
7. Погодные условия (если видны)
8. Необходимое оборудование""",

                "medical": """Проанализируй медицинскую ситуацию ДЕТАЛЬНО:
1. Количество пострадавших
2. Видимые травмы или состояния
3. Уровень сознания пострадавших
4. Кровотечения (если видны)
5. Положение тела (травма позвоночника?)
6. Окружение (безопасно ли?)
7. Необходимая первая помощь
8. Срочность эвакуации""",

                "water_rescue": """Проанализируй водную спасательную ситуацию:
1. Количество людей в воде
2. Состояние воды (спокойная/волны/течение)
3. Расстояние до берега
4. Погодные условия
5. Наличие спасательных средств
6. Температура воды (если можно определить)
7. Видимость под водой
8. Опасности (водовороты, препятствия)""",

                "ecological": """Проанализируй экологическую ситуацию:
1. Тип загрязнения (химическое, нефтяное, отходы)
2. Масштаб катастрофы
3. Зона поражения
4. Опасность для людей и животных
5. Распространение загрязнения
6. Необходимые меры изоляции
7. Видимые источники загрязнения""",

                "general": """Проанализируй чрезвычайную ситуацию ДЕТАЛЬНО:
1. Тип ЧС (определи точно)
2. Масштаб происшествия
3. Количество пострадавших (примерно)
4. Уровень опасности
5. Видимые повреждения
6. Окружающая обстановка
7. Доступность локации
8. Время суток (если видно)
9. Погодные условия"""
            }
            
            prompt = prompts_by_type.get(emergency_type, prompts_by_type["general"])
            
            prompt += """

Ответь СТРОГО в JSON формате:
{
  "severity": "low/medium/high/critical",
  "description": "детальное описание ситуации",
  "hazards": ["опасность1", "опасность2"],
  "recommendations": ["конкретная рекомендация 1", "рекомендация 2"],
  "priority": 1-5,
  "confidence": 0.0-1.0,
  "estimated_victims": число или null,
  "required_resources": ["ресурс1", "ресурс2"],
  "immediate_actions": ["действие1", "действие2"],
  "accessibility": "легкий/средний/затруднен/невозможен доступ",
  "weather_conditions": "описание погоды если видно",
  "time_sensitivity": "критично/срочно/умеренно/не критично"
}"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Latest model with vision
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                    "detail": "high"  # High detail for better analysis
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1500,
                temperature=0.3
            )
            
            import json
            try:
                result = json.loads(response.choices[0].message.content)
                result["model_used"] = "gpt-4o-vision"
                result["analysis_type"] = "image"
            except:
                # If not JSON, create structured response
                content = response.choices[0].message.content
                result = {
                    "severity": "medium",
                    "description": content,
                    "hazards": ["Требуется уточнение"],
                    "recommendations": ["Отправить разведку"],
                    "priority": 3,
                    "confidence": 0.7,
                    "estimated_victims": None,
                    "required_resources": ["Базовая команда"],
                    "immediate_actions": ["Оценить ситуацию"],
                    "accessibility": "не определен",
                    "weather_conditions": "не определены",
                    "time_sensitivity": "умеренно",
                    "model_used": "gpt-4o-vision",
                    "raw_response": content
                }
            
            return result
            
        except Exception as e:
            return {
                "severity": "medium",
                "description": f"Analysis failed: {str(e)}",
                "hazards": [],
                "recommendations": ["Обратитесь к оператору"],
                "priority": 3,
                "confidence": 0.0
            }
    
    async def analyze_fire(self, image_base64: str) -> Dict[str, Any]:
        """Analyze fire image"""
        return await self.analyze_emergency_image(image_base64, "fire")
    
    async def analyze_medical(self, image_base64: str) -> Dict[str, Any]:
        """Analyze medical emergency image"""
        return await self.analyze_emergency_image(image_base64, "medical")
    
    async def detect_people_count(self, image_base64: str) -> Dict[str, Any]:
        """
        Detect number of people in image
        
        Args:
            image_base64: Base64 encoded image
            
        Returns:
            dict: People count and locations
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Посчитай сколько людей на изображении. Ответь в формате JSON: {\"count\": число, \"confidence\": 0.0-1.0, \"details\": \"описание\"}"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            import json
            try:
                result = json.loads(response.choices[0].message.content)
            except:
                result = {"count": 0, "confidence": 0.0, "details": "Unable to parse"}
            
            return result
            
        except Exception as e:
            return {"count": 0, "confidence": 0.0, "details": str(e)}
