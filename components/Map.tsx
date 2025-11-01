'use client';

interface MapProps {
  address: string;
  className?: string;
  zoom?: number;
}

export default function Map({ address, className = 'h-[400px] w-full', zoom = 15 }: MapProps) {
  // URL encode the address for the iframe
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={className}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        className="border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
}
