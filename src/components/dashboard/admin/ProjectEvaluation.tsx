import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Clock, CheckCircle, XCircle, AlertCircle, Star, Loader } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { User, Project, Submission } from '../../../types';
import toast from 'react-hot-toast';

const ProjectEvaluation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assign' | 'evaluate'>('assign');
  const [searchTerm, setSearchTerm] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (activeTab === 'evaluate') {
      fetchSubmissions();
    }
  }, [activeTab]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Fetch actual submissions
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('status', 'in', ['pending', 'reviewed', 'submitted'])
      );

      // Fetch self projects that need evaluation
      const selfProjectsQuery = query(
        collection(db, 'projects'),
        where('type', '==', 'self'),
        where('status', 'in', ['submitted', 'completed'])
      );

      // Fetch assigned projects that need evaluation
      const assignedProjectsQuery = query(
        collection(db, 'projects'),
        where('type', '==', 'assigned'),
        where('status', 'in', ['submitted', 'completed', 'reviewed'])
      );

      const [submissionsSnapshot, selfProjectsSnapshot, assignedProjectsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(submissionsQuery),
        getDocs(selfProjectsQuery),
        getDocs(assignedProjectsQuery),
        getDocs(collection(db, 'users'))
      ]);

      // Create user lookup map
      const usersMap = new Map();
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        usersMap.set(doc.id, userData.name);
      });

      // Process actual submissions
      const actualSubmissions = submissionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        submittedAt: doc.data().submittedAt?.toDate() || new Date(),
        studentName: usersMap.get(doc.data().userId) || 'Unknown Student',
        type: 'submission',
        projectTitle: doc.data().projectTitle || 'Project Submission'
      }));

      // Process self projects
      const selfProjectSubmissions = selfProjectsSnapshot.docs.map(doc => {
        const project = doc.data() as Project;
        return {
          id: doc.id,
          projectTitle: project.title,
          description: project.description || project.activity || 'Self-directed project',
          submittedAt: project.updatedAt?.toDate() || project.createdAt?.toDate() || new Date(),
          status: project.status,
          studentName: usersMap.get(project.userId) || 'Unknown Student',
          userId: project.userId,
          rating: project.rating,
          feedback: project.feedback,
          type: 'self-project'
        };
      });

      // Process assigned projects
      const assignedProjectSubmissions = assignedProjectsSnapshot.docs.map(doc => {
        const project = doc.data() as Project;
        return {
          id: doc.id,
          projectTitle: project.title,
          description: project.submissionDescription || project.description || 'Assigned project',
          submittedAt: project.updatedAt?.toDate() || project.createdAt?.toDate() || new Date(),
          status: project.status,
          studentName: project.assignedTo?.map(userId => usersMap.get(userId)).join(', ') || 'Unknown Student',
          userId: project.assignedTo?.[0] || '', // For single assignment
          rating: project.rating,
          feedback: project.feedback,
          files: project.submissionUrl ? [project.submissionUrl] : [],
          type: 'assigned-project',
          assignedBy: project.assignedBy,
          deadline: project.deadline?.toDate() || null
        };
      });

      // Combine and sort
      const allSubmissions = [...actualSubmissions, ...selfProjectSubmissions, ...assignedProjectSubmissions]
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'reviewed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'reviewed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Evaluation</h2>
          <p className="text-gray-600">Assign projects and evaluate submissions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('assign')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'assign'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Assign Projects
        </button>
        <button
          onClick={() => setActiveTab('evaluate')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'evaluate'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Evaluate Submissions
        </button>
      </div>

      {activeTab === 'assign' ? (
        <AssignProjectsTab />
      ) : (
        <EvaluateSubmissionsTab submissions={submissions} loading={loading} onRefresh={fetchSubmissions} />
      )}
    </div>
  );
};

