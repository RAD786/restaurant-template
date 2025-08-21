// Inserts f_auto,q_auto into the Cloudinary delivery URL
const optimizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  // Cloudinary URLs contain /upload/ — inject delivery params after it.
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
};
export default optimizeImageUrl;