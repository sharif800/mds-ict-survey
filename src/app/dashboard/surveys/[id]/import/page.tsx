"use client";
import { useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function BulkImportPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [survey, setSurvey] = useState<any>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/surveys/${params.id}`).then(r => r.json()).then(setSurvey);
    }
  }, [params.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsed = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        return obj;
      });
      
      setCsvData(parsed);
      setError(null);
    };
    reader.readAsText(file);
  };

  const startImport = async () => {
    if (csvData.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const res = await fetch(`/api/surveys/${params.id}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: csvData }),
      });

      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/dashboard/surveys/${params.id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!survey) return <div className="p-8">Loading survey details...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <Link href={`/dashboard/surveys/${params.id}`} className="text-muted" style={{ fontSize: '0.8rem' }}>← Back to Survey</Link>
          <h1 className="page-title">Bulk Hardware Import</h1>
          <p className="page-subtitle">Importing assets into <span style={{ fontFamily: 'monospace' }}>{survey.referenceNumber}</span></p>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Step 1: Download Template</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Download the standard CSV template to ensure your data matches the system fields.
        </p>
        <button className="btn btn-outline btn-sm" onClick={() => {
          const headers = "assetTag,serialNumber,hostname,category,make,model,processorModel,ramGb,storageGb,storageType,currentOs,win11Compatible,purchaseDate,purchaseCost,condition,department,assignedTo";
          const blob = new Blob([headers], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "hardware_import_template.csv";
          a.click();
        }}>
          📥 Download CSV Template
        </button>
      </div>

      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3>Step 2: Upload CSV File</h3>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".csv" 
          className="form-control" 
          style={{ maxWidth: '400px', marginBottom: '1rem' }}
        />
        
        {csvData.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-SUBMITTED">{csvData.length} rows detected</span>
              <button className="btn btn-primary" onClick={startImport} disabled={uploading}>
                {uploading ? 'Importing...' : '🚀 Start Import Now'}
              </button>
            </div>

            <div className="data-table-container" style={{ maxHeight: '300px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset Tag</th><th>Category</th><th>Make/Model</th><th>Condition</th><th>Dept</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      <td>{row.assetTag}</td>
                      <td>{row.category}</td>
                      <td>{row.make} {row.model}</td>
                      <td>{row.condition}</td>
                      <td>{row.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 50 && (
                <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Showing first 50 rows only...
                </p>
              )}
            </div>
          </div>
        )}
        
        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
