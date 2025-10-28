'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, MapPin, Phone, Mail } from 'lucide-react';
import { vendorProfiles } from '../../data/vendorProfiles';

interface PortfolioImage {
  url: string;
  title: string;
  description: string;
  category: string;
  eventType: string;
}

interface ImageModalProps {
  isOpen: boolean;
  images: PortfolioImage[];
  currentImageIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function ImageModal({ isOpen, images, currentImageIndex, onClose, onNext, onPrev }: ImageModalProps) {
  if (!isOpen || !images[currentImageIndex]) return null;

  const currentImage = images[currentImageIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="relative max-w-6xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              ✕
            </button>
            
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage.url}
                alt={currentImage.title}
                className="w-full h-full object-contain max-h-[80vh] rounded-lg"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={onPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={onNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-b-lg">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">{currentImage.title}</h3>
              <p className="text-neutral-600 mb-2">{currentImage.description}</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {currentImage.category}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                  {currentImage.eventType}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface VendorProfile {
  id: string;
  companyName: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  description: string;
  city: string;
  state: string;
  services: string[];
  startingPrice: number;
  portfolioImages: PortfolioImage[];
}

function VendorCard({ vendor }: { vendor: VendorProfile }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % vendor.portfolioImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + vendor.portfolioImages.length) % vendor.portfolioImages.length);
  };

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const nextModalImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % vendor.portfolioImages.length);
  };

  const prevModalImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + vendor.portfolioImages.length) % vendor.portfolioImages.length);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
      >
        {/* Portfolio Slideshow */}
        <div className="relative h-64 bg-gray-100 overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={vendor.portfolioImages[currentImageIndex]?.url}
              alt={vendor.portfolioImages[currentImageIndex]?.title}
              className="w-full h-full object-cover cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => openModal(currentImageIndex)}
            />
          </AnimatePresence>
          
          {vendor.portfolioImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {vendor.portfolioImages.map((_img: PortfolioImage, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Vendor Details */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-neutral-900 mb-1">{vendor.companyName}</h3>
              <p className="text-blue-600 font-medium">{vendor.tagline}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < Math.floor(vendor.rating) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-600">{vendor.rating} ({vendor.reviewCount} reviews)</p>
            </div>
          </div>

          <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{vendor.description}</p>

          {/* Location */}
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-600">{vendor.city}, {vendor.state}</span>
          </div>

          {/* Services */}
          <div className="mb-4">
            <p className="text-sm font-medium text-neutral-900 mb-2">Services:</p>
            <div className="flex flex-wrap gap-1">
              {vendor.services.slice(0, 3).map((service: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {service}
                </span>
              ))}
              {vendor.services.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                  +{vendor.services.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-4">
            <p className="text-lg font-bold text-neutral-900">₹{vendor.startingPrice.toLocaleString()}</p>
            <p className="text-xs text-neutral-500">Starting price</p>
          </div>

          {/* Contact */}
          <div className="flex gap-2">
            <Link
              href={`/vendor-profiles/${vendor.id}`}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 text-center"
            >
              View Profile
            </Link>
            <button className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
              <Mail className="w-5 h-5 text-neutral-600" />
            </button>
            <button className="p-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
              <Phone className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </motion.div>

      <ImageModal
        isOpen={isModalOpen}
        images={vendor.portfolioImages}
        currentImageIndex={currentImageIndex}
        onClose={() => setIsModalOpen(false)}
        onNext={nextModalImage}
        onPrev={prevModalImage}
      />
    </>
  );
}

export default function VendorProfilesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const categories = ['All', 'Wedding Management', 'Corporate Events', 'Event Planning', 'Destination Management', 'Complete Coordination'];
  
  const filteredVendors = selectedCategory === 'All' 
    ? vendorProfiles 
    : vendorProfiles.filter(vendor => 
        vendor.services.some(service => 
          service.toLowerCase().includes(selectedCategory.toLowerCase().replace(' management', '').replace(' coordination', ''))
        ) ||
        vendor.specialties.some(spec => 
          spec.toLowerCase().includes(selectedCategory.toLowerCase().replace(' management', '').replace(' events', ''))
        ) ||
        vendor.portfolioImages.some(img => 
          img.category.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-neutral-900 mb-4"
          >
            Event Management Companies
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-neutral-600 max-w-2xl mx-auto"
          >
            Discover professional event management companies that handle your entire event from start to finish. Find the perfect partner for seamless event coordination.
          </motion.p>
        </div>

        {/* Category Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-3 justify-center mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                  : 'bg-white text-neutral-700 hover:bg-blue-50 shadow-sm hover:shadow-md'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Vendors Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
        >
          {filteredVendors.map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <VendorCard vendor={vendor} />
            </motion.div>
          ))}
        </motion.div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-neutral-600">No vendors found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}