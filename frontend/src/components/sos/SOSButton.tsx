import { useState } from 'react'
import { AlertCircle, MapPin, Mic, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { api } from '../../services/api'
import type { EmergencyType } from '../../types'

interface AIAnalysis {
  type: string
  priority: number
  severity: string
  keywords: string[]
  confidence: number
  estimated_victims: number | null
  location_hints: string[]
  required_resources: string[]
  immediate_actions: string[]
  risk_assessment: string
  error?: string
}

export default function SOSButton() {
  const [isEmergency, setIsEmergency] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('general')
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { latitude, longitude, getLocation, isLoading: locationLoading } = useGeolocation()

  const handleSOSClick = () => {
    setShowModal(true)
    setError(null)
    getLocation()
  }

  const analyzeWithAI = async () => {
    if (!description || description.length < 10) {
      setError('Пожалуйста, добавьте более подробное описание для AI анализа')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await api.post('/api/v1/ai/analyze/text', {
        text: description,
        analysis_type: 'classify'
      })

      console.log('🤖 AI Response:', response.data)

      if (response.data.success) {
        const analysis = response.data.analysis
        console.log('📊 AI Analysis:', analysis)
        console.log('🎯 Confidence:', analysis.confidence)
        console.log('⚡ Immediate Actions:', analysis.immediate_actions)
        console.log('📋 Risk Assessment:', analysis.risk_assessment)
        
        setAiAnalysis(analysis)
        setShowAIModal(true)
        
        // Auto-set emergency type from AI
        if (analysis.type) {
          setEmergencyType(analysis.type as EmergencyType)
        }
      }
    } catch (err: any) {
      console.error('AI analysis failed:', err)
      setError('Не удалось выполнить AI анализ. Продолжаем без анализа.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSubmitEmergency = async () => {
    if (!latitude || !longitude) {
      setError('Не удалось определить местоположение')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await api.post('/api/v1/sos/', {
        type: emergencyType,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        title: title || `Экстренная ситуация: ${emergencyType}`,
        description: description || 'Требуется помощь',
      })

      // Automatically analyze if description provided
      if (description && description.length >= 10) {
        await analyzeWithAI()
      }

      setShowModal(false)
      setIsEmergency(true)
      setDescription('')
      setTitle('')
      
      // Reset after 5 seconds
      setTimeout(() => {
        setIsEmergency(false)
      }, 5000)
    } catch (err: any) {
      console.error('Failed to create SOS alert:', err)
      setError(err.response?.data?.detail || 'Не удалось отправить сигнал SOS')
    } finally {
      setIsSubmitting(false)
    }
  }

  const emergencyTypes = [
    { value: 'fire', label: '🔥 Пожар', color: 'red' },
    { value: 'medical', label: '🚑 Медицинская помощь', color: 'blue' },
    { value: 'police', label: '👮 Полиция', color: 'indigo' },
    { value: 'water_rescue', label: '🚤 Спасение на воде', color: 'cyan' },
    { value: 'mountain_rescue', label: '⛰️ Горноспасательная', color: 'yellow' },
    { value: 'search_rescue', label: '🔍 Поисково-спасательная', color: 'purple' },
    { value: 'ecological', label: '☢️ Экологическая', color: 'green' },
    { value: 'general', label: '⚠️ Общая ситуация', color: 'gray' },
  ]

  return (
    <>
      {/* SOS Button */}
      <div className="relative">
        <button
          onClick={handleSOSClick}
          disabled={isEmergency}
          className={`
            relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full text-white font-bold
            transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-4
            disabled:cursor-not-allowed
            ${isEmergency 
              ? 'bg-gradient-success shadow-lg ring-green-300 scale-95' 
              : 'bg-gradient-emergency sos-button hover:scale-105 active:scale-95 ring-red-300'
            }
          `}
        >
          {isEmergency ? (
            <div className="flex flex-col items-center justify-center animate-fade-in">
              <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 mb-3" />
              <span className="text-xl sm:text-2xl font-bold">Помощь вызвана</span>
              <span className="text-sm sm:text-base font-normal mt-2 opacity-90">Ожидайте спасателей</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <span className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-2">SOS</span>
              <span className="text-sm sm:text-base font-semibold opacity-90">Нажмите для вызова</span>
            </div>
          )}
        </button>
        
        {/* Pulse rings animation */}
        {!isEmergency && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse-ring opacity-75"></div>
            <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse-ring opacity-75" style={{ animationDelay: '1s' }}></div>
          </>
        )}
      </div>

      {/* Emergency Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card-modern max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-gradient-emergency text-white p-5 sm:p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      Экстренный вызов
                    </h2>
                    <p className="text-sm opacity-90">Заполните информацию о ситуации</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Location Info */}
              <div className="card-modern bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">📍 Ваше местоположение</p>
                    {locationLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-600">Определение GPS...</p>
                      </div>
                    ) : latitude && longitude ? (
                      <div>
                        <p className="text-sm font-mono text-gray-700 bg-white px-2 py-1 rounded">
                          {latitude.toFixed(6)}, {longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">✓ Координаты получены</p>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 font-medium">⚠️ Не удалось определить местоположение</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  🚨 Тип чрезвычайной ситуации
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {emergencyTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEmergencyType(type.value as EmergencyType)}
                      className={`
                        p-3 sm:p-4 rounded-xl border-2 text-left transition-all transform hover:scale-105 active:scale-95
                        ${emergencyType === type.value
                          ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                        }
                      `}
                    >
                      <span className="text-sm sm:text-base font-semibold block text-center">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  📝 Заголовок (опционально)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-modern"
                  placeholder="Краткое описание ситуации..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  💬 Описание ситуации
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="input-modern resize-none"
                  placeholder="Опишите подробно: что произошло, количество пострадавших, видимые опасности, особые условия..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Подробное описание поможет AI проанализировать ситуацию и дать рекомендации
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="card-modern bg-red-50 border-2 border-red-200 p-4 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Voice Input Button */}
              <button 
                type="button"
                className="w-full card-modern bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 p-4 hover:border-purple-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <Mic className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-gray-900">Описать голосом</span>
                    <span className="text-xs text-gray-600">Скоро будет доступно</span>
                  </div>
                </div>
              </button>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSubmitEmergency}
                  disabled={!latitude || !longitude || isSubmitting || isAnalyzing}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Отправка...
                    </span>
                  ) : isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      AI анализ...
                    </span>
                  ) : (
                    '🚨 Отправить SOS'
                  )}
                </button>
              </div>

              {/* Warning */}
              <div className="card-modern bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    <span className="font-bold">Важно:</span> Ложный вызов экстренных служб преследуется по закону. 
                    Убедитесь, что ситуация требует немедленного вмешательства.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIModal && aiAnalysis && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card-modern max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 sm:p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      🤖 AI Анализ ситуации
                    </h2>
                    <p className="text-sm opacity-90">Рекомендации искусственного интеллекта</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Вызов успешно отправлен!</p>
                  <p className="text-sm text-green-700">Спасатели получили уведомление и уже направляются к вам</p>
                </div>
              </div>
            </div>

            {/* Priority & Type */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium mb-1">Приоритет</p>
                <p className="text-2xl font-bold text-red-700">
                  {aiAnalysis.priority} / 5
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {aiAnalysis.severity === 'critical' && '⚠️ Критический'}
                  {aiAnalysis.severity === 'high' && '🔴 Высокий'}
                  {aiAnalysis.severity === 'medium' && '🟡 Средний'}
                  {aiAnalysis.severity === 'low' && '🟢 Низкий'}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Тип ЧС</p>
                <p className="text-xl font-bold text-blue-700">
                  {emergencyTypes.find(t => t.value === aiAnalysis.type)?.label || aiAnalysis.type}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Уверенность: {(aiAnalysis.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-1">Оценка рисков</p>
                  <p className="text-sm text-yellow-800">{aiAnalysis.risk_assessment || 'Требуется уточнение'}</p>
                  
                  {aiAnalysis.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs font-semibold text-red-800 mb-1">⚠️ Ошибка AI анализа:</p>
                      <p className="text-xs text-red-700">{aiAnalysis.error}</p>
                      <p className="text-xs text-red-600 mt-2">
                        Возможные причины: проблема с API ключом OpenAI, исчерпана квота, или сетевая ошибка.
                        Вызов успешно отправлен, но без AI рекомендаций.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Immediate Actions */}
            {aiAnalysis.immediate_actions && aiAnalysis.immediate_actions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-red-600">⚡</span>
                  Немедленные действия
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.immediate_actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-red-600 font-bold">{index + 1}.</span>
                      <span className="text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Resources */}
            {aiAnalysis.required_resources && aiAnalysis.required_resources.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">🚒</span>
                  Необходимые ресурсы
                </h3>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.required_resources.map((resource, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Victims */}
            {aiAnalysis.estimated_victims !== null && (
              <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Пострадавшие</p>
                <p className="text-xl font-bold text-purple-700">
                  Примерно {aiAnalysis.estimated_victims} человек(а)
                </p>
              </div>
            )}

            {/* Keywords */}
            {aiAnalysis.keywords && aiAnalysis.keywords.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">Ключевые слова</h3>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location Hints */}
            {aiAnalysis.location_hints && aiAnalysis.location_hints.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Подсказки по местоположению
                </h3>
                <ul className="space-y-1">
                  {aiAnalysis.location_hints.map((hint, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowAIModal(false)}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Понятно
            </button>

            {/* Debug Info */}
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                🐛 Debug: Показать полные данные AI
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(aiAnalysis, null, 2)}
              </pre>
            </details>

            <p className="text-xs text-center text-gray-500 mt-4">
              Анализ выполнен с помощью OpenAI GPT-4o
            </p>
          </div>
        </div>
      )}
    </>
  )
}
