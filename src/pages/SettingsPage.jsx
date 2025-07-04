import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiSettings as Settings,
  FiUser as User,
  FiPhone as Phone,
  FiVolume2 as Volume,
  FiBell as Bell,
  FiMoon as Moon,
  FiSun as Sun,
  FiSave as Save,
  FiRefreshCw as RefreshCw,
  FiShield as Shield,
  FiDatabase as Database,
  FiWifi as Wifi
} from 'react-icons/fi';
import { cn } from '../utils/ui';
import toast from 'react-hot-toast';
import audioManager from '../services/audioManager';

const SettingsPage = ({ darkMode, onToggleDarkMode, user }) => {
  const [settings, setSettings] = useState({
    // Audio Settings
    ringtoneVolume: 80,
    microphoneVolume: 75,
    speakerVolume: 85,
    enableRingtone: true,
    enableKeypadSounds: true,
    
    // Call Settings
    autoAnswer: false,
    callWaiting: true,
    callForwarding: false,
    forwardingNumber: '',
    
    // Notification Settings
    enableNotifications: true,
    enableCallNotifications: true,
    enableMessageNotifications: true,
    notificationSound: true,
    
    // Privacy Settings
    showOnlineStatus: true,
    allowDirectCalls: true,
    blockUnknownCallers: false,
    
    // Advanced Settings
    enableDebugMode: false,
    autoReconnect: true,
    connectionTimeout: 30,
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Apply audio settings immediately
    if (key === 'speakerVolume' || key === 'microphoneVolume' || key === 'ringtoneVolume') {
      const normalizedValue = value / 100;
      if (key === 'speakerVolume') {
        audioManager.setVolume(normalizedValue);
      }
    }

    toast.success('Setting updated');
  };

  const handleSaveSettings = () => {
    try {
      // Save to localStorage
      localStorage.setItem('voip-settings', JSON.stringify(settings));

      // Apply all audio settings to audio manager
      audioManager.updateSettings({
        volume: settings.speakerVolume / 100,
        ringtoneVolume: settings.ringtoneVolume / 100
      });

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        ringtoneVolume: 80,
        microphoneVolume: 75,
        speakerVolume: 85,
        enableRingtone: true,
        enableKeypadSounds: true,
        autoAnswer: false,
        callWaiting: true,
        callForwarding: false,
        forwardingNumber: '',
        enableNotifications: true,
        enableCallNotifications: true,
        enableMessageNotifications: true,
        notificationSound: true,
        showOnlineStatus: true,
        allowDirectCalls: true,
        blockUnknownCallers: false,
        enableDebugMode: false,
        autoReconnect: true,
        connectionTimeout: 30,
      });
      toast.success('Settings reset to default');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      <div className="flex-shrink-0 p-4 lg:p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={cn(
              'text-sm',
              darkMode ? 'text-secondary-400' : 'text-secondary-600'
            )}>
              Customize your VoIP experience
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleResetSettings}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                darkMode
                  ? "text-secondary-400 hover:text-secondary-300 hover:bg-secondary-800 border border-secondary-700"
                  : "text-secondary-600 hover:text-secondary-700 hover:bg-secondary-100 border border-secondary-300"
              )}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex items-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">

        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <User className="w-5 h-5" />
            <span>Profile</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn(
                'block text-sm font-medium mb-1',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Username
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className={cn(
                  'w-full px-3 py-2 text-sm rounded border',
                  darkMode
                    ? 'bg-secondary-700 border-secondary-600 text-secondary-400'
                    : 'bg-secondary-50 border-secondary-300 text-secondary-500'
                )}
              />
            </div>
            
            <div>
              <label className={cn(
                'block text-sm font-medium mb-1',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Extension
              </label>
              <input
                type="text"
                value={user?.extension || ''}
                disabled
                className={cn(
                  'w-full px-3 py-2 text-sm rounded border',
                  darkMode
                    ? 'bg-secondary-700 border-secondary-600 text-secondary-400'
                    : 'bg-secondary-50 border-secondary-300 text-secondary-500'
                )}
              />
            </div>
          </div>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span>Appearance</span>
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className={cn(
                'font-medium',
                darkMode ? 'text-white' : 'text-secondary-900'
              )}>
                Dark Mode
              </p>
              <p className={cn(
                'text-sm',
                darkMode ? 'text-secondary-400' : 'text-secondary-600'
              )}>
                Switch between light and dark themes
              </p>
            </div>
            <button
              onClick={onToggleDarkMode}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                darkMode ? 'bg-primary-600' : 'bg-secondary-300'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </motion.div>

        {/* Audio Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'p-6 rounded-xl border',
            darkMode
              ? 'bg-secondary-800 border-secondary-700'
              : 'bg-white border-secondary-200'
          )}
        >
          <h3 className={cn(
            'text-lg font-semibold mb-4 flex items-center space-x-2',
            darkMode ? 'text-white' : 'text-secondary-900'
          )}>
            <Volume className="w-5 h-5" />
            <span>Audio Settings</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className={cn(
                'block text-sm font-medium mb-2',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Ringtone Volume: {settings.ringtoneVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.ringtoneVolume}
                onChange={(e) => handleSettingChange('ringtoneVolume', parseInt(e.target.value))}
                className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className={cn(
                'block text-sm font-medium mb-2',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Microphone Volume: {settings.microphoneVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.microphoneVolume}
                onChange={(e) => handleSettingChange('microphoneVolume', parseInt(e.target.value))}
                className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className={cn(
                'text-sm font-medium',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Enable Ringtone
              </label>
              <input
                type="checkbox"
                checked={settings.enableRingtone}
                onChange={(e) => handleSettingChange('enableRingtone', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className={cn(
                'text-sm font-medium',
                darkMode ? 'text-secondary-300' : 'text-secondary-700'
              )}>
                Keypad Sounds
              </label>
              <input
                type="checkbox"
                checked={settings.enableKeypadSounds}
                onChange={(e) => handleSettingChange('enableKeypadSounds', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
