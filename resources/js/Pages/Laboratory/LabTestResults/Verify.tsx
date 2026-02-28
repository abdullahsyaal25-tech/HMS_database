import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  ArrowLeft,
  CheckCircle2,
  User,
  FlaskConical,
  Calendar,
  FileText,
  Info,
} from 'lucide-react';

interface Patient {
  id: number;
  patient_id: string;
  first_name: string | null;
  father_name: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
}

interface LabTest {
  id: number;
  test_id: string;
  name: string;
  unit: string | null;
  normal_values: string | null;
}

interface UserType {
  id: number;
  name: string;
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

interface LabTestResult {
  id: number;
  result_id: string;
  patient_id: number;
  lab_test_id: number;
  performed_by: number;
  performed_at: string;
  verified_at: string | null;
  verified_by: number | null;
  results: string | ResultParameter[];
  status: 'pending' | 'completed' | 'verified';
  notes: string | null;
  abnormal_flags: string | null;
  created_at: string;
  updated_at: string;
  patient: Patient;
  test: LabTest;
  performedBy: UserType;
}

interface VerifyProps {
  labTestResult: LabTestResult;
}

export default function Verify({ labTestResult }: VerifyProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  // Results are now auto-completed on save - no verification needed
  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title="Result Details" />
          <p className="text-muted-foreground mt-1">
            Lab test results are automatically completed on save
          </p>
        </div>
      }
    >
      <Head title="Result Details" />

      <div className="space-y-6">
        {/* Info Alert */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Auto-Completed Result</AlertTitle>
          <AlertDescription className="text-blue-700">
            Lab test results are now automatically marked as completed when saved. 
            No additional verification step is required.
          </AlertDescription>
        </Alert>

        {/* Result Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Test Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{labTestResult.test?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Test ID: {labTestResult.test?.test_id}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{labTestResult.result_id}</Badge>
                  <Badge variant="default">{labTestResult.status}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(labTestResult.patient?.first_name, labTestResult.patient?.father_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {labTestResult.patient?.first_name} {labTestResult.patient?.father_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  PID: {labTestResult.patient?.patient_id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performed By */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Performed By</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{labTestResult.performedBy?.name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              {formatDate(labTestResult.performed_at)}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href={`/laboratory/lab-test-results/${labTestResult.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Full Result
            </Button>
          </Link>
          <Link href="/laboratory/lab-test-results">
            <Button variant="outline">View All Results</Button>
          </Link>
        </div>
      </div>
    </LaboratoryLayout>
  );
}
