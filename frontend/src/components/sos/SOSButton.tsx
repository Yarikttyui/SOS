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
      <button
        onClick={handleSOSClick}
        disabled={isEmergency}
        className={`
          relative w-64 h-64 rounded-full text-white font-bold text-4xl
          transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-400
          ${isEmergency 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-red-600 hover:bg-red-700 sos-button'
          }
        `}
      >
        {isEmergency ? (
          <div className="flex flex-col items-center">
            <span className="text-3xl">✓</span>
            <span className="text-lg mt-2">Помощь вызвана</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span>SOS</span>
            <span className="text-sm font-normal mt-2">Экстренный вызов</span>
          </div>
        )}
      </button>

      {/* Emergency Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                🚨 Экстренный вызов
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Location Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Ваше местоположение</p>
                  {locationLoading ? (
                    <p className="text-sm text-gray-600">Определение местоположения...</p>
                  ) : latitude && longitude ? (
                    <p className="text-sm text-gray-600">
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">Не удалось определить местоположение</p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Тип чрезвычайной ситуации
              </label>
              <div className="grid grid-cols-2 gap-3">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setEmergencyType(type.value as EmergencyType)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${emergencyType === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <span className="font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок (опционально)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Краткое описание..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание ситуации
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Опишите что произошло, количество пострадавших, видимые опасности..."
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Voice Input Button */}
            <button className="w-full mb-6 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2">
              <Mic className="w-5 h-5" />
              <span>Описать голосом (скоро)</span>
            </button>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitEmergency}
                disabled={!latitude || !longitude || isSubmitting || isAnalyzing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Отправка...' : isAnalyzing ? '🤖 Анализ...' : 'Отправить SOS'}
              </button>
            </div>

            {/* Warning */}
            <div className="mt-6 flex items-start gap-2 text-sm text-gray-600">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p>
                Ложный вызов экстренных служб преследуется по закону. Убедитесь, что ситуация требует немедленного вмешательства.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIModal && aiAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  AI Анализ ситуации
                </h2>
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
