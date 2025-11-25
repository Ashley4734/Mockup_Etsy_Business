import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, DollarSign, Tag, Save, Copy, Download, Check } from 'lucide-react';
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
  const [createdListing, setCreatedListing] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

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
      setCreatedListing(data.listing);
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

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleStartNew = () => {
    setCreatedListing(null);
    setGeneratedContent(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setTags([]);
    clearSelection();
    navigate('/dashboard');
  };

  // If listing is created, show the copyable format
  if (createdListing) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Listing Created!</h1>
          <button
            onClick={handleStartNew}
            className="btn btn-secondary"
          >
            Create Another
          </button>
        </div>

        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Check className="text-green-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Ready to Post!</h3>
              <p className="text-green-800 mt-1">
                Your listing content is ready. Copy each section below and paste into your Etsy listing.
                Download the PDF to upload as your digital download file.
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              Title ({createdListing.title.length}/140 characters)
            </label>
            <button
              onClick={() => copyToClipboard(createdListing.title, 'title')}
              className="btn btn-secondary btn-sm flex items-center space-x-2"
            >
              {copiedField === 'title' ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <p className="text-gray-900">{createdListing.title}</p>
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <label className="block text-sm font-semibold text-gray-700">Description</label>
            <button
              onClick={() => copyToClipboard(createdListing.description, 'description')}
              className="btn btn-secondary btn-sm flex items-center space-x-2"
            >
              {copiedField === 'description' ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{createdListing.description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <label className="block text-sm font-semibold text-gray-700">Price</label>
            <button
              onClick={() => copyToClipboard(createdListing.price.toString(), 'price')}
              className="btn btn-secondary btn-sm flex items-center space-x-2"
            >
              {copiedField === 'price' ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <p className="text-gray-900 text-xl font-semibold">${createdListing.price}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              Tags ({createdListing.tags.length}/13)
            </label>
            <button
              onClick={() => copyToClipboard(createdListing.tags.join(', '), 'tags')}
              className="btn btn-secondary btn-sm flex items-center space-x-2"
            >
              {copiedField === 'tags' ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <div className="flex flex-wrap gap-2">
              {createdListing.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* PDF Download */}
        <div className="card bg-primary-50 border-2 border-primary-200">
          <div className="flex items-start space-x-4">
            <Download className="text-primary-600 flex-shrink-0" size={32} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Digital Download File</h3>
              <p className="text-gray-700 mt-1 mb-4">
                Download this PDF and upload it to your Etsy listing as the digital download file.
                It contains instructions and Google Drive download links for your customers.
              </p>
              <a
                href={createdListing.pdfDownloadUrl}
                download
                className="btn btn-primary inline-flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Next Steps:</h3>
          <ol className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <span>Go to Etsy and start creating a new digital listing</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <span>Copy and paste the Title, Description, Price, and Tags from above</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <span>Upload your mockup image(s) from Google Drive as listing photos</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <span>Download and upload the PDF as the digital download file</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold mr-2">5.</span>
              <span>Set your listing type to "Digital" and publish!</span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Generate Listing Content</h1>
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
      {generatedContent && !createdListing && (
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
                <h3 className="font-semibold text-gray-900">Ready to finalize?</h3>
                <p className="text-sm text-gray-600">
                  This will generate your PDF download link and prepare the listing for copy/paste
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
                    <span>Finalize Listing</span>
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
