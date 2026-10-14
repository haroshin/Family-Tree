// Preset high-quality portrait avatars for family tree members
export const AVATAR_PRESETS = {
  male: [
    { id: 'm1', name: 'Young Man (Modern)', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' },
    { id: 'm2', name: 'Young Adult Man', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
    { id: 'm3', name: 'Middle Aged Man', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
    { id: 'm4', name: 'Elderly Gentleman', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80' },
    { id: 'm5', name: 'Senior Man with Beard', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80' },
    { id: 'm6', name: 'Classic Grandpa', url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=300&q=80' },
  ],
  female: [
    { id: 'f1', name: 'Young Woman (Modern)', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80' },
    { id: 'f2', name: 'Young Adult Woman', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80' },
    { id: 'f3', name: 'Middle Aged Woman', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80' },
    { id: 'f4', name: 'Senior Woman / Grandma', url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80' },
    { id: 'f5', name: 'Elderly Lady', url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=300&q=80' },
    { id: 'f6', name: 'Elegant Matriarch', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
  ],
  neutral: [
    { id: 'n1', name: 'Minimal Avatar Blue', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80' },
    { id: 'n2', name: 'Minimal Avatar Gold', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80' },
  ]
};

export const getDefaultAvatar = (gender = 'other', name = '') => {
  if (gender === 'male') {
    return AVATAR_PRESETS.male[1].url;
  }
  if (gender === 'female') {
    return AVATAR_PRESETS.female[0].url;
  }
  return AVATAR_PRESETS.neutral[0].url;
};
