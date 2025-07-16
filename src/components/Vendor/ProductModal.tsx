// src/components/Vendor/ProductModal.tsx
const [uploading, setUploading] = useState(false);
const [imageFile, setImageFile] = useState<File | null>(null);

const handleImageUpload = async (file: File) => {
  try {
    setUploading(true);
    const fileName = `${business.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    setFormData(prev => ({ ...prev, image_url: publicUrl }));
  } catch (error) {
    // ... error handling
  } finally {
    setUploading(false);
  }
};
