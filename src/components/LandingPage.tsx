import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Users, Award, TrendingUp, CheckCircle, Star } from 'lucide-react';
import Logo from './Logo';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-secondary-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Logo size={40} />
              <span className="text-2xl font-bold text-secondary-900">PEEP</span>
            </div>
            <button
              onClick={onGetStarted}
              className="btn-primary px-6 py-2"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6"
            >
              Performance Evaluation
              <span className="text-primary-600 block">Enhancement Program</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto"
            >
              Empower your learning journey with comprehensive project management, 
              skill assessment, and placement preparation tools designed for academic excellence.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={onGetStarted}
                className="btn-primary px-8 py-4 text-lg flex items-center justify-center space-x-2"
              >
                <span>Start Learning</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Comprehensive tools and resources to enhance your academic performance and career readiness.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Project Management",
                description: "Create, track, and submit projects with comprehensive evaluation tools and feedback systems."
              },
              {
                icon: Users,
                title: "Collaborative Learning",
                description: "Connect with peers, share knowledge, and learn from mistake cards and success stories."
              },
              {
                icon: Award,
                title: "Skill Assessment",
                description: "Track your progress with detailed analytics and performance metrics across all subjects."
              },
              {
                icon: TrendingUp,
                title: "Career Preparation",
                description: "Access placement opportunities, interview preparation, and career guidance resources."
              },
              {
                icon: CheckCircle,
                title: "Progress Tracking",
                description: "Monitor your learning journey with detailed dashboards and achievement milestones."
              },
              {
                icon: Star,
                title: "Excellence Recognition",
                description: "Earn points, badges, and recognition for outstanding performance and contributions."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-8 text-center hover:shadow-strong transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "1000+", label: "Active Students" },
              { number: "500+", label: "Projects Completed" },
              { number: "95%", label: "Success Rate" },
              { number: "50+", label: "Partner Companies" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-white"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-100 text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
              Ready to Transform Your Learning Experience?
            </h2>
            <p className="text-xl text-secondary-600 mb-8">
              Join thousands of students who are already using PEEP to enhance their academic performance and career prospects.
            </p>
            <button
              onClick={onGetStarted}
              className="btn-primary px-8 py-4 text-lg flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Get Started Today</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Logo size={40} />
              <span className="text-2xl font-bold">PEEP</span>
            </div>
            <div className="text-secondary-400">
              © 2024 Performance Evaluation Enhancement Program. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;