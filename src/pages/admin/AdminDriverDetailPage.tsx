import Section from '@/components/section';
import { Phone, Mail, MapPin, Download, ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { request } from '@/api/request';
import {
  downloadAuthenticatedFile,
  filenameFromUrl,
} from '@/lib/downloadBlob';
import { toast } from 'sonner';

type VehicleDocumentKey = 'truck_image' | 'driving_license_image' | 'legal_documents';

const isPdf = (url?: string | null) => !!url && /\.pdf($|\?)/i.test(url);

type Driver = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  avatar_url?: string | null;
  vehicle: {
    id: string;
    name: string;
    model: string;
    license_plate: string;
    brand: string;
    truck_image_url: string;
    driving_license_image_url: string;
    legal_documents_url: string;
  };
};

type DocumentCardProps = {
  title: string;
  previewUrl?: string | null;
  documentKey: VehicleDocumentKey;
  driverId: string;
};

function DocumentCard({ title, previewUrl, documentKey, driverId }: DocumentCardProps) {
  const hasPdf = isPdf(previewUrl);
  const fallbackFilename = `${documentKey.replace(/_/g, '-')}.bin`;

  const handleDownload = async () => {
    if (!previewUrl) return;

    const filename = filenameFromUrl(previewUrl, fallbackFilename);

    try {
      await downloadAuthenticatedFile(
        `/admin/drivers/${driverId}/vehicle-documents/${documentKey}`,
        filename,
      );
    } catch {
      if (/^https?:\/\//i.test(previewUrl)) {
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      toast.error('Could not download this file. Please try again.');
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">{title}</p>
        {previewUrl && (
          <button
            type="button"
            onClick={() => void handleDownload()}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 transition hover:bg-amber-100 hover:text-amber-700"
          >
            <Download size={12} />
            Download
          </button>
        )}
      </div>

      {!previewUrl ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-gray-400">
          <ImageOff size={28} />
          <span className="text-xs font-medium">No file available</span>
        </div>
      ) : hasPdf ? (
        <iframe
          src={previewUrl}
          title={title}
          className="h-52 w-full rounded-xl border border-gray-100"
        />
      ) : (
        <img
          src={previewUrl}
          alt={title}
          className="h-52 w-full rounded-xl border border-gray-100 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
    </div>
  );
}

export default function AdminDriverDetailPage() {
  const { driverid } = useParams();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDriver = async () => {
    try {
      setLoading(true);
      const response = await request.get(`/admin/drivers/${driverid}`);
      setDriver(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriver();
  }, [driverid]);

  if (loading) {
    return (
      <Section className="flex items-center justify-center p-20 font-sans">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-sm font-medium">Loading driver details…</p>
        </div>
      </Section>
    );
  }

  const contactInfo = [
    { icon: Phone, label: 'Mobile Phone', value: driver?.phone || 'N/A' },
    { icon: Mail, label: 'Corporate Email', value: driver?.email || 'N/A' },
    { icon: MapPin, label: 'Home Terminal', value: driver?.address || 'N/A' },
  ];

  const vehicleInfo = [
    { label: 'Car Name', value: driver?.vehicle?.name || 'N/A' },
    { label: 'Car Model', value: driver?.vehicle?.model || 'N/A' },
    { label: 'License Plate', value: driver?.vehicle?.license_plate || 'N/A' },
    { label: 'Car Brand', value: driver?.vehicle?.brand || 'N/A' },
  ];

  return (
    <Section className="p-4 font-sans sm:p-6 lg:p-8">
      <div className="mx-auto space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Driver Details · Employee ID: {driver?.username || 'N/A'}
          </p>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-100">
              {driver?.avatar_url ? (
                <img
                  src={driver.avatar_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-400">
                  {driver?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
            <div>
              <h1
                className="text-xl font-extrabold text-gray-900"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {driver?.name || 'N/A'}
              </h1>
              <span className="mt-1 inline-block rounded-full bg-[#1a1a1a] px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase">
                Senior Heavy Dispatch
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-[11px] font-bold tracking-widest text-gray-500 uppercase">
              Contact Information
            </p>
            <div className="divide-y divide-gray-100">
              {contactInfo.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                    <Icon size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm font-bold break-all text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-[11px] font-bold tracking-widest text-gray-500 uppercase">
              License &amp; Vehicle Info
            </p>
            <div className="grid grid-cols-2 gap-3">
              {vehicleInfo.map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[15px] font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {driverid && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <DocumentCard
              title="Truck Image"
              previewUrl={driver?.vehicle?.truck_image_url}
              documentKey="truck_image"
              driverId={driverid}
            />
            <DocumentCard
              title="Driving License"
              previewUrl={driver?.vehicle?.driving_license_image_url}
              documentKey="driving_license_image"
              driverId={driverid}
            />
            <DocumentCard
              title="Car Legal Documents"
              previewUrl={driver?.vehicle?.legal_documents_url}
              documentKey="legal_documents"
              driverId={driverid}
            />
          </div>
        )}
      </div>
    </Section>
  );
}
