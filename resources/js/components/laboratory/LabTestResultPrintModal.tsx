import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
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
            address?: string | null;
        };
        labTest?: {
            name: string;
            category: string;
            sample_type?: string | null;
            reference_ranges?: Record<string, {
                min?: number;
                max?: number;
                unit?: string;
                male?: { min: number; max: number };
                female?: { min: number; max: number };
            }>;
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

    // Get reference ranges from labTest
    const getReferenceRange = (parameterId: string, parameterName: string) => {
        const refRanges = labTestResult?.labTest?.reference_ranges;
        if (!refRanges) return { min: 0, max: 0 };
        
        // Try to find by parameter_id first, then by parameter name
        const range = refRanges[parameterId] || refRanges[parameterName];
        if (!range) return { min: 0, max: 0 };
        
        return {
            min: range.min ?? 0,
            max: range.max ?? 0
        };
    };

    const parsedResults = useMemo(() => {
        if (!labTestResult?.results) return [];
        try {
            const resultsData = typeof labTestResult.results === 'string'
                ? JSON.parse(labTestResult.results)
                : labTestResult.results;

            if (Array.isArray(resultsData)) {
                return resultsData.map((item: ResultParameter) => {
                    const refRange = getReferenceRange(item.parameter_id || item.name, item.name);
                    return {
                        parameter_id: item.parameter_id || item.name,
                        name: item.name || item.parameter_id,
                        value: String(item.value),
                        unit: item.unit || '',
                        referenceMin: item.referenceMin || refRange.min,
                        referenceMax: item.referenceMax || refRange.max,
                        status: item.status || 'normal',
                        notes: item.notes || '',
                    };
                });
            }

            return Object.entries(resultsData).map(([key, value]: [string, unknown]) => {
                const val = value as { 
                    value: number | string; 
                    unit: string; 
                    status: string; 
                    notes?: string; 
                    name?: string;
                    referenceMin?: number;
                    referenceMax?: number;
                    referenceRange?: { min: number; max: number };
                };
                const refRange = getReferenceRange(key, val.name || key);
                return {
                    parameter_id: key,
                    name: val.name || key,
                    value: String(val.value ?? ''),
                    unit: val.unit || '',
                    referenceMin: val.referenceMin || val.referenceRange?.min || refRange.min,
                    referenceMax: val.referenceMax || val.referenceRange?.max || refRange.max,
                    status: (val.status as 'normal' | 'abnormal' | 'critical') || 'normal',
                    notes: val.notes || '',
                };
            });
        } catch (e) {
            console.error('Failed to parse results:', e);
            return [];
        }
    }, [labTestResult?.results, labTestResult?.labTest?.reference_ranges]);

    const handlePrint = () => {
        if (!printRef.current || !labTestResult) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printStyles = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @page { size: A4; margin: 20mm; }
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.6;
                    background: white;
                    color: #000;
                }
                .print-container {
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 10px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 10px;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #000;
}
                .report-title { 
                    font-size: 16px; 
                    font-weight: bold;
                }
                .patient-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-size: 10px;
                }
                .patient-table td {
                    border: 1px solid #000;
                    padding: 2px 6px;
                }
                .patient-table .label {
                    font-weight: bold;
                    background-color: #f5f5f5;
                    width: 12%;
                }
                .results-section {
                    margin: 10px 0;
                }
                .results-title {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    text-align: center;
                }
                .results-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                }
                .results-table th {
                    border: 1px solid #000;
                    padding: 4px 6px;
                    text-align: left;
                    font-weight: bold;
                    background-color: #f0f0f0;
                }
                .results-table td {
                    border: 1px solid #000;
                    padding: 3px 6px;
                    text-align: left;
                }
                .results-table tr:nth-child(even) {
                    background-color: #fafafa;
                }
                .notes-section {
                    margin: 8px 0;
                    padding: 5px;
                    border: 1px solid #ddd;
                    font-size: 10px;
}
                .notes-title {
                    font-weight: bold;
                    margin-bottom: 3px;
}
                .footer {
                    margin-top: 15px;
                    padding-top: 5px;
                    border-top: 1px solid #000;
                    font-size: 9px;
                    text-align: center;
                    color: #666;
}
                @media print {
                    body { padding: 0; }
                    .print-container { border: none; }
                }
            </style>
        `;

        const patientName = labTestResult.patient?.first_name || 'N/A';
        const age = labTestResult.patient?.age ? `${labTestResult.patient.age} Year` : 'N/A';
        const gender = labTestResult.patient?.gender || 'N/A';
        const phone = labTestResult.patient?.phone || 'N/A';
        const address = labTestResult.patient?.address || 'N/A';
        const receiptNo = labTestResult.result_id || 'N/A';
        const userName = labTestResult.performedBy?.name || 'N/A';
        const testDate = labTestResult.performed_at ? new Date(labTestResult.performed_at).toLocaleDateString('en-US') : 'N/A';
        const printDate = new Date().toLocaleDateString('en-US');
        const testName = labTestResult.labTest?.name || '';
        const notes = labTestResult.notes;

        const referenceRangeText = (min: number, max: number, unit: string) => {
            if (min === 0 && max === 0) return '-';
            return `${min} - ${max} ${unit}`;
        };

        const resultsRows = parsedResults.map(result => `
            <tr>
                <td>${result.name}</td>
                <td>${result.value}</td>
                <td>${result.unit || '-'}</td>
                <td>${referenceRangeText(result.referenceMin, result.referenceMax, result.unit)}</td>
            </tr>
        `).join('');

        const notesSection = notes ? `
            <div class="notes-section">
                <div class="notes-title">Notes:</div>
                <div>${notes}</div>
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
                    <table class="patient-table">
                        <tr>
                            <td class="label">Receipt No:</td>
                            <td>${receiptNo}</td>
                            <td class="label">User:</td>
                            <td>${userName}</td>
                        </tr>
                        <tr>
                            <td class="label">Name:</td>
                            <td>${patientName}</td>
                            <td class="label">Contact No:</td>
                            <td>${phone}</td>
                        </tr>
                        <tr>
                            <td class="label">Age:</td>
                            <td>${age}</td>
                            <td class="label">Gender:</td>
                            <td>${gender}</td>
                        </tr>
                        <tr>
                            <td class="label">Date:</td>
                            <td>${testDate}</td>
                            <td class="label">Print Date:</td>
                            <td>${printDate}</td>
                        </tr>
                        <tr>
                            <td class="label">Address:</td>
                            <td colspan="3">${address}</td>
                        </tr>
                    </table>
                    
                    <div class="results-section">
                        <div class="results-title">${testName || 'Test Results'}</div>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Test</th>
                                    <th>Result</th>
                                    <th>Unit</th>
                                    <th>Reference Range</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${resultsRows}
                            </tbody>
                        </table>
                    </div>
                    
                    ${notesSection}
                    
                    <div class="footer">
                        Printed on: ${new Date().toLocaleString('en-US')}
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

    const patientName = labTestResult.patient?.first_name || 'N/A';
    const age = labTestResult.patient?.age ? `${labTestResult.patient.age} Year` : 'N/A';
    const gender = labTestResult.patient?.gender || 'N/A';
    const phone = labTestResult.patient?.phone || 'N/A';
    const address = labTestResult.patient?.address || 'N/A';
    const receiptNo = labTestResult.result_id || 'N/A';
    const userName = labTestResult.performedBy?.name || 'N/A';
    const testDate = labTestResult.performed_at ? new Date(labTestResult.performed_at).toLocaleDateString('en-US') : 'N/A';
    const printDate = new Date().toLocaleDateString('en-US');
    const testName = labTestResult.labTest?.name || 'Lab Test';

        const referenceRangeText = (min: number, max: number, unit: string) => {
            if (min === 0 && max === 0) return '-';
            return `${min} - ${max} ${unit}`;
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
                    {/* Patient Info */}
                    <table className="w-full border-collapse mb-4 text-xs">
                        <tbody>
                            <tr>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100 w-1/6">Receipt No:</td>
                                <td className="border border-gray-400 px-1 py-0.5">{receiptNo}</td>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100 w-1/6">User:</td>
                                <td className="border border-gray-400 px-1 py-0.5">{userName}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100">Name:</td>
                                <td className="border border-gray-400 px-1 py-0.5">{patientName}</td>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100">Contact No:</td>
                                <td className="border border-gray-400 px-1 py-0.5">{phone}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100">Age:</td>
                                <td className="border border-gray-400 px-1 py-0.5">{age}</td>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100">Gender:</td>
                                <td className="border border-gray-400 px-1 py-0.5">{gender}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100">Date:</td>
                                <td className="border border-gray-400 px-1 py-0.5">{testDate}</td>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100">Print Date:</td>
                                <td className="border border-gray-400 px-1 py-0.5">{printDate}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-400 px-1 py-0.5 font-semibold bg-gray-100">Address:</td>
                                <td className="border border-gray-400 px-1 py-0.5" colSpan={3}>{address}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Results Table */}
                    <div className="mb-4">
                        <h3 className="text-center font-bold text-sm mb-2">{testName || 'Test Results'}</h3>
                        <div className="border rounded overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left py-1 px-2 font-semibold border">Test</th>
                                        <th className="text-left py-1 px-2 font-semibold border">Result</th>
                                        <th className="text-left py-1 px-2 font-semibold border">Unit</th>
                                        <th className="text-left py-1 px-2 font-semibold border">Reference Range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedResults.length > 0 ? (
                                        parsedResults.map((result, index) => (
                                            <tr key={result.parameter_id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="py-1 px-2 border">{result.name}</td>
                                                <td className="py-1 px-2 border">{result.value}</td>
                                                <td className="py-1 px-2 border">{result.unit || '-'}</td>
                                                <td className="py-1 px-2 border">{referenceRangeText(result.referenceMin, result.referenceMax, result.unit)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-2 px-2 text-center text-gray-500">
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
                        <div className="mb-4 p-2 bg-gray-50 rounded border text-xs">
                            <h4 className="font-bold mb-1">Notes:</h4>
                            <p>{labTestResult.notes}</p>
                        </div>
                    )}

                    {/* Simple Footer */}
                    <div className="text-center text-xs text-gray-500 mt-4 pt-2 border-t">
                        Printed on: {new Date().toLocaleString('en-US')}
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
