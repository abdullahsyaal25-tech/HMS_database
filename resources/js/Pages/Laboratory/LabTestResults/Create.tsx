import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  ArrowLeft,
  Save,
  Search,
  User,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Droplet,
  Beaker,
  Info,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LabTest } from '@/types/lab-test';

interface Patient {
  id: number;
  patient_id: string;
  first_name: string | null;
  father_name: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
}

interface TestParameter {
  name: string;
  unit: string;
  description?: string;
}

interface ReferenceRange {
  min?: number;
  max?: number;
  unit?: string;
  values?: string[];
  male?: { min?: number; max?: number; };
  female?: { min?: number; max?: number; };
  critical_low?: number;
  critical_high?: number;
}

interface LabTestRequest {
  id: number;
  request_id: string;
  patient_id: number;
  test_name: string;
  status: string;
  patient: Patient;
}

interface PatientTestRequest {
  test_name: string;
  request_id: string;
  status: string;
}

interface LabTestResultCreateProps {
  patients: Patient[];
  labTests: LabTest[];
  requests: LabTestRequest[];
  patientTestRequests: Record<number, PatientTestRequest[]>;
}

interface ResultParameter {
  parameter_id: string;
  name: string;
  value: string;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  genderSpecific?: boolean;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  notes: string;
}

