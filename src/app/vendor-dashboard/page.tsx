'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Bell,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Eye,
  FileText,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Package
} from 'lucide-react';
import LaLillyLogoNew from '../../components/LaLillyLogoNew';

interface Vendor {
  id: string;
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  services: string[];
  experience: string;
  portfolio: string;
  description: string;
  status: string;
  registrationDate: Date;
  projects: ProjectBrief[];
  bids: Array<{
    id: string;
    projectId: string;
    amount: number;
    status: string;
  }>;
}

interface ProjectBrief {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  location: string;
  guestCount: string;
  venueStatus: string;
  requirements: Record<string, string[]>;
  status: 'new' | 'viewed' | 'bid_submitted' | 'closed';
  createdDate: Date;
  categories: string[];
  budget?: string;
}

const MOCK_PROJECTS: ProjectBrief[] = [
  {
    id: 'proj-001',
    clientName: 'Rahul & Priya Wedding',
    eventType: 'Wedding',
    eventDate: '2024-12-15',
    location: 'Mumbai, Maharashtra',
    guestCount: '300',
    venueStatus: 'Yes, venue is already booked',
    requirements: {
      'Decoration': ['Wedding car decoration and styling', 'Grand entrance decoration from gate to venue'],
      'Photography & Video': ['Professional videography with aerial shots', 'Candid photography style preferences'],
      'Entertainment': ['Live music performance requirements', 'DJ services and playlist preferences']
    },
    status: 'new',
    createdDate: new Date('2024-01-15'),
    categories: ['Venue & Decor', 'Photography & Video', 'Entertainment & Music'],
    budget: '₹5-8 Lakhs'
  },
  {
    id: 'proj-002',
    clientName: 'Tech Corp Annual Meet',
    eventType: 'Corporate Event',
    eventDate: '2024-11-20',
    location: 'Bangalore, Karnataka',
    guestCount: '150',
    venueStatus: 'No, please help us find a venue',
    requirements: {
      'Technical': ['LED display and screen setup', 'Audio system specifications'],
      'Food & Banquet': ['Catering menu customization', 'Beverage service options'],
      'Manpower': ['Professional hostess services', 'Security and crowd management']
    },
    status: 'viewed',
    createdDate: new Date('2024-01-10'),
    categories: ['Technical', 'Catering & Food', 'Security & Staff']
  },
  {
    id: 'proj-003',
    clientName: 'Aarav&apos;s 8th Birthday',
    eventType: 'Birthday/Theme Party',
    eventDate: '2024-10-25',
    location: 'Delhi, Delhi',
    guestCount: '50',
    venueStatus: 'Yes, venue is already booked',
    requirements: {
      'Entertainment': ['DJ and sound technician', 'Performance artists and entertainers'],
      'Food & Banquet': ['Catering menu and food stations', 'Welcome drinks and cocktail hour'],
      'Venue & Decor': ['Theme-based venue decoration', 'Photo booth and backdrop setup']
    },
    status: 'bid_submitted',
    createdDate: new Date('2024-01-05'),
    categories: ['Entertainment & Music', 'Catering & Food', 'Venue & Decor']
  }
];

