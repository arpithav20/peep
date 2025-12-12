// src/components/dashboard/user/SelfProjectForm.tsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import { motion } from 'framer-motion';
import { X, Save, Loader } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Project } from '../../../types'; // Import Project type

interface SelfProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialProject?: Project | null; // New prop for editing
}

const SelfProjectForm: React.FC<SelfProjectFormProps> = ({ onClose, onSuccess, initialProject }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialProject?.title || '',
    description: initialProject?.description || '',
    designation: initialProject?.designation || '',
    activity: initialProject?.activity || '',
    estimatedTime: initialProject?.estimatedTime || '',
    outcome: initialProject?.outcome || '',
    evaluation: initialProject?.evaluation || '',
    projectLink: initialProject?.projectLink || ''
  });

  // Update form data if initialProject changes (e.g., when opening for edit)
  useEffect(() => {
    if (initialProject) {
      setFormData({
        title: initialProject.title || '',
        description: initialProject.description || '',
        designation: initialProject.designation || '',
        activity: initialProject.activity || '',
        estimatedTime: initialProject.estimatedTime || '',
        outcome: initialProject.outcome || '',
        evaluation: initialProject.evaluation || '',
        projectLink: initialProject.projectLink || ''
      });
    } else {
      // Reset form for new project creation
      setFormData({
        title: '',
        description: '',
        designation: '',
        activity: '',
        estimatedTime: '',
        outcome: '',
        evaluation: '',
        projectLink: ''
      });
    }
  }, [initialProject]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const projectData = {
        ...formData,
        type: 'self',
        userId: currentUser.id,
        status: formData.projectLink ? 'submitted' : 'in-progress', // If link provided, assume submitted
        updatedAt: serverTimestamp()
      };

      if (initialProject && initialProject.id) {
        // Update existing project
        await updateDoc(doc(db, 'projects', initialProject.id), projectData);
        toast.success('Self-project updated successfully!');
      } else {
        // Create new project
        await addDoc(collection(db, 'projects'), {
          ...projectData,
          createdAt: serverTimestamp()
        });
        toast.success('Self-project created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating/updating self-project:', error);
      toast.error('Failed to save project. Please try again.');
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
          <h2 className="text-2xl font-bold text-gray-900">
            {initialProject ? 'Edit Self Project' : 'Create Self Project'}
          </h2>
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{initialProject ? 'Update Project' : 'Create Project'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SelfProjectForm;