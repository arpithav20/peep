import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, CheckCircle, Clock, XCircle, Star, MessageSquare, ExternalLink } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Project, Submission } from '../../../types';
import EditSubmissionModal from './EditSubmissionModal'; // New import

const SubmissionsTab: React.FC = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const [showEditSubmissionModal, setShowEditSubmissionModal] = useState(false);
  const [submissionToEdit, setSubmissionToEdit] = useState<Submission | null>(null);
  React.useEffect(() => {
    if (currentUser) {
      fetchSubmissions();
    }
  }, [currentUser]);

  const fetchSubmissions = async () => {
    if (!currentUser) return;
    
    try {
      // Fetch actual submissions
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('userId', '==', currentUser.id)
      );
      
      // Fetch self projects (which act as submissions)
      const selfProjectsQuery = query(
        collection(db, 'projects'),
        where('type', '==', 'self'),
        where('userId', '==', currentUser.id)
      );
      
      const [submissionsSnapshot, selfProjectsSnapshot] = await Promise.all([
        getDocs(submissionsQuery),
        getDocs(selfProjectsQuery)
      ]);
      
      // Process actual submissions
      const actualSubmissions = submissionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        type: 'submission'
      }));
      
      // Process self projects as submissions
      const selfProjectSubmissions = selfProjectsSnapshot.docs.map(doc => {
        const project = doc.data() as Project;
        return {
          id: doc.id,
          projectTitle: project.title,
          projectType: 'self',
          description: project.description || project.activity || 'Self-directed project',
          files: project.projectLink ? [project.projectLink] : [],
          submittedAt: project.createdAt?.toDate() || new Date(),
          status: project.status === 'completed' ? 'completed' : 'in-progress',
          feedback: project.evaluation,
          designation: project.designation,
          estimatedTime: project.estimatedTime,
          outcome: project.outcome,
          projectLink: project.projectLink,
          type: 'self-project'
        };
      });
      
      // Combine and sort by submission date
      const allSubmissions = [...actualSubmissions, ...selfProjectSubmissions]
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'reviewed':
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'in-progress':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'reviewed':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleEditSubmission = (submission: Submission) => {
    setSubmissionToEdit(submission);
    setShowEditSubmissionModal(true);
  };

  const handleCloseEditSubmissionModal = () => {
    setShowEditSubmissionModal(false);
    setSubmissionToEdit(null);
    fetchSubmissions(); // Refresh data after edit
  };
  const renderStars = (rating: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
          <p className="text-gray-600">Track your project submissions and feedback</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter(s => s.status === 'pending' || s.status === 'in-progress').length}
              </p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter(s => s.status === 'completed').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter(s => s.rating).length > 0 
                  ? Math.round(submissions.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / 
                     submissions.filter(s => s.rating).length) + '/100'
                  : 'N/A'}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {submissions.map((submission, index) => (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedSubmission(selectedSubmission === submission.id ? null : submission.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{submission.projectTitle}</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    submission.projectType === 'assigned' ? 'bg-blue-100 text-blue-700' :
                    submission.projectType === 'self' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {submission.projectType === 'assigned' ? 'Assigned' : 
                     submission.projectType === 'self' ? 'Self Project' : 
                     submission.type === 'self-project' ? 'Self Project' : 'Project'}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(submission.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status === 'in-progress' ? 'In Progress' : submission.status}
                    </span>
                  </div>
                </div>
              </div>
              {submission.rating && (
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">{submission.rating}/100</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">{submission.description}</p>

            {/* Self Project Details */}
            {submission.type === 'self-project' && (
              <div className="space-y-2 mb-4">
                {submission.designation && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-700">Designation:</span>
                    <span className="text-gray-600">{submission.designation}</span>
                  </div>
                )}
                {submission.estimatedTime && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-gray-700">Estimated Time:</span>
                    <span className="text-gray-600">{submission.estimatedTime}</span>
                  </div>
                )}
              </div>
            )}

            {/* Files */}
            {submission.files && submission.files.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {submission.type === 'self-project' ? 'Project Link:' : 'Submitted Files:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {submission.files.map((file, fileIndex) => (
                    submission.type === 'self-project' && file.startsWith('http') ? (
                      <a
                        key={fileIndex}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Project</span>
                      </a>
                    ) : (
                      <span
                        key={fileIndex}
                        className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{file}</span>
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Submission Date */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Calendar className="w-4 h-4" />
              <span>
                {submission.type === 'self-project' ? 'Started' : 'Submitted'} {submission.submittedAt.toLocaleDateString()}
              </span>
            </div>

            {/* Rating and Feedback (if available) */}
            {submission.rating && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Rating:</span>
                  <div className="flex items-center space-x-1">
                    {renderStars(submission.rating)}
                    <span className="text-sm text-gray-600 ml-2">{submission.rating}/10</span>
                  </div>
                </div>
              </div>
            )}

            {/* Expandable Feedback */}
            {selectedSubmission === submission.id && submission.feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 pt-4"
              >
                <div className="flex items-start space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {submission.type === 'self-project' ? 'Self-Evaluation:' : 
                       submission.type === 'assigned-project-submission' ? 'Instructor Feedback:' : 
                       'Instructor Feedback:'}
                    </p>
                    <p className="text-sm text-gray-600 p-3 rounded-lg bg-blue-50">
                      {submission.feedback}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Self Project Outcome */}
            {selectedSubmission === submission.id && submission.outcome && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 pt-4 mt-4"
              >
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">Expected Outcome:</p>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      {submission.outcome}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4">
              <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
          <p className="text-gray-600">Create a self-project or wait for assigned projects to get started</p>
        </div>
      )}

      {showEditSubmissionModal && submissionToEdit && (
        <EditSubmissionModal
          submission={submissionToEdit}
          onClose={handleCloseEditSubmissionModal}
          onSuccess={handleCloseEditSubmissionModal} // Close and refresh on success
        />
      )}
    </div>
  );
};

export default SubmissionsTab;