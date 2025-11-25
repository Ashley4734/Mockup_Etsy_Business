import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { templates as templatesApi } from '../services/api';

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    isDefault: false
  });

  // Fetch templates
  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await templatesApi.list();
      return response.data;
    }
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data) => templatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setIsCreating(false);
      setFormData({ name: '', content: '', isDefault: false });
    }
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => templatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setEditingId(null);
      setFormData({ name: '', content: '', isDefault: false });
    }
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      content: template.content,
      isDefault: template.is_default
    });
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', content: '', isDefault: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listing Templates</h1>
          <p className="text-gray-600 mt-1">
            Create reusable sections to include in your Etsy listings
          </p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>New Template</span>
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="card bg-primary-50 border-2 border-primary-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Template' : 'Create New Template'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Shipping Information, Usage Rights"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input min-h-[200px]"
                placeholder="Enter the content for this section..."
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700">
                Include by default in all new listings
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save size={18} />
                <span>{editingId ? 'Update' : 'Create'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        )}

        {data && data.templates && data.templates.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              No templates yet. Create your first template to reuse content across listings.
            </p>
          </div>
        )}

        {data && data.templates && data.templates.map((template) => (
          <div key={template.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  {template.is_default && (
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{template.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Created {new Date(template.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this template?')) {
                      deleteMutation.mutate(template.id);
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
