'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PhotoIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';

interface PortfolioImage {
  id: string;
  url: string;
  title: string;
  eventType: string;
  description: string;
  date: string;
}

interface Testimonial {
  id: string;
  clientName: string;
  eventType: string;
  quote: string;
  date: string;
  rating: number;
}

interface PortfolioData {
  vendorName: string;
  images: PortfolioImage[];
  testimonials: Testimonial[];
  eventTypes: string[];
}

export default function VendorPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.vendorId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    loadPortfolio();
  }, [vendorId]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/vendors/${vendorId}/portfolio`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load portfolio');
      }

      const data = await response.json();
      setPortfolio(data);
    } catch (err) {
      console.error('Error loading portfolio:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    if (!portfolio) return;
    setLightboxIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    if (!portfolio) return;
    setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border-2 border-red-500/50 rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Portfolio Not Found</h2>
          <p className="text-slate-300">{error || 'Portfolio could not be loaded'}</p>
          <button
            onClick={() => router.push(`/vendors/${vendorId}`)}
            className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const filteredImages = selectedFilter === 'all'
    ? portfolio.images
    : portfolio.images.filter(img => img.eventType === selectedFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/vendors/${vendorId}`)}
          className="mb-6 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Profile
        </button>

        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg">
              <PhotoIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{portfolio.vendorName} Portfolio</h1>
              <p className="text-slate-300">Showcasing our finest work</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        {portfolio.eventTypes.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All ({portfolio.images.length})
              </button>
              {portfolio.eventTypes.map((type) => {
                const count = portfolio.images.filter(img => img.eventType === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedFilter(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedFilter === type
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {type} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Portfolio Grid */}
        <div className="mb-8">
          {filteredImages.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-12 text-center">
              <PhotoIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No portfolio items to display</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image, index) => (
                <div
                  key={image.id}
                  onClick={() => openLightbox(index)}
                  className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                >
                  <div className="aspect-video bg-slate-900 flex items-center justify-center">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-semibold mb-1">{image.title}</p>
                      <p className="text-slate-300 text-sm">{image.eventType}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1">{image.title}</h3>
                    <p className="text-slate-400 text-sm mb-2">{image.eventType}</p>
                    {image.description && (
                      <p className="text-slate-300 text-sm line-clamp-2">{image.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testimonials */}
        {portfolio.testimonials.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Client Testimonials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-gradient-to-br from-orange-900/20 to-pink-900/20 border border-orange-500/30 rounded-lg p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < testimonial.rating ? 'text-yellow-400' : 'text-slate-600'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-slate-300 italic mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-white font-semibold">{testimonial.clientName}</p>
                      <p className="text-slate-400">{testimonial.eventType}</p>
                    </div>
                    <p className="text-slate-400">
                      {new Date(testimonial.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && filteredImages.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors"
            >
              <XMarkIcon className="w-10 h-10" />
            </button>

            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors"
            >
              <ChevronLeftIcon className="w-10 h-10" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors"
            >
              <ChevronRightIcon className="w-10 h-10" />
            </button>

            <div className="max-w-6xl max-h-[90vh] flex flex-col">
              <img
                src={filteredImages[lightboxIndex].url}
                alt={filteredImages[lightboxIndex].title}
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="bg-slate-900/90 p-4 rounded-b-lg mt-2">
                <h3 className="text-white font-semibold text-lg mb-1">
                  {filteredImages[lightboxIndex].title}
                </h3>
                <p className="text-slate-300 text-sm mb-2">
                  {filteredImages[lightboxIndex].eventType}
                </p>
                {filteredImages[lightboxIndex].description && (
                  <p className="text-slate-400 text-sm">
                    {filteredImages[lightboxIndex].description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
