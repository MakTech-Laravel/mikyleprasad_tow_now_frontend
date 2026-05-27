import { useRideTracking } from '@/hooks/useRideTracking';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DHAKA: [number, number] = [23.8103, 90.4125];

export default function LiveRideTrackPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const { track, reload } = useRideTracking({ rideId });

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  const driverPos = useMemo(() => {
    const lat = track?.driver?.current_lat;
    const lng = track?.driver?.current_lng;
    if (lat == null || lng == null) return null;

    return [lat, lng] as [number, number];
  }, [track]);

  const center = driverPos ?? DHAKA;

  if (!rideId) {
    return <p className="p-4 text-sm text-muted-foreground">Missing ride.</p>;
  }

  if (!track) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/rides/${rideId}`} aria-label="Back to ride">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-montserrat text-lg font-semibold">Live tracking</h1>
          <p className="text-muted-foreground text-xs">
            Status: <span className="font-medium text-foreground">{track.status}</span>
          </p>
        </div>
      </div>

      <div className="h-72 overflow-hidden rounded-xl border">
        <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={17} />
          <Marker position={center} />
        </MapContainer>
      </div>

      <Card className="p-4">
        <p className="text-sm font-medium">Driver</p>
        <p className="text-muted-foreground text-sm">{track.driver?.name ?? '—'}</p>
        <p className="text-muted-foreground text-sm">{track.driver?.phone ?? ''}</p>
        <Button variant="outline" size="sm" className="mt-3" type="button" onClick={() => void reload()}>
          Refresh
        </Button>
      </Card>
    </div>
  );
}
