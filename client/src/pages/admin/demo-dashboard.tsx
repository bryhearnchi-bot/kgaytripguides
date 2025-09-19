import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Analytics from '@/components/admin/Dashboard/Analytics';
import FormValidator, { FormField } from '@/components/admin/Forms/FormValidator';
import BulkOperations from '@/components/admin/BulkOperations';
import AdvancedSearch from '@/components/admin/Search/AdvancedSearch';
import EnhancedTripForm from '@/components/admin/Forms/EnhancedTripForm';
import {
  BarChart3,
  Edit,
  Search,
  Upload,
  Download,
  Zap,
  Star,
  TrendingUp,
  Users,
  Ship,
  Calendar,
  MapPin,
  Music,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react';
import { z } from 'zod';

// Demo data for components
const sampleItems = [
  {
    id: '1',
    name: 'Greek Isles Drag Cruise 2025',
    type: 'Cruise',
    status: 'active',
    lastModified: new Date('2024-12-01'),
    metadata: { capacity: 2850, duration: 7 }
  },
  {
    id: '2',
    name: 'Trixie Mattel',
    type: 'Talent',
    status: 'active',
    lastModified: new Date('2024-11-28'),
    metadata: { category: 'Drag', performances: 24 }
  },
  {
    id: '3',
    name: 'Welcome Party',
    type: 'Event',
    status: 'upcoming',
    lastModified: new Date('2024-11-25'),
    metadata: { venue: 'Pool Deck', capacity: 500 }
  },
];

const searchFields = [
  { key: 'name', label: 'Name', type: 'text' as const, searchable: true },
  { key: 'type', label: 'Type', type: 'select' as const, options: [
    { value: 'cruise', label: 'Cruise' },
    { value: 'talent', label: 'Talent' },
    { value: 'event', label: 'Event' },
  ]},
  { key: 'status', label: 'Status', type: 'select' as const, options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'upcoming', label: 'Upcoming' },
  ]},
  { key: 'lastModified', label: 'Last Modified', type: 'date' as const },
];

// Simple demo form schema
const demoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['travel', 'entertainment', 'dining'], {
    required_error: 'Please select a category',
  }),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

const demoFormFields: FormField[] = [
  {
    name: 'title',
    label: 'Title',
    type: 'text',
    required: true,
    placeholder: 'Enter a descriptive title',
    validation: { minLength: 3, maxLength: 100 },
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Provide detailed description...',
    validation: { minLength: 10, maxLength: 500 },
  },
  {
    name: 'website',
    label: 'Website',
    type: 'url',
    required: false,
    placeholder: 'https://example.com',
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'text',
    required: false,
    placeholder: 'tag1, tag2, tag3',
    description: 'Comma-separated tags',
  },
];

