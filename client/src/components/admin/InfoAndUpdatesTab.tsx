import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Info,
  FileText,
  Bell,
  Save,
  GripVertical
} from 'lucide-react';

interface InfoSection {
  id: number;
  title: string;
  content: string;
  orderIndex: number;
  updatedAt: string;
}

interface InfoAndUpdatesTabProps {
  trip?: any;
  onDataChange: () => void;
}

export default function InfoAndUpdatesTab({ 
  trip, 
  onDataChange 
}: InfoAndUpdatesTabProps) {
  const [infoSections, setInfoSections] = useState<InfoSection[]>([]);
  const [editingSection, setEditingSection] = useState<InfoSection | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');

  const addNewSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: InfoSection = {
      id: Date.now(),
      title: newSectionTitle,
      content: newSectionContent,
      orderIndex: infoSections.length,
      updatedAt: new Date().toISOString(),
    };

    setInfoSections(prev => [...prev, newSection]);
    setNewSectionTitle('');
    setNewSectionContent('');
    onDataChange();
  };

  const updateSection = (id: number, updates: Partial<InfoSection>) => {
    setInfoSections(prev => 
      prev.map(section => 
        section.id === id 
          ? { ...section, ...updates, updatedAt: new Date().toISOString() }
          : section
      )
    );
    onDataChange();
  };

  const deleteSection = (id: number) => {
    setInfoSections(prev => prev.filter(section => section.id !== id));
    onDataChange();
  };

  const saveSection = (section: InfoSection) => {
    updateSection(section.id, section);
    setEditingSection(null);
  };

  const predefinedSections = [
    { title: 'Embarkation Information', icon: '🚢' },
    { title: 'Dress Codes', icon: '👔' },
    { title: 'Dining Reservations', icon: '🍽️' },
    { title: 'Excursion Details', icon: '🗺️' },
    { title: 'Onboard Activities', icon: '🎯' },
    { title: 'WiFi & Communications', icon: '📱' },
    { title: 'Health & Safety', icon: '🏥' },
    { title: 'Disembarkation Info', icon: '🧳' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Information & Updates</h2>
          <p className="text-gray-600">Manage trip information and announcements</p>
        </div>
        <Button>
          <Bell className="w-4 h-4 mr-2" />
          Send Announcement
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add New Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Information Section</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Section title (e.g., Embarkation Information)"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Section content..."
                  value={newSectionContent}
                  onChange={(e) => setNewSectionContent(e.target.value)}
                  rows={4}
                />
              </div>
              <Button 
                onClick={addNewSection}
                disabled={!newSectionTitle.trim()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </CardContent>
          </Card>

          {/* Existing Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Information Sections</span>
                <Badge variant="secondary">{infoSections.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {infoSections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">No Information Sections</h3>
                    <p className="text-sm">Add sections to provide important cruise information</p>
                  </div>
                ) : (
                  infoSections.map(section => (
                    <div key={section.id} className="border rounded-lg p-4">
                      {editingSection?.id === section.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editingSection.title}
                            onChange={(e) => setEditingSection({
                              ...editingSection,
                              title: e.target.value
                            })}
                          />
                          <Textarea
                            value={editingSection.content}
                            onChange={(e) => setEditingSection({
                              ...editingSection,
                              content: e.target.value
                            })}
                            rows={6}
                          />
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => saveSection(editingSection)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingSection(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <h3 className="font-medium">{section.title}</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingSection(section)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteSection(section.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {section.content.length > 200 
                              ? `${section.content.substring(0, 200)}...`
                              : section.content
                            }
                          </p>
                          <div className="text-xs text-gray-500">
                            Last updated: {new Date(section.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-4">
          {/* Quick Add Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Add Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {predefinedSections.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setNewSectionTitle(template.title);
                      setNewSectionContent('');
                    }}
                  >
                    <span className="mr-2">{template.icon}</span>
                    {template.title}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
              {infoSections.length === 0 ? (
                <p className="text-sm text-gray-500">No recent updates</p>
              ) : (
                <div className="space-y-2">
                  {infoSections
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 3)
                    .map(section => (
                      <div key={section.id} className="text-sm">
                        <div className="font-medium truncate">{section.title}</div>
                        <div className="text-gray-500 text-xs">
                          {new Date(section.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Sections</span>
                <span className="font-medium">{infoSections.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Words</span>
                <span className="font-medium">
                  {infoSections.reduce((acc, section) => 
                    acc + section.content.split(' ').length, 0
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Update</span>
                <span className="font-medium">
                  {infoSections.length > 0 
                    ? new Date(Math.max(...infoSections.map(s => new Date(s.updatedAt).getTime()))).toLocaleDateString()
                    : 'Never'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}