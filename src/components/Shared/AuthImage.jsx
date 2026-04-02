import React, { useEffect, useState } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react';

export default function AuthImage({ src, className = "", style = {}, alt = "Afbeelding", fallbackNode = null }) {
  const { getAccessTokenSilently } = useAuth();
  
  // undefined: aan het laden, null: laden mislukt of geen src, string: blob url
  const [blobUrl, setBlobUrl] = useState(undefined);

  useEffect(() => {
    let isMounted = true; // Zorgt ervoor dat we geen onzichtbare componenten updaten

    if (!src) {
      setBlobUrl(null);
      return;
    }

    // Publieke placeholders hoeven we niet met een token op te halen
    if (src.includes('resources.connect.trimble.com') || src.includes('existing_project_with_no_image.svg')) {
      setBlobUrl(src);
      return;
    }

    const loadImage = async () => {
      try {
        const token = await getAccessTokenSilently();
        
        // Zorg dat we altijd een absolute URL hebben (Trimble Connect geeft soms relatieve paden terug)
        const fetchUrl = src.startsWith('http') ? src : `https://app.connect.trimble.com${src}`;
        
        const response = await fetch(fetchUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Afbeelding ophalen mislukt');
        
        const blob = await response.blob();
        if (isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
        }
      } catch (e) {
        console.error("Fout bij laden avatar/thumbnail:", e);
        if (isMounted) setBlobUrl(null); // Fallback status
      }
    };

    loadImage();

    return () => { 
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl); 
      }
    };
  }, [src, getAccessTokenSilently]);

  // LAAD STATUS: Toon een pulserend Bootstrap vlakje
  if (blobUrl === undefined) {
    return (
      <div className={`${className} placeholder-glow bg-light d-flex align-items-center justify-content-center`} style={style}>
        <span className="placeholder w-100 h-100"></span>
      </div>
    );
  }

  // FOUT STATUS / GEEN PLAATJE: Toon de fallback (bijv. het ModusIcon)
  if (blobUrl === null) {
    return fallbackNode || <div className={`${className} bg-light`} style={style} />;
  }

  // SUCCES: Toon de beveiligde afbeelding!
  return <img src={blobUrl} className={className} style={style} alt={alt} />;
}