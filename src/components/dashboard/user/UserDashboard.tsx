import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Upload,
  Target,
  Play,
  Users,
  CheckCircle,
  Clock,
  Trophy,
  Sparkles,
  BellRing
} from 'lucide-react';
import Layout from '../Layout';
import { useAuth } from '../../contexts/AuthContext';
import ResourcesTab from './ResourcesTab';
import ProjectsTab from './ProjectsTab';
import SubmissionsTab from './SubmissionsTab';
import PlacementsTab from './PlacementsTab';
import MistakeCards from './MistakeCards';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../../../lib/firebase'; // Import db

type TabType = 'overview' | 'resources' | 'projects' | 'submissions' | 'placements' | 'mistakes';

const UserDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'submissions', label: 'Submissions', icon: Upload },
    { id: 'placements', label: 'Placements', icon: Users },
    { id: 'mistakes', label: 'Mistakes', icon: Sparkles }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'resources':
        return <ResourcesTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'submissions':
        return <SubmissionsTab />;
      case 'placements':
        return <PlacementsTab />;
      case 'mistakes':
        return <MistakeCards />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-8 text-white"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                <span className="flex items-center space-x-2">
                  <span>Welcome back, {currentUser?.name || 'Student'}!</span>
                  <Trophy className="w-6 h-6 text-yellow-300" />
                </span>
              </h1>
              <p className="text-green-100">
                Continue your learning journey and achieve your goals
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-2"
        >
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab: any) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <div className="mt-8">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

// Overview Tab Component
const OverviewTab: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    videosWatched: 0,
    videosTotal: 0,
    projectsCompleted: 0,
    projectsTotal: 0,
    applications: 0
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        // Fetch resources stats
        const resourcesSnapshot = await getDocs(collection(db, 'resources'));
        const totalResources = resourcesSnapshot.size;

        const userResourceProgressQuery = query(
          collection(db, 'userResourceProgress'),
          where('userId', '==', currentUser.id),
          where('status', '==', 'completed')
        );
        const userResourceProgressSnapshot = await getDocs(userResourceProgressQuery);
        const videosWatched = userResourceProgressSnapshot.size; // Assuming all resources are videos for this stat

        // Fetch projects stats
        const projectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', currentUser.id)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const totalProjects = projectsSnapshot.size;
        const projectsCompleted = projectsSnapshot.docs.filter(doc => doc.data().status === 'completed').length;

        // Fetch placements stats
        const placementsQuery = query(
          collection(db, 'placements'),
          where('userId', '==', currentUser.id)
        );
        const placementsSnapshot = await getDocs(placementsQuery);
        const applications = placementsSnapshot.size;

        setStats({
          videosWatched,
          videosTotal: totalResources,
          projectsCompleted,
          projectsTotal: totalProjects,
          applications
        });

        // Fetch announcements
        const announcementsQuery = query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc')
        );
        const announcementsSnapshot = await getDocs(announcementsQuery);
        const fetchedAnnouncements = announcementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setAnnouncements(fetchedAnnouncements);

      } catch (error) {
        console.error('Error fetching overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Videos Watched */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Play className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.videosWatched}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Resources Completed</h3>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: stats.videosTotal > 0 ? `${(stats.videosWatched / stats.videosTotal) * 100}%` : '0%' }} />
        </div>
        <p className="text-sm text-gray-600">{stats.videosWatched} of {stats.videosTotal} completed</p>
      </motion.div>

      {/* Projects Completed */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.projectsCompleted}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Projects Completed</h3>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: stats.projectsTotal > 0 ? `${(stats.projectsCompleted / stats.projectsTotal) * 100}%` : '0%' }} />
        </div>
        <p className="text-sm text-gray-600">{stats.projectsCompleted} of {stats.projectsTotal} completed</p>
      </motion.div>

      {/* Applications */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{stats.applications}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Applications</h3>
        <p className="text-sm text-gray-600">Total applications submitted</p>
      </motion.div>

      {/* News & Announcements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 md:col-span-2 lg:col-span-3"
      >
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <BellRing className="w-5 h-5 text-primary-500" />
          <span>News & Announcements</span>
        </h3>
        <div className="space-y-3">
          {announcements.length > 0 ? announcements.map((announcement, index) => (
            <div key={announcement.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
              <p className="text-xs text-gray-600">{announcement.message}</p>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mt-1">{announcement.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No announcements yet</p>
              <p className="text-sm text-gray-400">Check back later for updates!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;