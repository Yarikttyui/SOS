import { notify } from '../../utils/notifications';

export default function NotificationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Демо уведомлений</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => notify.success('Операция выполнена успешно!')}
            className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-lg"
          >
            Успех ✅
          </button>
          
          <button
            onClick={() => notify.error('Произошла ошибка!')}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg"
          >
            Ошибка ❌
          </button>
          
          <button
            onClick={() => notify.warning('Внимание! Проверьте данные')}
            className="px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-all shadow-lg"
          >
            Предупреждение ⚠️
          </button>
          
          <button
            onClick={() => notify.info('Информация для вас')}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg"
          >
            Информация ℹ️
          </button>
          
          <button
            onClick={() => {
              const id = notify.loading('Загрузка данных...');
              setTimeout(() => {
                notify.success('Данные загружены!');
              }, 2000);
            }}
            className="px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all shadow-lg"
          >
            Загрузка ⏳
          </button>
          
          <button
            onClick={() => {
              notify.promise(
                new Promise((resolve) => setTimeout(resolve, 2000)),
                {
                  loading: 'Обработка...',
                  success: 'Готово!',
                  error: 'Ошибка обработки'
                }
              );
            }}
            className="px-6 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium transition-all shadow-lg"
          >
            Promise 🎉
          </button>
        </div>
      </div>
    </div>
  );
}