interface ParsedReferenceRange {
  min?: number;
  max?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export default function LabTestResultCreate({ patients, labTests, requests, patientTestRequests }: LabTestResultCreateProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [activeTab, setActiveTab] = useState('patient');

  const { data, setData, post, processing, errors } = useForm({
    lab_test_id: '',
    patient_id: '',
    request_id: '',
    performed_at: new Date().toISOString().split('T')[0],
    performed_time: new Date().toTimeString().slice(0, 5),
    results: '{}',
    status: 'pending' as 'pending' | 'completed' | 'verified',
    notes: '',
    abnormal_flags: '',
  });

  const [resultParameters, setResultParameters] = useState<ResultParameter[]>([]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 10);
    const search = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.patient_id.toLowerCase().includes(search) ||
      (p.first_name?.toLowerCase() || '').includes(search) ||
      (p.father_name?.toLowerCase() || '').includes(search)
    ).slice(0, 10);
  }, [patients, patientSearch]);

  const patientSpecificTests = useMemo(() => {
    if (!selectedPatient) return labTests;
    
    const patientTests = Array.isArray(patientTestRequests[selectedPatient.id]) 
      ? patientTestRequests[selectedPatient.id] 
      : [];
    const patientTestNames = patientTests.map(t => t.test_name);
    
    return labTests.filter(test => patientTestNames.includes(test.name));
  }, [selectedPatient, labTests, patientTestRequests]);

  const parseReferenceRange = (refRange: ReferenceRange | undefined, patientGender: string | null): ParsedReferenceRange => {
    if (!refRange) return {};

    if (patientGender && patientGender.toLowerCase() === 'male' && refRange.male) {
      return {
        min: refRange.male.min,
        max: refRange.male.max,
        criticalLow: refRange.critical_low,
        criticalHigh: refRange.critical_high,
      };
    }

    if (patientGender && patientGender.toLowerCase() === 'female' && refRange.female) {
      return {
        min: refRange.female.min,
        max: refRange.female.max,
        criticalLow: refRange.critical_low,
        criticalHigh: refRange.critical_high,
      };
    }

    return {
      min: refRange.min,
      max: refRange.max,
      criticalLow: refRange.critical_low,
      criticalHigh: refRange.critical_high,
    };
  };

  const getTestParameters = (test: LabTest): ResultParameter[] => {
    if (!test.parameters || Object.keys(test.parameters).length === 0) {
      return [];
    }

    return Object.entries(test.parameters).map(([paramKey, param]) => {
      const refRange = test.reference_ranges?.[paramKey] as ReferenceRange | undefined;
      const parsedRange = parseReferenceRange(refRange, selectedPatient?.gender || null);

      return {
        parameter_id: paramKey,
        name: param.name,
        value: '',
        unit: param.unit,
        referenceMin: parsedRange.min,
        referenceMax: parsedRange.max,
        genderSpecific: !!(refRange?.male || refRange?.female),
        status: 'pending' as const,
        notes: '',
      };
    });
  };

  const determineStatus = (value: string, refRange: ReferenceRange | undefined, patientGender: string | null): 'normal' | 'abnormal' | 'critical' | 'pending' => {
    if (value === '') return 'pending';

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'pending';

    const parsed = parseReferenceRange(refRange, patientGender);

    if (parsed.criticalLow !== undefined && numValue < parsed.criticalLow) {
      return 'critical';
    }
    if (parsed.criticalHigh !== undefined && numValue > parsed.criticalHigh) {
      return 'critical';
    }

    if (parsed.min !== undefined && parsed.max !== undefined) {
      if (numValue >= parsed.min && numValue <= parsed.max) {
        return 'normal';
      }
      return 'abnormal';
    }

    return 'pending';
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id.toString() === patientId);
    setSelectedPatient(patient || null);
    setData('patient_id', patientId);
  };

  const handleTestSelect = (testId: string) => {
    const test = labTests.find(t => t.id.toString() === testId);
    setSelectedTest(test || null);
    setData('lab_test_id', testId);
    
    if (test) {
      const params = getTestParameters(test);
      setResultParameters(params);
    } else {
      setResultParameters([]);
    }
  };

  const handleParameterChange = (paramId: string, value: string) => {
    const updatedParams = resultParameters.map(param => {
      if (param.parameter_id === paramId) {
        const refRange = selectedTest?.reference_ranges?.[paramId] as ReferenceRange | undefined;
        const status = determineStatus(value, refRange, selectedPatient?.gender || null);
        
        return { ...param, value, status };
      }
      return param;
    });
    
    setResultParameters(updatedParams);

    const resultsObj = updatedParams.reduce((acc, param) => {
      if (param.value !== '') {
        acc[param.parameter_id] = {
          value: parseFloat(param.value),
          unit: param.unit,
          status: param.status,
          notes: param.notes,
        };
      }
      return acc;
    }, {} as Record<string, unknown>);

    setData('results', JSON.stringify(resultsObj));
  };

  const handleParameterNotesChange = (paramId: string, notes: string) => {
    const updatedParams = resultParameters.map(param => {
      if (param.parameter_id === paramId) {
        return { ...param, notes };
      }
      return param;
    });
    setResultParameters(updatedParams);

    const resultsObj = updatedParams.reduce((acc, param) => {
      if (param.value !== '') {
        acc[param.parameter_id] = {
          value: parseFloat(param.value),
          unit: param.unit,
          status: param.status,
          notes: param.notes,
        };
      }
      return acc;
    }, {} as Record<string, unknown>);

    setData('results', JSON.stringify(resultsObj));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'abnormal':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'border-l-green-600 bg-green-50/50';
      case 'abnormal':
        return 'border-l-orange-600 bg-orange-50/50';
      case 'critical':
        return 'border-l-red-600 bg-red-50/50 animate-pulse';
      default:
        return 'border-l-gray-300 bg-gray-50/50';
    }
  };

  const abnormalCount = resultParameters.filter(r => r.status === 'abnormal' || r.status === 'critical').length;
  const criticalCount = resultParameters.filter(r => r.status === 'critical').length;
  const normalCount = resultParameters.filter(r => r.status === 'normal').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const performedDateTime = `${data.performed_at}T${data.performed_time}`;
    
    const abnormalParamNames = resultParameters
      .filter(r => r.status === 'abnormal' || r.status === 'critical')
      .map(r => r.name)
      .join(', ');

    const formData = {
      lab_test_id: data.lab_test_id,
      patient_id: data.patient_id,
      performed_at: performedDateTime,
      results: data.results,
      status: data.status,
      notes: data.notes,
      abnormal_flags: abnormalParamNames,
    };
    
    Object.entries(formData).forEach(([key, value]) => {
      setData(key as keyof typeof data, value);
    });
    
    post('/laboratory/lab-test-results');
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const getReferenceRangeText = (param: ResultParameter, test: LabTest | null): string => {
    if (!test) return '';
    
    const refRange = test.reference_ranges?.[param.parameter_id] as ReferenceRange | undefined;
    if (!refRange) return 'No reference range';

    const parsed = parseReferenceRange(refRange, selectedPatient?.gender || null);
    
    if (refRange.values && refRange.values.length > 0) {
      return `Values: ${refRange.values.join(', ')}`;
    }

    const rangeText: string[] = [];
    if (parsed.min !== undefined) rangeText.push(`${parsed.min}`);
    if (parsed.max !== undefined) rangeText.push(`${parsed.max}`);
    
    const range = rangeText.length > 0 ? rangeText.join(' - ') : 'N/A';
    
    if (param.genderSpecific) {
      return `${range} ${param.unit} (Gender-specific)`;
    }
    
    return `${range} ${param.unit}`;
  };

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title="Add New Lab Test Result" />
          <p className="text-muted-foreground mt-1">
            Enter test results with automatic flagging and dynamic parameter loading
          </p>
        </div>
      }
    >
      <Head title="Add New Lab Test Result" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Add New Lab Test Result" />
            <p className="text-muted-foreground mt-1">
              Enter test results with automatic flagging
            </p>
          </div>

          <Link href="/laboratory/lab-test-results">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Results
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="patient">Patient</TabsTrigger>
              <TabsTrigger value="test">Test & Results</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="patient" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Patient</CardTitle>
                  <CardDescription>Search and select the patient for this test result</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Search Patient</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or patient ID..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient.id.toString())}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                          data.patient_id === patient.id.toString()
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                        )}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(patient.first_name, patient.father_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {patient.first_name} {patient.father_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PID: {patient.patient_id} • {patient.age}y • {patient.gender}
                          </p>
                        </div>
                        {data.patient_id === patient.id.toString() && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>

                  {filteredPatients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No patients found matching your search
                    </div>
                  )}

                  {errors.patient_id && (
                    <p className="text-sm text-red-600">{errors.patient_id}</p>
                  )}

                  {selectedPatient && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Selected Patient</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{selectedPatient.first_name} {selectedPatient.father_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Patient ID:</span>
                          <p className="font-medium">{selectedPatient.patient_id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Age:</span>
                          <p className="font-medium">{selectedPatient.age} years</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Blood Group:</span>
                          <p className="font-medium">{selectedPatient.blood_group || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setActiveTab('test')}
                      disabled={!data.patient_id}
                    >
                      Continue to Test Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="lab_test_id">Lab Test *</Label>
                        {!selectedPatient ? (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                            Please select a patient first to view their lab tests
                          </div>
                        ) : patientSpecificTests.length === 0 ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                            All lab tests for this patient already have results entered
                          </div>
                        ) : (
                          <Select
                            value={data.lab_test_id}
                            onValueChange={handleTestSelect}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select lab test" />
                            </SelectTrigger>
                            <SelectContent>
                              {patientSpecificTests.map((test) => (
                                <SelectItem key={test.id} value={test.id.toString()}>
                                  {test.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {errors.lab_test_id && (
                          <p className="text-sm text-red-600">{errors.lab_test_id}</p>
                        )}
                      </div>

                      {selectedTest && selectedTest.sample_type && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Droplet className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-900">Sample Type</p>
                              <p className="text-blue-700">{selectedTest.sample_type}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedTest && selectedTest.category && (
                        <div className="space-y-2">
                          <Label className="text-xs">Category</Label>
                          <Badge variant="outline">{selectedTest.category}</Badge>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="performed_at">Date *</Label>
                          <Input
                            id="performed_at"
                            type="date"
                            value={data.performed_at}
                            onChange={(e) => setData('performed_at', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="performed_time">Time *</Label>
                          <Input
                            id="performed_time"
                            type="time"
                            value={data.performed_time}
                            onChange={(e) => setData('performed_time', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={data.status}
                          onValueChange={(value) => setData('status', value as 'pending' | 'completed' | 'verified')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {resultParameters.length > 0 && (
                        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                          <p className="text-sm font-medium">Result Summary</p>
                          <div className="flex gap-2 flex-wrap">
                            {normalCount > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {normalCount} Normal
                              </Badge>
                            )}
                            {abnormalCount > 0 && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                {abnormalCount - criticalCount} Abnormal
                              </Badge>
                            )}
                            {criticalCount > 0 && (
                              <Badge variant="destructive">
                                {criticalCount} Critical
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {resultParameters.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Beaker className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-700">
                              <strong>{resultParameters.length}</strong> parameters to enter
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Result Entry</CardTitle>
                      <CardDescription>
                        {selectedTest
                          ? `Enter values for ${selectedTest.name}. Values will be automatically flagged based on reference ranges.`
                          : 'Select a test to enter results'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!selectedTest ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a lab test to begin entering results</p>
                        </div>
                      ) : resultParameters.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>This test has no parameters configured</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {resultParameters.map((result) => (
                            <div
                              key={result.parameter_id}
                              className={cn(
                                'p-4 rounded-lg border-l-4 transition-all',
                                getStatusClass(result.status)
                              )}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                <div className="md:col-span-3">
                                  <Label className="font-medium">{result.name}</Label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {getReferenceRangeText(result, selectedTest)}
                                  </p>
                                </div>

                                <div className="md:col-span-3">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={result.value}
                                      onChange={(e) => handleParameterChange(result.parameter_id, e.target.value)}
                                      placeholder="Enter value"
                                      className={cn(
                                        'pr-12',
                                        result.status === 'critical' && 'border-red-600 focus:border-red-600'
                                      )}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                      {result.unit}
                                    </span>
                                  </div>
                                </div>

                                <div className="md:col-span-2 flex items-center gap-2">
                                  {getStatusIcon(result.status)}
                                  <span className={cn(
                                    'text-sm font-medium capitalize',
                                    result.status === 'normal' && 'text-green-600',
                                    result.status === 'abnormal' && 'text-orange-600',
                                    result.status === 'critical' && 'text-red-600',
                                    result.status === 'pending' && 'text-gray-500',
                                  )}>
                                    {result.status}
                                  </span>
                                </div>

                                <div className="md:col-span-4">
                                  <Input
                                    placeholder="Notes (optional)"
                                    value={result.notes}
                                    onChange={(e) => handleParameterNotesChange(result.parameter_id, e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab('patient')}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  disabled={!data.lab_test_id || resultParameters.length === 0}
                >
                  Review Results
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Results</CardTitle>
                  <CardDescription>Review all entered values before saving</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedPatient && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Patient Information
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{selectedPatient.first_name} {selectedPatient.father_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Patient ID:</span>
                          <p className="font-medium">{selectedPatient.patient_id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Age:</span>
                          <p className="font-medium">{selectedPatient.age} years</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gender:</span>
                          <p className="font-medium">{selectedPatient.gender}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTest && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        Test Information
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Test:</span>
                          <p className="font-medium">{selectedTest.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Performed:</span>
                          <p className="font-medium">{data.performed_at} at {data.performed_time}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium capitalize">{data.status}</p>
                        </div>
                        {selectedTest.sample_type && (
                          <div>
                            <span className="text-muted-foreground">Sample:</span>
                            <p className="font-medium">{selectedTest.sample_type}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {resultParameters.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Test Results</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium">Parameter</th>
                              <th className="px-4 py-3 text-left font-medium">Value</th>
                              <th className="px-4 py-3 text-left font-medium">Reference Range</th>
                              <th className="px-4 py-3 text-left font-medium">Status</th>
                              <th className="px-4 py-3 text-left font-medium">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {resultParameters.map((result, idx) => (
                              <tr key={idx} className={cn(
                                result.status === 'critical' && 'bg-red-50',
                                result.status === 'abnormal' && 'bg-orange-50'
                              )}>
                                <td className="px-4 py-3 font-medium">{result.name}</td>
                                <td className="px-4 py-3">
                                  {result.value ? `${result.value} ${result.unit}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {getReferenceRangeText(result, selectedTest)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(result.status)}
                                    <span className={cn(
                                      'capitalize font-medium',
                                      result.status === 'normal' && 'text-green-600',
                                      result.status === 'abnormal' && 'text-orange-600',
                                      result.status === 'critical' && 'text-red-600',
                                    )}>
                                      {result.status}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {result.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {criticalCount > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800">Critical Values Detected</h4>
                          <p className="text-sm text-red-700 mt-1">
                            {criticalCount} parameter(s) have critical values. Please verify these results carefully before saving.
                            Critical values require immediate physician notification.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any additional notes about the test results..."
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('test')}>
                      Back to Edit
                    </Button>
                    <div className="flex gap-3">
                      <Link href="/laboratory/lab-test-results">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        disabled={processing || resultParameters.length === 0}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {processing ? 'Saving...' : 'Save Results'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </LaboratoryLayout>
  );
}