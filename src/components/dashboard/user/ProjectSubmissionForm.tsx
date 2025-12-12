// src/components/dashboard/user/ProjectSubmissionForm.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Loader, Link } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Submission } from '../../../types'; // Assuming Submission type is defined

interface ProjectSubmissionFormProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialSubmission?: Submission | null; // For editing existing submissions
  readOnly?: boolean; // For viewing details
}

const ProjectSubmissionForm: React.FC<ProjectSubmissionFormProps> = ({
  projectId,
  onClose,
  onSuccess,
  initialSubmission,
  readOnly = false
}) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [formData, setFormData] = useState({
    description: initialSubmission?.description || '',
    projectLink: initialSubmission?.files?.[0] || '' // Assuming single project link for now
  });

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          setProjectData(projectDoc.data());
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be logged in to submit a project.');
      return;
    }

    setLoading(true);
    try {
      // Check if this is an assigned project
      if (projectData?.type === 'assigned') {
        // For assigned projects, update the project document directly
        await updateDoc(doc(db, 'projects', projectId), {
          submissionDescription: formData.description,
          submissionUrl: formData.projectLink,
          status: 'submitted',
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Assigned project submitted successfully!');
      } else {
        // For other projects, use the submission collection
        const submissionData = {
          projectId,
          userId: currentUser.id,
          description: formData.description,
          files: formData.projectLink ? [formData.projectLink] : [],
          submittedAt: serverTimestamp(),
          status: 'pending',
        };

        if (initialSubmission && initialSubmission.id) {
          // Update existing submission
          await updateDoc(doc(db, 'submissions', initialSubmission.id), submissionData);
          toast.success('Project submission updated successfully!');
        } else {
          // Create new submission
          await addDoc(collection(db, 'submissions'), submissionData);
          toast.success('Project submitted successfully!');
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting project:', error);
      toast.error('Failed to submit project. Please try again.');
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
            {readOnly ? 'Project Details' : (initialSubmission ? 'Edit Project Submission' : 'Submit Project')}
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
          {/* Project Information Display */}
          {projectData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{projectData.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{projectData.description}</p>
              {projectData.deadline && (
                <p className="text-sm text-gray-500">
                  Due: {new Date(projectData.deadline.toDate()).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              placeholder="Describe your project work and what you've achieved."
              readOnly={readOnly}
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
                readOnly={readOnly}
              />
            </div>
          </div>

          {!readOnly && (
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
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{initialSubmission ? 'Update Submission' : 'Submit Project'}</span>
                  </>
                )}
              </button>
            </div>
          )}
          {readOnly && (
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProjectSubmissionForm;