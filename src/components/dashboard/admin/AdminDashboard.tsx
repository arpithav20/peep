import React, { useState } from 'react';
import { useState, useEffect } from 'react';
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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Layout from '../Layout';
import UserManagement from './admin/UserManagement';
import ContentManagement from './admin/ContentManagement';
import ProjectEvaluation from './admin/ProjectEvaluation';
import PlacementOverview from './admin/PlacementOverview';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalResources: 0,
    placementRate: 0,
    recentActivities: [],
    topResources: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Fetch projects
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      const totalProjects = projectsSnapshot.size;

      // Fetch resources
      const resourcesSnapshot = await getDocs(collection(db, 'resources'));
      const totalResources = resourcesSnapshot.size;

      // Mock data for demonstration
      const mockTopResources = [
        { title: 'React Fundamentals', type: 'video', views: 1250 },
        { title: 'JavaScript ES6 Guide', type: 'pdf', views: 980 },
        { title: 'Node.js Best Practices', type: 'presentation', views: 750 },
        { title: 'Database Design Principles', type: 'video', views: 620 }
      ];

      const mockRecentActivities = [
        { user: 'John Doe', action: 'submitted project', time: '2 hours ago' },
        { user: 'Jane Smith', action: 'completed course', time: '4 hours ago' },
        { user: 'Mike Johnson', action: 'joined platform', time: '6 hours ago' },
        { user: 'Sarah Wilson', action: 'downloaded resource', time: '8 hours ago' }
      ];

      setAnalyticsData({
        totalUsers,
        totalProjects,
        totalResources,
        placementRate: 85, // Mock placement rate
        recentActivities: mockRecentActivities,
        topResources: mockTopResources
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'content', label: 'Content Management', icon: FileText },
    { id: 'projects', label: 'Project Evaluation', icon: Briefcase },
    { id: 'placements', label: 'Placement Overview', icon: Award }
  ];

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
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">+12%</span>
            <span className="text-gray-600 text-sm ml-2">from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalProjects}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">+8%</span>
            <span className="text-gray-600 text-sm ml-2">from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resources</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalResources}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">+15%</span>
            <span className="text-gray-600 text-sm ml-2">from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Placement Rate</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.placementRate}%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">+3%</span>
            <span className="text-gray-600 text-sm ml-2">from last month</span>
          </div>
        </motion.div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activities</h3>
          <div className="space-y-4">
            {analyticsData.recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Resources</h3>
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

      {/* Most Viewed Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Most Viewed Resources</h3>
        <div className="space-y-4">
          {analyticsData.topResources.length > 0 ? analyticsData.topResources.map((resource, index) => (
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
          )) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No resource data available</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-600">Add New User</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <Upload className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-600">Upload Resource</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-600">System Settings</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users, content, and monitor platform performance</p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-8 border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;