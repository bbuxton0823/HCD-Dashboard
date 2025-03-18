import { useState } from 'react';
import { parseHCDExcel } from '@/lib/importers/hcdImporter';
import { HCDReportData } from '@/models/InternalHCDData';
import styled from 'styled-components';

const UploadContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const UploadForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UploadButton = styled.label`
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #004a7c;
  }
  
  input {
    display: none;
  }
`;

const Message = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${props => 
    props.type === 'success' ? '#d4edda' : 
    props.type === 'error' ? '#f8d7da' : 
    '#cce5ff'};
  color: ${props => 
    props.type === 'success' ? '#155724' : 
    props.type === 'error' ? '#721c24' : 
    '#004085'};
  margin-top: 1rem;
`;

// This function would save the data to your backend/database
async function saveHCDData(data: HCDReportData): Promise<void> {
  // In a real implementation, this would make an API call to save the data
  console.log('Saving HCD data:', data);
  
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}

export default function HCDDataUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setMessage({ text: 'Processing file...', type: 'info' });
    
    try {
      const hcdData = await parseHCDExcel(file);
      // Save to database or state management
      await saveHCDData(hcdData);
      setMessage({ text: 'HCD data successfully uploaded and processed', type: 'success' });
    } catch (error) {
      setMessage({ 
        text: `Error processing file: ${error instanceof Error ? error.message : String(error)}`, 
        type: 'error' 
      });
    } finally {
      setIsUploading(false);
      
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  }
  
  return (
    <UploadContainer>
      <h3>Upload HCD Report Data</h3>
      <p>Upload the latest Housing and Community Development report data in Excel (.xlsx) format.</p>
      
      <UploadForm>
        <UploadButton>
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleUpload} 
            disabled={isUploading} 
          />
          {isUploading ? 'Processing...' : 'Select File'}
        </UploadButton>
        
        {message && (
          <Message type={message.type}>
            {message.text}
          </Message>
        )}
      </UploadForm>
    </UploadContainer>
  );
} 