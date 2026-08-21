'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface HazmonImageUploaderProps {
  hazmonId: string;
  currentImageUrl?: string;
  onImageUpdated: (newUrl: string) => void;
}

export default function HazmonImageUploader({
  hazmonId,
  currentImageUrl,
  onImageUpdated,
}: HazmonImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create file path: userId/hazmonId/filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${hazmonId}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hazmon-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('hazmon-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update hazmon_collection with new image URL
      const { error: updateError } = await supabase
        .from('hazmon_collection')
        .update({ custom_image_url: publicUrl })
        .eq('id', hazmonId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Delete old image if exists
      if (currentImageUrl && currentImageUrl.includes('hazmon-images')) {
        try {
          const oldPath = currentImageUrl.split('hazmon-images/').pop();
          if (oldPath) {
            await supabase.storage
              .from('hazmon-images')
              .remove([oldPath]);
          }
        } catch (e) {
          console.warn('Failed to delete old image:', e);
        }
      }

      onImageUpdated(publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (!confirm('Remove custom image and use default icon?')) return;

    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Delete from storage
      if (currentImageUrl && currentImageUrl.includes('hazmon-images')) {
        const imagePath = currentImageUrl.split('hazmon-images/').pop();
        if (imagePath) {
          await supabase.storage
            .from('hazmon-images')
            .remove([imagePath]);
        }
      }

      // Update database
      const { error: updateError } = await supabase
        .from('hazmon_collection')
        .update({ custom_image_url: null })
        .eq('id', hazmonId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onImageUpdated('');
    } catch (err: any) {
      console.error('Remove error:', err);
      setError(err.message || 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Current Image Preview */}
      {currentImageUrl && (
        <div className="relative w-full aspect-square bg-black/20 rounded-lg overflow-hidden border border-white/10">
          <img
            src={currentImageUrl}
            alt="Custom Hazmon"
            className="w-full h-full object-contain"
          />
          <button
            onClick={handleRemoveImage}
            disabled={uploading}
            className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id={`hazmon-upload-${hazmonId}`}
        />
        <label htmlFor={`hazmon-upload-${hazmonId}`}>
          <Button
            type="button"
            variant="outline"
            className="w-full pointer-events-none"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                Uploading...
              </>
            ) : currentImageUrl ? (
              <>
                <ImageIcon size={16} className="mr-2" />
                Change Image
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload Custom Image
              </>
            )}
          </Button>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Help Text */}
      <p className="text-xs text-steel">
        {currentImageUrl 
          ? 'Upload a new image to replace the current one'
          : 'Upload your own artwork for this Hazmon (max 2MB)'}
      </p>
    </div>
  );
}
