import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Upload, 
  Link, 
  FileText, 
  Image,
  X,
  Download,
  Eye,
  Check,
  Loader2
} from 'lucide-react';

interface AiAssistPanelProps {
  cruise?: any;
  activeTab: string;
  onClose: () => void;
}

export default function AiAssistPanel({ 
  cruise, 
  activeTab, 
  onClose 
}: AiAssistPanelProps) {
  const [aiMode, setAiMode] = useState<'extract' | 'generate'>('extract');
  const [extractUrl, setExtractUrl] = useState('');
  const [extractFile, setExtractFile] = useState<File | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiJobs, setAiJobs] = useState([]);

  const handleExtractFromUrl = async () => {
    if (!extractUrl.trim()) return;
    
    setIsProcessing(true);
    // TODO: Implement AI extraction from URL
    console.log('Extracting from URL:', extractUrl);
    setTimeout(() => {
      setIsProcessing(false);
      setExtractUrl('');
    }, 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExtractFile(file);
    }
  };

  const handleExtractFromFile = async () => {
    if (!extractFile) return;
    
    setIsProcessing(true);
    // TODO: Implement AI extraction from file
    console.log('Extracting from file:', extractFile.name);
    setTimeout(() => {
      setIsProcessing(false);
      setExtractFile(null);
    }, 3000);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsProcessing(true);
    // TODO: Implement AI image generation
    console.log('Generating image:', imagePrompt);
    setTimeout(() => {
      setIsProcessing(false);
      setImagePrompt('');
    }, 3000);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>AI Assistant</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={aiMode === 'extract' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAiMode('extract')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Extract Data
          </Button>
          <Button
            variant={aiMode === 'generate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAiMode('generate')}
          >
            <Image className="w-4 h-4 mr-2" />
            Generate Images
          </Button>
        </div>

        <Separator />

        {/* Extract Data Mode */}
        {aiMode === 'extract' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Extract from Web Link</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Paste URL here..."
                  value={extractUrl}
                  onChange={(e) => setExtractUrl(e.target.value)}
                />
                <Button 
                  onClick={handleExtractFromUrl}
                  disabled={!extractUrl.trim() || isProcessing}
                  size="sm"
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4 mr-2" />
                  )}
                  Extract from URL
                </Button>
              </div>
            </div>

            <div className="text-center text-gray-400">
              <span>OR</span>
            </div>

            <div>
              <h3 className="font-medium mb-2">Upload PDF/Document</h3>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full cursor-pointer"
                    asChild
                  >
                    <div>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </div>
                  </Button>
                </label>
                {extractFile && (
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    {extractFile.name}
                    <Button 
                      onClick={handleExtractFromFile}
                      disabled={isProcessing}
                      size="sm"
                      className="w-full mt-2"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      Extract Data
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Extraction Targets */}
            <div>
              <h4 className="text-sm font-medium mb-2">What to extract:</h4>
              <div className="space-y-2">
                <Badge variant="outline" className="mr-2">
                  {activeTab === 'setup' && 'Itinerary & Ports'}
                  {activeTab === 'events' && 'Events & Artists'}
                  {activeTab === 'info' && 'Information & Updates'}
                </Badge>
                <p className="text-xs text-gray-600">
                  AI will automatically detect and extract relevant information for the {activeTab} tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Images Mode */}
        {aiMode === 'generate' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Generate Image</h3>
              <div className="space-y-2">
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || isProcessing}
                  size="sm"
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Image
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Quick prompts:</h4>
              <div className="space-y-1">
                {[
                  'Cruise ship at sunset',
                  'Greek island port with white buildings',
                  'Pool party deck scene',
                  'Elegant dining room',
                  'Dance party with lights'
                ].map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setImagePrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* AI Jobs/Results */}
        <div>
          <h3 className="font-medium mb-2">Recent AI Jobs</h3>
          {aiJobs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No AI jobs yet</p>
              <p className="text-xs">Start by extracting data or generating images</p>
            </div>
          ) : (
            <div className="space-y-2">
              {aiJobs.map((job: any, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{job.type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">{job.description}</p>
                  {job.status === 'completed' && (
                    <div className="flex space-x-1 mt-2">
                      <Button variant="outline" size="sm" className="text-xs h-6">
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-6">
                        <Check className="w-3 h-3 mr-1" />
                        Apply
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}