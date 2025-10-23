import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- Estados de React ---
  const [clima, setClima] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Estado para saber si estamos cargando
  const [LocationName, setLocationName] = useState('');

 // --- Hook de Efecto ---
  useEffect(() => {
    // 1. Intentamos obtener la geolocalización del navegador
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // todo bien si el usuario dio permiso
          const { latitude, longitude } = position.coords;
          fetchClima(latitude, longitude);
          fetchLocationName(latitude, longitude); // <-- 1. AÑADE ESTA LÍNEA
        },
        () => {
          // Error o permiso denegado. Usamos la ubicación por defecto (Zacapa).
          setError('No se pudo obtener tu ubicación. Mostrando el clima de Zacapa.');
          fetchClima(14.97, -89.54); // Coordenadas de Zacapa
          fetchLocationName(14.97, -89.54); 
        }
      );
    } else {
      // El navegador es muy antiguo y no soporta geolocalización
      setError('Geolocalización no soportada. Mostrando el clima de Zacapa.');
      fetchClima(14.97, -89.54); // Coordenadas de Zacapa
      fetchLocationName(14.97, -89.54); 
    }
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez

  // --- Función para buscar el clima (ahora con lat/lon) ---
  const fetchClima = async (lat, lon) => {
    setLoading(true);
    setError('');

    // Usamos la URL que conseguí gratis sin cuenta jeje, pero con lat/lon dinámicas
    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,cloud_cover,uv_index&timezone=auto`;

    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (response.ok) {
        setClima(data); // Guardamos la respuesta completa
        console.log(data); // Revisa la consola para ver la estructura
      } else {
        setError('No se pudo obtener el clima.');
      }
    } catch (err) {
      setError('Error de conexión. ¿Estás offline?');
    }
    setLoading(false); // Terminamos de cargar
  };
  
  const fetchLocationName = async (lat, lon) => {
    // API de Geocodificación Inversa de Open-Meteo
    const GEO_API_URL = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&format=json`;

    try {
      const response = await fetch(GEO_API_URL);
      const data = await response.json();
      
      // La API devuelve 'name' (ciudad) y 'admin1' (departamento/estado)
      if (response.ok && data.name) {
        setLocationName(`${data.name}, ${data.admin1 || ''}`); // Ej: "Zacapa, Zacapa"
      } else {
        // Si no encuentra nombre, mostramos las coordenadas como plan B
        setLocationName(`(Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`);
      }
    } catch (err) {
      // Si falla la API de geocodificación, mostramos las coordenadas
      setLocationName(`(Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)})`);
    }
  };

  
  // Función auxiliar para obtener el índice de la hora actual
  // La API devuelve un array 'time', tenemos que encontrar la hora más cercana
  const getCurrentHourIndex = () => {
    if (!clima || !clima.hourly || !clima.hourly.time) return 0;
    
    // new Date() es la hora actual. new Date(timeString) es la hora del forecast.
    // Buscamos la diferencia más pequeña.
    const now = new Date();
    let closestIndex = 0;
    let minDiff = Infinity;

    clima.hourly.time.forEach((timeString, index) => {
      const diff = Math.abs(now - new Date(timeString));
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const i = getCurrentHourIndex(); // Obtenemos el índice de la hora actual

  return (
    <div className="App">
      {/* Logo de la universidad */}
      <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/Escudo_de_la_universidad_Mariano_G%C3%A1lvez_Guatemala.svg" alt="Logo UMG" className="logo-umg" />
      <header className="App-header">
        <h1>Mi App de Clima UMG</h1>
        <h2> Luis Armando Orozco Cifuentes 1190-22-102</h2>

        {/* Mostramos un mensaje mientras carga */}
        {loading && <p>Obteniendo tu ubicación y el clima...</p>}

        {/* Mostramos el error si existe */}
        {error && <p className="error">{error}</p>}

        {/* Mostramos los resultados si existen */}
        {clima && !loading && (
          <div className="resultado-clima">
            <h2>Clima actual (aprox.)</h2>
            <p>Ubicación: {LocationName || 'Cargando ubicación...'}</p>
            <p></p>
            {/* <p>Ubicación: (Lat: {clima.latitude.toFixed(2)}, Lon: {clima.longitude.toFixed(2)})</p> */}
            
            {/* IMPORTANTE: Esta API devuelve arrays 'hourly'.
              Usamos el índice 'i' que calculamos para mostrar la hora más cercana.
            */}
            <div className="info-principal">
              <span className="temperatura">
                {clima.hourly.temperature_2m[i]}
                {clima.hourly_units.temperature_2m}
              </span>
            </div>
            <p>Humedad: {clima.hourly.relative_humidity_2m[i]}{clima.hourly_units.relative_humidity_2m}</p>
            <p>Prob. de Lluvia: {clima.hourly.precipitation_probability[i]}{clima.hourly_units.precipitation_probability}</p>
            <p>Nubosidad: {clima.hourly.cloud_cover[i]}{clima.hourly_units.cloud_cover}</p>
            <p>Índice UV: {clima.hourly.uv_index[i]}</p>
            <p>(Datos para la hora: {clima.hourly.time[i]})</p>
            
          </div>
        )}
      </header>
    </div>
  );
}

export default App;