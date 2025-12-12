import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, FileText, Presentation, Eye, Download, Search, Filter, Loader, CheckCircle, Clock } from 'lucide-react'; // Added CheckCircle, Clock
import { collection, getDocs, updateDoc, doc, increment, addDoc, serverTimestamp, query, where, setDoc } from 'firebase/firestore'; // Added query, where, setDoc
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Resource } from '../../../types';
import toast from 'react-hot-toast';

const ResourcesTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'pdf' | 'ppt'>('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [completedResourcesCount, setCompletedResourcesCount] = useState(0);

  useEffect(() => {
    fetchResources();
  }, [currentUser]); // Depend on currentUser to refetch when user changes

  const fetchResources = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      // Fetch resources
      const snapshot = await getDocs(collection(db, 'resources'));
      const resourcesData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
        status: 'not-started' // Default status
      })) as Resource[];
      
      // Fetch user progress
      const progressQuery = query(
        collection(db, 'userResourceProgress'),
        where('userId', '==', currentUser.id)
      );
      const progressSnapshot = await getDocs(progressQuery);
      const progressMap = new Map();
      let completedCount = 0;
      
      progressSnapshot.docs.forEach(doc => {
        const data = doc.data();
        progressMap.set(data.resourceId, data);
        if (data.status === 'completed') {
          completedCount++;
        }
      });
      
      setUserProgress(progressMap);
      setCompletedResourcesCount(completedCount);
      
      // Update resources with progress status
      const resourcesWithProgress = resourcesData.map(resource => ({
        ...resource,
        status: progressMap.get(resource.id)?.status || 'not-started'
      }));
      
      setResources(resourcesData);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResource = async (resource: Resource) => {
    if (!currentUser) {
      toast.error('Please log in to track your progress.');
      window.open(resource.url, '_blank');
      return;
    }

    try {
      // Increment view count
      await updateDoc(doc(db, 'resources', resource.id), {
        viewCount: increment(1)
      });
      
      // Update or create user-specific progress
      const userProgressDocRef = doc(db, 'userResourceProgress', `${currentUser.id}_${resource.id}`);
      const existingProgress = userProgress.get(resource.id);

      if (!existingProgress) {
        // Create new progress entry if it doesn't exist
        await setDoc(userProgressDocRef, {
          userId: currentUser.id,
          resourceId: resource.id,
          status: 'in-progress', // Mark as in-progress on first view
          lastViewedAt: serverTimestamp(),
          startedAt: serverTimestamp()
        });
        
        // Update local state
        const newProgress = {
          userId: currentUser.id,
          resourceId: resource.id,
          status: 'in-progress',
          lastViewedAt: new Date(),
          startedAt: new Date()
        };
        setUserProgress(prev => new Map(prev.set(resource.id, newProgress)));
      } else {
        // Update existing progress entry
        await updateDoc(userProgressDocRef, {
          status: existingProgress.status === 'completed' ? 'completed' : 'in-progress',
          lastViewedAt: serverTimestamp()
        });
        
        // Update local state
        setUserProgress(prev => new Map(prev.set(resource.id, {
          ...existingProgress,
          status: existingProgress.status === 'completed' ? 'completed' : 'in-progress',
          lastViewedAt: new Date()
        })));
      }
      
      // Open resource in new tab
      window.open(resource.url, '_blank');
      
      // Update local state
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, viewCount: r.viewCount + 1, status: existingProgress?.status === 'completed' ? 'completed' : 'in-progress' }
          : r
      ));

    } catch (error) {
      console.error('Error updating view count or progress:', error);
      toast.error('Failed to track progress. Please try again.');
      // Still open the resource even if view count update fails
      window.open(resource.url, '_blank');
    }
  };

  const handleMarkAsComplete = async (resource: Resource) => {
    if (!currentUser) {
      toast.error('Please log in to mark resources as complete.');
      return;
    }
    
    const existingProgress = userProgress.get(resource.id);
    if (!existingProgress || existingProgress.status === 'not-started') {
      toast.error('Please view the resource first before marking it as complete.');
      return;
    }
    
    try {
      const userProgressDocRef = doc(db, 'userResourceProgress', `${currentUser.id}_${resource.id}`);
      await setDoc(userProgressDocRef, {
        userId: currentUser.id,
        resourceId: resource.id,
        status: 'completed',
        completedAt: serverTimestamp()
      }, { merge: true });
      
      toast.success(`'${resource.title}' marked as complete!`);
      
      // Update local state
      setUserProgress(prev => new Map(prev.set(resource.id, {
        ...existingProgress,
        status: 'completed',
        completedAt: new Date()
      })));
      
      setResources(prev => prev.map(r =>
        r.id === resource.id
          ? { ...r, status: 'completed' }
          : r
      ));
      setCompletedResourcesCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking resource as complete:', error);
      toast.error('Failed to mark as complete.');
    }
  };


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'ppt':
        return <Presentation className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-100 text-red-700';
      case 'pdf':
        return 'bg-blue-100 text-blue-700';
      case 'ppt':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIndicator = (status: 'completed' | 'in-progress' | 'not-started') => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center text-green-600 text-xs font-medium"><CheckCircle className="w-3 h-3 mr-1" /> Completed</span>;
      case 'in-progress':
        return <span className="flex items-center text-blue-600 text-xs font-medium"><Clock className="w-3 h-3 mr-1" /> In Progress</span>;
      case 'not-started':
      default:
        return <span className="flex items-center text-gray-500 text-xs font-medium">Not Started</span>;
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || resource.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalResources = resources.length;
  const completionRate = totalResources > 0 ? Math.round((completedResourcesCount / totalResources) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Total Resources</p>
              <p className="text-2xl font-bold text-gray-900">{totalResources}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
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
              <p className="text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedResourcesCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
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
              <p className="text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Play className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex space-x-2">
          {['all', 'video', 'pdf', 'ppt'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredResources.map((resource, index) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Resource Preview */}
            {resource.type === 'video' ? (
              <div className="aspect-video bg-gray-900">
                {userProgress.get(resource.id)?.status === 'in-progress' && (
                  <button
                    onClick={() => handleViewResource(resource)}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    <span>Play Video</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <div className={`p-4 rounded-full ${getTypeColor(resource.type)}`}>
                  {getTypeIcon(resource.type)}
                </div>
              </div>
            )}

            {/* Resource Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </div>
                <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                  {resource.type.toUpperCase()}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {resource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <span>{resource.viewCount} views</span>
                  {getStatusIndicator(userProgress.get(resource.id)?.status || 'not-started')}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewResource(resource)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                  {resource.status !== 'completed' && (
                    <button
                      onClick={() => handleMarkAsComplete(resource)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Mark Complete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          {resources.length === 0 ? (
            <>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources available</h3>
              <p className="text-gray-600">Resources will appear here once uploaded by instructors</p>
            </>
          ) : (
            <>
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourcesTab;