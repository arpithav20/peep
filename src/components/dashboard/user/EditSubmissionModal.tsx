import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader, Link } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import toast from 'react-hot-toast';
import { Submission } from '../../../types';

interface EditSubmissionModalProps {
  submission: Submission;
  onClose: () => void;
  onSuccess: () => void;
}

const EditSubmissionModal: React.FC<EditSubmissionModalProps> = ({
  submission,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: submission.description || '',
    projectLink: submission.files?.[0] || '' // Assuming single project link
  });

  useEffect(() => {
    setFormData({
      description: submission.description || '',
      projectLink: submission.files?.[0] || ''
    });
  }, [submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedData: Partial<Submission> = {
        description: formData.description,
        files: formData.projectLink ? [formData.projectLink] : [],
        submittedAt: serverTimestamp(), // Update timestamp on edit
        // Note: status is not changed here, it's handled by admin evaluation
      };

      await updateDoc(doc(db, 'submissions', submission.id), updatedData);
      toast.success('Submission updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission. Please try again.');
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
          <h2 className="text-2xl font-bold text-gray-900">Edit Submission</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              placeholder="Describe your project work and what you've achieved."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Link (e.g., GitHub, Google Drive, Live Demo)
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="url"
                name="projectLink"
                value={formData.projectLink}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="https://github.com/your-project"
              />
            </div>
          </div>

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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Submission</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditSubmissionModal;