import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, DollarSign, Tag, Save } from 'lucide-react';
import useMockupStore from '../stores/useMockupStore';
import { listings, templates as templatesApi } from '../services/api';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { selectedMockups, clearSelection } = useMockupStore();

  const [generatedContent, setGeneratedContent] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user templates
  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await templatesApi.list();
      return response.data;
    }
  });

  useEffect(() => {
    if (selectedMockups.length === 0) {
      navigate('/dashboard');
    }
  }, [selectedMockups, navigate]);

  // Generate listing content
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const fileIds = selectedMockups.map(m => m.id);
      const customSections = templatesData?.templates?.filter(t => t.is_default) || [];

      const response = await listings.generate({
        fileIds,
        customSections: customSections.map(t => ({ name: t.name, content: t.content }))
      });

      const content = response.data.content;
      setGeneratedContent(content);
      setTitle(content.title);
      setDescription(content.description);
      setTags(content.tags);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate listing content: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (data) => {
      const response = await listings.create(data);
      return response.data;
    },
    onSuccess: (data) => {
      alert(`Listing created successfully! View it on Etsy: ${data.listing.url}`);
      clearSelection();
      navigate('/dashboard');
    },
    onError: (error) => {
      alert('Failed to create listing: ' + error.message);
    }
  });

  const handleCreateListing = () => {
    if (!title || !description || !price) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    createListingMutation.mutate({
      fileIds: selectedMockups.map(m => m.id),
      title,
      description,
      price: parseFloat(price),
      tags
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Etsy Listing</h1>
          <p className="text-gray-600 mt-1">
            {selectedMockups.length} mockup{selectedMockups.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      </div>

      {/* Selected Mockups Preview */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Selected Mockups</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {selectedMockups.map((mockup) => (
            <div key={mockup.id} className="aspect-square rounded overflow-hidden">
              <img
                src={mockup.thumbnailLink}
                alt={mockup.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Generate Content Button */}
      {!generatedContent && (
        <div className="card text-center">
          <Sparkles className="mx-auto text-primary-600 mb-4" size={48} />
          <h2 className="text-xl font-semibold mb-2">Generate Listing Content with AI</h2>
          <p className="text-gray-600 mb-6">
            Our AI will analyze your mockup and create optimized listing content
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate Content</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Listing Form */}
      {generatedContent && (
        <div className="space-y-6">
          {/* Title */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">
                ({title.length}/140 characters)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.substring(0, 140))}
              className="input"
              placeholder="Enter listing title"
              maxLength={140}
            />
          </div>

          {/* Description */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[300px] font-mono text-sm"
              placeholder="Enter listing description"
            />
          </div>

          {/* Price */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign size={18} className="text-gray-400" />
              </div>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input pl-10"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags ({tags.length}/13)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
                >
                  <Tag size={14} />
                  <span>{tag}</span>
                  <button
                    onClick={() => setTags(tags.filter((_, i) => i !== index))}
                    className="ml-1 text-primary-900 hover:text-primary-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              className="input"
              placeholder="Add a tag (press Enter)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  e.preventDefault();
                  if (tags.length < 13) {
                    setTags([...tags, e.target.value.trim().toLowerCase()]);
                    e.target.value = '';
                  }
                }
              }}
            />
          </div>

          {/* Actions */}
          <div className="card bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Ready to create listing?</h3>
                <p className="text-sm text-gray-600">
                  This will create a draft listing on Etsy with your mockup download link
                </p>
              </div>
              <button
                onClick={handleCreateListing}
                disabled={createListingMutation.isPending}
                className="btn btn-primary flex items-center space-x-2"
              >
                {createListingMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Create Listing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
