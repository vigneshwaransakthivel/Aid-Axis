import axios from 'axios';

// Simple axios instance for API calls
const api = axios.create();

export default api;

// Download file from server
export async function downloadFile(id) {
  try {
    const res = await api.get(`/api/health-locker/documents/${id}/download`);
    if (res.data.data) {
      // Create download link from base64 data
      const link = document.createElement('a');
      link.href = res.data.data;
      link.download = res.data.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('File data not available');
    }
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download file');
  }
}
