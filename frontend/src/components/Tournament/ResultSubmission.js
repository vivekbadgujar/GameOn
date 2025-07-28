import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Target,
  Trophy,
  Clock,
  FileImage,
  Loader2
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { submitResult } from '../../services/api';
import toast from 'react-hot-toast';

const ResultSubmission = ({ tournament, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    kills: '',
    rank: '',
    damage: '',
    survivalTime: ''
  });
  const [screenshots, setScreenshots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 3,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      const newScreenshots = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }));
      setScreenshots(prev => [...prev, ...newScreenshots].slice(0, 3));
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(({ errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error('File size must be less than 5MB');
          } else if (error.code === 'file-invalid-type') {
            toast.error('Only image files are allowed');
          }
        });
      });
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const removeScreenshot = (id) => {
    setScreenshots(prev => {
      const updated = prev.filter(screenshot => screenshot.id !== id);
      // Revoke URL to prevent memory leaks
      const toRemove = prev.find(screenshot => screenshot.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return updated;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.kills || formData.kills < 0 || formData.kills > 50) {
      newErrors.kills = 'Kills must be between 0 and 50';
    }

    if (!formData.rank || formData.rank < 1 || formData.rank > tournament.maxParticipants) {
      newErrors.rank = `Rank must be between 1 and ${tournament.maxParticipants}`;
    }

    if (!formData.damage || formData.damage < 0) {
      newErrors.damage = 'Damage must be a positive number';
    }

    if (screenshots.length === 0) {
      newErrors.screenshots = 'At least one screenshot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('kills', formData.kills);
      submitData.append('rank', formData.rank);
      submitData.append('damage', formData.damage);
      submitData.append('survivalTime', formData.survivalTime);

      screenshots.forEach((screenshot, index) => {
        submitData.append(`screenshot_${index}`, screenshot.file);
      });

      await submitResult(tournament._id, submitData);

      toast.success('Results submitted successfully!');
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting results:', error);
      toast.error('Failed to submit results. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl glass-card p-6 mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Submit Results</h2>
            <p className="text-white/60 text-sm">{tournament.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Submission Deadline */}
        <div className="flex items-center space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-6">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-sm font-medium">
            Submit within 5 minutes of match end to avoid disqualification
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Performance Stats */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Match Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Kills *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.kills}
                  onChange={(e) => handleInputChange('kills', e.target.value)}
                  className={`input-field w-full ${errors.kills ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
                {errors.kills && (
                  <p className="text-red-400 text-xs mt-1">{errors.kills}</p>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Final Rank *
                </label>
                <input
                  type="number"
                  min="1"
                  max={tournament.maxParticipants}
                  value={formData.rank}
                  onChange={(e) => handleInputChange('rank', e.target.value)}
                  className={`input-field w-full ${errors.rank ? 'border-red-500' : ''}`}
                  placeholder="1"
                />
                {errors.rank && (
                  <p className="text-red-400 text-xs mt-1">{errors.rank}</p>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Damage Dealt *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.damage}
                  onChange={(e) => handleInputChange('damage', e.target.value)}
                  className={`input-field w-full ${errors.damage ? 'border-red-500' : ''}`}
                  placeholder="0"
                />
                {errors.damage && (
                  <p className="text-red-400 text-xs mt-1">{errors.damage}</p>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Survival Time
                </label>
                <input
                  type="text"
                  value={formData.survivalTime}
                  onChange={(e) => handleInputChange('survivalTime', e.target.value)}
                  className="input-field w-full"
                  placeholder="25:30"
                />
              </div>
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Result Screenshots *
            </h3>
            
            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-blue-400 bg-blue-500/10'
                  : errors.screenshots
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  {isDragActive ? (
                    <Upload className="w-8 h-8 text-blue-400" />
                  ) : (
                    <Camera className="w-8 h-8 text-white/60" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium mb-2">
                    {isDragActive ? 'Drop screenshots here' : 'Upload Result Screenshots'}
                  </p>
                  <p className="text-white/60 text-sm">
                    Drag & drop or click to select (Max 3 files, 5MB each)
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    PNG, JPG, JPEG formats supported
                  </p>
                </div>
              </div>
            </div>

            {errors.screenshots && (
              <p className="text-red-400 text-xs mt-2">{errors.screenshots}</p>
            )}

            {/* Preview Screenshots */}
            {screenshots.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {screenshots.map((screenshot) => (
                  <div key={screenshot.id} className="relative group">
                    <img
                      src={screenshot.preview}
                      alt="Screenshot preview"
                      className="w-full h-24 object-cover rounded-lg border border-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(screenshot.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-black/60 rounded px-2 py-1">
                        <p className="text-white text-xs truncate">
                          {screenshot.file.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Important Notes */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-semibold text-sm mb-2">Important Notes:</p>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Screenshots must clearly show your final rank and kills</li>
                  <li>• Results will be verified by moderators</li>
                  <li>• False submissions will result in disqualification</li>
                  <li>• Prizes will be distributed after verification</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-3"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Submit Results</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResultSubmission;