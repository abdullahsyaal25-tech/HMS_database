import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useRef, useMemo } from 'react';

interface ResultParameter {
    parameter_id: string;
    name: string;
    value: string;
    unit: string;
    referenceMin: number;
    referenceMax: number;
    status: 'normal' | 'abnormal' | 'critical';
    notes?: string;
}

interface LabTestResultPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    labTestResult: {
        result_id: string;
        patient?: {
            first_name: string | null;
            father_name: string | null;
            patient_id: string;
            age: number | null;
            gender: string | null;
            blood_group: string | null;
            phone: string | null;
        };
        labTest?: {
            name: string;
            category: string;
            sample_type?: string | null;
        };
        performedBy?: { name: string };
        performed_at: string;
        results: string;
        notes: string | null;
        status: string;
    } | null;
}

export function LabTestResultPrintModal({ isOpen, onClose, labTestResult }: LabTestResultPrintModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const parsedResults = useMemo(() => {
        if (!labTestResult?.results) return [];
        try {
            const resultsData = typeof labTestResult.results === 'string'
                ? JSON.parse(labTestResult.results)
                : labTestResult.results;

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
    }, [labTestResult?.results]);

    const handlePrint = () => {
        if (!printRef.current || !labTestResult) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printStyles = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @page { size: A4; margin: 15mm; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11px;
                    line-height: 1.5;
                    background: white;
                    color: #333;
                }
                .print-container {
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px double #000;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .logo { width: 70px; height: auto; margin-bottom: 8px; }
                .hospital-name-farsi { 
                    font-size: 20px; 
                    font-weight: bold; 
                    margin: 5px 0;
                    font-family: 'Arial', sans-serif;
                }
                .hospital-name { 
                    font-size: 16px; 
                    font-weight: bold; 
                    margin: 3px 0;
                    color: #1a365d;
                }
                .report-title { 
                    font-size: 14px; 
                    color: #666;
                    margin-top: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .info-sections {
                    display: flex;
                    gap: 30px;
                    margin: 20px 0;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #ccc;
                }
                .info-column {
                    flex: 1;
                }
                .section-title {
                    font-size: 11px;
                    font-weight: bold;
                    border-bottom: 2px solid #333;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    color: #1a365d;
                }
                .info-row { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 4px 0;
                    border-bottom: 1px dotted #ddd;
                }
                .info-label { 
                    font-weight: 600; 
                    color: #555; 
                    font-size: 10px;
                }
                .info-value { 
                    text-align: right; 
                    font-weight: 500; 
                    font-size: 10px;
                    color: #333;
                }
                .results-section {
                    margin: 20px 0;
                }
                .results-title {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #1a365d;
                    text-transform: uppercase;
                }
                .results-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .results-table th {
                    background-color: #f0f4f8;
                    border: 1px solid #ccc;
                    padding: 8px 6px;
                    text-align: left;
                    font-size: 10px;
                    font-weight: bold;
                    color: #1a365d;
                    text-transform: uppercase;
                }
                .results-table td {
                    border: 1px solid #ddd;
                    padding: 6px;
                    font-size: 10px;
                }
                .results-table tr:nth-child(even) {
                    background-color: #fafafa;
                }
                .status-normal { color: #16a34a; font-weight: 600; }
                .status-abnormal { color: #ea580c; font-weight: 600; }
                .status-critical { color: #dc2626; font-weight: 600; }
                .reference-range {
                    font-size: 9px;
                    color: #666;
                }
                .notes-section {
                    margin: 20px 0;
                    padding: 12px;
                    background-color: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 4px;
                }
                .notes-title {
                    font-size: 11px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #374151;
                }
                .notes-content {
                    font-size: 10px;
                    color: #4b5563;
                    font-style: italic;
                }
                .signatures-section {
                    display: flex;
                    justify-content: space-between;
                    margin: 40px 0 30px;
                    padding-top: 20px;
                }
                .signature-box {
                    text-align: center;
                    width: 150px;
                }
                .signature-line {
                    border-top: 1px solid #333;
                    padding-top: 5px;
                    margin-top: 30px;
                    font-size: 10px;
                    font-weight: 600;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #ccc;
                    font-size: 9px;
                    color: #666;
                }
                .disclaimer {
                    text-align: center;
                    margin-bottom: 10px;
                    font-style: italic;
                }
                .print-timestamp {
                    text-align: right;
                    font-size: 8px;
                    color: #999;
                }
                @media print {
                    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-container { border: none; }
                }
            </style>
        `;

        const patientName = labTestResult.patient?.first_name || 'N/A';
        const fatherName = labTestResult.patient?.father_name || 'N/A';
        const patientId = labTestResult.patient?.patient_id || 'N/A';
        const gender = labTestResult.patient?.gender || 'N/A';
        const age = labTestResult.patient?.age ? `${labTestResult.patient.age} years` : 'N/A';
        const bloodGroup = labTestResult.patient?.blood_group || 'N/A';
        const phone = labTestResult.patient?.phone || 'N/A';
        const testName = labTestResult.labTest?.name || 'N/A';
        const category = labTestResult.labTest?.category || 'N/A';
        const sampleType = labTestResult.labTest?.sample_type || 'N/A';
        const performedBy = labTestResult.performedBy?.name || 'N/A';
        const performedDate = labTestResult.performed_at;
        const resultId = labTestResult.result_id;
        const notes = labTestResult.notes;

        const formatDate = (dateString: string) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const getStatusClass = (status: string) => {
            switch (status) {
                case 'normal': return 'status-normal';
                case 'abnormal': return 'status-abnormal';
                case 'critical': return 'status-critical';
                default: return '';
            }
        };

        const getStatusLabel = (status: string) => {
            switch (status) {
                case 'normal': return 'Normal';
                case 'abnormal': return 'Abnormal';
                case 'critical': return 'Critical';
                default: return status;
            }
        };

        const referenceRangeText = (min: number, max: number) => {
            if (min === 0 && max === 0) return '-';
            return `${min} - ${max}`;
        };

        const resultsRows = parsedResults.map(result => `
            <tr>
                <td><strong>${result.name}</strong></td>
                <td>${result.value}</td>
                <td>${result.unit || '-'}</td>
                <td class="reference-range">${referenceRangeText(result.referenceMin, result.referenceMax)}</td>
                <td class="${getStatusClass(result.status)}">${getStatusLabel(result.status)}</td>
            </tr>
        `).join('');

        const notesSection = notes ? `
            <div class="notes-section">
                <div class="notes-title">Notes:</div>
                <div class="notes-content">${notes}</div>
            </div>
        ` : '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                ${printStyles}
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <img src="/logo.png" alt="Hospital Logo" class="logo" />
                        <div class="hospital-name-farsi">کامران معالیجوي روغتون</div>
                        <div class="hospital-name">Kamran Curative Hospital</div>
                        <div class="report-title">Laboratory Test Report</div>
                    </div>
                    
                    <div class="info-sections">
                        <div class="info-column">
                            <div class="section-title">Patient Information</div>
                            <div class="info-row">
                                <span class="info-label">Patient Name:</span>
                                <span class="info-value">${patientName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Father Name:</span>
                                <span class="info-value">${fatherName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Patient ID:</span>
                                <span class="info-value">${patientId}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Age:</span>
                                <span class="info-value">${age}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Gender:</span>
                                <span class="info-value">${gender}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Blood Group:</span>
                                <span class="info-value">${bloodGroup}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${phone}</span>
                            </div>
                        </div>
                        
                        <div class="info-column">
                            <div class="section-title">Test Information</div>
                            <div class="info-row">
                                <span class="info-label">Result ID:</span>
                                <span class="info-value">${resultId}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Test Name:</span>
                                <span class="info-value">${testName}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Category:</span>
                                <span class="info-value">${category}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Sample Type:</span>
                                <span class="info-value">${sampleType}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Performed By:</span>
                                <span class="info-value">${performedBy}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Performed Date:</span>
                                <span class="info-value">${formatDate(performedDate)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span class="info-value">${labTestResult.status || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="results-section">
                        <div class="results-title">Test Results</div>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th style="width: 30%;">Parameter</th>
                                    <th style="width: 15%;">Result</th>
                                    <th style="width: 15%;">Unit</th>
                                    <th style="width: 25%;">Reference Range</th>
                                    <th style="width: 15%;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${resultsRows}
                            </tbody>
                        </table>
                    </div>
                    
                    ${notesSection}
                    
                    <div class="signatures-section">
                        <div class="signature-box">
                            <div class="signature-line">Lab Technician</div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line">Pathologist</div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <div class="disclaimer">
                            <strong>Disclaimer:</strong> This report is generated for laboratory use only. 
                            Please consult with your physician for interpretation and medical advice.
                            This is a computer-generated report and does not require a physical signature.
                        </div>
                        <div class="print-timestamp">
                            Printed on: ${new Date().toLocaleString('en-US')}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    if (!labTestResult) return null;

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status: 'normal' | 'abnormal' | 'critical') => {
        switch (status) {
            case 'normal':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'abnormal':
                return <AlertCircle className="h-4 w-4 text-orange-600" />;
            case 'critical':
                return <AlertTriangle className="h-4 w-4 text-red-600" />;
            default:
                return null;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'normal':
                return 'text-green-600 bg-green-50';
            case 'abnormal':
                return 'text-orange-600 bg-orange-50';
            case 'critical':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const referenceRangeText = (min: number, max: number) => {
        if (min === 0 && max === 0) return '-';
        return `${min} - ${max}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Laboratory Test Report Preview
                    </DialogTitle>
                </DialogHeader>

                <div ref={printRef} className="bg-white p-6 border rounded-lg">
                    {/* Header */}
                    <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                        <img
                            src="/Logo.png"
                            alt="Hospital Logo"
                            className="mx-auto w-16 h-16 object-contain mb-2"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <h2 className="text-xl font-bold">کامران معالیجوي روغتون</h2>
                        <h3 className="text-lg font-semibold text-gray-700">Kamran Curative Hospital</h3>
                        <p className="text-sm text-gray-600 mt-1">Laboratory Test Report</p>
                    </div>

                    {/* Two Column Info Layout */}
                    <div className="grid grid-cols-2 gap-6 mb-6 border-b pb-4">
                        {/* Patient Information */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-800 border-b pb-1 text-sm uppercase tracking-wide">Patient Information</h3>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Patient Name:</span>
                                <span className="font-medium text-sm">{labTestResult.patient?.first_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Father Name:</span>
                                <span className="font-medium text-sm">{labTestResult.patient?.father_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Patient ID:</span>
                                <span className="font-medium text-sm">{labTestResult.patient?.patient_id || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Age:</span>
                                <span className="font-medium text-sm">{labTestResult.patient?.age ? `${labTestResult.patient.age} years` : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Gender:</span>
                                <span className="font-medium text-sm capitalize">{labTestResult.patient?.gender || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Blood Group:</span>
                                <span className="font-medium text-sm">{labTestResult.patient?.blood_group || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Test Information */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-800 border-b pb-1 text-sm uppercase tracking-wide">Test Information</h3>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Result ID:</span>
                                <span className="font-medium text-sm font-mono">{labTestResult.result_id}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Test Name:</span>
                                <span className="font-medium text-sm">{labTestResult.labTest?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Category:</span>
                                <span className="font-medium text-sm">{labTestResult.labTest?.category || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Sample Type:</span>
                                <span className="font-medium text-sm">{labTestResult.labTest?.sample_type || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Performed By:</span>
                                <span className="font-medium text-sm">{labTestResult.performedBy?.name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600 text-sm">Performed Date:</span>
                                <span className="font-medium text-sm">{formatDate(labTestResult.performed_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Test Results</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 border-b">Parameter</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 border-b">Result</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 border-b">Unit</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 border-b">Reference Range</th>
                                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 border-b">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedResults.length > 0 ? (
                                        parsedResults.map((result, index) => (
                                            <tr key={result.parameter_id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="py-2 px-3 text-sm font-medium border-b">{result.name}</td>
                                                <td className="py-2 px-3 text-sm border-b">{result.value}</td>
                                                <td className="py-2 px-3 text-sm text-gray-600 border-b">{result.unit || '-'}</td>
                                                <td className="py-2 px-3 text-sm text-gray-600 border-b">{referenceRangeText(result.referenceMin, result.referenceMax)}</td>
                                                <td className="py-2 px-3 text-sm border-b">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusClass(result.status)}`}>
                                                        {getStatusIcon(result.status)}
                                                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-4 px-3 text-sm text-center text-gray-500">
                                                No results available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {labTestResult.notes && (
                        <div className="mb-6 p-3 bg-gray-50 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 text-sm mb-1">Notes:</h4>
                            <p className="text-sm text-gray-600 italic">{labTestResult.notes}</p>
                        </div>
                    )}

                    {/* Signature Lines */}
                    <div className="flex justify-between mt-8 mb-6">
                        <div className="text-center w-40">
                            <div className="border-t border-gray-400 pt-1 mt-8">
                                <span className="text-sm font-medium text-gray-700">Lab Technician</span>
                            </div>
                        </div>
                        <div className="text-center w-40">
                            <div className="border-t border-gray-400 pt-1 mt-8">
                                <span className="text-sm font-medium text-gray-700">Pathologist</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t">
                        <p className="italic mb-1">
                            <strong>Disclaimer:</strong> This report is for laboratory use only. Please consult with your physician for interpretation.
                        </p>
                        <p className="text-gray-400">Printed on: {new Date().toLocaleString('en-US')}</p>
                    </div>
                </div>

                <div className="flex gap-3 mt-4 no-print">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        <X className="h-4 w-4 mr-2" />
                        Close
                    </Button>
                    <Button onClick={handlePrint} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Report
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
