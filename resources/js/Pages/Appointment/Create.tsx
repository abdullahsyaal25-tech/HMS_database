import { Head, useForm, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import { AppointmentPrintModal } from '@/components/appointment/AppointmentPrintModal';
import { DepartmentPrint } from '@/components/appointment/DepartmentPrint';
import { useToast } from '@/components/Toast';
import { 
    ArrowLeft, 
    Save, 
    Calendar as CalendarIcon, 
    User, 
    Stethoscope, 
    Percent, 
    Users, 
    Building2,
    Plus,
    Trash2,
    Package,
    Calculator,
    Search,
    X,
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    full_name: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
    specialization: string;
    fees: string;
    department_id: number;
}

interface DepartmentService {
    id: number;
    department_id: number | null;
    name: string;
    base_cost: string;
    is_lab_test?: boolean;
}

interface Department {
    id: number;
    name: string;
    services: DepartmentService[];
}

interface SelectedService {
    id: string;
    department_service_id: string;
    name: string;
    custom_cost: string;
    discount_percentage: string;
    final_cost: number;
    is_lab_test?: boolean;
}

interface SubmitService {
    department_service_id: string;
    custom_cost: number;
    discount_percentage: number;
    is_lab_test?: boolean;
}

interface PrintAppointment {
    appointment_id: string;
    patient?: {
        first_name: string;
        father_name?: string;
        gender?: string;
        age?: number;
    };
    doctor?: {
        id?: number;
        full_name: string;
    };
    department?: {
        name: string;
    };
    services?: Array<{
        id: number;
        name: string;
        pivot: {
            custom_cost: number;
            discount_percentage: number;
            final_cost: number;
        };
    }>;
    appointment_date: string;
    fee: number;
    discount: number;
    grand_total?: number;
    created_at?: string;
}

interface AppointmentCreateProps {
    patients: Patient[];
    doctors: Doctor[];
    departments: Department[];
    printAppointment?: PrintAppointment;
}

// Extended page props for Inertia
interface PageProps {
    flash?: { success?: string; error?: string };
    printAppointment?: PrintAppointment;
    flashId?: string;
    successMessage?: string;
    flashDepartment?: string | null;
    flashDoctor?: string | null;
}

interface FormData {
    patient_id: string;
    doctor_id: string;
    department_id: string;
    appointment_date: string;
    reason: string;
    notes: string;
    fee: string;
    discount: string;
    discount_type: 'percentage' | 'fixed';
    discount_fixed: string;
    status: string;
    services: SubmitService[];
}

export default function AppointmentCreate({ patients, doctors, departments, printAppointment: initialPrintAppointment }: AppointmentCreateProps) {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Get page props for flash messages and printAppointment from Inertia
    const pageProps = usePage().props as PageProps;
    const { showSuccess } = useToast();
    
    // Get printAppointment from page props (updated automatically by Inertia after form submission)
    const printAppointment = pageProps.printAppointment || initialPrintAppointment;
    
    // Separate state for managing services in the UI
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
    // Initialize with printAppointment value - will show modal if appointment was created
    const [showPrintModal, setShowPrintModal] = useState(false);
    // Track which print modal to show based on whether services were added
    const [printType, setPrintType] = useState<'doctor' | 'department' | null>(null);
    // Track if form was successfully submitted - only show print modal after submission
    const [hasSubmitted, setHasSubmitted] = useState(false);
    
    // Track previous flashId to detect new submissions
    const prevFlashIdRef = useRef<string | undefined>(undefined);
    
    // Search and selection state for Patient
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [selectedPatientIndex, setSelectedPatientIndex] = useState(-1);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const patientSearchRef = useRef<HTMLInputElement>(null);
    
    // Search and selection state for Department
    const [departmentSearchQuery, setDepartmentSearchQuery] = useState('');
    const [selectedDepartmentIndex, setSelectedDepartmentIndex] = useState(-1);
    const [selectedDepartmentObj, setSelectedDepartmentObj] = useState<Department | null>(null);
    const departmentSearchRef = useRef<HTMLInputElement>(null);
    
    // Search and selection state for Doctor
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
    const [selectedDoctorIndex, setSelectedDoctorIndex] = useState(-1);
    const [selectedDoctorObj, setSelectedDoctorObj] = useState<Doctor | null>(null);
    const doctorSearchRef = useRef<HTMLInputElement>(null);

    // Search state for services (one search per service in the form)
    const [serviceSearchQueries, setServiceSearchQueries] = useState<{ [key: string]: string }>({});
    const [selectedServiceIndices, setSelectedServiceIndices] = useState<{ [key: string]: number }>({});
    
    // Show toast when appointment is created successfully
    // Use flashId as the primary dependency to detect new appointments
    useEffect(() => {
        const flashId = pageProps.flashId;
        const successMessage = pageProps.successMessage;
        const flashDepartment = pageProps.flashDepartment;
        const flashDoctor = pageProps.flashDoctor;
    
        
        // Only show toast if this is a new flash (different flashId)
        if (flashId && flashId !== prevFlashIdRef.current && successMessage) {
            console.log('[DEBUG] Showing success toast with message:', successMessage);
            
            // Build detailed success message with department and doctor info
            let detailMessage = successMessage;
            if (flashDoctor) {
                detailMessage += ` Doctor: ${flashDoctor}`;
            }
            if (flashDepartment) {
                detailMessage += ` Department: ${flashDepartment}`;
            }
            
            showSuccess('Appointment Created', detailMessage);
        }
        
        // Update ref for next comparison
        prevFlashIdRef.current = flashId;
    }, [pageProps.flashId, pageProps.successMessage, pageProps.flashDepartment, pageProps.flashDoctor, printAppointment, showSuccess]);
    
    // Handle print modal close - reset form after printing
    const handlePrintModalClose = () => {
        setShowPrintModal(false);
        setPrintType(null);
        
        // Reset form to initial state after print modal is closed
        const now = new Date();
        const newDate = now.toISOString().split('T')[0];
        const newTime = now.toTimeString().slice(0, 5);
        
        setData({
            patient_id: '',
            doctor_id: '',
            department_id: '',
            appointment_date: newDate + 'T' + newTime,
            reason: '',
            notes: '',
            fee: '',
            discount: '0',
            discount_type: 'percentage',
            discount_fixed: '0',
            status: 'completed',
            services: [] as SubmitService[],
        });
        
        // Clear selected services
        setSelectedServices([]);
        
        console.log('[DEBUG] Form reset after print modal closed');
    };
    
    // Show print modal only after form submission succeeds
    // Use a ref to track services that were submitted to handle timing issues
    const submittedServicesRef = useRef<SelectedService[]>([]);
    
    useEffect(() => {
        if (printAppointment && hasSubmitted) {
           
            const hasServicesFromBackend = (printAppointment.services && printAppointment.services.length > 0);
            const hasServicesFromSubmission = submittedServicesRef.current.length > 0;
            const hasServicesFromState = selectedServices.length > 0 && selectedServices.some(s => s.department_service_id !== '');
            const hasServices = hasServicesFromBackend || hasServicesFromSubmission || hasServicesFromState;
        
            
            let determinedPrintType: 'doctor' | 'department' = 'doctor';
            
            if (hasServices) {
                // Priority 1: If there are services, always use Department Print regardless of doctor
                determinedPrintType = 'department';
            } else if (printAppointment.doctor) {
                // Priority 2: If no services but doctor is selected, use Doctor Print
                determinedPrintType = 'doctor';
            } else {
                // Fallback: If no services and no doctor, default to department if available
                determinedPrintType = printAppointment.department ? 'department' : 'doctor';
            }
            
            
            setTimeout(() => {
                console.log('[DEBUG] Inside timeout - setting printType to:', determinedPrintType);
                setPrintType(determinedPrintType);
                console.log('[DEBUG] Inside timeout - setting showPrintModal to true');
                setShowPrintModal(true);
                setHasSubmitted(false); // Reset after showing
                submittedServicesRef.current = []; // Clear ref after use
                console.log('[DEBUG] States updated, printType now:', determinedPrintType);
            }, 0);
        }
    }, [printAppointment, hasSubmitted, selectedServices]);
    
    const { data, setData, processing, errors } = useForm<FormData>({
        patient_id: '',
        doctor_id: '',
        department_id: '',
        appointment_date: currentDate + 'T' + currentTime,
        reason: '',
        notes: '',
        fee: '',
        discount: '0',
        discount_type: 'percentage',
        discount_fixed: '0',
        status: 'completed',
        services: [] as SubmitService[],
    });

    // Get available services for selected department
    const availableServices = useMemo(() => {
        if (!data.department_id) return [];
        const department = departments.find(d => d.id.toString() === data.department_id);
        return department?.services || [];
    }, [data.department_id, departments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Calculate totals to get final fee value
        const totals = calculateTotals();
        console.log('[DEBUG] Calculated totals:', totals);
        
        // Prepare services data for submission
        const servicesData: SubmitService[] = selectedServices.map(s => ({
            department_service_id: s.department_service_id,
            custom_cost: parseFloat(s.custom_cost) || 0,
            discount_percentage: parseFloat(s.discount_percentage) || 0,
            is_lab_test: s.is_lab_test || false,
        })).filter(s => s.department_service_id !== ''); // Only include services with valid IDs
        
        console.log('[DEBUG] Prepared services data for submission:', servicesData);
        
        // Capture the selected services in a ref BEFORE submitting
        // This ensures we have the services data available for print type determination
        // even if the backend response hasn't arrived yet or has timing issues
        submittedServicesRef.current = [...selectedServices];
        console.log('[DEBUG] Captured services in ref:', submittedServicesRef.current);
        
        // If using services, set the fee from grand total
        if (servicesData.length > 0 && !data.fee) {
            setData('fee', totals.grandTotal.toString());
        }
 
        // Use router.post to submit with the services data directly - this bypasses React state timing issues
        router.post('/appointments', {
            ...data,
            services: JSON.stringify(servicesData),
        }, {
            onSuccess: () => {
                console.log('[DEBUG] Request succeeded');
                // Mark form as submitted successfully - this triggers the print modal
                setHasSubmitted(true);
            },
            onError: (errors) => console.error('[DEBUG] Request errors:', errors),
            onFinish: () => console.log('[DEBUG] Request finished'),
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const addService = () => {
        const newService: SelectedService = {
            id: Date.now().toString(),
            department_service_id: '',
            name: '',
            custom_cost: '',
            discount_percentage: '0',
            final_cost: 0,
            is_lab_test: false,
        };
        
        setSelectedServices([...selectedServices, newService]);
    };

    const removeService = (id: string) => {
        setSelectedServices(selectedServices.filter(s => s.id !== id));
    };

    const updateService = (id: string, field: keyof SelectedService, value: string) => {
        setSelectedServices(prev => prev.map(service => {
            if (service.id !== id) return service;
            
            const updated = { ...service, [field]: value };
            
            if (field === 'department_service_id' && value) {
                const deptService = availableServices.find(s => s.id.toString() === value);
                if (deptService) {
                    updated.name = deptService.name;
                    updated.custom_cost = deptService.base_cost;
                    updated.is_lab_test = deptService.is_lab_test || false;
                }
            }
            
            const cost = parseFloat(updated.custom_cost) || 0;
            const discount = parseFloat(updated.discount_percentage) || 0;
            const discountAmount = cost * (discount / 100);
            updated.final_cost = Math.max(0, cost - discountAmount);
            
            return updated;
        }));
    };

    const calculateTotals = () => {
        if (selectedServices.length > 0) {
            const subtotal = selectedServices.reduce((sum, s) => sum + (parseFloat(s.custom_cost) || 0), 0);
            const servicesDiscount = selectedServices.reduce((sum, s) => {
                const cost = parseFloat(s.custom_cost) || 0;
                const discount = parseFloat(s.discount_percentage) || 0;
                return sum + (cost * discount / 100);
            }, 0);
            
            let additionalDiscount = 0;
            if (data.discount_type === 'percentage') {
                const discountPercent = parseFloat(data.discount) || 0;
                additionalDiscount = subtotal * (discountPercent / 100);
            } else {
                additionalDiscount = parseFloat(data.discount_fixed) || 0;
            }
            
            const totalDiscount = servicesDiscount + additionalDiscount;
            const grandTotal = Math.max(0, subtotal - totalDiscount);
            
            return {
                subtotal,
                totalDiscount,
                grandTotal,
                isServiceBased: true,
            };
        } else {
            const fee = parseFloat(data.fee) || 0;
            let discountAmount = 0;
            
            if (data.discount_type === 'percentage') {
                const discountPercent = parseFloat(data.discount) || 0;
                discountAmount = fee * (discountPercent / 100);
            } else {
                discountAmount = parseFloat(data.discount_fixed) || 0;
            }
            
            const finalFee = Math.max(0, fee - discountAmount);
            
            return {
                subtotal: fee,
                totalDiscount: discountAmount,
                grandTotal: finalFee,
                isServiceBased: false,
            };
        }
    };

    const totals = calculateTotals();

    // Filtered lists for dropdowns
    const filteredPatients = useMemo(() => {
        if (!patientSearchQuery.trim()) return patients.slice(0, 5);
        const q = patientSearchQuery.toLowerCase();
        return patients
            .filter(p =>
                p.full_name.toLowerCase().includes(q) ||
                p.patient_id.toLowerCase().includes(q)
            )
            .slice(0, 5);
    }, [patients, patientSearchQuery]);

    const filteredDepartments = useMemo(() => {
        if (!departmentSearchQuery.trim()) return departments.slice(0, 5);
        const q = departmentSearchQuery.toLowerCase();
        return departments
            .filter(d => d.name.toLowerCase().includes(q))
            .slice(0, 5);
    }, [departments, departmentSearchQuery]);

    const filteredDoctors = useMemo(() => {
        if (!doctorSearchQuery.trim()) return doctors.slice(0, 5);
        const q = doctorSearchQuery.toLowerCase();
        return doctors
            .filter(d =>
                d.full_name.toLowerCase().includes(q) ||
                d.doctor_id.toLowerCase().includes(q)
            )
            .slice(0, 5);
    }, [doctors, doctorSearchQuery]);

    // Handle patient selection
    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setData('patient_id', patient.id.toString());
        setPatientSearchQuery('');
        setSelectedPatientIndex(-1);
    };

    const handleClearPatient = () => {
        setSelectedPatient(null);
        setData('patient_id', '');
    };

    // Handle department selection
    const handleSelectDepartment = (department: Department) => {
        setSelectedDepartmentObj(department);
        setData('department_id', department.id.toString());
        setDepartmentSearchQuery('');
        setSelectedDepartmentIndex(-1);
        setSelectedServices([]); // Clear services when department changes
    };

    const handleClearDepartment = () => {
        setSelectedDepartmentObj(null);
        setData('department_id', '');
        setSelectedServices([]); // Clear services
    };

    // Handle doctor selection
    const handleSelectDoctor = (doctor: Doctor) => {
        setSelectedDoctorObj(doctor);
        setData('doctor_id', doctor.id.toString());
        setData('fee', doctor.fees);
        setDoctorSearchQuery('');
        setSelectedDoctorIndex(-1);
    };

    const handleClearDoctor = () => {
        setSelectedDoctorObj(null);
        setData('doctor_id', '');
        setData('fee', '');
    };

    // Render filtered results dropdown
    const renderPatientResults = () => {
        if (!patientSearchQuery) return null;
        if (filteredPatients.length === 0) {
            return (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No patients found
                </div>
            );
        }
        return filteredPatients.map((patient, index) => (
            <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3 ${
                    index === selectedPatientIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
            >
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                    <p className="font-medium text-sm">{patient.full_name}</p>
                    <p className="text-xs text-muted-foreground">{patient.patient_id}</p>
                </div>
            </button>
        ));
    };

    const renderDepartmentResults = () => {
        if (!departmentSearchQuery) return null;
        if (filteredDepartments.length === 0) {
            return (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No departments found
                </div>
            );
        }
        return filteredDepartments.map((dept, index) => (
            <button
                key={dept.id}
                onClick={() => handleSelectDepartment(dept)}
                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3 ${
                    index === selectedDepartmentIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
            >
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                    <p className="font-medium text-sm">{dept.name}</p>
                </div>
            </button>
        ));
    };

    const renderDoctorResults = () => {
        if (!doctorSearchQuery) return null;
        if (filteredDoctors.length === 0) {
            return (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No doctors found
                </div>
            );
        }
        return filteredDoctors.map((doctor, index) => (
            <button
                key={doctor.id}
                onClick={() => handleSelectDoctor(doctor)}
                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3 ${
                    index === selectedDoctorIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
            >
                <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                    <p className="font-medium text-sm">Dr. {doctor.full_name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.specialization} • {doctor.doctor_id}</p>
                </div>
            </button>
        ));
    };

    // Keyboard navigation for search dropdowns
    const handlePatientSearchKeyDown = (e: React.KeyboardEvent) => {
        if (filteredPatients.length === 0) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedPatientIndex(prev =>
                    prev < filteredPatients.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedPatientIndex(prev =>
                    prev > 0 ? prev - 1 : filteredPatients.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedPatientIndex >= 0) {
                    handleSelectPatient(filteredPatients[selectedPatientIndex]);
                }
                break;
            case 'Escape':
                setPatientSearchQuery('');
                setSelectedPatientIndex(-1);
                break;
        }
    };

    const handleDepartmentSearchKeyDown = (e: React.KeyboardEvent) => {
        if (filteredDepartments.length === 0) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedDepartmentIndex(prev =>
                    prev < filteredDepartments.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedDepartmentIndex(prev =>
                    prev > 0 ? prev - 1 : filteredDepartments.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedDepartmentIndex >= 0) {
                    handleSelectDepartment(filteredDepartments[selectedDepartmentIndex]);
                }
                break;
            case 'Escape':
                setDepartmentSearchQuery('');
                setSelectedDepartmentIndex(-1);
                break;
        }
    };

    const handleDoctorSearchKeyDown = (e: React.KeyboardEvent) => {
        if (filteredDoctors.length === 0) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedDoctorIndex(prev =>
                    prev < filteredDoctors.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedDoctorIndex(prev =>
                    prev > 0 ? prev - 1 : filteredDoctors.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedDoctorIndex >= 0) {
                    handleSelectDoctor(filteredDoctors[selectedDoctorIndex]);
                }
                break;
            case 'Escape':
                setDoctorSearchQuery('');
                setSelectedDoctorIndex(-1);
                break;
        }
    };

    // Service search handlers
    const getFilteredServicesForService = (currentServiceId: string): DepartmentService[] => {
        const query = serviceSearchQueries[currentServiceId] || '';
        const allOptions = getAvailableServiceOptions(currentServiceId);
        
        if (!query.trim()) {
            return availableServices
                .filter(s => !selectedServices
                    .filter(sel => sel.id !== currentServiceId)
                    .map(sel => sel.department_service_id)
                    .includes(s.id.toString()))
                .slice(0, 5);
        }
        
        const q = query.toLowerCase();
        return availableServices
            .filter(s => 
                !selectedServices
                    .filter(sel => sel.id !== currentServiceId)
                    .map(sel => sel.department_service_id)
                    .includes(s.id.toString()) &&
                s.name.toLowerCase().includes(q)
            )
            .slice(0, 5);
    };

    const handleSelectService = (serviceId: string, service: DepartmentService) => {
        updateService(serviceId, 'department_service_id', service.id.toString());
        setServiceSearchQueries(prev => ({ ...prev, [serviceId]: '' }));
        setSelectedServiceIndices(prev => ({ ...prev, [serviceId]: -1 }));
    };

    const renderServiceResults = (serviceId: string) => {
        const query = serviceSearchQueries[serviceId] || '';
        const filteredServices = getFilteredServicesForService(serviceId);
        
        if (!query) return null;
        if (filteredServices.length === 0) {
            return (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No services found
                </div>
            );
        }
        
        return filteredServices.map((service, index) => (
            <button
                key={service.id}
                onClick={() => handleSelectService(serviceId, service)}
                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3 ${
                    index === (selectedServiceIndices[serviceId] ?? -1) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
            >
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                    <p className="font-medium text-sm">{service.name}</p>
                    <p className="text-xs text-muted-foreground">؋{service.base_cost}</p>
                </div>
            </button>
        ));
    };

    const handleServiceSearchKeyDown = (e: React.KeyboardEvent, serviceId: string) => {
        const filteredServices = getFilteredServicesForService(serviceId);
        if (filteredServices.length === 0) return;
        
        const currentIndex = selectedServiceIndices[serviceId] ?? -1;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedServiceIndices(prev => ({
                    ...prev,
                    [serviceId]: currentIndex < filteredServices.length - 1 ? currentIndex + 1 : 0
                }));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedServiceIndices(prev => ({
                    ...prev,
                    [serviceId]: currentIndex > 0 ? currentIndex - 1 : filteredServices.length - 1
                }));
                break;
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    handleSelectService(serviceId, filteredServices[currentIndex]);
                }
                break;
            case 'Escape':
                setServiceSearchQueries(prev => ({ ...prev, [serviceId]: '' }));
                setSelectedServiceIndices(prev => ({ ...prev, [serviceId]: -1 }));
                break;
        }
    };

    const getAvailableServiceOptions = (currentServiceId: string) => {
        const selectedIds = selectedServices
            .filter(s => s.id !== currentServiceId)
            .map(s => s.department_service_id);
        
        return availableServices
            .filter(s => !selectedIds.includes(s.id.toString()))
            .map(s => ({
                value: s.id.toString(),
                label: s.name,
                subtitle: `؋${s.base_cost}`,
                icon: <Package className="h-4 w-4 text-amber-600" />
            }));
    };

    // Prepare an appointment object for printing. Hooks must be at top-level of component.
    const appointmentForPrint = useMemo(() => {
        if (!printAppointment) return null;

        const backendHasServices = Array.isArray(printAppointment.services) && printAppointment.services.length > 0;
        if (backendHasServices) return printAppointment;

        const sourceServices = (submittedServicesRef.current && submittedServicesRef.current.length > 0)
            ? submittedServicesRef.current
            : selectedServices;

        if (!sourceServices || sourceServices.length === 0) return printAppointment;

        const mappedServices = sourceServices.map(s => ({
            id: s.department_service_id ? parseInt(s.department_service_id, 10) : 0,
            name: s.name,
            pivot: {
                custom_cost: parseFloat(String(s.custom_cost)) || 0,
                discount_percentage: parseFloat(String(s.discount_percentage)) || 0,
                final_cost: typeof s.final_cost === 'number' ? s.final_cost : (parseFloat(String(s.custom_cost)) || 0),
            }
        }));

        return { ...printAppointment, services: mappedServices };
    }, [printAppointment, selectedServices]);

    return (
        <HospitalLayout>
            <Head title="Schedule New Appointment" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title="Schedule New Appointment" />
                            <p className="text-sm text-muted-foreground mt-1">Create a new appointment for a patient with their preferred doctor</p>
                        </div>
                        
                        <Link href="/appointments">
                            <Button variant="outline" size="sm" className="shadow-sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Appointments
                            </Button>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Hidden input for services - backup for form submission */}
                        <input type="hidden" name="services" value={JSON.stringify(selectedServices.map(s => ({
                            department_service_id: s.department_service_id,
                            custom_cost: parseFloat(s.custom_cost) || 0,
                            discount_percentage: parseFloat(s.discount_percentage) || 0,
                            is_lab_test: s.is_lab_test || false,
                        })).filter((s: any) => s.department_service_id !== ''))} />

                        <Card className="shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Users className="h-6 w-6 text-blue-600" />
                                    Schedule Appointment
                                </CardTitle>
                                <CardDescription className="text-base">Fill in all appointment details including patient, doctor, services and costs</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6">
                                {/* Section 1: Patient & Doctor Selection */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
                                        <Users className="h-5 w-5" />
                                        Patient & Doctor Selection
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Patient Search */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold flex items-center gap-2">
                                                <User className="h-4 w-4 text-blue-600" />
                                                Patient *
                                            </Label>
                                            {selectedPatient ? (
                                                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                            <User className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{selectedPatient.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">ID: {selectedPatient.patient_id}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={handleClearPatient} aria-label="Clear patient">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            ref={patientSearchRef}
                                                            placeholder="Search patient by name or ID..."
                                                            value={patientSearchQuery}
                                                            onChange={e => {
                                                                setPatientSearchQuery(e.target.value);
                                                                setSelectedPatientIndex(-1);
                                                            }}
                                                            onKeyDown={handlePatientSearchKeyDown}
                                                            className="pl-9 pr-9"
                                                        />
                                                        {patientSearchQuery && (
                                                            <Button
                                                                variant="ghost" size="sm"
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                                                onClick={() => setPatientSearchQuery('')}
                                                                tabIndex={-1}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {patientSearchQuery && (
                                                        <div className="border rounded-md divide-y overflow-hidden max-h-64 overflow-y-auto shadow-md">
                                                            {renderPatientResults()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {errors.patient_id && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {errors.patient_id}
                                                </p>
                                            )}
                                        </div>

                                        {/* Department Search */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-purple-600" />
                                                Department <span className="text-green-600 text-xs font-normal">(Optional)</span>
                                            </Label>
                                            {selectedDepartmentObj ? (
                                                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                                            <Building2 className="h-4 w-4 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{selectedDepartmentObj.name}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={handleClearDepartment} aria-label="Clear department">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            ref={departmentSearchRef}
                                                            placeholder="Search department..."
                                                            value={departmentSearchQuery}
                                                            onChange={e => {
                                                                setDepartmentSearchQuery(e.target.value);
                                                                setSelectedDepartmentIndex(-1);
                                                            }}
                                                            onKeyDown={handleDepartmentSearchKeyDown}
                                                            className="pl-9 pr-9"
                                                        />
                                                        {departmentSearchQuery && (
                                                            <Button
                                                                variant="ghost" size="sm"
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                                                onClick={() => setDepartmentSearchQuery('')}
                                                                tabIndex={-1}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {departmentSearchQuery && (
                                                        <div className="border rounded-md divide-y overflow-hidden max-h-64 overflow-y-auto shadow-md">
                                                            {renderDepartmentResults()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {errors.department_id && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {errors.department_id}
                                                </p>
                                            )}
                                        </div>

                                        {/* Doctor Search */}
                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold flex items-center gap-2">
                                                <Stethoscope className="h-4 w-4 text-green-600" />
                                                Doctor <span className="text-green-600 text-xs font-normal">(Optional)</span>
                                            </Label>
                                            {selectedDoctorObj ? (
                                                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                            <Stethoscope className="h-4 w-4 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">Dr. {selectedDoctorObj.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{selectedDoctorObj.specialization}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={handleClearDoctor} aria-label="Clear doctor">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            ref={doctorSearchRef}
                                                            placeholder="Search doctor by name or ID..."
                                                            value={doctorSearchQuery}
                                                            onChange={e => {
                                                                setDoctorSearchQuery(e.target.value);
                                                                setSelectedDoctorIndex(-1);
                                                            }}
                                                            onKeyDown={handleDoctorSearchKeyDown}
                                                            className="pl-9 pr-9"
                                                        />
                                                        {doctorSearchQuery && (
                                                            <Button
                                                                variant="ghost" size="sm"
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                                                onClick={() => setDoctorSearchQuery('')}
                                                                tabIndex={-1}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {doctorSearchQuery && (
                                                        <div className="border rounded-md divide-y overflow-hidden max-h-64 overflow-y-auto shadow-md">
                                                            {renderDoctorResults()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {errors.doctor_id && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {errors.doctor_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-8"></div>

                                {/* Section 2: Department Services */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                                        <Package className="h-5 w-5" />
                                        {data.department_id && departments.find(d => d.id.toString() === data.department_id)?.name === 'Laboratory' 
                                            ? 'Laboratory Tests' 
                                            : 'Department Services'}
                                    </h3>
                                    
                                    {!data.department_id ? (
                                        <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg">
                                            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>Please select a department first to view available services</p>
                                        </div>
                                    ) : availableServices.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg">
                                            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>No services available for this department</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-sm text-muted-foreground">
                                                    {selectedServices.length} service(s) added
                                                </span>
                                                <Button
                                                    type="button"
                                                    onClick={addService}
                                                    disabled={availableServices.length === 0}
                                                    variant="outline"
                                                    className="bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    {data.department_id && departments.find(d => d.id.toString() === data.department_id)?.name === 'Laboratory' 
                                                        ? 'Add Lab Test' 
                                                        : 'Add Service'}
                                                </Button>
                                            </div>

                                            {selectedServices.length > 0 && (
                                                <div className="space-y-4">
                                                    {selectedServices.map((service, index) => (
                                                        <div 
                                                            key={service.id} 
                                                            className="border rounded-lg p-4 bg-gray-50/50 space-y-4"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-semibold text-indigo-700">
                                                                    {data.department_id && departments.find(d => d.id.toString() === data.department_id)?.name === 'Laboratory' 
                                                                        ? `Lab Test #${index + 1}` 
                                                                        : `Service #${index + 1}`}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => removeService(service.id)}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                                <div className="md:col-span-2">
                                                                    <Label className="text-sm font-medium">Service</Label>
                                                                    {selectedServices.find(s => s.id === service.id)?.name ? (
                                                                        <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                                                                    <Package className="h-4 w-4 text-amber-600" />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-medium text-sm">{selectedServices.find(s => s.id === service.id)?.name}</p>
                                                                                </div>
                                                                            </div>
                                                                            <Button 
                                                                                variant="ghost" 
                                                                                size="sm" 
                                                                                onClick={() => {
                                                                                    updateService(service.id, 'department_service_id', '');
                                                                                    updateService(service.id, 'name', '');
                                                                                }}
                                                                                aria-label="Clear service"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            <div className="relative">
                                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                                <Input
                                                                                    placeholder="Search service..."
                                                                                    value={serviceSearchQueries[service.id] || ''}
                                                                                    onChange={e => {
                                                                                        setServiceSearchQueries(prev => ({
                                                                                            ...prev,
                                                                                            [service.id]: e.target.value
                                                                                        }));
                                                                                        setSelectedServiceIndices(prev => ({
                                                                                            ...prev,
                                                                                            [service.id]: -1
                                                                                        }));
                                                                                    }}
                                                                                    onKeyDown={(e) => handleServiceSearchKeyDown(e, service.id)}
                                                                                    className="pl-9 pr-9"
                                                                                />
                                                                                {(serviceSearchQueries[service.id]) && (
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                                                                        onClick={() => {
                                                                                            setServiceSearchQueries(prev => ({
                                                                                                ...prev,
                                                                                                [service.id]: ''
                                                                                            }));
                                                                                        }}
                                                                                        tabIndex={-1}
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </Button>
                                                                                )}
                                                                            </div>
                                                                            {(serviceSearchQueries[service.id]) && (
                                                                                <div className="border rounded-md divide-y overflow-hidden max-h-48 overflow-y-auto shadow-md">
                                                                                    {renderServiceResults(service.id)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                <div>
                                                                    <Label className="text-sm font-medium">Cost (؋)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        value={service.custom_cost}
                                                                        onChange={(e) => updateService(service.id, 'custom_cost', e.target.value)}
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                                
                                                                <div>
                                                                    <Label className="text-sm font-medium">Discount (%)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        max="100"
                                                                        value={service.discount_percentage}
                                                                        onChange={(e) => updateService(service.id, 'discount_percentage', e.target.value)}
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex justify-end items-center gap-2 text-sm">
                                                                <span className="text-muted-foreground">Final Cost:</span>
                                                                <span className="font-bold text-indigo-700 text-lg">
                                                                    ؋{service.final_cost.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {errors.services && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {errors.services}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="border-t pt-8"></div>

                                {/* Section 3: Cost Summary */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-700">
                                        <Calculator className="h-5 w-5" />
                                        Cost Summary
                                    </h3>
                                    {!totals.isServiceBased ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="fee" className="text-base font-semibold">
                                                    Consultation Fee {data.doctor_id ? '' : '*'}
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-lg font-bold text-muted-foreground">؋</span>
                                                    <Input
                                                        id="fee"
                                                        name="fee"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.fee}
                                                        onChange={handleChange}
                                                        placeholder="0.00"
                                                        className={`pl-11 h-12 text-base ${!data.doctor_id ? '' : 'bg-muted/50'}`}
                                                        readOnly={!!data.doctor_id}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {data.doctor_id 
                                                        ? "📌 Auto-filled from selected doctor" 
                                                        : "Enter consultation fee manually"}
                                                </p>
                                                {errors.fee && (
                                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                                        <span className="font-medium">⚠</span> {errors.fee}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-base font-semibold">Discount Type</Label>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={data.discount_type === 'percentage' ? 'default' : 'outline'}
                                                        onClick={() => setData('discount_type', 'percentage')}
                                                        className="flex-1 h-12 text-sm"
                                                    >
                                                        <Percent className="h-4 w-4 mr-1" />
                                                        Percentage
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={data.discount_type === 'fixed' ? 'default' : 'outline'}
                                                        onClick={() => setData('discount_type', 'fixed')}
                                                        className="flex-1 h-12 text-sm"
                                                    >
                                                        <span className="mr-1">؋</span>
                                                        Fixed
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="discount_value" className="text-base font-semibold">
                                                    Discount {data.discount_type === 'percentage' ? '(%)' : '(؋)'}
                                                </Label>
                                                <div className="relative">
                                                    {data.discount_type === 'percentage' ? (
                                                        <Percent className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                                    ) : (
                                                        <span className="absolute left-3 top-3 text-lg font-bold text-muted-foreground">؋</span>
                                                    )}
                                                    <Input
                                                        id="discount_value"
                                                        name={data.discount_type === 'percentage' ? 'discount' : 'discount_fixed'}
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max={data.discount_type === 'percentage' ? 100 : undefined}
                                                        value={data.discount_type === 'percentage' ? data.discount : data.discount_fixed}
                                                        onChange={handleChange}
                                                        placeholder="0"
                                                        className="pl-11 h-12 text-base"
                                                    />
                                                </div>
                                                {errors.discount && (
                                                    <p className="text-sm text-red-600 flex items-center gap-1">
                                                        <span className="font-medium">⚠</span> {errors.discount}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2 md:col-start-3">
                                                <Label className="text-base font-semibold">Final Amount *</Label>
                                                <div className="flex items-center h-12 px-4 py-3 border-2 border-amber-500 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
                                                    <span className="text-2xl font-bold mr-2 text-amber-600">؋</span>
                                                    <span className="font-bold text-2xl text-amber-700">{totals.grandTotal.toFixed(2)}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">💰 Amount after discount</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                {selectedServices.map((service, index) => (
                                                    <div key={service.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                                        <div>
                                                            <span className="font-medium">{service.name || `${data.department_id && departments.find(d => d.id.toString() === data.department_id)?.name === 'Laboratory' ? 'Lab Test' : 'Service'} #${index + 1}`}</span>
                                                            <span className="text-sm text-muted-foreground ml-2">
                                                                (؋{parseFloat(service.custom_cost || '0').toFixed(2)} 
                                                                {parseFloat(service.discount_percentage || '0') > 0 && (
                                                                    <span className="text-green-600"> - {service.discount_percentage}%</span>
                                                                )})
                                                            </span>
                                                        </div>
                                                        <span className="font-semibold">؋{service.final_cost.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="border-t pt-4 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-semibold">Additional Discount Type</Label>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant={data.discount_type === 'percentage' ? 'default' : 'outline'}
                                                                onClick={() => setData('discount_type', 'percentage')}
                                                                className="flex-1 h-10 text-xs"
                                                            >
                                                                <Percent className="h-3 w-3 mr-1" />
                                                                Percentage
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant={data.discount_type === 'fixed' ? 'default' : 'outline'}
                                                                onClick={() => setData('discount_type', 'fixed')}
                                                                className="flex-1 h-10 text-xs"
                                                            >
                                                                <span className="mr-1">؋</span>
                                                                Fixed
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount_value_services" className="text-sm font-semibold">
                                                            Additional Discount {data.discount_type === 'percentage' ? '(%)' : '(؋)'}
                                                        </Label>
                                                        <div className="relative">
                                                            {data.discount_type === 'percentage' ? (
                                                                <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <span className="absolute left-3 top-2 text-base font-bold text-muted-foreground">؋</span>
                                                            )}
                                                            <Input
                                                                id="discount_value_services"
                                                                name={data.discount_type === 'percentage' ? 'discount' : 'discount_fixed'}
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max={data.discount_type === 'percentage' ? 100 : undefined}
                                                                value={data.discount_type === 'percentage' ? data.discount : data.discount_fixed}
                                                                onChange={handleChange}
                                                                placeholder="0"
                                                                className="pl-10 h-10 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Subtotal:</span>
                                                    <span className="font-medium">؋{totals.subtotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-green-600">
                                                    <span>Total Discount:</span>
                                                    <span className="font-medium">-؋{totals.totalDiscount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t">
                                                    <span className="text-lg font-bold">Grand Total:</span>
                                                    <div className="flex items-center h-12 px-6 py-3 border-2 border-amber-500 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
                                                        <span className="text-2xl font-bold mr-2 text-amber-600">؋</span>
                                                        <span className="font-bold text-2xl text-amber-700">{totals.grandTotal.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                                
                        <div className="flex justify-end space-x-4 pb-8">
                            <Link href="/appointments">
                                <Button type="button" variant="outline" size="lg" className="shadow-md">
                                    Cancel
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={processing} 
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-white"
                            >
                                <Save className="mr-2 h-5 w-5" />
                                {processing ? 'Scheduling...' : 'Schedule Appointment'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Show appropriate print modal based on whether services were selected */}
            {(() => {
                console.log('[RENDER] Modal check - printType:', printType, 'showPrintModal:', showPrintModal);
                return null;
            })()}

            {printType === 'department' && (
                <DepartmentPrint
                    isOpen={showPrintModal}
                    onClose={handlePrintModalClose}
                    appointment={appointmentForPrint ?? null}
                />
            )}

            {printType === 'doctor' && (
                <AppointmentPrintModal
                    isOpen={showPrintModal}
                    onClose={handlePrintModalClose}
                    appointment={appointmentForPrint ?? null}
                />
            )}
        </HospitalLayout>
    );
}
