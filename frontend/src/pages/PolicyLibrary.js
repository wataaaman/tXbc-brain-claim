import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Search, Book, Scale, FileText, Shield, Users, HelpCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const categoryIcons = {
  'Injuries': Scale,
  'Administration': Shield,
  'Appeals': HelpCircle,
  'Benefits': FileText
};

export default function PolicyLibrary() {
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    filterPolicies();
  }, [searchQuery, selectedCategory, policies]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/policies`);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
        setFilteredPolicies(data);
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPolicies = () => {
    let result = policies;

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.keywords.some(k => k.toLowerCase().includes(query)) ||
        p.policy_number.toLowerCase().includes(query)
      );
    }

    setFilteredPolicies(result);
  };

  const categories = ['all', ...new Set(policies.map(p => p.category))];

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[Manrope] mb-2">
            WCB Policy Library
          </h1>
          <p className="text-lg text-muted-foreground">
            Search and explore Alberta WCB policies for traumatic brain injury claims
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search policies, keywords, or policy numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
              data-testid="policy-search-input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="rounded-full capitalize"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`filter-${cat}`}
              >
                {cat === 'all' ? 'All Policies' : cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Policy List */}
          <div className="lg:col-span-1">
            <Card className="card-warm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Policies ({filteredPolicies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading policies...
                    </div>
                  ) : filteredPolicies.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No policies found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPolicies.map((policy) => {
                        const Icon = categoryIcons[policy.category] || FileText;
                        return (
                          <button
                            key={policy.policy_id}
                            onClick={() => setSelectedPolicy(policy)}
                            className={`w-full text-left p-3 rounded-xl transition-colors ${
                              selectedPolicy?.policy_id === policy.policy_id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                            data-testid={`policy-item-${policy.policy_id}`}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                              <div>
                                <p className="font-medium text-sm">
                                  Policy {policy.policy_number}
                                </p>
                                <p className={`text-xs ${
                                  selectedPolicy?.policy_id === policy.policy_id
                                    ? 'text-primary-foreground/80'
                                    : 'text-muted-foreground'
                                }`}>
                                  {policy.title}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Policy Content */}
          <div className="lg:col-span-2">
            {selectedPolicy ? (
              <Card className="card-warm">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2 rounded-full">
                        Policy {selectedPolicy.policy_number}
                      </Badge>
                      <CardTitle className="text-2xl font-[Manrope]">
                        {selectedPolicy.title}
                      </CardTitle>
                      <CardDescription>
                        Category: {selectedPolicy.category} | Effective: {selectedPolicy.effective_date}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedPolicy.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="rounded-full">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <ScrollArea className="h-[calc(100vh-24rem)]">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-[Public_Sans] text-base leading-relaxed bg-transparent p-0 border-none">
                        {selectedPolicy.content}
                      </pre>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-warm h-full flex items-center justify-center">
                <CardContent className="text-center py-16">
                  <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Policy</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Choose a policy from the list to view its full content and details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold font-[Manrope] mb-4">Quick Reference</h2>
          <Accordion type="single" collapsible className="space-y-2">
            <AccordionItem value="tbi" className="card-warm border-none rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline" data-testid="tbi-accordion">
                <span className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  TBI Classification (Policy 03 01)
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-green-500/10 rounded-xl">
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Group 1 - Mild TBI</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Brief loss of consciousness (&lt;30 min)</li>
                      <li>• Transient confusion</li>
                      <li>• Symptoms resolve quickly</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-xl">
                    <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-2">Group 2 - Moderate/Severe TBI</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Longer loss of consciousness (&gt;30 min)</li>
                      <li>• Persistent neurological deficits</li>
                      <li>• Imaging confirmed pathology</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="access" className="card-warm border-none rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline" data-testid="access-accordion">
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Your Rights (Policy 01 02)
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pt-2">
                Under Policy 01 02 (Access & Privacy), you are entitled to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Full copy of all personal information in your claim file</li>
                  <li>Medical records, financial records, and administrative records</li>
                  <li>Telephone recordings of conversations with WCB staff</li>
                  <li>Internal notes and case management memos</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="appeals" className="card-warm border-none rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline" data-testid="appeals-accordion">
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Appeals Process (Policy 01 08)
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pt-2">
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Internal Grievance:</strong> Submit complaint to WCB Complaints & Grievances Unit</li>
                  <li><strong>DRDRB Review:</strong> If internal grievance rejected (30-day deadline)</li>
                  <li><strong>Appeals Commission:</strong> Final administrative avenue (90-day deadline)</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </AppLayout>
  );
}
