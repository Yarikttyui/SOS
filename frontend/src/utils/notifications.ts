import toast from 'react-hot-toast';

export const notify = {
  success: (message: string) => {
    toast.success(message, {
      icon: '✅',
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(16, 185, 129, 0.5)',
        borderRadius: '16px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
      duration: 4000,
    });
  },

  error: (message: string) => {
    toast.error(message, {
      icon: '❌',
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        borderRadius: '16px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
      duration: 4000,
    });
  },

  warning: (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(245, 158, 11, 0.5)',
        borderRadius: '16px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
      duration: 4000,
    });
  },

  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        borderRadius: '16px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      icon: '⏳',
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(139, 92, 246, 0.5)',
        borderRadius: '16px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
    });
  },

  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        },
        success: {
          icon: '🎉',
          style: {
            border: '1px solid rgba(16, 185, 129, 0.5)',
          },
        },
        error: {
          icon: '❌',
          style: {
            border: '1px solid rgba(239, 68, 68, 0.5)',
          },
        },
        loading: {
          icon: '⏳',
          style: {
            border: '1px solid rgba(139, 92, 246, 0.5)',
          },
        },
      }
    );
  },
};
