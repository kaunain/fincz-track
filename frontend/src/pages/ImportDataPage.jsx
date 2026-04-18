import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import { Upload, ChevronRight, FileSpreadsheet, Settings2, CheckCircle2, AlertCircle, ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../components/Card';
import { portfolioAPI } from '../utils/api';
import ImportPreviewModal from '../components/ImportPreviewModal';

const BROKERS = [
  { id: 'zerodha', name: 'Zerodha', description: 'Supports standard holdings CSV export.' },
  { id: 'custom', name: 'Custom CSV', description: 'Upload any CSV and map your own columns.' },
];

const IMPORT_STEPS = [
  { id: 1, label: 'Select Broker', icon: FileSpreadsheet },
  { id: 2, label: 'Upload CSV', icon: Upload },
  { id: 3, label: 'Map Columns', icon: Settings2 },
];

const ImportDataPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ symbol: '', units: '', buyPrice: '' });
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const downloadSampleCSV = () => {
    const headers = ['Symbol', 'Units', 'Buy Price', 'Name', 'Type', 'Date'];
    const rows = [
      ['TCS.NS', '10', '3500.50', 'Tata Consultancy Services', 'stock', '2023-10-01'],
      ['HDFCBANK.NS', '50', '1650.00', 'HDFC Bank', 'stock', '2023-11-15'],
      ['INFY.NS', '25', '1450.75', 'Infosys', 'stock', '2023-12-20']
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fincz_sample_import.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Automatically detect encoding (UTF-8, UTF-16LE, UTF-16BE) using BOM
    const reader = new FileReader();
    reader.onload = (event) => {
      const uint8 = new Uint8Array(event.target.result);
      let encoding = 'UTF-8';
      
      // Detect UTF-16 Little Endian BOM (0xFF 0xFE)
      if (uint8[0] === 0xFF && uint8[1] === 0xFE) encoding = 'UTF-16LE';
      // Detect UTF-16 Big Endian BOM (0xFE 0xFF)
      else if (uint8[0] === 0xFE && uint8[1] === 0xFF) encoding = 'UTF-16BE';

      Papa.parse(file, {
        encoding,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          const rows = results.data;
          if (!rows || rows.length < 2) {
            toast.error('CSV file seems to be empty or missing data.');
            return;
          }

          // Manually clean headers to remove BOM residuals and whitespace
          const cleanedHeaders = rows[0].map(h => 
            typeof h === 'string' ? h.replace(/^\ufeff/, '').trim() : h
          );

          setHeaders(cleanedHeaders);
          setCsvData(rows.slice(1));
          
          if (selectedBroker === 'zerodha') {
            autoMapZerodha(cleanedHeaders, rows.slice(1));
          } else {
            setStep(3); // Go to mapping step
          }
        },
        error: (error) => {
          console.error('CSV Parse Error:', error);
          toast.error('Failed to parse CSV file');
        }
      });
    };
    reader.readAsArrayBuffer(file.slice(0, 2));
  };

  const autoMapZerodha = (headers, data) => {
    // Helper to find a header by trying multiple common variations
    const findHeader = (targets) => 
      headers.findIndex(h => targets.includes(h.toLowerCase().trim()));

    const symIdx = findHeader(['symbol', 'stock symbol', 'ticker']);
    const qtyIdx = findHeader(['quantity available', 'quantity', 'qty', 'units']);
    const prcIdx = findHeader(['average price', 'avg. price', 'avg price', 'buy price', 'cost price']);
    
    if (symIdx === -1 || qtyIdx === -1 || prcIdx === -1) {
      toast.error('Could not detect Zerodha format. Switching to manual mapping.');
      setSelectedBroker('custom');
      setStep(3);
      return;
    }

    generatePreview(data, symIdx, qtyIdx, prcIdx);
  };

  const generatePreview = (data, symIdx, qtyIdx, prcIdx) => {
    const processed = data.map(row => {
      const symbol = row[symIdx]?.trim();
      const units = parseFloat(row[qtyIdx]);
      const buyPrice = parseFloat(row[prcIdx]);
      
      const validationErrors = [];
      if (!symbol) validationErrors.push('Missing symbol');
      if (isNaN(units) || units <= 0) validationErrors.push('Invalid units');
      if (isNaN(buyPrice) || buyPrice <= 0) validationErrors.push('Invalid price');

      return {
        name: symbol || 'Imported Asset',
        type: 'stock',
        purchaseDate: new Date().toISOString().split('T')[0],
        symbol: symbol || 'N/A',
        units: isNaN(units) ? 0 : units,
        buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
        isValid: validationErrors.length === 0,
        errors: validationErrors
      };
    });

    setPreviewData(processed);
    setShowPreview(true);
  };

  const handleManualMap = () => {
    if (!mapping.symbol || !mapping.units || !mapping.buyPrice) {
      toast.error('Please map all required columns: Symbol, Units, and Average Price.');
      return;
    }

    const selectedColumns = [mapping.symbol, mapping.units, mapping.buyPrice];
    if (new Set(selectedColumns).size !== selectedColumns.length) {
      toast.error('Duplicate mapping detected. Each CSV column can only be mapped to one field.');
      return;
    }

    const symIdx = headers.indexOf(mapping.symbol);
    const qtyIdx = headers.indexOf(mapping.units);
    const prcIdx = headers.indexOf(mapping.buyPrice);

    if (symIdx === -1 || qtyIdx === -1 || prcIdx === -1) {
      toast.error('Please map all required columns.');
      return;
    }

    generatePreview(csvData, symIdx, qtyIdx, prcIdx);
  };

  const resetImport = () => {
    setStep(1);
    setSelectedBroker(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({ symbol: '', units: '', buyPrice: '' });
  };

  const handleFilterInvalid = () => {
    const validData = previewData.filter(item => item.isValid);
    setPreviewData(validData);
    toast.info(`Filtered out ${previewData.length - validData.length} invalid entries.`);
  };

  const handleFinalConfirm = async () => {
    const invalidCount = previewData.filter(item => !item.isValid).length;
    if (invalidCount > 0) {
      toast.error(`Please correct the ${invalidCount} invalid entries highlighted in the preview.`);
      return;
    }

    if (previewData.length === 0) {
      toast.error('No valid investments found to import.');
      return;
    }

    setLoading(true);
    try {
      // Strip UI-only fields (isValid, errors) before sending to backend
      const cleanData = previewData.map(({ isValid, errors, ...rest }) => rest);
      
      await portfolioAPI.bulkAdd(cleanData);
      toast.success('Successfully imported investments!');
      navigate('/reports');
    } catch (err) {
      toast.error('Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-blue-600">
          <ArrowLeft size={18} /> Back to Reports
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold dark:text-white mb-2">Import Portfolio</h1>
          <p className="text-gray-500">Migrate your holdings from your broker in minutes.</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12 relative flex justify-between">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0" />
          {IMPORT_STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div className={`p-3 rounded-full border-2 transition-all duration-300 ${
                  isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' :
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </div>
                <span className={`text-xs mt-2 font-bold uppercase tracking-wider ${
                  isActive || isCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="grid gap-4">
            {BROKERS.map(broker => (
              <button
                key={broker.id}
                onClick={() => { setSelectedBroker(broker.id); setStep(2); }}
                className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-blue-500 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                    <FileSpreadsheet />
                  </div>
                  <div>
                    <h3 className="font-bold dark:text-white">{broker.name}</h3>
                    <p className="text-sm text-gray-500">{broker.description}</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-500" />
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <Card className="text-center p-12">
            <Upload className="mx-auto mb-4 text-blue-600" size={48} />
            <h3 className="text-xl font-bold mb-2 dark:text-white">Upload your {selectedBroker} CSV</h3>
            <p className="text-sm text-gray-500 mb-6">Make sure the file is in .csv format.</p>
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-blue-700 transition-colors inline-block"
              >
                Select File
              </label>
              <button 
                onClick={downloadSampleCSV}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 transition-colors"
              >
                <Download size={14} /> Download Sample CSV Template
              </button>
            </div>

            <button 
              type="button"
              onClick={() => setStep(1)}
              className="mt-8 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <ArrowLeft size={14} /> Back to broker selection
            </button>
          </Card>
        )}

        {step === 3 && (
          <Card title="Map CSV Columns">
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Select which column in your CSV matches the required fields.</p>
              
              <div className="grid gap-4">
                {['symbol', 'units', 'buyPrice'].map(field => (
                  <div key={field} className="flex items-center justify-between">
                    <label className="capitalize font-medium dark:text-white">{field === 'buyPrice' ? 'Average Price' : field}</label>
                    <select
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 w-48 dark:text-white"
                      value={mapping[field]}
                      onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                    >
                      <option value="">Select Column</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={resetImport}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualMap}
                  className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Preview Data
                </button>
              </div>
            </div>
          </Card>
        )}

        <ImportPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={handleFinalConfirm}
          onFilterInvalid={handleFilterInvalid}
          data={previewData}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ImportDataPage;