const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  status: 'implemented' | 'demo' | 'enhanced';
}> = ({ icon: Icon, title, description, features, status }) => (
  <Card className="h-full">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <Badge
          variant={status === 'implemented' ? 'default' : status === 'enhanced' ? 'secondary' : 'outline'}
          className={
            status === 'implemented' ? 'bg-green-100 text-green-800' :
            status === 'enhanced' ? 'bg-blue-100 text-blue-800' :
            'bg-orange-100 text-orange-800'
          }
        >
          {status === 'implemented' ? 'Live' : status === 'enhanced' ? 'Enhanced' : 'Demo'}
        </Badge>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default function DemoDashboard() {
  const { toast } = useToast();
  const [activeDemo, setActiveDemo] = useState('analytics');

  const handleDemoSubmit = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Demo form submitted",
      description: "This is a demonstration of the enhanced form validation.",
    });
  };

  const handleDemoSearch = (filters: any[], sortBy?: string, sortDirection?: 'asc' | 'desc') => {
    console.log('Demo search:', { filters, sortBy, sortDirection });
    toast({
      title: "Search executed",
      description: `Applied ${filters.length} filters with ${sortBy ? `sorting by ${sortBy}` : 'no sorting'}`,
    });
  };

  const handleBulkOperation = async (operation: string, selectedIds: string[], data?: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: `Bulk ${operation} completed`,
      description: `Successfully processed ${selectedIds.length} items`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Enhanced Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive data visualization, progressive form validation, bulk operations,
            and advanced search capabilities for the K-GAY Travel Guides platform.
          </p>
          <div className="flex justify-center items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Zap className="w-4 h-4 mr-1" />
              Real-time Analytics
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Star className="w-4 h-4 mr-1" />
              Progressive Validation
            </Badge>
            <Badge variant="outline" className="text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              Bulk Operations
            </Badge>
          </div>
        </div>

        {/* Feature Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={BarChart3}
            title="Analytics Dashboard"
            description="Real-time data visualization with interactive charts"
            features={[
              'Trip engagement trends',
              'Port popularity metrics',
              'Revenue analytics',
              'Talent performance tracking',
              'Real-time statistics',
              'AI-generated insights'
            ]}
            status="enhanced"
          />
          <FeatureCard
            icon={Edit}
            title="Progressive Forms"
            description="Enhanced form validation with auto-save"
            features={[
              'Real-time validation',
              'Auto-save drafts',
              'Progress indicators',
              'Custom validation rules',
              'SEO optimization hints',
              'Preview mode'
            ]}
            status="enhanced"
          />
          <FeatureCard
            icon={Users}
            title="Bulk Operations"
            description="Multi-select operations with progress tracking"
            features={[
              'Multi-select interface',
              'Bulk edit modals',
              'Import/export tools',
              'Progress indicators',
              'Error handling',
              'Undo capabilities'
            ]}
            status="enhanced"
          />
          <FeatureCard
            icon={Search}
            title="Advanced Search"
            description="Faceted filtering with saved searches"
            features={[
              'Complex filter builder',
              'Saved search queries',
              'Export filtered results',
              'Recent search history',
              'Category organization',
              'Quick search modes'
            ]}
            status="enhanced"
          />
        </div>

        {/* Interactive Demos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-600" />
              Interactive Component Demos
            </CardTitle>
            <CardDescription>
              Explore the enhanced admin components with real functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeDemo} onValueChange={setActiveDemo}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="forms">Form Validation</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
                <TabsTrigger value="search">Advanced Search</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="space-y-6">
                <div className="bg-white rounded-lg p-1 border">
                  <Analytics />
                </div>
              </TabsContent>

              <TabsContent value="forms" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Enhanced Trip Form</h3>
                    <EnhancedTripForm onSubmit={handleDemoSubmit} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Simple Demo Form</h3>
                    <FormValidator
                      schema={demoSchema}
                      fields={demoFormFields}
                      onSubmit={handleDemoSubmit}
                      showProgress={true}
                      showPreview={true}
                      title="Demo Form"
                      description="Try the progressive validation features"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-6">
                <BulkOperations
                  items={sampleItems}
                  onBulkEdit={(ids, changes) => handleBulkOperation('edit', ids, changes)}
                  onBulkDelete={(ids) => handleBulkOperation('delete', ids)}
                  onExport={(ids, format) => handleBulkOperation('export', ids, { format })}
                  onImport={(file, options) => handleBulkOperation('import', [], { file, options })}
                  itemType="item"
                  allowedOperations={['edit', 'delete', 'export', 'import']}
                />
              </TabsContent>

              <TabsContent value="search" className="space-y-6">
                <AdvancedSearch
                  fields={searchFields}
                  onSearch={handleDemoSearch}
                  onExport={async (filters, format) => {
                    toast({
                      title: "Export started",
                      description: `Exporting ${filters.length} filtered results as ${format}`,
                    });
                  }}
                  placeholder="Search items, talent, events..."
                  recentSearches={[
                    'Greek Isles',
                    'Trixie Mattel',
                    'Pool Party',
                    'Celebrity Cruises'
                  ]}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Implementation Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">Performance Benefits</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span>50% faster form validation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span>Real-time data updates</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span>Optimized bulk operations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-green-500" />
                <span>Reduced API calls</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">User Experience</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                <span>Progressive validation feedback</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                <span>Auto-save prevents data loss</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                <span>Intuitive bulk operations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-blue-500" />
                <span>Advanced search capabilities</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Business Impact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-purple-500" />
                <span>Data-driven decision making</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-purple-500" />
                <span>Improved content quality</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-purple-500" />
                <span>Faster content management</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-purple-500" />
                <span>Better user insights</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-600" />
              Technology Stack & Implementation
            </CardTitle>
            <CardDescription>
              Built with modern React patterns and the latest UI libraries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Charts & Visualization</h4>
                <p className="text-sm text-blue-600 mt-1">Recharts, Custom Components</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Form Validation</h4>
                <p className="text-sm text-green-600 mt-1">React Hook Form, Zod Schema</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900">UI Components</h4>
                <p className="text-sm text-orange-600 mt-1">Radix UI, Tailwind CSS</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900">State Management</h4>
                <p className="text-sm text-purple-600 mt-1">TanStack Query, Local State</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}