const AssignProjectsTab: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    assignedTo: [] as string[]
  });

  useEffect(() => {
    fetchStudents();
    fetchRecentAssignments();
  }, []);

  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'user'));
      const snapshot = await getDocs(q);
      const studentsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as User[];
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAssignments = async () => {
    try {
      // Fetch users first to get student names
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersMap = new Map();
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        usersMap.set(doc.id, userData.name);
      });

      const q = query(
        collection(db, 'projects'),
        where('type', '==', 'assigned')
      );
      const snapshot = await getDocs(q);
      const assignments = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        studentNames: doc.data().assignedTo?.map(userId => usersMap.get(userId)).filter(name => name) || []
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
      setRecentAssignments(assignments);
    } catch (error) {
      console.error('Error fetching recent assignments:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || formData.assignedTo.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    assignProject();
  };

  const assignProject = async () => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'projects'), {
        title: formData.title,
        description: formData.description,
        deadline: new Date(formData.deadline),
        assignedTo: formData.assignedTo,
        assignedBy: currentUser?.name || 'Admin',
        type: 'assigned',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success(`Project assigned to ${formData.assignedTo.length} student(s)`);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        assignedTo: []
      });
      fetchRecentAssignments();
    } catch (error) {
      console.error('Error assigning project:', error);
      toast.error('Failed to assign project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assignment Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign New Project</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the project requirements"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline
            </label>
            <input
              type="date"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Students
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {students.map((student) => (
                <label key={student.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.assignedTo.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          assignedTo: [...formData.assignedTo, student.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          assignedTo: formData.assignedTo.filter(id => id !== student.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{student.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {submitting ? 'Assigning...' : 'Assign Project'}
          </button>
        </form>
      </motion.div>

      {/* Recent Assignments */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assignments</h3>

        <div className="space-y-3">
          {recentAssignments.map((assignment, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{assignment.title}</h4>
              <p className="text-sm text-blue-600 mb-1">
                Students: {assignment.studentNames?.join(', ') || 'No students assigned'}
              </p>
              <p className="text-sm text-gray-600">
                {assignment.assignedTo?.length || 0} students • Due {assignment.deadline ? new Date(assignment.deadline?.toDate ? assignment.deadline.toDate() : assignment.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
          ))}
          {recentAssignments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent assignments</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const EvaluateSubmissionsTab: React.FC<{ submissions: any[], loading: boolean, onRefresh: () => void }> = ({ submissions, loading, onRefresh }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Submissions List */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Submissions</h3>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              onClick={() => setSelectedSubmission(submission)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedSubmission?.id === submission.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{submission.projectTitle}</h4>
                  <p className="text-sm text-gray-600">{submission.studentName}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  submission.status === 'pending' || submission.status === 'submitted'
                    ? 'bg-orange-100 text-orange-700'
                    : submission.status === 'reviewed' || submission.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {submission.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Submitted {submission.submittedAt.toLocaleDateString()}
              </p>
            </div>
          ))}

          {submissions.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No submissions to evaluate</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Evaluation Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        {selectedSubmission ? (
          <EvaluationForm submission={selectedSubmission} onRefresh={onRefresh} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a submission to evaluate</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

interface EvaluationFormProps {
  submission: any;
  onRefresh: () => void;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ submission, onRefresh }) => {
  const [rating, setRating] = useState(submission.rating || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Determine which collection to update based on submission type
      if (submission.type === 'self-project' || submission.type === 'assigned-project') {
        // Update project document
        await updateDoc(doc(db, 'projects', submission.id), {
          rating,
          feedback,
          status: 'reviewed',
          reviewedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update submission document
        await updateDoc(doc(db, 'submissions', submission.id), {
          rating,
          feedback,
          status: 'reviewed',
          reviewedAt: serverTimestamp()
        });
      }

      toast.success('Evaluation submitted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error('Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluate Submission</h3>

      <div className="space-y-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-700">Project</p>
          <p className="text-gray-900">{submission.projectTitle}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Student</p>
          <p className="text-gray-900">{submission.studentName}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">Description</p>
          <p className="text-gray-600 text-sm">{submission.description}</p>
        </div>

        {submission.files && submission.files.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Submitted Files</p>
            <div className="space-y-1">
              {submission.files.map((file: string, index: number) => (
                <a
                  key={index}
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {file}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            required
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback
          </label>
          <textarea
            required
            rows={6}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide detailed feedback for the student..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Evaluation'}
        </button>
      </form>
    </div>
  );
};

export default ProjectEvaluation;
