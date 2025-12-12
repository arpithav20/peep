import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trophy, Target, Lightbulb, Award, Sparkles, Plus, BookOpen, Globe, Zap, FlaskConical, Loader } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { MistakeCard } from '../../../types';
import toast from 'react-hot-toast';

const MistakeCards: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [mistakeCards, setMistakeCards] = useState<MistakeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    question: '',
    howSolved: 'on-my-own' as 'on-my-own' | 'website' | 'friend' | 'instructor' | 'other',
    otherMethod: '',
    reflection: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser) {
      fetchMistakeCards();
    }
  }, [currentUser]);

  const fetchMistakeCards = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'mistakeCards'),
        where('userId', '==', currentUser.id)
      );
      
      const snapshot = await getDocs(q);
      const cardsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        earnedAt: doc.data().earnedAt?.toDate() || new Date()
      })) as MistakeCard[];
      
      // Sort by earned date (newest first)
      cardsData.sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
      
      setMistakeCards(cardsData);
    } catch (error) {
      console.error('Error fetching mistake cards:', error);
      toast.error('Failed to fetch mistake cards');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.question.trim()) {
      errors.question = 'Question is required';
    }
    
    if (formData.howSolved === 'other' && !formData.otherMethod.trim()) {
      errors.otherMethod = 'Please specify the method';
    }
    
    if (!formData.reflection.trim()) {
      errors.reflection = 'Reflection is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !validateForm()) return;

    setSubmitting(true);
    try {
      const points = Math.floor(Math.random() * 3) + 3; // Random points between 3-5
      
      await addDoc(collection(db, 'mistakeCards'), {
        userId: currentUser.id,
        question: formData.question,
        howSolved: formData.howSolved,
        otherMethod: formData.otherMethod,
        reflection: formData.reflection,
        points,
        earnedAt: serverTimestamp(),
        encouragement: getRandomEncouragement()
      });

      toast.success(`Learning moment added! You earned ${points} points!`);
      setShowAddForm(false);
      setFormData({
        question: '',
        howSolved: 'on-my-own',
        otherMethod: '',
        reflection: ''
      });
      setFormErrors({});
      fetchMistakeCards();
    } catch (error) {
      console.error('Error adding mistake card:', error);
      toast.error('Failed to add learning moment');
    } finally {
      setSubmitting(false);
    }
  };

  const getRandomEncouragement = () => {
    const encouragements = [
      "Great job reflecting on your learning process!",
      "Every mistake is a stepping stone to mastery!",
      "You're building resilience with every challenge!",
      "Keep experimenting - that's how you grow!",
      "Your curiosity is your superpower!",
      "Learning from mistakes shows real wisdom!"
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  };

  const totalPoints = mistakeCards.reduce((sum, card) => sum + card.points, 0);
  const recentCards = mistakeCards.filter(card => 
    Date.now() - card.earnedAt.getTime() < 86400000 * 7
  ).length;

  const encouragingMessages = [
    { text: "Every mistake is a step forward!", icon: Target },
    { text: "You're building resilience with every challenge!", icon: Zap },
    { text: "Mistakes are proof that you're trying!", icon: Sparkles },
    { text: "Keep experimenting - that's how you learn!", icon: FlaskConical }
  ];

  const getSolvedMethodIcon = (method: string) => {
    switch (method) {
      case 'on-my-own':
        return <Target className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      case 'friend':
        return <Heart className="w-4 h-4" />;
      case 'instructor':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSolvedMethodColor = (method: string) => {
    switch (method) {
      case 'on-my-own':
        return 'bg-accent-100 text-accent-700';
      case 'website':
        return 'bg-primary-100 text-primary-700';
      case 'friend':
        return 'bg-pink-100 text-pink-700';
      case 'instructor':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Mistake Cards</h2>
          <p className="text-secondary-600">Celebrating your learning journey through trial and error</p>
        </motion.div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-accent flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Learning Moment</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100">Total Mistake Cards</p>
              <p className="text-3xl font-bold">{mistakeCards.length}</p>
            </div>
            <Heart className="w-8 h-8 text-pink-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Learning Points</p>
              <p className="text-3xl font-bold">{totalPoints}</p>
            </div>
            <Trophy className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100">This Week</p>
              <p className="text-3xl font-bold">{recentCards}</p>
            </div>
            <Target className="w-8 h-8 text-indigo-200" />
          </div>
        </motion.div>
      </div>

      {/* Encouraging Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-yellow-500 rounded-full">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-secondary-900 mb-2 flex items-center space-x-2">
              <span>Keep Going, You're Amazing!</span>
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </h3>
            <p className="text-secondary-700">
              <span className="flex items-center space-x-2">
                {(() => {
                  const message = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
                  const IconComponent = message.icon;
                  return (
                    <>
                      <IconComponent className="w-4 h-4" />
                      <span>{message.text}</span>
                    </>
                  );
                })()}
              </span>
            </p>
            <p className="text-sm text-secondary-600 mt-2">
              Remember: Every expert was once a beginner who never gave up. Your mistakes are stepping stones to mastery!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Add Mistake Card Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Add Learning Moment</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                What question or problem did you encounter? *
              </label>
              <textarea
                rows={3}
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className={`input-field ${formErrors.question ? 'border-error-500 focus:ring-error-500' : ''}`}
                placeholder="Describe the question or challenge you faced..."
              />
              {formErrors.question && (
                <p className="text-error-500 text-sm mt-1">{formErrors.question}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                How did you solve it? *
              </label>
              <select
                value={formData.howSolved}
                onChange={(e) => setFormData({ ...formData, howSolved: e.target.value as any })}
                className="input-field"
              >
                <option value="on-my-own">On my own</option>
                <option value="website">Using a website/documentation</option>
                <option value="friend">Asked a friend/peer</option>
                <option value="instructor">Asked instructor/mentor</option>
                <option value="other">Other method</option>
              </select>
            </div>

            {formData.howSolved === 'other' && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Please specify the method *
                </label>
                <input
                  type="text"
                  value={formData.otherMethod}
                  onChange={(e) => setFormData({ ...formData, otherMethod: e.target.value })}
                  className={`input-field ${formErrors.otherMethod ? 'border-error-500 focus:ring-error-500' : ''}`}
                  placeholder="How did you solve it?"
                />
                {formErrors.otherMethod && (
                  <p className="text-error-500 text-sm mt-1">{formErrors.otherMethod}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                What did you learn from this experience? *
              </label>
              <textarea
                rows={3}
                value={formData.reflection}
                onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
                className={`input-field ${formErrors.reflection ? 'border-error-500 focus:ring-error-500' : ''}`}
                placeholder="Reflect on what you learned and how it helped you grow..."
              />
              {formErrors.reflection && (
                <p className="text-error-500 text-sm mt-1">{formErrors.reflection}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-accent flex-1 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Learning Moment</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormErrors({});
                }}
                className="btn-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Mistake Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mistakeCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border-2 border-pink-200 p-6 hover:shadow-medium hover:border-pink-300 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-secondary-700">+{card.points} Learning Points</span>
                  </div>
                  <p className="text-xs text-secondary-500">{card.earnedAt.toLocaleDateString()}</p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-secondary-500 mb-1">QUESTION</p>
                <p className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg">{card.question}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-secondary-500 mb-2">HOW SOLVED</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSolvedMethodColor(card.howSolved)}`}>
                    {getSolvedMethodIcon(card.howSolved)}
                    <span className="ml-1 capitalize">{card.howSolved.replace('-', ' ')}</span>
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-secondary-500 mb-1">REFLECTION</p>
                <p className="text-sm text-secondary-700 bg-primary-50 p-3 rounded-lg">{card.reflection}</p>
              </div>

              <div className="bg-accent-50 border border-accent-200 rounded-lg p-3">
                <p className="text-accent-800 text-sm">{card.encouragement}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {mistakeCards.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No Mistake Cards Yet</h3>
          <p className="text-secondary-600 mb-4">
            Don't worry! Mistakes are how we learn. Start adding your learning moments to earn points.
          </p>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-primary-800 text-sm">
              <span className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <span><strong>Pro Tip:</strong> The best learners make the most mistakes because they're not afraid to try new things!</span>
              </span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Achievement Badge */}
      {totalPoints >= 15 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white text-center"
        >
          <Trophy className="w-12 h-12 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2 flex items-center justify-center space-x-2">
            <span>Brave Learner Badge!</span>
            <Trophy className="w-6 h-6 text-yellow-200" />
          </h3>
          <p className="text-yellow-100">
            You've earned {totalPoints} learning points by embracing mistakes. Keep up the fearless learning!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MistakeCards;