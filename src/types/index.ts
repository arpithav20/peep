export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  batch?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  profilePictureUrl?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  };
  academicInfo?: {
    studentId?: string;
    program?: string;
    year?: number;
    gpa?: number;
  };
  createdAt: Date;
  lastLogin?: Date;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'ppt' | 'video';
  url: string;
  description?: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: Date;
  viewCount: number;
  status?: 'completed' | 'in-progress' | 'not-started'; // New field for progress tracking
}

export interface Project {
  id: string;
  title: string;
  description: string;
  designation?: string;
  activity?: string;
  estimatedTime?: string;
  outcome?: string;
  evaluation?: string;
  projectLink?: string;
  type: 'assigned' | 'unlocked' | 'self';
  assignedBy?: string;
  assignedTo?: string[];
  deadline?: Date;
  resources?: string[];
  status: 'pending' | 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'in-progress' | 'completed';
  rating?: number;
  feedback?: string;
  submissionDescription?: string;
  submissionUrl?: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface Submission {
  id: string;
  projectId: string;
  userId: string;
  files: string[];
  description: string;
  submittedAt: Date;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  rating?: number;
  feedback?: string;
}

export interface Placement {
  id: string;
  userId: string;
  company: string;
  position: string;
  type: 'assigned' | 'self-applied';
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted';
  appliedAt: Date;
  notes?: string;
}

export interface MistakeCard {
  id: string;
  userId: string;
  question?: string;
  howSolved?: 'on-my-own' | 'website' | 'friend' | 'instructor' | 'other';
  otherMethod?: string;
  reflection?: string;
  message?: string;
  context?: string;
  encouragement?: string;
  earnedAt: Date;
  points: number;
}