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
import { SampleTypeBadge } from '@/components/laboratory';
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
  FileText,
  Calendar,
  ChevronRight,
  Microscope,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { LabTest, LabCategory } from '@/types/lab-test';

// Patient Interface
interface Patient {
  id: number;
  patient_id: string;
  first_name: string | null;
  father_name: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  phone?: string | null;
}

// Test Parameter from LabTest.parameters JSON
interface TestParameter {
  name: string;
  unit: string;
  description?: string;
}

// Reference Range from LabTest.reference_ranges JSON
interface ReferenceRange {
  min?: number;
  max?: number;
  unit?: string;
  values?: string[];
  male?: { min?: number; max?: number; unit?: string };
  female?: { min?: number; max?: number; unit?: string };
  critical_low?: number;
  critical_high?: number;
}

// Lab Test Request
interface LabTestRequest {
  id: number;
  request_id: string;
  patient_id: number;
  test_name: string;
  status: string;
  patient: Patient;
}

// Patient-specific test request mapping
interface PatientTestRequest {
  test_name: string;
  request_id: string;
  status: string;
}

// Props from Controller
interface LabTestResultCreateProps {
  patients: Patient[];
  labTests: LabTest[];
  requests: LabTestRequest[];
  patientTestRequests: Record<number, PatientTestRequest[]>;
}

// Result parameter for form state
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

// Parsed reference range for calculations
interface ParsedReferenceRange {
  min?: number;
  max?: number;
  criticalLow?: number;
  criticalHigh?: number;
  unit?: string;
  values?: string[];
}

// Category configuration with icons and colors
const categoryConfig: Record<LabCategory, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  Hematology: { 
    label: 'Hematology', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200',
    icon: Droplet 
  },
  Biochemistry: { 
    label: 'Biochemistry', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200',
    icon: FlaskConical 
  },
  Serology: { 
    label: 'Serology', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200',
    icon: Activity 
  },
  Coagulation: { 
    label: 'Coagulation', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50', 
    borderColor: 'border-orange-200',
    icon: Clock 
  },
  Microbiology: { 
    label: 'Microbiology', 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    icon: Microscope 
  },
  Molecular: { 
    label: 'Molecular/PCR', 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50', 
    borderColor: 'border-indigo-200',
    icon: Activity 
  },
  Urine: { 
    label: 'Urine Tests', 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50', 
    borderColor: 'border-yellow-200',
    icon: Beaker 
  },
  Stool: { 
    label: 'Stool Tests', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50', 
    borderColor: 'border-amber-200',
    icon: Beaker 
  },
  Semen: { 
    label: 'Semen Analysis', 
    color: 'text-cyan-600', 
    bgColor: 'bg-cyan-50', 
    borderColor: 'border-cyan-200',
    icon: FlaskConical 
  },
  Special: { 
    label: 'Special Tests', 
    color: 'text-pink-600', 
    bgColor: 'bg-pink-50', 
    borderColor: 'border-pink-200',
    icon: AlertCircle 
  },
};

