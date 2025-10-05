"""
Text Analysis Service
"""
from typing import Dict, Any
from openai import OpenAI

from app.core.config import settings


class TextAnalyzer:
    """Text analysis for emergency classification"""
    
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
    
    async def classify_emergency(self, text: str) -> Dict[str, Any]:
        """
        Classify emergency type from text description
        
        Args:
            text: Emergency description
            
        Returns:
            dict: Classification results with enhanced details
        """
        try:
            system_prompt = """Ты - AI помощник спасательной службы. Классифицируй тип чрезвычайной ситуации из описания.

Возможные типы:
- fire (пожар)
- medical (медицинская помощь)
- police (полиция)
- water_rescue (спасение на воде)
- mountain_rescue (горноспасательная операция)
- search_rescue (поисково-спасательная операция)
- ecological (экологическая катастрофа)
- general (общая ЧС)

Приоритеты (1-5):
1 - критический (угроза жизни)
2 - высокий (срочная помощь)
3 - средний (требуется помощь)
4 - низкий (мониторинг)
5 - информационный

Ответь СТРОГО в JSON формате:
{
  "type": "тип_ЧС",
  "priority": 1-5,
  "severity": "low/medium/high/critical",
  "keywords": ["ключевые_слова"],
  "confidence": 0.0-1.0,
  "estimated_victims": число или null,
  "location_hints": ["подсказки_по_местоположению"],
  "required_resources": ["необходимые_ресурсы"],
  "immediate_actions": ["немедленные_действия"],
  "risk_assessment": "оценка_рисков"
}"""
            
            print(f"🤖 AI Request - Text: {text[:100]}...")
            
            response = self.client.chat.completions.create(
                model="deepseek-chat",  # DeepSeek model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Описание ЧС: {text}"}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            import json
            raw_content = response.choices[0].message.content
            print(f"🎯 AI Raw Response: {raw_content}")
            
            result = json.loads(raw_content)
            print(f"📊 AI Parsed Result: {result}")
            
            # Add metadata
            result["analyzed_at"] = "now"
            result["model_used"] = "gpt-4o"
            
            print(f"✅ AI Final Result - Confidence: {result.get('confidence', 'N/A')}")
            
            return result
            
        except Exception as e:
            print(f"❌ AI Classification Error: {str(e)}")
            return {
                "type": "general",
                "priority": 3,
                "severity": "medium",
                "keywords": [],
                "confidence": 0.0,
                "estimated_victims": None,
                "location_hints": [],
                "required_resources": ["Базовая спасательная команда"],
                "immediate_actions": ["Отправить спасателей"],
                "risk_assessment": "Требуется уточнение",
                "error": str(e)
            }
    
    async def generate_rescue_plan(
        self,
        emergency_type: str,
        description: str,
        location: str = "",
        resources_available: list = None
    ) -> Dict[str, Any]:
        """
        Generate detailed rescue operation plan using AI
        
        Args:
            emergency_type: Type of emergency
            description: Situation description
            location: Location details
            resources_available: Available rescue resources
            
        Returns:
            dict: Detailed rescue plan
        """
        try:
            resources_str = ", ".join(resources_available) if resources_available else "стандартные ресурсы"
            
            prompt = f"""Создай ДЕТАЛЬНЫЙ план спасательной операции для следующей ситуации:

Тип ЧС: {emergency_type}
Описание: {description}
Местоположение: {location or "не указано"}
Доступные ресурсы: {resources_str}

Создай план в формате JSON:
{{
  "operation_name": "название операции",
  "phases": [
    {{
      "phase_number": 1,
      "phase_name": "название этапа",
      "duration_estimate": "оценка времени",
      "actions": ["действие 1", "действие 2"],
      "required_personnel": ["специалист 1"],
      "equipment_needed": ["оборудование 1"]
    }}
  ],
  "team_composition": {{
    "team_leader": "роль руководителя",
    "members": ["член команды 1", "член команды 2"],
    "specialists": ["специалист 1"]
  }},
  "safety_measures": ["мера безопасности 1", "мера 2"],
  "communication_plan": "план связи",
  "evacuation_routes": ["маршрут 1"],
  "medical_support": "план медицинской поддержки",
  "contingency_plans": ["план Б", "план В"],
  "estimated_duration": "общая оценка времени",
  "success_criteria": ["критерий успеха 1"],
  "risks": ["риск 1", "риск 2"]
}}"""
            
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "Ты - опытный координатор спасательных операций. Создавай детальные, реалистичные планы."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            import json
            plan = json.loads(response.choices[0].message.content)
            plan["generated_at"] = "now"
            plan["model_used"] = "gpt-4o"
            
            return plan
            
        except Exception as e:
            print(f"❌ Plan Generation Error: {str(e)}")
            return {
                "operation_name": "Стандартная спасательная операция",
                "phases": [
                    {
                        "phase_number": 1,
                        "phase_name": "Оценка ситуации",
                        "duration_estimate": "15 минут",
                        "actions": ["Прибыть на место", "Оценить обстановку"],
                        "required_personnel": ["Руководитель группы"],
                        "equipment_needed": ["Средства связи"]
                    }
                ],
                "team_composition": {
                    "team_leader": "Старший спасатель",
                    "members": ["Спасатель 1", "Спасатель 2"],
                    "specialists": []
                },
                "safety_measures": ["Использовать СИЗ"],
                "communication_plan": "Радиосвязь",
                "evacuation_routes": ["Основной маршрут"],
                "medical_support": "Базовая первая помощь",
                "contingency_plans": ["Вызвать подкрепление"],
                "estimated_duration": "1-2 часа",
                "success_criteria": ["Все пострадавшие в безопасности"],
                "risks": ["Изменение погоды", "Недостаток ресурсов"],
                "error": str(e)
            }
    
    async def analyze_situation_report(self, report_text: str) -> Dict[str, Any]:
        """
        Analyze situation report and extract key information
        
        Args:
            report_text: Situation report text
            
        Returns:
            dict: Analyzed report data
        """
        try:
            prompt = f"""Проанализируй отчет о ЧС и извлеки ключевую информацию:

{report_text}

Ответь в JSON:
{{
  "summary": "краткое резюме",
  "key_points": ["ключевой пункт 1", "пункт 2"],
  "current_status": "текущий статус",
  "challenges": ["проблема 1"],
  "progress": "описание прогресса",
  "next_steps": ["следующий шаг 1"],
  "sentiment": "positive/neutral/negative/critical",
  "urgency_level": 1-5
}}"""
            
            response = self.client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "Ты - аналитик спасательных операций"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            import json
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            return {
                "summary": "Ошибка анализа",
                "key_points": [],
                "current_status": "Не определен",
                "challenges": [],
                "progress": "Не определен",
                "next_steps": [],
                "sentiment": "neutral",
                "urgency_level": 3,
                "error": str(e)
            }

