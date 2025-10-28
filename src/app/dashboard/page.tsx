'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Users,
  Eye,
  ArrowRight,
  Plus,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
  proposalCount: number;
  clientBrief: {
    event_type: string;
    date: string;
    city: string;
    guest_count: string;
  };
}

const STATUS_CONFIG = {
  BLUEPRINT_READY: { label: 'Draft', color: 'gray', icon: FileText },
  OPEN_FOR_BIDS: { label: 'Open for Proposals', color: 'blue', icon: Clock },
  CRAFTSMEN_BIDDING: { label: 'Receiving Bids', color: 'orange', icon: Users },
  SHORTLIST_REVIEW: { label: 'Reviewing Shortlist', color: 'purple', icon: Eye },
  COMMISSIONED: { label: 'Commissioned', color: 'green', icon: CheckCircle2 },
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Try to load from API first
        const response = await fetch('/api/forge/projects?userId=temp_user');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }

      // Also check localStorage for latest project
      const latestProjectId = localStorage.getItem('latest_project_id');
      if (latestProjectId && projects.length === 0) {
        // Mock project for demo
        setProjects([
          {
            id: latestProjectId,
            title: 'My Event',
            status: 'OPEN_FOR_BIDS',
            created_at: new Date().toISOString(),
            proposalCount: 0,
            clientBrief: {
              event_type: 'Wedding',
              date: '2025-06-15',
              city: 'Mumbai',
              guest_count: '200',
            },
          },
        ]);
      }

      setLoading(false);
    };

    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Events</h1>
              <p className="mt-1 text-slate-600">Track and manage your event proposals</p>
            </div>
            <Link
              href="/forge"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Plan New Event
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No events yet</h3>
            <p className="text-slate-600 mb-6">Start by planning your first event</p>
            <Link
              href="/forge"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Plan Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project, index) => {
              const statusConfig = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.OPEN_FOR_BIDS;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-slate-900">
                            {project.clientBrief.event_type} - {project.clientBrief.city}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-${statusConfig.color}-100 text-${statusConfig.color}-700`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </span>
                        </div>

                        <dl className="grid grid-cols-3 gap-4 mt-4 text-sm">
                          <div>
                            <dt className="text-slate-600">Event Date</dt>
                            <dd className="font-semibold text-slate-900 mt-1">
                              {new Date(project.clientBrief.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-600">Guests</dt>
                            <dd className="font-semibold text-slate-900 mt-1">
                              {project.clientBrief.guest_count} people
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-600">Proposals Received</dt>
                            <dd className="font-semibold text-slate-900 mt-1">
                              {project.proposalCount} proposals
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <Link
                        href={`/events/${project.id}`}
                        className="ml-6 inline-flex items-center gap-2 px-4 py-2 border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-semibold rounded-lg transition-colors"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Alert if no proposals yet */}
                    {project.proposalCount === 0 && project.status === 'OPEN_FOR_BIDS' && (
                      <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Waiting for vendor proposals
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            We&apos;ve notified relevant vendors in {project.clientBrief.city}. Proposals
                            typically arrive within 24-48 hours.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
