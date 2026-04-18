import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ChevronRight, FileSpreadsheet, Settings2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Card from '../components/Card';
import { portfolioAPI } from '../utils/api';
import ImportPreviewModal from '../components/ImportPreviewModal';

const BROKERS = [
  { id: 'zerodha', name: 'Zerodha', description: 'Supports standard holdings CSV export.' },
  { id: 'custom', name: 'Custom CSV', description: 'Upload any CSV and map your own columns.' },
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      
      if (rows.length < 2) {
        toast.error('CSV file seems to be empty or missing data.');
        return;
      }

      setHeaders(rows[0]);
      setCsvData(rows.slice(1));
      
      if (selectedBroker === 'zerodha') {
        autoMapZerodha(rows[0], rows.slice(1));
      } else {
        setStep(3); // Go to mapping step
      }
    };
    reader.readAsText(file);
  };

  const autoMapZerodha = (headers, data) => {
    const symIdx = headers.indexOf('Symbol');
    const qtyIdx = headers.indexOf('Quantity Available');
    const prcIdx = headers.indexOf('Average Price');
    
    if (symIdx === -1 || qtyIdx === -1 || prcIdx === -1) {
      toast.error('Could not detect Zerodha format. Switching to manual mapping.');
      setSelectedBroker('custom');
      setStep(3);
      return;
    }

    generatePreview(data, symIdx, qtyIdx, prcIdx);
  };

  const generatePreview = (data, symIdx, qtyIdx, prcIdx) => {
    const processed = data.map(row => ({
      symbol: row[symIdx],
      units: parseFloat(row[qtyIdx] || 0),
      buyPrice: parseFloat(row[prcIdx] || 0),
    })).filter(item => item.units > 0);

    setPreviewData(processed);
    setShowPreview(true);
  };

  const handleManualMap = () => {
    const symIdx = headers.indexOf(mapping.symbol);
    const qtyIdx = headers.indexOf(mapping.units);
    const prcIdx = headers.indexOf(mapping.buyPrice);

    if (symIdx === -1 || qtyIdx === -1 || prcIdx === -1) {
      toast.error('Please map all required columns.');
      return;
    }

    generatePreview(csvData, symIdx, qtyIdx, prcIdx);
  };

  const handleFinalConfirm = async () => {
    setLoading(true);
    try {
      await portfolioAPI.bulkAdd(previewData);
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

              <button
                onClick={handleManualMap}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Preview Data
              </button>
            </div>
          </Card>
        )}

        <ImportPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={handleFinalConfirm}
          data={previewData}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ImportDataPage;