import { useState, useMemo, useRef } from 'react';
import { Truck, Info, UploadCloud, CheckCircle2, ShieldCheck, ImageUp } from 'lucide-react';
import Section from '@/components/section';
import FileUpload from '@/components/file-upload';
import { Button } from '@/components/ui/button';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/auth/useAuth';
import { request } from '@/api/request';
import { toast } from 'sonner';

// Helper: convert stored relative path → full public storage URL
const storageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_APP_URL as string)?.replace(/\/$/, '') ?? '';
  return `${base}/storage/${path.replace(/^\//, '')}`;
};

// ─────────────────────────────────────────────────────────────
// ClickablePreview
// ─────────────────────────────────────────────────────────────
type ClickablePreviewProps = {
  url: string;
  mimeType?: string;
  accept?: string;
  onNewFile: (file: File) => void;
};

function ClickablePreview({ url, mimeType = 'image/jpeg', accept = 'image/*', onNewFile }: ClickablePreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPdf = mimeType === 'application/pdf' || url.toLowerCase().endsWith('.pdf');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onNewFile(file);
    e.target.value = '';
  };

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-dashed border-amber-300 bg-amber-50/40"
      onClick={() => inputRef.current?.click()}
      title="Click to change"
    >
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── PDF preview ── */}
      {isPdf ? (
        <div className="flex h-28 flex-col items-center justify-center gap-2 text-gray-400 transition-all group-hover:brightness-75">
          <svg className="h-10 w-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1H8v-1zm0 2h8v1H8v-1zm0-4h4v1H8v-1z" />
          </svg>
          <span className="text-xs font-medium text-gray-500">PDF Document</span>
        </div>
      ) : (
        /* ── Image preview ── */
        <img
          src={url}
          alt="Preview"
          className="h-28 w-full object-cover transition-all duration-200 group-hover:brightness-50"
        />
      )}

      {/* ── Hover overlay ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <ImageUp className="h-6 w-6 text-white drop-shadow" />
        <span className="text-xs font-semibold text-white drop-shadow">Click to change</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Schema & Types
// ─────────────────────────────────────────────────────────────
const driverVehicleSchema = z.object({
  name: z.string().min(1, 'Truck name is required'),
  license_plate: z.string().min(1, 'License plate is required'),
  capacity: z.number().min(1, 'Max capacity is required'),
  insurance_status: z.number(),
});

type DriverVehicleFormData = {
  name: string;
  license_plate: string;
  capacity: number;
  insurance_status: number;
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
type DriverAuthUser = {
  vehicle?: {
    name?: string;
    license_plate?: string;
    capacity?: number;
    insurance_status?: number | boolean;
    truck_image_url?: string | null;
    driving_license_image_url?: string | null;
    legal_documents_url?: string | null;
  };
};

export default function DriverVehiclePage() {
  const { user } = useAuth();
  const vehicle = (user as DriverAuthUser | null)?.vehicle;

  const [truckImage, setTruckImage] = useState<File | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<File | null>(null);
  const [legalDocs, setLegalDocs] = useState<File | null>(null);

  const formValues = useMemo(
    () => ({
      name: vehicle?.name ?? '',
      license_plate: vehicle?.license_plate ?? '',
      capacity: vehicle?.capacity ?? 0,
      insurance_status: vehicle?.insurance_status ? 1 : 0,
    }),
    [vehicle],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverVehicleFormData>({
    resolver: zodResolver(driverVehicleSchema),
    values: formValues,
    resetOptions: { keepDirtyValues: true },
  });

  const handleDiscard = () => {
    reset();
    setTruckImage(null);
    setDrivingLicense(null);
    setLegalDocs(null);
  };

  const onSubmit = async (data: DriverVehicleFormData) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('license_plate', data.license_plate);
      // formData.append('capacity', String(data.capacity));
      formData.append('capacity', data.capacity.toString());
      formData.append('insurance_status', String(data.insurance_status));

      if (truckImage) formData.append('truck_image', truckImage);
      if (drivingLicense) formData.append('driving_license_image', drivingLicense);
      if (legalDocs) formData.append('legal_documents', legalDocs);

      await request.post('/driver/profile/update-vehicle', formData);

      toast.success('Vehicle configuration updated successfully');
      setTruckImage(null);
      setDrivingLicense(null);
      setLegalDocs(null);
      reset(data);
    } catch (error: unknown) {
      console.error('Update vehicle error:', error);
      toast.error('Failed to update vehicle configuration');
    }
  };

  const truckImageUrl = vehicle?.truck_image_url ?? null;
  const licenseImageUrl = vehicle?.driving_license_image_url
    ? storageUrl(vehicle.driving_license_image_url)
    : null;
  const legalDocsUrl = vehicle?.legal_documents_url
    ? storageUrl(vehicle.legal_documents_url)
    : null;

  const truckPreviewUrl = truckImage ? URL.createObjectURL(truckImage) : null;
  const licensePreviewUrl = drivingLicense ? URL.createObjectURL(drivingLicense) : null;
  const legalDocsPreviewUrl = legalDocs ? URL.createObjectURL(legalDocs) : null;

  return (
    <Section className="flex flex-col font-sans">
      <Section.Heading
        title="Vehicle Configuration"
        subtitle="Update your truck details and required documentation"
        align="left"
        className="mb-0 px-8"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid flex-1 grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-2">

          {/* ── Left Column: Basic Info ── */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-[#FFFEFA] p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                    <Truck className="h-4 w-4 text-amber-500" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
                </div>
                <Info className="h-4 w-4 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Truck Name *</label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Heavy Duty Alpha-01"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">License Plate *</label>
                  <div className="relative">
                    <input
                      {...register('license_plate')}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <CheckCircle2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  </div>
                  {errors.license_plate && <p className="mt-1 text-xs text-red-500">{errors.license_plate.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Capacity (lbs) *</label>
                    <input
                      type="number"
                      {...register('capacity', { valueAsNumber: true })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    {errors.capacity && <p className="mt-1 text-xs text-red-500">{errors.capacity.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Insurance *</label>
                    <select
                      {...register('insurance_status', { valueAsNumber: true })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Document Uploads ── */}
          <div className="rounded-2xl border border-border bg-[#FFFEFA] p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <UploadCloud className="h-4 w-4 text-amber-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Upload Documents</h2>
            </div>

            <div className="space-y-5">

              {/* ── Truck Image ──
              */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Truck Image</label>
                {truckPreviewUrl || truckImageUrl ? (
                  <ClickablePreview
                    url={truckPreviewUrl ?? truckImageUrl!}
                    mimeType="image/jpeg"
                    accept="image/*"
                    onNewFile={(file) => setTruckImage(file)}
                  />
                ) : (
                  <FileUpload
                    value={truckImage}
                    onChange={(val) => setTruckImage(val as File | null)}
                    existingFiles={[]}
                    accept="image/*"
                    maxSize={5}
                  />
                )}
              </div>

              {/* ── Driving License ── */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Driving License</label>
                {licensePreviewUrl || licenseImageUrl ? (
                  <ClickablePreview
                    url={licensePreviewUrl ?? licenseImageUrl!}
                    mimeType="image/jpeg"
                    accept="image/*"
                    onNewFile={(file) => setDrivingLicense(file)}
                  />
                ) : (
                  <FileUpload
                    value={drivingLicense}
                    onChange={(val) => setDrivingLicense(val as File | null)}
                    existingFiles={[]}
                    accept="image/*"
                    maxSize={5}
                  />
                )}
              </div>

              {/* ── Insurance Document ── */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Insurance Document</label>
                {legalDocsPreviewUrl || legalDocsUrl ? (
                  <ClickablePreview
                    url={legalDocsPreviewUrl ?? legalDocsUrl!}
                    mimeType={legalDocs?.type ?? 'application/pdf'}
                    accept="image/*,.pdf"
                    onNewFile={(file) => setLegalDocs(file)}
                  />
                ) : (
                  <FileUpload
                    value={legalDocs}
                    onChange={(val) => setLegalDocs(val as File | null)}
                    existingFiles={[]}
                    accept="image/*,.pdf"
                    maxSize={10}
                  />
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex flex-col items-start gap-4 border-t border-gray-200 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <span>Sensitive information is encrypted. Last update: Today.</span>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              className="flex-1 rounded-xl sm:flex-none"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 sm:flex-none"
            >
              {isSubmitting ? 'Saving...' : 'Submit Configuration'}
            </Button>
          </div>
        </div>
      </form>
    </Section>
  );
}