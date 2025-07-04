import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX as X,
  FiUser as User,
  FiMail as Mail,
  FiPhone as Phone,
  FiLock as Lock,
  FiShield as Shield,
  FiEye as Eye,
  FiEyeOff as EyeOff,
  FiUserPlus as UserPlus,
  FiAlertCircle as AlertCircle
} from 'react-icons/fi';
import { cn } from '../utils/ui';
import toast from 'react-hot-toast';

const CreateUserModal = ({ isOpen, onClose, onCreateUser, darkMode }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    extension: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Extension validation
    if (!formData.extension.trim()) {
      newErrors.extension = 'Extension is required';
    } else if (!/^\d{3,5}$/.test(formData.extension)) {
      newErrors.extension = 'Extension must be 3-5 digits';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        extension: formData.extension.trim(),
        password: formData.password,
        role: formData.role
      });
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        extension: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });
      setErrors({});
      onClose();
      toast.success('User created successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        username: '',
        email: '',
        extension: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative w-full max-w-md mx-auto rounded-xl shadow-2xl',
              'max-h-[90vh] overflow-y-auto',
              darkMode
                ? 'bg-secondary-800 border border-secondary-700'
                : 'bg-white border border-secondary-200'
            )}
          >
            {/* Header */}
            <div className={cn(
              'flex items-center justify-between p-6 border-b',
              darkMode ? 'border-secondary-700' : 'border-secondary-200'
            )}>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <UserPlus className={cn(
                    'w-5 h-5',
                    darkMode ? 'text-primary-400' : 'text-primary-600'
                  )} />
                </div>
                <div>
                  <h2 className={cn(
                    'text-lg font-semibold',
                    darkMode ? 'text-white' : 'text-secondary-900'
                  )}>
                    Create New User
                  </h2>
                  <p className={cn(
                    'text-sm',
                    darkMode ? 'text-secondary-400' : 'text-secondary-600'
                  )}>
                    Add a new user to the VoIP system
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  darkMode
                    ? 'hover:bg-secondary-700 text-secondary-400 hover:text-white'
                    : 'hover:bg-secondary-100 text-secondary-500 hover:text-secondary-700'
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Username Field */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  darkMode ? 'text-secondary-300' : 'text-secondary-700'
                )}>
                  Username
                </label>
                <div className="relative">
                  <User className={cn(
                    'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4',
                    darkMode ? 'text-secondary-400' : 'text-secondary-500'
                  )} />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors',
                      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      errors.username
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : darkMode
                          ? 'bg-secondary-900 border-secondary-600 text-white placeholder-secondary-400'
                          : 'bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500'
                    )}
                    placeholder="Enter username"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.username && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.username}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  darkMode ? 'text-secondary-300' : 'text-secondary-700'
                )}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={cn(
                    'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4',
                    darkMode ? 'text-secondary-400' : 'text-secondary-500'
                  )} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors',
                      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      errors.email
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : darkMode
                          ? 'bg-secondary-900 border-secondary-600 text-white placeholder-secondary-400'
                          : 'bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500'
                    )}
                    placeholder="Enter email address"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Extension Field */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  darkMode ? 'text-secondary-300' : 'text-secondary-700'
                )}>
                  Extension
                </label>
                <div className="relative">
                  <Phone className={cn(
                    'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4',
                    darkMode ? 'text-secondary-400' : 'text-secondary-500'
                  )} />
                  <input
                    type="text"
                    value={formData.extension}
                    onChange={(e) => handleInputChange('extension', e.target.value.replace(/\D/g, ''))}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors',
                      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      errors.extension
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : darkMode
                          ? 'bg-secondary-900 border-secondary-600 text-white placeholder-secondary-400'
                          : 'bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500'
                    )}
                    placeholder="Enter extension (e.g., 1001)"
                    disabled={isSubmitting}
                    maxLength={5}
                  />
                </div>
                {errors.extension && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.extension}
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  darkMode ? 'text-secondary-300' : 'text-secondary-700'
                )}>
                  Role
                </label>
                <div className="relative">
                  <Shield className={cn(
                    'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4',
                    darkMode ? 'text-secondary-400' : 'text-secondary-500'
                  )} />
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors',
                      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      darkMode
                        ? 'bg-secondary-900 border-secondary-600 text-white'
                        : 'bg-white border-secondary-300 text-secondary-900'
                    )}
                    disabled={isSubmitting}
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  darkMode ? 'text-secondary-300' : 'text-secondary-700'
                )}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={cn(
                    'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4',
                    darkMode ? 'text-secondary-400' : 'text-secondary-500'
                  )} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-12 py-2.5 rounded-lg border transition-colors',
                      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      errors.password
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : darkMode
                          ? 'bg-secondary-900 border-secondary-600 text-white placeholder-secondary-400'
                          : 'bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500'
                    )}
                    placeholder="Enter password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={cn(
                      'absolute right-3 top-1/2 transform -translate-y-1/2 p-1',
                      darkMode ? 'text-secondary-400 hover:text-white' : 'text-secondary-500 hover:text-secondary-700'
                    )}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  darkMode ? 'text-secondary-300' : 'text-secondary-700'
                )}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className={cn(
                    'absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4',
                    darkMode ? 'text-secondary-400' : 'text-secondary-500'
                  )} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={cn(
                      'w-full pl-10 pr-12 py-2.5 rounded-lg border transition-colors',
                      'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                      errors.confirmPassword
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : darkMode
                          ? 'bg-secondary-900 border-secondary-600 text-white placeholder-secondary-400'
                          : 'bg-white border-secondary-300 text-secondary-900 placeholder-secondary-500'
                    )}
                    placeholder="Confirm password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={cn(
                      'absolute right-3 top-1/2 transform -translate-y-1/2 p-1',
                      darkMode ? 'text-secondary-400 hover:text-white' : 'text-secondary-500 hover:text-secondary-700'
                    )}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors',
                    darkMode
                      ? 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600 hover:text-white'
                      : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors',
                    'bg-primary-600 text-white hover:bg-primary-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center space-x-2'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateUserModal;
