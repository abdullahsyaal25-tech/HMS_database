import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import { LabStatusBadge } from '@/components/laboratory';
import { LabTestResultPrintModal } from '@/components/laboratory/LabTestResultPrintModal';
import {
  ArrowLeft,
  Edit,
  FileCheck,
  Printer,
  Mail,
  Download,
  User,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Beaker,
  Info,
  Flag,
  Activity,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface Patient {
  id: number;
  patient_id: string;
  first_name: string | null;
  father_name: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  address: string | null;
}

interface LabTest {
  id: number;
  test_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  normal_values: string | null;
  category: string;
  sample_type?: string | null;
}

interface UserInfo {
  id: number;
  name: string;
  signature?: string;
}

interface ResultParameter {
  parameter_id: string;
  name: string;
  value: string;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  status: 'normal' | 'abnormal' | 'critical';
  notes: string;
}

interface RelatedResult {
  id: number;
  result_id: string;
  performed_at: string;
  status: string;
  hasAbnormal: boolean;
}

interface LabTestResult {
  id: number;
  result_id: string;
  patient_id: number;
  lab_test_id: number;
  performed_by: number;
  performed_at: string;
  verified_at: string | null;
  verified_by: number | null;
  results: string;
  status: 'pending' | 'completed' | 'verified';
  notes: string | null;
  abnormal_flags: string | null;
  interpretation: string | null;
  created_at: string;
  updated_at: string;
  patient: Patient;
  labTest: LabTest;
  performedBy: UserInfo;
  verifiedBy?: UserInfo;
  relatedResults?: RelatedResult[];
  previousResult?: {
    performed_at: string;
    results: ResultParameter[];
  };
  sample_collection_time?: string;
}

interface LabTestResultShowProps {
  labTestResult: LabTestResult;
  canEdit: boolean;
  canPrint: boolean;
  canEmail: boolean;
}

export default function LabTestResultShow({
  labTestResult,
  canEdit,
  canPrint,
  canEmail,
}: LabTestResultShowProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const parsedResults = useMemo(() => {
    try {
      // Handle both string and already-parsed results
      const resultsData = typeof labTestResult.results === 'string' 
        ? JSON.parse(labTestResult.results) 
        : labTestResult.results;
      
      // Handle array format (from some legacy data)
      if (Array.isArray(resultsData)) {
        return resultsData.map((item: ResultParameter) => ({
          parameter_id: item.parameter_id || item.name,
          name: item.name || item.parameter_id,
          value: String(item.value),
          unit: item.unit || '',
          referenceMin: item.referenceMin || 0,
          referenceMax: item.referenceMax || 0,
          status: item.status || 'normal',
          notes: item.notes || '',
        }));
      }
      
      // Handle object format { parameter_id: { value, unit, status, notes } }
      return Object.entries(resultsData).map(([key, value]: [string, unknown]) => {
        const val = value as { value: number | string; unit: string; status: string; notes?: string; name?: string };
        return {
          parameter_id: key,
          name: val.name || key,
          value: String(val.value ?? ''),
          unit: val.unit || '',
          referenceMin: 0,
          referenceMax: 0,
          status: (val.status as 'normal' | 'abnormal' | 'critical') || 'normal',
          notes: val.notes || '',
        };
      });
    } catch (e) {
      console.error('Failed to parse results:', e);
      return [];
    }
  }, [labTestResult.results]);

  const previousResults = useMemo(() => {
    if (!labTestResult.previousResult) return {};
    const prev = labTestResult.previousResult.results;
    if (!Array.isArray(prev)) return {};
    const map: Record<string, number> = {};
    prev.forEach(p => {
      map[p.parameter_id] = parseFloat(p.value);
    });
    return map;
  }, [labTestResult.previousResult]);

  const abnormalCount = parsedResults.filter(r => r.status === 'abnormal' || r.status === 'critical').length;
  const criticalCount = parsedResults.filter(r => r.status === 'critical').length;
  const normalCount = parsedResults.filter(r => r.status === 'normal').length;

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.open(`/laboratory/lab-test-results/${labTestResult.id}/pdf`, '_blank');
  };

  const getTrend = (paramId: string, currentValue: string): 'up' | 'down' | 'stable' | null => {
    const prevValue = previousResults[paramId];
    if (!prevValue || !currentValue) return null;
    const current = parseFloat(currentValue);
    if (isNaN(current)) return null;

    const diff = current - prevValue;
    const percentChange = (diff / prevValue) * 100;

    if (Math.abs(percentChange) < 5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const isValueInRange = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  };

  const getStatusIcon = (status: 'normal' | 'abnormal' | 'critical') => {
    switch (status) {
      case 'normal':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'abnormal':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBgColor = (status: 'normal' | 'abnormal' | 'critical') => {
    switch (status) {
      case 'normal':
        return 'bg-green-50 border-green-200';
      case 'abnormal':
        return 'bg-orange-50 border-orange-200';
      case 'critical':
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title={`Lab Test Result: ${labTestResult.result_id}`} />
          <p className="text-muted-foreground mt-1">
            Full laboratory report with parameter breakdown
          </p>
        </div>
      }
    >
      <Head title={`Lab Test Result - ${labTestResult.result_id}`} />

      <div className="space-y-6 print:space-y-0 lab-test-result-print">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block print-header">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                <FlaskConical className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HMS Laboratory</h1>
                <p className="text-sm text-gray-600">Comprehensive Diagnostic Services</p>
                <p className="text-xs text-gray-500 mt-1">Phone: +1 (555) 123-4567 | Email: lab@hms.com</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">LABORATORY REPORT</p>
              <p className="text-sm font-mono text-gray-600 mt-1">{labTestResult.result_id}</p>
              <p className="text-xs text-gray-500 mt-1">Report Date: {formatDateShort(labTestResult.performed_at)}</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <Heading title={`Lab Test Result: ${labTestResult.result_id}`} />
            <p className="text-muted-foreground mt-1">
              Full laboratory report with parameter breakdown
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Link href={`/laboratory/lab-test-results/${labTestResult.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}

            {canPrint && (
              <Button variant="outline" onClick={() => setIsPrintModalOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}

            {canEmail && (
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Email Lab Report</DialogTitle>
                    <DialogDescription>
                      Send this lab report to the patient or physician.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Recipient Email</Label>
                      <Input type="email" placeholder="Enter email address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Message (Optional)</Label>
                      <Textarea placeholder="Add a message..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setEmailDialogOpen(false)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Report
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>

            <Link href="/laboratory/lab-test-results">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Critical Values Alert */}
        {criticalCount > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 text-lg">Critical Values Detected</AlertTitle>
            <AlertDescription className="text-red-700">
              This report contains {criticalCount} critical value(s) that require immediate physician attention.
              Please review carefully and follow up as necessary.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1 print:block">
          {/* Patient & Test Info - Print Layout */}
          <div className="hidden print:grid print:grid-cols-2 print:gap-6 print:mb-6 print:bg-gray-50 print:p-4 print:rounded-lg">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-3 border-b pb-1">Patient Information</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-semibold">Name:</span> {labTestResult.patient?.first_name} {labTestResult.patient?.father_name}</p>
                <p className="text-sm"><span className="font-semibold">Patient ID:</span> {labTestResult.patient?.patient_id}</p>
                <p className="text-sm"><span className="font-semibold">Age/Gender:</span> {labTestResult.patient?.age} years / {labTestResult.patient?.gender}</p>
                <p className="text-sm"><span className="font-semibold">Blood Group:</span> {labTestResult.patient?.blood_group || 'N/A'}</p>
                {labTestResult.patient?.phone && (
                  <p className="text-sm"><span className="font-semibold">Phone:</span> {labTestResult.patient?.phone}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-3 border-b pb-1">Test Information</h3>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-semibold">Test Name:</span> {labTestResult.labTest?.name}</p>
                <p className="text-sm"><span className="font-semibold">Category:</span> {labTestResult.labTest?.category}</p>
                <p className="text-sm"><span className="font-semibold">Sample Type:</span> {labTestResult.labTest?.sample_type || 'N/A'}</p>
                <p className="text-sm"><span className="font-semibold">Collected:</span> {formatDateShort(labTestResult.performed_at)}</p>
                <p className="text-sm"><span className="font-semibold">Reported:</span> {formatDateShort(labTestResult.performed_at)}</p>
              </div>
            </div>
          </div>

          {/* Left Column - Patient & Test Info */}
          <div className="lg:col-span-1 space-y-6 print:hidden">
            {/* Patient Information Card */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 print:hidden">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(labTestResult.patient?.first_name, labTestResult.patient?.father_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">
                      {labTestResult.patient?.first_name} {labTestResult.patient?.father_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Patient ID: {labTestResult.patient?.patient_id}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Age</span>
                    <p className="font-medium">{labTestResult.patient?.age} years</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Gender</span>
                    <p className="font-medium capitalize">{labTestResult.patient?.gender}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Blood Group</span>
                    <p className="font-medium">{labTestResult.patient?.blood_group || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Phone</span>
                    <p className="font-medium">{labTestResult.patient?.phone || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Information Card */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FlaskConical className="h-5 w-5" />
                  Test Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wide">Test Name</span>
                  <p className="font-semibold text-lg">{labTestResult.labTest?.name ?? 'Unknown Test'}</p>
                </div>

                {labTestResult.labTest?.category && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Category</span>
                    <div className="mt-1">
                      <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {labTestResult.labTest.category}
                      </span>
                    </div>
                  </div>
                )}

                {labTestResult.labTest?.sample_type && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Sample Type</span>
                    <p className="text-sm font-medium">{labTestResult.labTest.sample_type}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Status</span>
                    <div className="mt-1">
                      <LabStatusBadge
                        status={labTestResult.status === 'pending' ? 'pending' : 'completed'}
                        size="md"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Performed</span>
                    <p className="text-sm font-medium">{formatDate(labTestResult.performed_at)}</p>
                    <p className="text-xs text-muted-foreground">
                      by {labTestResult.performedBy?.name || 'Unknown'}
                    </p>
                  </div>


                </div>
              </CardContent>
            </Card>

            {/* Result Summary */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="text-lg">Result Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-600">{normalCount}</p>
                    <p className="text-xs text-green-700 font-medium">Normal</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-2xl font-bold text-orange-600">{abnormalCount - criticalCount}</p>
                    <p className="text-xs text-orange-700 font-medium">Abnormal</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                    <p className="text-xs text-red-700 font-medium">Critical</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6 print:col-span-1 print:block">
            <Card className="print:shadow-none print:border-0 print:block">
              <CardHeader className="print:pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Beaker className="h-5 w-5" />
                  Test Results
                </CardTitle>
                <CardDescription>
                  Detailed results with reference ranges and status indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 print:hidden">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                  </TabsList>

                  <TabsContent value="table" className="mt-4 print:mt-0">
                    <div className="border rounded-lg overflow-hidden print:border-0">
                      <table className="w-full print:print-results-table">
                        <thead className="bg-muted print:hidden">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Parameter</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Result</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Reference Range</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                          </tr>
                        </thead>
                        <thead className="hidden print:table-header-group">
                          <tr>
                            <th className="w-1/3">Parameter</th>
                            <th className="w-1/4">Result</th>
                            <th className="w-1/4">Reference Range</th>
                            <th className="w-1/6">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y print:table-row-group">
                          {parsedResults.map((result, idx) => (
                            <tr
                              key={idx}
                              className={cn(
                                result.status === 'critical' && 'bg-red-50',
                                result.status === 'abnormal' && 'bg-orange-50/50'
                              )}
                            >
                              <td className="px-4 py-3 print:py-2">
                                <p className="font-medium print:text-xs">{result.name}</p>
                                {result.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 print:hidden">{result.notes}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 print:py-2">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'font-semibold',
                                    result.status === 'normal' && 'text-green-600 print:print-status-normal',
                                    result.status === 'abnormal' && 'text-orange-600 print:print-status-abnormal',
                                    result.status === 'critical' && 'text-red-600 print:print-status-critical',
                                  )}>
                                    {result.value}
                                  </span>
                                  <span className="text-sm text-muted-foreground print:text-xs">{result.unit}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 print:py-2 print:text-xs text-muted-foreground print:text-gray-600">
                                {result.referenceMin !== undefined && result.referenceMax !== undefined
                                  ? `${result.referenceMin} - ${result.referenceMax} ${result.unit}`
                                  : 'See reference'
                                }
                              </td>
                              <td className="px-4 py-3 print:py-2">
                                <div className="flex items-center gap-2 print:gap-1">
                                  {result.status === 'normal' && <CheckCircle2 className="h-4 w-4 text-green-600 print:hidden" />}
                                  {result.status === 'abnormal' && <AlertCircle className="h-4 w-4 text-orange-600 print:hidden" />}
                                  {result.status === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600 print:hidden" />}
                                  <span className={cn(
                                    'text-sm font-medium capitalize print:text-xs',
                                    result.status === 'normal' && 'text-green-600 print:print-status-normal',
                                    result.status === 'abnormal' && 'text-orange-600 print:print-status-abnormal',
                                    result.status === 'critical' && 'text-red-600 print:print-status-critical',
                                  )}>
                                    {result.status}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="detailed" className="mt-4 print:hidden">
                    <div className="space-y-4">
                      {parsedResults.map((result, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'p-4 rounded-lg border',
                            getStatusBgColor(result.status)
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              {getStatusIcon(result.status)}
                              <div>
                                <h4 className="font-semibold text-base">{result.name}</h4>
                              </div>
                            </div>
                            <div className={cn(
                              'px-3 py-1 rounded-full text-sm font-semibold capitalize',
                              result.status === 'normal' && 'bg-green-100 text-green-700',
                              result.status === 'abnormal' && 'bg-orange-100 text-orange-700',
                              result.status === 'critical' && 'bg-red-100 text-red-700',
                            )}>
                              {result.status}
                            </div>
                          </div>

                          <Separator className="my-3" />

                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-muted-foreground block text-xs uppercase tracking-wide font-medium">Result</span>
                              <p className={cn(
                                'text-2xl font-bold mt-1',
                                result.status === 'normal' && 'text-green-600',
                                result.status === 'abnormal' && 'text-orange-600',
                                result.status === 'critical' && 'text-red-600',
                              )}>
                                {result.value} <span className="text-lg text-muted-foreground">{result.unit}</span>
                              </p>
                            </div>
                          </div>

                          {result.notes && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex gap-2">
                                <Flag className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-muted-foreground text-xs uppercase tracking-wide font-medium block">Notes</span>
                                  <p className="text-sm mt-1">{result.notes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                {labTestResult.notes && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Additional Notes
                    </h4>
                    <p className="text-sm text-muted-foreground">{labTestResult.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Print Footer - Only visible when printing */}
        <div className="hidden print:block print:mt-8">
          {/* Notes Section */}
          {labTestResult.notes && (
            <div className="print:mb-6 print:p-3 print:bg-gray-50 print:rounded-lg">
              <p className="print:text-xs print:font-semibold print:text-gray-600 print:mb-1">Comments/Notes:</p>
              <p className="print:text-xs print:text-gray-700">{labTestResult.notes}</p>
            </div>
          )}
          
          {/* Signature Section */}
          <div className="print:mt-8 print:pt-6 print:border-t-2 print:border-gray-300">
            <div className="print:grid print:grid-cols-2 print:gap-16">
              <div className="print:text-center">
                <div className="print:h-16 print:border-b print:border-gray-400 print:mb-2"></div>
                <p className="print:text-sm print:font-bold">{labTestResult.performedBy?.name || 'Unknown'}</p>
                <p className="print:text-xs print:text-gray-600">Laboratory Technician</p>
                <p className="print:text-xs print:text-gray-500">Date: {formatDateShort(labTestResult.performed_at)}</p>
              </div>
              <div className="print:text-center">
                <div className="print:h-16 print:border-b print:border-gray-400 print:mb-2"></div>
                <p className="print:text-sm print:font-bold">Authorized Signatory</p>
                <p className="print:text-xs print:text-gray-600">Laboratory Pathologist</p>
                <p className="print:text-xs print:text-gray-500">Date: {formatDateShort(labTestResult.performed_at)}</p>
              </div>
            </div>
          </div>
          
          {/* Footer Disclaimer */}
          <div className="print:mt-8 print:pt-4 print:border-t print:border-gray-200">
            <div className="print:flex print:justify-between print:items-start">
              <div className="print:w-2/3">
                <p className="print:text-xs print:text-gray-500 print:leading-relaxed">
                  <span className="print:font-semibold">Important Note:</span> This is a computer-generated laboratory report. 
                  The results should be interpreted by a qualified healthcare professional in conjunction with the patient's clinical history. 
                  For any queries regarding this report, please contact our laboratory.
                </p>
              </div>
              <div className="print:text-right">
                <p className="print:text-xs print:text-gray-400">Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p className="print:text-xs print:text-gray-400 print:mt-1">Page 1 of 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LabTestResultPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        labTestResult={{
          result_id: labTestResult.result_id,
          patient: labTestResult.patient,
          labTest: labTestResult.labTest,
          performedBy: labTestResult.performedBy,
          performed_at: labTestResult.performed_at,
          results: labTestResult.results,
          notes: labTestResult.notes,
          status: labTestResult.status,
        }}
      />
    </LaboratoryLayout>
  );
}
