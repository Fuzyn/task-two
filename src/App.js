import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import './App.css';


function App() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiZnV6eW4iLCJhIjoiY2wxYzk3YnpoMDRsMjNndGZpd2h6dDQ5YSJ9.deVtzer2lFu9voN1B19d9Q';
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(18.63);
  const [lat, setLat] = useState(54.34);
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: 7.5
    });


  });

  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on('load', async () => {
      // Get the initial location 
      const geojson = await getLocation();
      // Add location as a source.
      map.current.addSource('bus', {
        type: 'geojson',
        data: geojson
      });
      // Add the rocket symbol layer to the map.
      map.current.addLayer({
        'id': 'bus',
        'type': 'symbol',
        'source': 'bus',
        'layout': {
          'icon-image': 'rocket-15'
        }
      });

      // Update the source from the API every 2 seconds.
      const updateSource = setInterval(async () => {
        const geojson = await getLocation(updateSource);
        map.current.getSource('bus').setData(geojson);
      }, 2000);

      async function getLocation(updateSource) {
        // Make a request to the API.
        try {
          const response = await axios.get('https://ckan2.multimediagdansk.pl/gpsPositions?v=2')
            .then(function (response) {
              // handle success
              return response
            })
          const { lat, lon } = await response.json();
          // Fly the map to the location.
          map.current.flyTo({
            center: [response.data.vehicles[0].lat, response.data.vehicles[0].lon],
            speed: 0.5
          });
          // Return the location 
          return {
            'type': 'FeatureCollection',
            'features': [
              {
                'type': 'Feature',
                'geometry': {
                  'type': 'Point',
                  'coordinates': [response.data.vehicles[0].lat, response.data.vehicles[0].lon]
                }
              }
            ]
          };
        } catch (err) {
          // If the updateSource interval is defined, clear the interval to stop updating the source.
          if (updateSource) clearInterval(updateSource);
          throw new Error(err);
        }
      }
    });
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  });

  return (
    <div className="App">
      <div>
        <div className="sidebar">
          Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        </div>
        <div ref={mapContainer} className="map-container" />
      </div>
    </div>
  );
}

export default App;