export default function LabTestResultCreate({ patients, labTests, requests, patientTestRequests }: LabTestResultCreateProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [activeTab, setActiveTab] = useState('patient');

  const { data, setData, post, processing, errors, reset } = useForm({
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

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 10);
    const search = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.patient_id.toLowerCase().includes(search) ||
      (p.first_name?.toLowerCase() || '').includes(search) ||
      (p.father_name?.toLowerCase() || '').includes(search) ||
      (p.phone?.toLowerCase() || '').includes(search)
    ).slice(0, 10);
  }, [patients, patientSearch]);

  // Get tests specific to selected patient
  const patientSpecificTests = useMemo(() => {
    if (!selectedPatient) return [];
    
    const patientTests = Array.isArray(patientTestRequests[selectedPatient.id]) 
      ? patientTestRequests[selectedPatient.id] 
      : [];
    const patientTestNames = patientTests.map(t => t.test_name);
    
    return labTests.filter(test => patientTestNames.includes(test.name));
  }, [selectedPatient, labTests, patientTestRequests]);

  // Group tests by category
  const testsByCategory = useMemo(() => {
    const grouped: Record<string, LabTest[]> = {};
    patientSpecificTests.forEach(test => {
      const category = test.category || 'Special';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(test);
    });
    return grouped;
  }, [patientSpecificTests]);

  // Parse reference range based on patient gender
  const parseReferenceRange = useCallback((refRange: ReferenceRange | undefined, patientGender: string | null): ParsedReferenceRange => {
    if (!refRange) return {};

    if (patientGender && patientGender.toLowerCase() === 'male' && refRange.male) {
      return {
        min: refRange.male.min,
        max: refRange.male.max,
        unit: refRange.male.unit || refRange.unit,
        criticalLow: refRange.critical_low,
        criticalHigh: refRange.critical_high,
      };
    }

    if (patientGender && patientGender.toLowerCase() === 'female' && refRange.female) {
      return {
        min: refRange.female.min,
        max: refRange.female.max,
        unit: refRange.female.unit || refRange.unit,
        criticalLow: refRange.critical_low,
        criticalHigh: refRange.critical_high,
      };
    }

    return {
      min: refRange.min,
      max: refRange.max,
      unit: refRange.unit,
      criticalLow: refRange.critical_low,
      criticalHigh: refRange.critical_high,
    };
  }, []);

  // Parse results JSON string to array
  const parseResults = (results: string | ResultParameter[]): ResultParameter[] => {
    if (Array.isArray(results)) return results;
    try {
      return JSON.parse(results);
    } catch {
      return [];
    }
  };

  // Get test parameters from LabTest.parameters JSON
  const getTestParameters = useCallback((test: LabTest): ResultParameter[] => {
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
  }, [parseReferenceRange, selectedPatient?.gender]);

  // Determine status based on value and reference range
  const determineStatus = useCallback((value: string, refRange: ReferenceRange | undefined, patientGender: string | null): 'normal' | 'abnormal' | 'critical' | 'pending' => {
    if (value === '') return 'pending';

    const parsed = parseReferenceRange(refRange, patientGender);

    // Handle enumerated values (e.g., Positive/Negative, Present/Absent)
    if (parsed.values && parsed.values.length > 0) {
      const normalizedValue = value.toLowerCase().trim();
      const normalizedValues = parsed.values.map(v => v.toLowerCase().trim());
      
      // Check if value is in the allowed list
      if (normalizedValues.includes(normalizedValue)) {
        // For qualitative tests, consider first value as "normal" reference
        return normalizedValue === normalizedValues[0] ? 'normal' : 'abnormal';
      }
      return 'abnormal';
    }

    // Try numeric comparison
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      // Non-numeric value without enumerated reference - mark as pending
      return 'pending';
    }

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
  }, [parseReferenceRange]);

  // Handle patient selection
  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id.toString() === patientId);
    setSelectedPatient(patient || null);
    setSelectedTest(null);
    setResultParameters([]);
    setData(prev => ({
      ...prev,
      patient_id: patientId,
      lab_test_id: '',
      request_id: '',
      results: '{}',
    }));
  };

  // Handle test selection
  const handleTestSelect = (testId: string) => {
    const test = labTests.find(t => t.id.toString() === testId);
    setSelectedTest(test || null);
    setData(prev => ({ ...prev, lab_test_id: testId }));
    
    if (test) {
      const params = getTestParameters(test);
      setResultParameters(params);
    } else {
      setResultParameters([]);
    }
  };

  // Handle parameter value change
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
    updateResultsData(updatedParams);
  };

  // Handle parameter notes change
  const handleParameterNotesChange = (paramId: string, notes: string) => {
    const updatedParams = resultParameters.map(param => {
      if (param.parameter_id === paramId) {
        return { ...param, notes };
      }
      return param;
    });
    setResultParameters(updatedParams);
    updateResultsData(updatedParams);
  };

  // Update results JSON data
  const updateResultsData = (params: ResultParameter[]) => {
    const resultsObj = params.reduce((acc, param) => {
      if (param.value !== '') {
        // Try to parse as number, otherwise keep as string
        const numValue = parseFloat(param.value);
        const isNumeric = !isNaN(numValue) && isFinite(numValue);
        
        acc[param.parameter_id] = {
          value: isNumeric ? numValue : param.value,
          unit: param.unit,
          status: param.status,
          notes: param.notes,
        };
      }
      return acc;
    }, {} as Record<string, unknown>);

    setData('results', JSON.stringify(resultsObj));

    // Update abnormal flags
    const abnormalParams = params
      .filter(r => r.status === 'abnormal' || r.status === 'critical')
      .map(r => r.name);
    setData('abnormal_flags', abnormalParams.join(', '));
  };

  // Get status icon
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

  // Get status styling
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'border-l-green-500 bg-green-50/30';
      case 'abnormal':
        return 'border-l-orange-500 bg-orange-50/30';
      case 'critical':
        return 'border-l-red-500 bg-red-50/50 animate-pulse';
      default:
        return 'border-l-gray-300 bg-gray-50/30';
    }
  };

  // Get trend indicator
  const getTrendIndicator = (value: string, min?: number, max?: number) => {
    if (value === '' || min === undefined || max === undefined) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    if (numValue < min) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    if (numValue > max) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Calculate summary counts
  const abnormalCount = resultParameters.filter(r => r.status === 'abnormal').length;
  const criticalCount = resultParameters.filter(r => r.status === 'critical').length;
  const normalCount = resultParameters.filter(r => r.status === 'normal').length;
  const pendingCount = resultParameters.filter(r => r.status === 'pending').length;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const performedDateTime = `${data.performed_at}T${data.performed_time}`;

    setData('performed_at', performedDateTime);
    
    post('/laboratory/lab-test-results', {
      onSuccess: () => {
        reset();
        setSelectedPatient(null);
        setSelectedTest(null);
        setResultParameters([]);
      },
    });
  };

  // Get patient initials
  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  // Get reference range display text
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
      return `${range} ${param.unit || parsed.unit || ''} (${selectedPatient?.gender || 'Gender-specific'})`.trim();
    }
    
    return `${range} ${param.unit || parsed.unit || ''}`.trim();
  };

  return (
    <LaboratoryLayout
      header={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading title="Add New Lab Test Result" />
            <p className="text-muted-foreground mt-1">
              Enter test results with automatic flagging and dynamic parameter loading
            </p>
          </div>
          <Link href="/laboratory/lab-test-results">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
          </Link>
        </div>
      }
    >
      <Head title="Add New Lab Test Result" />

      <div className="space-y-6 max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
              <TabsTrigger value="patient" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">1. Patient</span>
                <span className="sm:hidden">Patient</span>
              </TabsTrigger>
              <TabsTrigger value="test" className="gap-2" disabled={!data.patient_id}>
                <FlaskConical className="h-4 w-4" />
                <span className="hidden sm:inline">2. Test & Results</span>
                <span className="sm:hidden">Test</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="gap-2" disabled={!data.lab_test_id || resultParameters.length === 0}>
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">3. Review</span>
                <span className="sm:hidden">Review</span>
              </TabsTrigger>
            </TabsList>

            {/* Patient Selection Tab */}
            <TabsContent value="patient" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Select Patient
                  </CardTitle>
                  <CardDescription>Search and select the patient for this test result</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search Input */}
                  <div className="space-y-2">
                    <Label>Search Patient</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, patient ID, or phone number..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Patient Grid */}
                  <div className="h-[400px] rounded-lg border overflow-y-auto">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handlePatientSelect(patient.id.toString())}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-lg border text-left transition-all hover:shadow-sm',
                            data.patient_id === patient.id.toString()
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
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
                            {patient.blood_group && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Blood: {patient.blood_group}
                              </Badge>
                            )}
                          </div>
                          {data.patient_id === patient.id.toString() && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredPatients.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No patients found matching your search</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  )}

                  {errors.patient_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.patient_id}
                    </p>
                  )}

                  {/* Selected Patient Summary */}
                  {selectedPatient && (
                    <Card className="bg-muted/50 border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Selected Patient</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground block text-xs">Name</span>
                            <p className="font-medium">{selectedPatient.first_name} {selectedPatient.father_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Patient ID</span>
                            <p className="font-medium">{selectedPatient.patient_id}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Age / Gender</span>
                            <p className="font-medium">{selectedPatient.age}y / {selectedPatient.gender}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Blood Group</span>
                            <p className="font-medium">{selectedPatient.blood_group || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setActiveTab('test')}
                      disabled={!data.patient_id}
                      className="gap-2"
                    >
                      Continue to Test Selection
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test & Results Tab */}
            <TabsContent value="test" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column - Test Selection */}
                <div className="xl:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        Test Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Test Selection */}
                      <div className="space-y-2">
                        <Label>Lab Test *</Label>
                        {!selectedPatient ? (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                            Please select a patient first
                          </div>
                        ) : patientSpecificTests.length === 0 ? (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                            No pending tests for this patient
                          </div>
                        ) : (
                          <div className="h-[300px] rounded-lg border overflow-y-auto">
                            <div className="p-2 space-y-1">
                              {Object.entries(testsByCategory).map(([category, tests]) => {
                                const config = categoryConfig[category as LabCategory] || categoryConfig.Special;
                                const Icon = config.icon;
                                return (
                                  <div key={category} className="space-y-1">
                                    <div className={cn('px-2 py-1 text-xs font-medium flex items-center gap-1', config.color)}>
                                      <Icon className="h-3 w-3" />
                                      {config.label}
                                    </div>
                                    {tests.map((test) => (
                                      <button
                                        key={test.id}
                                        type="button"
                                        onClick={() => handleTestSelect(test.id.toString())}
                                        className={cn(
                                          'w-full text-left px-3 py-2 rounded text-sm transition-colors',
                                          data.lab_test_id === test.id.toString()
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted'
                                        )}
                                      >
                                        {test.name}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {errors.lab_test_id && (
                          <p className="text-sm text-destructive">{errors.lab_test_id}</p>
                        )}
                      </div>

                      {/* Selected Test Info */}
                      {selectedTest && (
                        <>
                          <div className="h-px bg-border" />
                          
                          {/* Sample Type */}
                          {selectedTest.sample_type && (
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

                          {/* Category */}
                          {selectedTest.category && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Category:</span>
                              <Badge variant="outline" className={cn(
                                categoryConfig[selectedTest.category]?.bgColor,
                                categoryConfig[selectedTest.category]?.color,
                                categoryConfig[selectedTest.category]?.borderColor
                              )}>
                                {selectedTest.category}
                              </Badge>
                            </div>
                          )}

                          {/* Date & Time */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="performed_at">Date *</Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="performed_at"
                                  type="date"
                                  value={data.performed_at}
                                  onChange={(e) => setData('performed_at', e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="performed_time">Time *</Label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="performed_time"
                                  type="time"
                                  value={data.performed_time}
                                  onChange={(e) => setData('performed_time', e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Status */}
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
                                <SelectItem value="pending">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                    Pending
                                  </div>
                                </SelectItem>
                                <SelectItem value="completed">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                    Completed
                                  </div>
                                </SelectItem>
                                <SelectItem value="verified">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Verified
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Result Summary */}
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
                                    {abnormalCount} Abnormal
                                  </Badge>
                                )}
                                {criticalCount > 0 && (
                                  <Badge variant="destructive">
                                    {criticalCount} Critical
                                  </Badge>
                                )}
                                {pendingCount > 0 && (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                    {pendingCount} Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Parameter Count */}
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
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Result Entry */}
                <div className="xl:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Result Entry
                      </CardTitle>
                      <CardDescription>
                        {selectedTest
                          ? `Enter values for ${selectedTest.name}. Values will be automatically flagged based on reference ranges.`
                          : 'Select a test to begin entering results'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!selectedTest ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <FlaskConical className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">Select a lab test</p>
                          <p className="text-sm mt-1">Choose a test from the left panel to begin entering results</p>
                        </div>
                      ) : resultParameters.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <Info className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No parameters configured</p>
                          <p className="text-sm mt-1">This test doesn't have any parameters defined</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {resultParameters.map((result) => (
                            <div
                              key={result.parameter_id}
                              className={cn(
                                'p-4 rounded-lg border-l-4 transition-all hover:shadow-sm',
                                getStatusClass(result.status)
                              )}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                {/* Parameter Name & Reference */}
                                <div className="md:col-span-4">
                                  <Label className="font-medium text-sm">{result.name}</Label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {getReferenceRangeText(result, selectedTest)}
                                  </p>
                                  {result.genderSpecific && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      Gender-specific
                                    </Badge>
                                  )}
                                </div>

                                {/* Value Input */}
                                <div className="md:col-span-4">
                                  <div className="relative">
                                    <Input
                                      type="text"
                                      value={result.value}
                                      onChange={(e) => handleParameterChange(result.parameter_id, e.target.value)}
                                      placeholder="Enter value"
                                      className={cn(
                                        'pr-16',
                                        result.status === 'critical' && 'border-red-600 focus:border-red-600 focus:ring-red-600',
                                        result.status === 'abnormal' && 'border-orange-500 focus:border-orange-500'
                                      )}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                                      {result.unit}
                                    </span>
                                  </div>
                                </div>

                                {/* Status Indicator */}
                                <div className="md:col-span-4 flex items-center gap-2">
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
                                  {getTrendIndicator(result.value, result.referenceMin, result.referenceMax)}
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

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab('patient')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  disabled={!data.lab_test_id || resultParameters.length === 0}
                  className="gap-2"
                >
                  Review Results
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Review Results
                  </CardTitle>
                  <CardDescription>Review all entered values before saving</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Patient Information */}
                  {selectedPatient && (
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Patient Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground block text-xs">Name</span>
                            <p className="font-medium">{selectedPatient.first_name} {selectedPatient.father_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Patient ID</span>
                            <p className="font-medium">{selectedPatient.patient_id}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Age / Gender</span>
                            <p className="font-medium">{selectedPatient.age}y / {selectedPatient.gender}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Blood Group</span>
                            <p className="font-medium">{selectedPatient.blood_group || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Test Information */}
                  {selectedTest && (
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FlaskConical className="h-4 w-4" />
                          Test Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground block text-xs">Test Name</span>
                            <p className="font-medium">{selectedTest.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Performed</span>
                            <p className="font-medium">{data.performed_at} at {data.performed_time}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs">Status</span>
                            <p className="font-medium capitalize flex items-center gap-1">
                              {data.status === 'pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                              {data.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                              {data.status === 'verified' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                              {data.status}
                            </p>
                          </div>
                          {selectedTest.sample_type && (
                            <div>
                              <span className="text-muted-foreground block text-xs">Sample Type</span>
                              <p className="font-medium">{selectedTest.sample_type}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Test Results Table */}
                  {resultParameters.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Test Results
                      </h4>
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

                  {/* Critical Values Warning */}
                  {criticalCount > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
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

                  {/* Additional Notes */}
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

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('test')} className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
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
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
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