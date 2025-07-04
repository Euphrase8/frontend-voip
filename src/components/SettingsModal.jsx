import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX as X,
  FiMoon as Moon,
  FiSun as Sun,
  FiMonitor as Monitor,
  FiVolume2 as Volume,
  FiMic as Mic,
  FiWifi as Wifi,
  FiRefreshCw as Refresh,
  FiSave as Save,
  FiRotateCcw as Reset
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../utils/ui';
import toast from 'react-hot-toast';
import audioManager from '../services/audioManager';

const SettingsModal = ({ isOpen, onClose, darkMode }) => {
  const { toggleDarkMode, theme, setTheme, themes } = useTheme();
  const [settings, setSettings] = useState({
    darkMode: darkMode,
    theme: theme,
    notifications: {
      sound: true,
      desktop: true,
      calls: true,
      system: true
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      volume: 80
    },
    network: {
      autoReconnect: true,
      connectionTimeout: 30,
      retryAttempts: 3
    },
    ui: {
      animations: true,
      compactMode: false,
      showExtensions: true,
      autoHideNavigation: false
    }
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('voipSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('voipSettings', JSON.stringify(settings));

      // Apply theme changes
      if (settings.darkMode !== darkMode) {
        toggleDarkMode();
      }

      if (settings.theme !== theme) {
        setTheme(settings.theme);
      }

      // Apply audio settings to audio manager
      if (settings.audio) {
        audioManager.updateSettings({
          volume: settings.audio.volume / 100,
          echoCancellation: settings.audio.echoCancellation,
          noiseSuppression: settings.audio.noiseSuppression,
          autoGainControl: settings.audio.autoGainControl
        });
      }

      toast.success('Settings saved successfully!');
      console.log('🔧 Settings saved:', settings);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      darkMode: false,
      theme: 'default',
      notifications: {
        sound: true,
        desktop: true,
        calls: true,
        system: true
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        volume: 80
      },
      network: {
        autoReconnect: true,
        connectionTimeout: 30,
        retryAttempts: 3
      },
      ui: {
        animations: true,
        compactMode: false,
        showExtensions: true,
        autoHideNavigation: false
      }
    };
    
    setSettings(defaultSettings);
    localStorage.removeItem('voipSettings');
    toast.success('Settings reset to defaults');
    console.log('🔄 Settings reset to defaults');
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const updateTopLevelSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

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
            "w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl",
            darkMode ? "bg-secondary-900 text-white" : "bg-white text-secondary-900"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b",
            darkMode ? "border-secondary-700" : "border-secondary-200"
          )}>
            <h2 className="text-2xl font-bold">Settings</h2>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg transition-colors",
                darkMode ? "hover:bg-secondary-800" : "hover:bg-secondary-100"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Theme Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Appearance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <button
                    onClick={() => updateTopLevelSetting('darkMode', !settings.darkMode)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                      settings.darkMode
                        ? "bg-primary-600 text-white"
                        : "bg-secondary-200 text-secondary-700"
                    )}
                  >
                    {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>{settings.darkMode ? 'Dark' : 'Light'}</span>
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateTopLevelSetting('theme', e.target.value)}
                    className={cn(
                      "w-full p-3 rounded-lg border",
                      darkMode
                        ? "bg-secondary-800 border-secondary-700 text-white"
                        : "bg-white border-secondary-300 text-secondary-900"
                    )}
                  >
                    {Object.entries(themes).map(([key, themeData]) => (
                      <option key={key} value={key}>
                        {themeData.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Volume className="w-5 h-5 mr-2" />
                Notifications
              </h3>
              <div className="space-y-3">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <button
                      onClick={() => updateSetting('notifications', key, !value)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        value ? "bg-primary-600" : "bg-secondary-300"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5",
                          value ? "translate-x-6" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Mic className="w-5 h-5 mr-2" />
                Audio
              </h3>
              <div className="space-y-4">
                {Object.entries(settings.audio).map(([key, value]) => (
                  <div key={key}>
                    {key === 'volume' ? (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Volume: {value}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => updateSetting('audio', key, parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <button
                          onClick={() => updateSetting('audio', key, !value)}
                          className={cn(
                            "w-12 h-6 rounded-full transition-colors relative",
                            value ? "bg-primary-600" : "bg-secondary-300"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5",
                              value ? "translate-x-6" : "translate-x-0.5"
                            )}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Network Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Wifi className="w-5 h-5 mr-2" />
                Network
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Auto Reconnect</span>
                  <button
                    onClick={() => updateSetting('network', 'autoReconnect', !settings.network.autoReconnect)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.network.autoReconnect ? "bg-primary-600" : "bg-secondary-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5",
                        settings.network.autoReconnect ? "translate-x-6" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Connection Timeout: {settings.network.connectionTimeout}s
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={settings.network.connectionTimeout}
                    onChange={(e) => updateSetting('network', 'connectionTimeout', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Retry Attempts: {settings.network.retryAttempts}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.network.retryAttempts}
                    onChange={(e) => updateSetting('network', 'retryAttempts', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={cn(
            "flex items-center justify-between p-6 border-t",
            darkMode ? "border-secondary-700" : "border-secondary-200"
          )}>
            <button
              onClick={handleReset}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                "text-danger-600 hover:bg-danger-50"
              )}
            >
              <Reset className="w-4 h-4" />
              <span>Reset</span>
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  darkMode
                    ? "bg-secondary-700 hover:bg-secondary-600 text-white"
                    : "bg-secondary-200 hover:bg-secondary-300 text-secondary-900"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;
