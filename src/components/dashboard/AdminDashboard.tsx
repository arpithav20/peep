import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  BookOpen, 
  Briefcase, 
  BarChart3,
  Upload,
  UserPlus,
  Settings,
  Award,
  Play,
  Presentation,
  Target,
  CheckCircle,
  Clock
} from 'lucide-react';
import Layout from '../Layout';
import UserManagement from './admin/UserManagement';
import ContentManagement from './admin/ContentManagement';
import ProjectEvaluation from './admin/ProjectEvaluation';
import PlacementOverview from './admin/PlacementOverview';

type TabType = 'users' | 'content' | 'projects' | 'placements' | 'analytics';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users, color: 'blue' },
    { id: 'content', label: 'Content Management', icon: BookOpen, color: 'green' },
    { id: 'projects', label: 'Project Evaluation', icon: FileText, color: 'purple' },
    { id: 'placements', label: 'Placement Overview', icon: Briefcase, color: 'orange' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'pink' }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50',
      green: isActive ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-green-50',
      purple: isActive ? 'bg-purple-500 text-white' : 'text-purple-600 hover:bg-purple-50',
      orange: isActive ? 'bg-orange-500 text-white' : 'text-orange-600 hover:bg-orange-50',
      pink: isActive ? 'bg-pink-500 text-white' : 'text-pink-600 hover:bg-pink-50'
    };
    return colorMap[color as keyof typeof colorMap];
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'content':
        return <ContentManagement />;
      case 'projects':
        return <ProjectEvaluation />;
      case 'placements':
        return <PlacementOverview />;
      case 'analytics':
        return <AnalyticsTab />;
      default:
        return null;
    }
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-blue-100">
                Manage users, content, and track learner progress
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-2"
        >
          <div className="flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    getColorClasses(tab.color, isActive)
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6"
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </Layout>
  );
};

// Analytics Tab Component
const AnalyticsTab: React.FC = () => {
  // TODO: Replace with real data from Firebase
  const analyticsData = {
    contentViews: {
      videos: 0,
      pdfs: 0,
      ppts: 0
    },
    projects: {
      assigned: 0,
      submissions: 0,
      pending: 0
    },
    weeklyProgress: [],
    topResources: []
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Video Views</p>
              <p className="text-3xl font-bold">{analyticsData.contentViews.videos.toLocaleString()}</p>
            </div>
            <Play className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">PDF Views</p>
              <p className="text-3xl font-bold">{analyticsData.contentViews.pdfs.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">PPT Views</p>
              <p className="text-3xl font-bold">{analyticsData.contentViews.ppts.toLocaleString()}</p>
            </div>
            <Presentation className="w-8 h-8 text-orange-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Content Views</p>
              <p className="text-3xl font-bold">
                {(analyticsData.contentViews.videos + analyticsData.contentViews.pdfs + analyticsData.contentViews.ppts).toLocaleString()}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>
      </div>

      {/* Project Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Projects Assigned</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{analyticsData.projects.assigned}</p>
          <p className="text-sm text-gray-600">Total projects assigned to students</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Submissions</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{analyticsData.projects.submissions}</p>
          <p className="text-sm text-gray-600">Projects submitted by students</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Review</h3>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{analyticsData.projects.pending}</p>
          <p className="text-sm text-gray-600">Projects awaiting evaluation</p>
        </motion.div>
      </div>

      {/* Weekly Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Progress</h3>
        <div className="space-y-4">
          {analyticsData.weeklyProgress.map((week, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{week.week}</h4>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{week.submissions} Submissions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{week.views} Views</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{week.submissions + week.views}</div>
                <div className="text-sm text-gray-500">Total Activity</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Most Viewed Resources</h3>
        <div className="space-y-4">
          {analyticsData.topResources.map((resource, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  resource.type === 'video' ? 'bg-red-100 text-red-600' :
                  resource.type === 'pdf' ? 'bg-blue-100 text-blue-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {resource.type === 'video' ? <Play className="w-4 h-4" /> :
                   resource.type === 'pdf' ? <FileText className="w-4 h-4" /> :
                   <Presentation className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{resource.title}</h4>
                  <p className="text-sm text-gray-500 capitalize">{resource.type}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{resource.views}</div>
                <div className="text-sm text-gray-500">views</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;