export default function VendorDashboardPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [projects, setProjects] = useState<ProjectBrief[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectBrief | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'bids' | 'profile'>('overview');

  useEffect(() => {
    // Load vendor session
    const session = localStorage.getItem('lalilly-vendor-session');
    if (!session) {
      window.location.href = '/vendor-auth';
      return;
    }

    const vendorData: Vendor = JSON.parse(session);
    setVendor(vendorData);

    // Load or generate projects for this vendor
    const relevantProjects = MOCK_PROJECTS.filter(project => 
      project.categories.some(category => vendorData.services.includes(category))
    );
    setProjects(relevantProjects);
  }, []);


  const markAsViewed = (projectId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId && p.status === 'new' 
        ? { ...p, status: 'viewed' } 
        : p
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-700 border-green-200';
      case 'viewed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'bid_submitted': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Bell className="w-4 h-4" />;
      case 'viewed': return <Eye className="w-4 h-4" />;
      case 'bid_submitted': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const newProjectsCount = projects.filter(p => p.status === 'new').length;
  const totalBidsSubmitted = projects.filter(p => p.status === 'bid_submitted').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white pt-16">

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'projects', label: 'Projects', icon: Package, badge: newProjectsCount },
              { id: 'bids', label: 'My Bids', icon: FileText },
              { id: 'profile', label: 'Profile', icon: Building2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'projects' | 'bids' | 'profile')}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ml-1">
                    {tab.badge}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">
                      Welcome back, {vendor.ownerName}!
                    </h1>
                    <p className="opacity-90">
                      {vendor.companyName} • {vendor.city}, {vendor.state}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{projects.length}</div>
                    <div className="opacity-90">Available Projects</div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-neutral-900">{newProjectsCount}</div>
                      <div className="text-sm text-neutral-600">New Projects</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-neutral-900">
                        {projects.filter(p => p.status === 'viewed').length}
                      </div>
                      <div className="text-sm text-neutral-600">Under Review</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-neutral-900">{totalBidsSubmitted}</div>
                      <div className="text-sm text-neutral-600">Bids Submitted</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-neutral-900">4.8</div>
                      <div className="text-sm text-neutral-600">Average Rating</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Projects */}
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-900">Recent Project Opportunities</h3>
                </div>
                <div className="divide-y divide-neutral-200">
                  {projects.slice(0, 3).map(project => (
                    <div key={project.id} className="p-6 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-neutral-900">{project.clientName}</h4>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getStatusColor(project.status)}`}>
                              {getStatusIcon(project.status)}
                              {project.status.replace('_', ' ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(project.eventDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {project.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {project.guestCount} guests
                            </div>
                            {project.budget && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {project.budget}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {project.categories.slice(0, 3).map(category => (
                              <span key={category} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg">
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProject(project);
                            markAsViewed(project.id);
                          }}
                          className="ml-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-900">Available Project Opportunities</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Projects matching your service categories • {projects.length} opportunities
                  </p>
                </div>
                <div className="divide-y divide-neutral-200">
                  {projects.map(project => (
                    <div key={project.id} className="p-6 hover:bg-neutral-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-neutral-900">{project.clientName}</h4>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getStatusColor(project.status)}`}>
                              {getStatusIcon(project.status)}
                              {project.status.replace('_', ' ')}
                            </div>
                            <span className="text-xs text-neutral-500">
                              Posted {new Date(project.createdDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(project.eventDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {project.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {project.guestCount} guests
                            </div>
                            {project.budget && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {project.budget}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {project.categories.map(category => (
                              <span key={category} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg">
                                {category}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-neutral-600">
                            {project.eventType} • {Object.keys(project.requirements).length} requirement categories
                          </p>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              markAsViewed(project.id);
                            }}
                            className="px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                          >
                            View Details
                          </button>
                          {project.status !== 'bid_submitted' && (
                            <button className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105">
                              Submit Bid
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bids' && (
            <motion.div
              key="bids"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Bid Management</h3>
              <p className="text-neutral-600 mb-6">
                Track your submitted bids and their status. This feature will be available in the next update.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                <Clock className="w-4 h-4" />
                Coming Soon
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-6">Vendor Profile</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={vendor.companyName}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Owner Name</label>
                    <input
                      type="text"
                      value={vendor.ownerName}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={vendor.email}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={vendor.phone}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={`${vendor.city}, ${vendor.state}`}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Experience</label>
                    <input
                      type="text"
                      value={vendor.experience || 'Not specified'}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Services Offered</label>
                  <div className="flex flex-wrap gap-2">
                    {vendor.services.map(service => (
                      <span key={service} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                
                {vendor.description && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Business Description</label>
                    <textarea
                      value={vendor.description}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 h-24 resize-none"
                      readOnly
                    />
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <div className="text-sm text-neutral-600">
                    Member since: {new Date(vendor.registrationDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project Detail Modal */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedProject(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-neutral-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">{selectedProject.clientName}</h3>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(selectedProject.eventDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedProject.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {selectedProject.guestCount} guests
                        </div>
                        {selectedProject.budget && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {selectedProject.budget}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-3">Event Details</h4>
                      <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                        <div><span className="font-medium">Type:</span> {selectedProject.eventType}</div>
                        <div><span className="font-medium">Venue Status:</span> {selectedProject.venueStatus}</div>
                        <div><span className="font-medium">Categories:</span> {selectedProject.categories.join(', ')}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-3">Requirements</h4>
                      <div className="space-y-4">
                        {Object.entries(selectedProject.requirements).map(([category, items]) => (
                          <div key={category} className="bg-neutral-50 rounded-lg p-4">
                            <h5 className="font-medium text-neutral-900 mb-2">{category}</h5>
                            <ul className="space-y-1 text-sm text-neutral-600">
                              {(items as string[]).map((item, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-neutral-200 flex gap-3">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                  >
                    Close
                  </button>
                  {selectedProject.status !== 'bid_submitted' && (
                    <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105">
                      Submit Bid for This Project
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}