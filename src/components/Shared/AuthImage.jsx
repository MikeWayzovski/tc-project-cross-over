import React, { useEffect, useState } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react';

export default function AuthImage({ src, className = "", style = {}, alt = "Afbeelding", fallbackNode = null }) {
  const { getAccessTokenSilently } = useAuth();
  
  const [blobUrl, setBlobUrl] = useState(undefined);

  useEffect(() => {
    let isMounted = true; 

    if (!src) {
      setBlobUrl(null);
      return;
    }

    if (src.includes('resources.connect.trimble.com') || src.includes('existing_project_with_no_image.svg')) {
      setBlobUrl(src);
      return;
    }

    const loadImage = async () => {
      try {
        // HIER ZIT DE FIX: Pak het globale Trimble token als we in een iframe zitten!
        const token = window.trimbleSandboxToken || await getAccessTokenSilently();
        
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
        if (isMounted) setBlobUrl(null); 
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

  if (blobUrl === undefined) {
    return (
      <div className={`${className} placeholder-glow bg-light d-flex align-items-center justify-content-center`} style={style}>
        <span className="placeholder w-100 h-100"></span>
      </div>
    );
  }

  if (blobUrl === null) {
    return fallbackNode || <div className={`${className} bg-light`} style={style} />;
  }

  return <img src={blobUrl} className={className} style={style} alt={alt} />;
}