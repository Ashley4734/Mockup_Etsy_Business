import { Check } from 'lucide-react';
import useMockupStore from '../stores/useMockupStore';

export default function MockupGallery({ mockups }) {
  const { selectedMockups, toggleMockup } = useMockupStore();

  const isSelected = (mockupId) => {
    return selectedMockups.some(m => m.id === mockupId);
  };

  if (!mockups || mockups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No mockup images found in your Google Drive</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {mockups.map((mockup) => (
        <div
          key={mockup.id}
          onClick={() => toggleMockup(mockup)}
          className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all ${
            isSelected(mockup.id)
              ? 'ring-4 ring-primary-500 shadow-lg'
              : 'hover:shadow-md'
          }`}
        >
          {/* Image */}
          <div className="aspect-square bg-gray-100">
            <img
              src={mockup.thumbnailLink}
              alt={mockup.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Selection Overlay */}
          {isSelected(mockup.id) && (
            <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1">
              <Check size={20} />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {!isSelected(mockup.id) && (
                <div className="bg-white rounded-full p-2">
                  <Check size={24} className="text-primary-600" />
                </div>
              )}
            </div>
          </div>

          {/* File Name */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
            <p className="text-white text-sm truncate font-medium">
              {mockup.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
