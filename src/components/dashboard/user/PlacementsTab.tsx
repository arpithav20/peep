import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building, Calendar, MapPin, ExternalLink, Edit, Trash2, Loader, X, Save } from 'lucide-react'; // Added X, Save
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Placement } from '../../../types';
import toast from 'react-hot-toast';

const PlacementsTab: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false); // Controls visibility of the form modal
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false); // New state to differentiate add/edit mode
  const [currentPlacementId, setCurrentPlacementId] = useState<string | null>(null); // Stores ID of placement being edited
  
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    type: 'self-applied' as 'assigned' | 'self-applied',
    status: 'applied' as 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted',
    appliedAt: '',
    notes: '',
    location: '',
    website: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser) {
      fetchPlacements();
    }
  }, [currentUser]);

  const fetchPlacements = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'placements'),
        where('userId', '==', currentUser.id)
      );
      
      const snapshot = await getDocs(q);
      const placementsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        appliedAt: doc.data().appliedAt?.toDate() || new Date()
      })) as Placement[];
      
      // Sort by application date (newest first)
      placementsData.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
      
      setPlacements(placementsData);
    } catch (error) {
      console.error('Error fetching placements:', error);
      toast.error('Failed to fetch placements');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.company.trim()) {
      errors.company = 'Company name is required';
    }
    
    if (!formData.position.trim()) {
      errors.position = 'Position is required';
    }
    
    if (!formData.appliedAt) {
      errors.appliedAt = 'Application date is required';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !validateForm()) return;

    setSubmitting(true);
    try {
      if (isEditing && currentPlacementId) {
        await updateDoc(doc(db, 'placements', currentPlacementId), {
          ...formData,
          appliedAt: new Date(formData.appliedAt),
          updatedAt: serverTimestamp()
        });
        toast.success('Application updated successfully!');
      } else {
        await addDoc(collection(db, 'placements'), {
          ...formData,
          userId: currentUser.id,
          appliedAt: new Date(formData.appliedAt),
          createdAt: serverTimestamp()
        });
        toast.success('Application added successfully!');
      }

      setShowAddForm(false);
      setFormData({
        company: '',
        position: '',
        type: 'self-applied',
        status: 'applied',
        appliedAt: '',
        notes: '',
        location: '',
        website: ''
      });
      setFormErrors({});
      fetchPlacements();
    } catch (error) {
      console.error('Error adding placement:', error);
      toast.error('Failed to add application');
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (placementId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await deleteDoc(doc(db, 'placements', placementId));
      toast.success('Application deleted successfully');
      fetchPlacements();
    } catch (error) {
      console.error('Error deleting placement:', error);
      toast.error('Failed to delete application');
    }
  };

  const handleOpenAddForm = () => {
    setIsEditing(false);
    setCurrentPlacementId(null);
    setFormData({
      company: '',
      position: '',
      type: 'self-applied',
      status: 'applied',
      appliedAt: '',
      notes: '',
      location: '',
      website: ''
    });
    setFormErrors({});
    setShowAddForm(true);
  };

  const handleOpenEditForm = (placement: Placement) => {
    setIsEditing(true);
    setCurrentPlacementId(placement.id);
    setFormData({
      company: placement.company,
      position: placement.position,
      type: placement.type,
      status: placement.status,
      appliedAt: placement.appliedAt.toISOString().split('T')[0], // Format date for input
      notes: placement.notes || '',
      location: placement.location || '',
      website: placement.website || ''
    });
    setFormErrors({});
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setIsEditing(false);
    setCurrentPlacementId(null);
    setFormErrors({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-primary-100 text-primary-700';
      case 'interviewing':
        return 'bg-warning-100 text-warning-700';
      case 'offered':
        return 'bg-accent-100 text-accent-700';
      case 'rejected':
        return 'bg-error-100 text-error-700';
      case 'accepted':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'assigned' 
      ? 'bg-primary-100 text-primary-700' 
      : 'bg-warning-100 text-warning-700';
  };

  const stats = {
    total: placements.length,
    active: placements.filter(p => ['applied', 'interviewing', 'offered'].includes(p.status)).length,
    offers: placements.filter(p => p.status === 'offered').length,
    accepted: placements.filter(p => p.status === 'accepted').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Placements</h2>
          <p className="text-secondary-600">Track your job applications and placement progress</p>
        </div>
        <button 
          onClick={handleOpenAddForm}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-600 text-sm">Total Applications</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <Building className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-600 text-sm">Active</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.active}</p>
            </div>
            <div className="p-2 bg-warning-100 rounded-lg">
              <Calendar className="w-5 h-5 text-warning-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-600 text-sm">Offers</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.offers}</p>
            </div>
            <div className="p-2 bg-accent-100 rounded-lg">
              <Building className="w-5 h-5 text-accent-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-600 text-sm">Accepted</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.accepted}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Application Form Modal */}
      {showAddForm && (
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
              <h3 className="text-lg font-semibold text-secondary-900">
                {isEditing ? 'Edit Application' : 'Add New Application'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className={`input-field ${formErrors.company ? 'border-error-500 focus:ring-error-500' : ''}`}
                placeholder="Enter company name"
              />
              {formErrors.company && (
                <p className="text-error-500 text-sm mt-1">{formErrors.company}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Position *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className={`input-field ${formErrors.position ? 'border-error-500 focus:ring-error-500' : ''}`}
                placeholder="Enter position title"
              />
              {formErrors.position && (
                <p className="text-error-500 text-sm mt-1">{formErrors.position}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`input-field ${formErrors.location ? 'border-error-500 focus:ring-error-500' : ''}`}
                placeholder="Enter location"
              />
              {formErrors.location && (
                <p className="text-error-500 text-sm mt-1">{formErrors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Company Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="input-field"
                placeholder="https://company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Application Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="input-field"
              >
                <option value="self-applied">Self Applied</option>
                <option value="assigned">Assigned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="input-field"
              >
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
                <option value="accepted">Accepted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Applied Date *
              </label>
              <input
                type="date"
                value={formData.appliedAt}
                onChange={(e) => setFormData({ ...formData, appliedAt: e.target.value })}
                className={`input-field ${formErrors.appliedAt ? 'border-error-500 focus:ring-error-500' : ''}`}
              />
              {formErrors.appliedAt && (
                <p className="text-error-500 text-sm mt-1">{formErrors.appliedAt}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                placeholder="Add any notes about this application..."
              />
            </div>

            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>{isEditing ? 'Saving...' : 'Adding...'}</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Update Application' : 'Add Application'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={handleCloseForm}
                className="btn-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
        </motion.div>
      )}

      {/* Placements List */}
      <div className="grid grid-cols-1 gap-4">
        {placements.map((placement, index) => (
          <motion.div
            key={placement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6 hover:shadow-medium"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-secondary-900 text-lg">{placement.company}</h3>
                  {placement.website && (
                    <a
                      href={placement.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <p className="text-secondary-700 font-medium mb-1">{placement.position}</p>
                <div className="flex items-center space-x-2 text-sm text-secondary-600">
                  <MapPin className="w-4 h-4" />
                  <span>{placement.location}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(placement.type)}`}>
                  {placement.type === 'assigned' ? 'Assigned' : 'Self Applied'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(placement.status)}`}>
                  {placement.status.charAt(0).toUpperCase() + placement.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-secondary-600 mb-4">
              <Calendar className="w-4 h-4" />
              <span>Applied {placement.appliedAt.toLocaleDateString()}</span>
            </div>

            {placement.notes && (
              <div className="bg-secondary-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-secondary-700">{placement.notes}</p>
              </div>
            )}

            <div className="flex space-x-2">
              <button onClick={() => handleOpenEditForm(placement)} className="btn-secondary flex items-center space-x-1 text-sm">
                <Edit className="w-3 h-3" />
                <span>Update</span>
              </button>
              <button 
                onClick={() => handleDelete(placement.id)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-error-500 text-white text-sm rounded-lg hover:bg-error-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {placements.length === 0 && !showAddForm && (
        <div className="text-center py-12 col-span-full">
          <Building className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No applications yet</h3>
          <p className="text-secondary-600">Start tracking your job applications</p>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary mt-4"
          >
            Add First Application
          </button>
        </div>
      )}
    </div>
  );
};

export default PlacementsTab;