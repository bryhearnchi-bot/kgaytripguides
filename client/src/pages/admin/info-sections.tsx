import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Info,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  FileText,
  Utensils,
  Shirt,
  Check,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Star
} from 'lucide-react';

interface InfoSection {
  id: number;
  title: string;
  content: string;
  category: string;
  isTemplate: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface InfoSectionFormData {
  title: string;
  content: string;
  category: string;
  isTemplate: boolean;
}

const CATEGORIES = [
  { value: 'dining', label: 'Dining Information', icon: Utensils, color: 'bg-orange-500' },
  { value: 'dress_code', label: 'Dress Codes', icon: Shirt, color: 'bg-purple-500' },
  { value: 'whats_included', label: "What's Included", icon: Check, color: 'bg-green-500' },
  { value: 'important_notices', label: 'Important Notices', icon: AlertCircle, color: 'bg-red-500' },
  { value: 'tips_recommendations', label: 'Tips & Recommendations', icon: Lightbulb, color: 'bg-yellow-500' },
  { value: 'general_info', label: 'General Information', icon: BookOpen, color: 'bg-blue-500' },
];

const PREDEFINED_TEMPLATES = {
  dining: [
    {
      title: 'Main Dining Rooms',
      content: 'Our main dining rooms offer a sophisticated dining experience with multi-course meals featuring international cuisine. Dress code: Smart casual for breakfast and lunch, formal for dinner. Reservations recommended for specialty restaurants.'
    },
    {
      title: 'Casual Dining Options',
      content: 'Enjoy casual dining at our buffet, poolside grill, and grab-and-go stations. Available throughout the day with varied menus including healthy options, international dishes, and comfort food favorites.'
    },
    {
      title: 'Specialty Restaurants',
      content: 'Experience our collection of specialty restaurants featuring cuisines from around the world. Additional charges apply. Advance reservations highly recommended as these venues fill up quickly.'
    }
  ],
  dress_code: [
    {
      title: 'Casual Dress Code',
      content: 'Appropriate for most shipboard activities. Think vacation comfort: shorts, t-shirts, sundresses, sandals, and swimwear (pool areas only). Not permitted in main dining rooms for dinner.'
    },
    {
      title: 'Smart Casual',
      content: 'Elevated casual wear perfect for main dining rooms and most evening activities. Collared shirts, blouses, dress pants, skirts, casual dresses. No shorts, flip-flops, or tank tops.'
    },
    {
      title: 'Formal Night',
      content: 'Elegant evening wear for special dining experiences and events. Suits, cocktail dresses, evening gowns encouraged. Formal night photos available with professional photographers.'
    }
  ],
  whats_included: [
    {
      title: 'Accommodations',
      content: 'Your stateroom accommodation for the duration of the cruise, including daily housekeeping service, fresh linens, and room amenities.'
    },
    {
      title: 'Meals & Dining',
      content: 'All main dining room meals, buffet dining, room service (delivery charges may apply), and select casual dining venues. Specialty restaurants available for additional charge.'
    },
    {
      title: 'Entertainment & Activities',
      content: 'Broadway-style shows, live music, comedy acts, deck parties, fitness center access, pools, and most onboard activities and facilities.'
    }
  ],
  important_notices: [
    {
      title: 'Documentation Requirements',
      content: 'Valid passport required for all guests. Some itineraries may accept other forms of identification - check specific requirements. Ensure documents are valid for at least 6 months beyond travel date.'
    },
    {
      title: 'Health & Safety',
      content: 'All guests must complete health screening prior to boarding. Guests feeling unwell will not be permitted to board. Follow all posted health and safety guidelines throughout your cruise.'
    },
    {
      title: 'Prohibited Items',
      content: 'Certain items are prohibited onboard for safety and security reasons. Review the complete list before packing. Security screening is conducted prior to boarding.'
    }
  ],
  tips_recommendations: [
    {
      title: 'Booking Shore Excursions',
      content: 'Book shore excursions early for best selection and guaranteed return to ship. Independent exploration is possible but ensure you return well before departure time as the ship will not wait.'
    },
    {
      title: 'Onboard Spending',
      content: 'Budget for gratuities, beverages, specialty dining, spa services, and shore excursions. Consider purchasing beverage packages and WiFi packages for better value.'
    },
    {
      title: 'Packing Essentials',
      content: 'Pack formal wear for special nights, comfortable walking shoes for shore excursions, sun protection, and any necessary medications in carry-on luggage.'
    }
  ]
};

export default function InfoSectionsManagement() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<InfoSection | null>(null);
  const [formData, setFormData] = useState<InfoSectionFormData>({
    title: '',
    content: '',
    category: 'general_info',
    isTemplate: true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch info sections
  const { data: sections = [], isLoading: sectionsLoading, error: sectionsError } = useQuery<InfoSection[]>({
    queryKey: ['admin-info-sections'],
    queryFn: async () => {
      const response = await fetch('/api/admin/info-sections', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch info sections');
      }
      return response.json();
    },
  });

  // Create/Update section mutation
  const saveSection = useMutation({
    mutationFn: async (data: InfoSectionFormData) => {
      const url = editingSection ? `/api/admin/info-sections/${editingSection.id}` : '/api/admin/info-sections';
      const method = editingSection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to save section');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Info section ${editingSection ? 'updated' : 'created'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-info-sections'] });
      closeSectionModal();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${editingSection ? 'update' : 'create'} section`,
        variant: 'destructive',
      });
    },
  });

  // Delete section mutation
  const deleteSection = useMutation({
    mutationFn: async (sectionId: number) => {
      const response = await fetch(`/api/admin/info-sections/${sectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete section');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Info section deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-info-sections'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete section',
        variant: 'destructive',
      });
    },
  });

  // Duplicate section mutation
  const duplicateSection = useMutation({
    mutationFn: async (section: InfoSection) => {
      const data = {
        title: `${section.title} (Copy)`,
        content: section.content,
        category: section.category,
        isTemplate: section.isTemplate,
      };

      const response = await fetch('/api/admin/info-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate section');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Info section duplicated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-info-sections'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to duplicate section',
        variant: 'destructive',
      });
    },
  });

  const openSectionModal = (section?: InfoSection) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        title: section.title,
        content: section.content,
        category: section.category,
        isTemplate: section.isTemplate,
      });
    } else {
      setEditingSection(null);
      setFormData({
        title: '',
        content: '',
        category: 'general_info',
        isTemplate: true,
      });
    }
    setSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setSectionModalOpen(false);
    setEditingSection(null);
  };

  const handleInputChange = (field: keyof InfoSectionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Content is required',
        variant: 'destructive',
      });
      return;
    }

    saveSection.mutate(formData);
  };

  const createFromTemplate = (template: any) => {
    setFormData({
      title: template.title,
      content: template.content,
      category: activeTab === 'all' ? 'general_info' : activeTab,
      isTemplate: true,
    });
    setSectionModalOpen(true);
  };

  const getCategoryData = (category: string) => {
    return CATEGORIES.find(cat => cat.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const filteredSections = sections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || section.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const sectionsByCategory = CATEGORIES.map(category => ({
    ...category,
    sections: filteredSections.filter(section => section.category === category.value),
    count: sections.filter(section => section.category === category.value).length
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Info Sections Management</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage reusable information sections for cruise guides</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => openSectionModal()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>

        {/* Search and Tabs */}
        <Card>
          <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search sections by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
                  <TabsTrigger value="all" className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span className="hidden sm:inline">All ({sections.length})</span>
                    <span className="sm:hidden">All</span>
                  </TabsTrigger>
                  {CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const count = sections.filter(s => s.category === category.value).length;
                    return (
                      <TabsTrigger key={category.value} value={category.value} className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{category.label.split(' ')[0]} ({count})</span>
                        <span className="sm:hidden">({count})</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

        {/* Content */}
        {sectionsLoading ? (
          <div className="text-center py-8">
            <Info className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-600" />
            <p>Loading info sections...</p>
          </div>
        ) : sectionsError ? (
          <div className="text-center py-8 text-red-600">
            <p>Error loading sections: {sectionsError.message}</p>
          </div>
          ) : activeTab === 'all' ? (
            /* All Sections View */
            <div className="space-y-6">
              {sectionsByCategory.map((category) => (
                <Card key={category.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${category.color}`} />
                      <category.icon className="w-5 h-5" />
                      <span>{category.label}</span>
                      <Badge variant="secondary">{category.count}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {category.sections.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <category.icon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No sections in this category yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setActiveTab(category.value);
                          }}
                        >
                          Add First Section
                        </Button>
                      </div>
                    ) : (
                      <InfoSectionsTable
                        sections={category.sections}
                        onEdit={openSectionModal}
                        onDuplicate={duplicateSection}
                        onDelete={deleteSection}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Category-specific View */
            <div className="space-y-6">
              {/* Templates for this category */}
              {PREDEFINED_TEMPLATES[activeTab] && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <span>Quick Start Templates</span>
                    </CardTitle>
                    <CardDescription>
                      Click on any template below to create a new section based on it
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PREDEFINED_TEMPLATES[activeTab].map((template, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2 border-yellow-200 bg-yellow-50"
                          onClick={() => createFromTemplate(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-2">
                              <Plus className="w-4 h-4 text-yellow-600 mt-1" />
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{template.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-3">
                                  {template.content}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {React.createElement(getCategoryData(activeTab).icon, { className: "w-5 h-5" })}
                    <span>{getCategoryData(activeTab).label}</span>
                    <Badge variant="secondary">{filteredSections.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredSections.length === 0 ? (
                    <div className="text-center py-12">
                      {React.createElement(getCategoryData(activeTab).icon, { className: "w-12 h-12 mx-auto mb-4 text-gray-400" })}
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No sections found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your search terms.' : `Create your first ${getCategoryData(activeTab).label.toLowerCase()} section.`}
                      </p>
                      {!searchTerm && (
                        <Button onClick={() => openSectionModal()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Section
                        </Button>
                      )}
                    </div>
                  ) : (
                    <InfoSectionsTable
                      sections={filteredSections}
                      onEdit={openSectionModal}
                      onDuplicate={duplicateSection}
                      onDelete={deleteSection}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

      {/* Section Modal */}
      <Dialog open={sectionModalOpen} onOpenChange={(open) => !open && closeSectionModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Edit Info Section' : 'Add New Info Section'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter section title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          <category.icon className="w-4 h-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter the content for this section..."
                rows={8}
                className="resize-none"
              />
              <p className="text-sm text-gray-500">
                You can use basic formatting. This content will be displayed in cruise guides.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isTemplate"
                checked={formData.isTemplate}
                onChange={(e) => handleInputChange('isTemplate', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="isTemplate">Save as reusable template</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={closeSectionModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveSection.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {saveSection.isPending ? 'Saving...' : (editingSection ? 'Update Section' : 'Create Section')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Info Sections Table Component
interface InfoSectionsTableProps {
  sections: InfoSection[];
  onEdit: (section: InfoSection) => void;
  onDuplicate: any;
  onDelete: any;
}

function InfoSectionsTable({
  sections,
  onEdit,
  onDuplicate,
  onDelete
}: InfoSectionsTableProps) {
  const getCategoryData = (category: string) => {
    return CATEGORIES.find(cat => cat.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Section Title</TableHead>
            <TableHead>Content Preview</TableHead>
            <TableHead>Type/Category</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => {
            const categoryData = getCategoryData(section.category);
            const CategoryIcon = categoryData.icon;

            return (
              <TableRow key={section.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium ${categoryData.color}`}>
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{section.title}</div>
                      {section.isTemplate && (
                        <Badge variant="outline" className="text-xs mt-1">Template</Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600 max-w-md">
                    {truncateContent(section.content)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${categoryData.color}`} />
                    <span className="text-sm font-medium">{categoryData.label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    Used {section.usageCount} times
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDuplicate.mutate(section)}
                      title="Duplicate Section"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(section)}
                      title="Edit Section"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Section</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{section.title}"?
                            This action cannot be undone and will remove this section from all trips using it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete.mutate(section.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}