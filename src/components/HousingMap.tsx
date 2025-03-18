import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { HousingProject } from '@/models/InternalHCDData';

// Fix for default Leaflet markers not showing properly
// In a real application, you would import and use actual icon files
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Different colors for different housing statuses
const statusColors = {
  'Planned': 'gray',
  'Permitted': 'blue',
  'Under Construction': 'orange',
  'Completed': 'green'
};

interface HousingMapProps {
  projects: HousingProject[];
}

const HousingMap: React.FC<HousingMapProps> = ({ projects }) => {
  useEffect(() => {
    // This ensures the icon is properly set for all markers
    L.Marker.prototype.options.icon = defaultIcon;
  }, []);

  // Find center coordinates from the projects, or default to San Mateo County center
  const calculateCenter = (): [number, number] => {
    if (!projects || projects.length === 0) {
      // Default to San Mateo County center if no projects
      return [37.54, -122.31];
    }
    
    // Calculate average lat/lng from all projects
    const validProjects = projects.filter(p => p.latitude && p.longitude);
    if (validProjects.length === 0) return [37.54, -122.31];
    
    const latSum = validProjects.reduce((sum, p) => sum + (p.latitude || 0), 0);
    const lngSum = validProjects.reduce((sum, p) => sum + (p.longitude || 0), 0);
    
    return [latSum / validProjects.length, lngSum / validProjects.length];
  };
  
  const mapCenter = calculateCenter();

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={11} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {projects.map((project) => {
        // Skip projects without coordinates
        if (!project.latitude || !project.longitude) return null;
        
        return (
          <Marker 
            key={project.id || project.name}
            position={[project.latitude, project.longitude]} 
          >
            <Popup>
              <div>
                <h3>{project.name}</h3>
                <p><strong>Location:</strong> {project.address}</p>
                <p><strong>Units:</strong> {project.units}</p>
                <p><strong>Affordability:</strong> {project.affordabilityLevel}</p>
                <p><strong>Status:</strong> {project.status}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default HousingMap; 