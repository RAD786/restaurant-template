const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  // include admin token so /api/upload (protected) works
  const token = localStorage.getItem('admintoken');

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    throw new Error((await res.text()) || 'Upload failed');
  }

  return res.json(); // { url, public_id }
};

export default uploadImage;
