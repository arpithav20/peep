import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, CheckCircle, AlertCircle, Calendar, User } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Project, Submission } from '../../../types';
import CreateSelfProjectForm from './CreateSelfProjectForm'; // This will be renamed to SelfProjectForm
import SelfProjectForm from './SelfProjectForm'; // Import the renamed component
import ProjectSubmissionForm from './ProjectSubmissionForm'; // New import
import toast from 'react-hot-toast';

const ProjectsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assigned' | 'unlocked' | 'self'>('assigned');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selfProjects, setSelfProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const [showProjectSubmissionForm, setShowProjectSubmissionForm] = useState(false);
  const [selectedProjectForSubmission, setSelectedProjectForSubmission] = useState<Project | null>(null);
  const [initialSubmissionData, setInitialSubmissionData] = useState<Submission | null>(null);
  const [isSubmissionFormReadOnly, setIsSubmissionFormReadOnly] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const unlockedProjects: any[] = [];

  React.useEffect(() => {
    if (currentUser) {
      if (activeTab === 'self') {
        fetchSelfProjects();
      } else if (activeTab === 'assigned') {
        fetchAssignedProjects();
      }
    }
  }, [activeTab, currentUser]);

  const fetchAssignedProjects = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'projects'),
        where('type', '==', 'assigned'),
        where('assignedTo', 'array-contains', currentUser.id)
      );
      
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        deadline: doc.data().deadline?.toDate() || new Date()
      })) as Project[];
      
      // Sort projects by creation date in descending order (newest first)
      projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setAssignedProjects(projects);
    } catch (error) {
      console.error('Error fetching assigned projects:', error);
      toast.error('Failed to fetch assigned projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelfProjects = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'projects'),
        where('type', '==', 'self'),
        where('userId', '==', currentUser.id)
      );
      
      const snapshot = await getDocs(q);
      const projects = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Project[];
      
      // Sort projects by creation date in descending order (newest first)
      projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setSelfProjects(projects);
    } catch (error) {
      console.error('Error fetching self projects:', error);
      toast.error('Failed to fetch self projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectStatusUpdate = async (projectId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      toast.success(`Project marked as ${newStatus}`);
      
      // Refresh the appropriate project list
      if (activeTab === 'assigned') {
        fetchAssignedProjects();
      } else if (activeTab === 'self') {
        fetchSelfProjects();
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    }
  };

  const handleCreateSuccess = () => {
    fetchSelfProjects();
  };

  const handleOpenSubmissionForm = async (project: Project, readOnly: boolean = false) => {
    setSelectedProjectForSubmission(project);
    setIsSubmissionFormReadOnly(readOnly);

    // Fetch existing submission if available
    if (project.id && currentUser) {
      const q = query(
        collection(db, 'submissions'),
        where('projectId', '==', project.id),
        where('userId', '==', currentUser.id)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setInitialSubmissionData(snapshot.docs[0].data() as Submission);
      } else {
        setInitialSubmissionData(null);
      }
    } else {
      setInitialSubmissionData(null);
    }

    setShowProjectSubmissionForm(true);
  };

  const handleSubmissionSuccess = async () => {
    // After submission, update the project status to 'submitted'
    if (selectedProjectForSubmission) {
      await handleProjectStatusUpdate(selectedProjectForSubmission.id, 'submitted');
    }
    setShowProjectSubmissionForm(false);
    setSelectedProjectForSubmission(null);
    setInitialSubmissionData(null);
    setIsSubmissionFormReadOnly(false);
    
    // Refresh the projects list to show updated status
    if (activeTab === 'assigned') {
      fetchAssignedProjects();
    } else if (activeTab === 'self') {
      fetchSelfProjects();
    }
  };

  const handleCloseSubmissionForm = () => {
    setShowProjectSubmissionForm(false);
    setSelectedProjectForSubmission(null);
    setInitialSubmissionData(null);
    setIsSubmissionFormReadOnly(false);
  };

  const handleEditSelfProject = (project: Project) => {
    setEditingProject(project);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditingProject(null);
    fetchSelfProjects(); // Refresh the projects list
  };

  const handleViewProjectDetails = (project: Project) => {
    setSelectedProjectForSubmission(project);
    setShowProjectDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'locked':
        return 'bg-gray-100 text-gray-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'submitted':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'Advanced':
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
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600">Manage your assigned, unlocked, and self-projects</p>
        </div>
        <button 
          onClick={() => {
            setActiveTab('self');
            setShowCreateForm(true);
          }}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Self Project</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'assigned'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Assigned Projects ({assignedProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('unlocked')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'unlocked'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unlocked Projects ({unlockedProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('self')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'self'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Self Projects ({selfProjects.length})
        </button>
      </div>

      {/* Tab Content */}
      {loading && activeTab === 'self' ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTab === 'assigned' && assignedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(project.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Assigned by {project.assignedBy}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Due {project.deadline.toLocaleDateString()}</span>
                </div>

                {project.resources && project.resources.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Resources:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.resources.map((resource) => (
                        <span
                          key={resource}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md"
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex space-x-2">
                {project.status === 'pending' || project.status === 'in-progress' ? (
                  <button
                    onClick={() => handleOpenSubmissionForm(project, false)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    {project.status === 'pending' ? 'Start Project' : 'Continue Working'}
                  </button>
                ) : project.status === 'submitted' ? (
                  <button
                    onClick={() => handleOpenSubmissionForm(project, true)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    View Submission
                  </button>
                ) : (
                  <button
                    onClick={() => handleViewProjectDetails(project)}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                )}
                <button
                  onClick={() => handleViewProjectDetails(project)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Details
                </button>
              </div>
            </motion.div>
          ))}

          {activeTab === 'unlocked' && unlockedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow ${
                project.status === 'locked' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(project.difficulty)}`}>
                    {project.difficulty}
                  </span>
                  <span className="text-sm text-gray-600">{project.estimatedTime}</span>
                </div>
                
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Unlocked by:</span> {project.unlockedBy}
                </p>
              </div>

              <div className="mt-4">
                <button 
                  disabled={project.status === 'locked'}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    project.status === 'locked'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {project.status === 'locked' ? 'Locked' : 'Start Project'}
                </button>
              </div>
            </motion.div>
          ))}

          {activeTab === 'self' && (
            <>
              {selfProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {project.designation && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="font-medium">Designation:</span>
                        <span>{project.designation}</span>
                      </div>
                    )}
                    
                    {project.estimatedTime && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="font-medium">Estimated Time:</span>
                        <span>{project.estimatedTime}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Started {project.createdAt.toLocaleDateString()}</span>
                    </div>
                    
                    {project.activity && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Activity:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {project.activity}
                        </p>
                      </div>
                    )}
                    
                    {project.outcome && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Expected Outcome:</p>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                          {project.outcome}
                        </p>
                      </div>
                    )}
                    
                    {project.evaluation && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Self-Evaluation:</p>
                        <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                          {project.evaluation}
                        </p>
                      </div>
                    )}
                    
                    {project.projectLink && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Project Link:</p>
                        <a
                          href={project.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {project.projectLink}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleEditSelfProject(project)}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </motion.div>
              ))}

            </>
          )}
        </div>
      )}

      {/* Create/Edit Self Project Form Modal */}
      {showCreateForm && (
        <CreateSelfProjectForm // This will be renamed to SelfProjectForm
          onClose={() => {
            setShowCreateForm(false);
          }}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Self Project Form Modal */}
      {showEditForm && editingProject && (
        <SelfProjectForm
          onClose={handleCloseEditForm}
          onSuccess={handleCloseEditForm}
          initialProject={editingProject}
        />
      )}

      {/* Project Submission/Details Form Modal */}
      {showProjectSubmissionForm && selectedProjectForSubmission && (
        <ProjectSubmissionForm
          projectId={selectedProjectForSubmission.id}
          onClose={handleCloseSubmissionForm}
          onSuccess={handleSubmissionSuccess}
          initialSubmission={initialSubmissionData}
          readOnly={isSubmissionFormReadOnly}
        />
      )}

      {/* Project Details Modal */}
      {showProjectDetails && selectedProjectForSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedProjectForSubmission.title}</h2>
            <p className="text-gray-700 mb-4">{selectedProjectForSubmission.description}</p>
            <button onClick={() => setShowProjectDetails(false)} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && ((activeTab === 'assigned' && assignedProjects.length === 0) ||
        (activeTab === 'unlocked' && unlockedProjects.length === 0) ||
        (activeTab === 'self' && selfProjects.length === 0 && !showCreateForm)) && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab} projects yet
          </h3>
          <p className="text-gray-600">
            {activeTab === 'assigned' && 'Your instructor will assign projects soon'}
            {activeTab === 'unlocked' && 'Complete more resources to unlock projects'}
            {activeTab === 'self' && 'Create your first self-directed learning project'}
          </p>
          {activeTab === 'self' && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Your First Project
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsTab;