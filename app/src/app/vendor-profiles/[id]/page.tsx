'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  ArrowLeft,
  CheckCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { vendorProfiles } from '../../../data/vendorProfiles';

interface PortfolioImage {
  id: string;
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

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const vendor = vendorProfiles.find(v => v.id === params.id);

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Vendor Not Found</h1>
          <p className="text-neutral-600 mb-6">The vendor profile you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/vendor-profiles')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
          >
            Browse All Vendors
          </button>
        </div>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(vendor.portfolioImages.map(img => img.category)))];
  const filteredImages = selectedCategory === 'All' 
    ? vendor.portfolioImages 
    : vendor.portfolioImages.filter(img => img.category === selectedCategory);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const nextModalImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevModalImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendors
        </button>

        {/* Vendor Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Vendor Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">{vendor.companyName}</h1>
                  <p className="text-xl text-blue-600 font-medium mb-4">{vendor.tagline}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${
                          i < Math.floor(vendor.rating) 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <p className="text-neutral-600">{vendor.rating} ({vendor.reviewCount} reviews)</p>
                </div>
              </div>

              <p className="text-neutral-600 mb-6">{vendor.description}</p>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-neutral-400" />
                  <span className="text-neutral-700">{vendor.city}, {vendor.state}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-neutral-400" />
                  <span className="text-neutral-700">{vendor.experience}</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-neutral-400" />
                  <span className="text-neutral-700">₹{vendor.startingPrice.toLocaleString()} onwards</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-neutral-700">Verified Vendor</span>
                </div>
              </div>

              {/* Services */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.services.map((service, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex gap-4">
                <button className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105">
                  Request Quote
                </button>
                <button className="p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                  <Mail className="w-6 h-6 text-neutral-600" />
                </button>
                <button className="p-4 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                  <Phone className="w-6 h-6 text-neutral-600" />
                </button>
              </div>
            </div>

            {/* Main Portfolio Image */}
            <div className="lg:w-96">
              <div className="relative h-80 bg-gray-100 rounded-xl overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filteredImages[currentImageIndex]?.url}
                  alt={filteredImages[currentImageIndex]?.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openModal(currentImageIndex)}
                />
                
                {filteredImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    {/* Image counter */}
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {filteredImages.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Image info */}
              <div className="mt-3">
                <h4 className="font-medium text-neutral-900">{filteredImages[currentImageIndex]?.title}</h4>
                <p className="text-sm text-neutral-600">{filteredImages[currentImageIndex]?.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Gallery */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Portfolio Gallery</h2>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setCurrentImageIndex(0);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-gray-100 text-neutral-700 hover:bg-blue-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => openModal(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm font-medium truncate">{image.title}</p>
                  <p className="text-xs text-white/80 truncate">{image.category}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Client Reviews</h2>
          <div className="space-y-6">
            {vendor.reviews.map((review, index) => (
              <div key={index} className="border-b border-neutral-200 last:border-b-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-neutral-900">{review.clientName}</h4>
                    <p className="text-sm text-neutral-500">{review.eventType} • {review.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < review.rating 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-neutral-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ImageModal
        isOpen={isModalOpen}
        images={filteredImages}
        currentImageIndex={currentImageIndex}
        onClose={() => setIsModalOpen(false)}
        onNext={nextModalImage}
        onPrev={prevModalImage}
      />
    </div>
  );
}