import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CreateSelfProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSelfProjectForm: React.FC<CreateSelfProjectFormProps> = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    designation: '',
    activity: '',
    estimatedTime: '',
    outcome: '',
    evaluation: '',
    projectLink: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        type: 'self',
        userId: currentUser.id,
        status: 'in-progress',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Self-project created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating self-project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Self Project</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your project name"
              />
            </div>

            {/* Project Designation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Designation *
              </label>
              <input
                type="text"
                name="designation"
                required
                value={formData.designation}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., Web Development, Mobile App, Research"
              />
            </div>

            {/* Estimated Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time (e.g., "2 weeks", "40 hours") *
              </label>
              <input
                type="text"
                name="estimatedTime"
                required
                value={formData.estimatedTime}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 2 weeks, 1 month, 40 hours"
              />
            </div>

            {/* Activity */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity *
              </label>
              <textarea
                name="activity"
                required
                rows={3}
                value={formData.activity}
                onChange={handleChange}
                className="input-field"
                placeholder="Describe the main activities and tasks involved in this project"
              />
            </div>

            {/* Project Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                placeholder="Provide a detailed description of your project"
              />
            </div>

            {/* Project Outcome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Outcome *
              </label>
              <textarea
                name="outcome"
                required
                rows={3}
                value={formData.outcome}
                onChange={handleChange}
                className="input-field"
                placeholder="What do you expect to achieve or learn from this project?"
              />
            </div>

            {/* Project Evaluation */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Evaluation (Self-Reflection)
              </label>
              <textarea
                name="evaluation"
                rows={3}
                value={formData.evaluation}
                onChange={handleChange}
                className="input-field"
                placeholder="How will you evaluate your progress and success? What metrics will you use?"
              />
            </div>

            {/* Project Link */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Link
              </label>
              <input
                type="url"
                name="projectLink"
                value={formData.projectLink}
                onChange={handleChange}
                className="input-field"
                placeholder="https://github.com/username/project or https://docs.google.com/..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateSelfProjectForm;