
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import VehicleSelection from '../components/3d/VehicleSelection.jsx';
import CarExperience from '../components/3d/CarExperience.jsx';
import TryndamereExperience from '../components/3d/TryndamereExperience.jsx';

const DobacksoftPage = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    // Hide scrollbar when in 3D experience
    if (selectedVehicle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedVehicle]);

  return (
    <div className="w-full min-h-screen bg-slate-950">
      <Helmet>
        <title>DobackSoft 3D Experience | Artificial World</title>
        <meta name="description" content="Explore the deterministic 3D environment of DobackSoft." />
      </Helmet>

      {!selectedVehicle && (
        <VehicleSelection onSelect={setSelectedVehicle} />
      )}

      {selectedVehicle === 'car' && (
        <CarExperience onReturn={() => setSelectedVehicle(null)} />
      )}

      {selectedVehicle === 'tryndamere' && (
        <TryndamereExperience onReturn={() => setSelectedVehicle(null)} />
      )}
    </div>
  );
};

export default DobacksoftPage;
