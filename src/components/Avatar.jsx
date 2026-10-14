import React, { useState } from 'react';
import { User } from 'lucide-react';

export default function Avatar({ photo, name, gender, className = "w-24 h-24 rounded-full" }) {
  const [imgError, setImgError] = useState(false);

  // Get initials from name (e.g., "Alex Morgan" -> "AM")
  const getInitials = (n = '') => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const hasPhoto = photo && photo.trim() !== '' && !imgError;

  if (hasPhoto) {
    return (
      <img
        src={photo}
        alt={name || 'Family Member'}
        onError={() => setImgError(true)}
        className={`${className} object-cover`}
      />
    );
  }

  // Blank Photo Placeholder with Leaf & Silhouette Theme
  const isFemale = gender === 'female';
  const isMale = gender === 'male';

  const placeholderBg = isFemale
    ? 'bg-gradient-to-tr from-emerald-900 via-rose-950 to-emerald-950 border-rose-400/80 text-rose-200'
    : isMale
    ? 'bg-gradient-to-tr from-emerald-900 via-teal-950 to-emerald-950 border-emerald-400/80 text-emerald-200'
    : 'bg-gradient-to-tr from-emerald-900 via-amber-950 to-emerald-950 border-amber-400/80 text-amber-200';

  return (
    <div className={`${className} ${placeholderBg} border-2 flex flex-col items-center justify-center shadow-lg relative overflow-hidden shrink-0`}>
      <User className="w-1/2 h-1/2 opacity-50 mb-0.5" />
      <span className="font-serif-vintage font-bold text-xs tracking-wider">
        {getInitials(name)}
      </span>
      <span className="text-[9px] uppercase font-bold opacity-60">
        No Photo
      </span>
    </div>
  );
}
