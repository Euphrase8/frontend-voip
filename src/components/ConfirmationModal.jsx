import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAlertTriangle as AlertTriangle,
  FiX as X,
  FiTrash2 as Trash2,
  FiCheck as Check
} from 'react-icons/fi';
import { cn } from '../utils/ui';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger, warning, info
  loading = false,
  darkMode = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-danger-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-warning-500" />;
      default:
        return <Check className="w-6 h-6 text-primary-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-warning';
      default:
        return 'btn-primary';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={cn(
            "w-full max-w-md mx-4 rounded-xl shadow-2xl",
            darkMode ? "bg-secondary-900 text-white" : "bg-white text-secondary-900"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b",
            darkMode ? "border-secondary-700" : "border-secondary-200"
          )}>
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "p-1 rounded-lg transition-colors",
                darkMode 
                  ? "hover:bg-secondary-800 text-secondary-400 hover:text-white"
                  : "hover:bg-secondary-100 text-secondary-500 hover:text-secondary-700"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className={cn(
              "text-sm leading-relaxed",
              darkMode ? "text-secondary-300" : "text-secondary-600"
            )}>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className={cn(
            "flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 p-6 border-t",
            darkMode ? "border-secondary-700" : "border-secondary-200"
          )}>
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary order-2 sm:order-1"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                getConfirmButtonClass(),
                "order-1 sm:order-2",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
