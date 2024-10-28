import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ChoroplethMap = ({ geoJsonData, sectorData }) => {
    useEffect(() => {
      console.log("GeoJSON Data:", JSON.stringify(geoJsonData, null, 2)); // Log GeoJSON data in a readable format
        // console.log("GeoJSON Data:", geoJsonData); // Log GeoJSON data
        console.log("Sector Data:", sectorData); // Log Sector data
    }, [geoJsonData, sectorData]);

    const getColor = (frequency) => {

        if (frequency > 20) return '#800026'; // Dark Red
        if (frequency > 10) return '#BD0026'; // Red
        // if (frequency > 10) return '#E31A1C'; // Light Red
        if (frequency > 6) return '#FC4E2A';  // Orange Red
        if (frequency > 3) return '#FD8D3C';  // Orange
        return '#FFEDA0'; 
    };

    const calculateFrequency = (geoJsonData) => {
      const frequencyCount = {};

      geoJsonData.features.forEach((feature) => {
          const sectorNumber = feature.properties.sectorNumber; 
          frequencyCount[sectorNumber] = (frequencyCount[sectorNumber] || 0) + 1; 
      });

      return frequencyCount;
  };

  const updatedSectorData = calculateFrequency(geoJsonData);
    return (
        <MapContainer center={[30.7333, 76.7794]} zoom={13} style={{ height: '500px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {geoJsonData.features.map((feature, index) => {
                const sectorNumber = feature.properties.sectorNumber;
                const frequency = updatedSectorData[sectorNumber] || 0;
                console.log(`Sector: ${sectorNumber}, Frequency: ${frequency}, Color: ${getColor(frequency)}`);
                const position = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]; // Leaflet uses [lat, lng]

                return (
                    <Circle
                        key={index}
                        center={position}
                        radius={ 300} // Scale radius based on frequency
                        fillColor={getColor(frequency)}
                        fillOpacity={0.2}
                        stroke={false}
                    >
                      </Circle>
                );
            })}
        </MapContainer>
    );
};

export default ChoroplethMap;




