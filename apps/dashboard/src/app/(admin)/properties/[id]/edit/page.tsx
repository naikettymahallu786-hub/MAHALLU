'use client';
import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function EditPropertyPage() {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => apiClient.get(`/properties/${id}`).then(r => r.data.data),
  });

  const { register, handleSubmit, watch, reset } = useForm({ 
    defaultValues: { status: 'vacant', type: 'building', name: '', propertyCode: '', rentAmount: '', quantity: 1 } 
  });
  
  useEffect(() => {
    if (property) {
      reset({
        propertyCode: property.propertyCode,
        name: property.name,
        type: property.type,
        rentAmount: property.rentAmount || '',
        status: property.status,
        quantity: property.quantity || 1,
      });
    }
  }, [property, reset]);

  const watchType = watch('type');

  const updateMutation = useMutation<any, any, any>({
    mutationFn: (data) => apiClient.put(`/properties/${id}`, data),
    onSuccess: () => {
      toast.success('Property updated successfully');
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      router.push('/properties');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update property')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/properties/${id}`}><button className="p-2 rounded-xl border"><ArrowLeft size={16} /></button></Link>
        <div>
          <h1 className="page-title text-xl">Edit Property</h1>
          <p className="page-subtitle font-medium">Update asset or rental unit details</p>
        </div>
      </div>
      <div className="section-card">
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Property Code *</label>
              <input type="text" {...register('propertyCode', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Property Name *</label>
              <input type="text" {...register('name', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Property Type *</label>
              <select {...register('type', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="building">Building Complex</option>
                <option value="shop">Shop Room</option>
                <option value="rental_house">Rental House</option>
                <option value="land">Land Area</option>
                <option value="equipment">Equipment (Chairs, Tables, etc.)</option>
              </select>
            </div>
            {watchType === 'equipment' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Total Quantity *</label>
                <input type="number" {...register('quantity', { valueAsNumber: true, required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Monthly Rent / Fee (INR)</label>
              <input type="number" {...register('rentAmount', { valueAsNumber: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Status *</label>
              <select {...register('status', { required: true })} className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm">
                <option value="vacant">Vacant / Available</option>
                <option value="occupied">Occupied / Rented Out</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href={`/properties/${id}`}><button type="button" className="px-5 py-2.5 rounded-xl border text-sm font-semibold">Cancel</button></Link>
            <button type="submit" disabled={updateMutation.isPending} className="btn-brand flex items-center gap-2">
              {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
