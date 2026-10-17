import React, { useState, useEffect } from 'react';
import { X, User, Camera, Calendar, MapPin, Briefcase, Heart, Sparkles, Plus, ImageOff } from 'lucide-react';
import { AVATAR_PRESETS, getDefaultAvatar } from '../data/avatars';
import Avatar from './Avatar';

export default function MemberModal({
  isOpen,
  onClose,
  onSave,
  initialMember,
  targetMember,
  relationType,
  members
}) {


  const [formData, setFormData] = useState({
    name: '',
    maidenName: '',
    relationToMe: 'Relative',
    gender: 'male',
    side: 'both',
    birthYear: '',
    birthPlace: '',
    deathYear: '',
    deathPlace: '',
    isDeceased: false,
    occupation: '',
    bio: '',
    notes: '',
    photo: '',
    fatherId: '',
    motherId: '',
    spouseId: '',
    siblingIds: [],
    generation: 0,
    tags: ''
  });

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (initialMember) {
      // Editing existing member
      setFormData({
        ...initialMember,
        side: initialMember.side || 'both',
        siblingIds: Array.isArray(initialMember.siblingIds) ? initialMember.siblingIds : [],
        tags: Array.isArray(initialMember.tags) ? initialMember.tags.join(', ') : initialMember.tags || ''
      });
    } else if (targetMember && relationType) {
      // Adding new relative connected to targetMember
      let defaultRelation = 'Relative';
      let defaultGender = 'male';
      let defaultSide = targetMember.side || 'both';
      let gen = targetMember.generation ?? 0;
      let fId = '';
      let mId = '';
      let sId = '';
      let sibIds = [];

      if (relationType === 'father') {
        defaultRelation = targetMember.id === 'me' ? 'Father' : `Father of ${targetMember.name}`;
        defaultGender = 'male';
        defaultSide = 'father';
        gen = (targetMember.generation ?? 0) + 1;
      } else if (relationType === 'mother') {
        defaultRelation = targetMember.id === 'me' ? 'Mother' : `Mother of ${targetMember.name}`;
        defaultGender = 'female';
        defaultSide = 'mother';
        gen = (targetMember.generation ?? 0) + 1;
      } else if (relationType === 'spouse') {
        defaultRelation = 'Spouse';
        defaultGender = targetMember.gender === 'male' ? 'female' : 'male';
        sId = targetMember.id;
        gen = targetMember.generation ?? 0;
      } else if (relationType === 'sibling') {
        defaultRelation = 'Sibling';
        defaultGender = 'female';
        fId = targetMember.fatherId || '';
        mId = targetMember.motherId || '';
        gen = targetMember.generation ?? 0;
        sibIds = [targetMember.id];
      } else if (relationType === 'child') {
        defaultRelation = 'Child';
        defaultGender = 'male';
        gen = (targetMember.generation ?? 0) - 1;
        if (targetMember.gender === 'female') {
          mId = targetMember.id;
          if (targetMember.spouseId) fId = targetMember.spouseId;
        } else {
          fId = targetMember.id;
          if (targetMember.spouseId) mId = targetMember.spouseId;
        }
      }

      const photoUrl = getDefaultAvatar(defaultGender);

      setFormData({
        name: '',
        maidenName: '',
        relationToMe: defaultRelation,
        gender: defaultGender,
        side: defaultSide,
        birthYear: '',
        birthPlace: '',
        deathYear: '',
        deathPlace: '',
        isDeceased: false,
        occupation: '',
        bio: '',
        notes: '',
        photo: photoUrl,
        fatherId: fId,
        motherId: mId,
        spouseId: sId,
        siblingIds: sibIds,
        generation: gen,
        tags: ''
      });
    } else {
      // Blank new member
      setFormData({
        name: '',
        maidenName: '',
        relationToMe: 'Relative',
        gender: 'male',
        side: 'father',
        birthYear: '',
        birthPlace: '',
        deathYear: '',
        deathPlace: '',
        isDeceased: false,
        occupation: '',
        bio: '',
        notes: '',
        photo: getDefaultAvatar('male'),
        fatherId: '',
        motherId: '',
        spouseId: '',
        siblingIds: [],
        generation: 0,
        tags: ''
      });
    }
  }, [initialMember, targetMember, relationType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const formattedTags = formData.tags
      ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    onSave({
      ...formData,
      tags: formattedTags,
      id: initialMember ? initialMember.id : `person_${Date.now()}`
    }, targetMember, relationType);

    onClose();
  };

  const handleGenderChange = (newGender) => {
    setFormData(prev => ({
      ...prev,
      gender: newGender,
      photo: prev.photo || getDefaultAvatar(newGender)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0b160f] border-2 border-[#d4af37]/50 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)] overflow-hidden my-8 tapestry-burnt-edges">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#070e09] via-[#12281a] to-[#070e09] border-b border-[#24422e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#740001]/40 border border-[#d4af37]/50 flex items-center justify-center text-[#fef08a] shadow-inner text-base">
              📜
            </div>
            <div>
              <h2 className="font-['Cinzel_Decorative',serif] font-bold text-lg text-[#fef08a] tracking-wide">
                {initialMember ? 'Edit Member Details' : targetMember ? `Add ${relationType || 'Relative'} for ${targetMember.name}` : 'Add Family Member'}
              </h2>
              <p className="text-xs text-emerald-300/80 font-serif">
                Add or update details for this family member
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#060c08] hover:bg-[#740001]/60 text-amber-200/70 hover:text-[#fef08a] border border-[#2b4c34] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-amber-100">
          
          {/* Avatar & Basic Info Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#07100a] border border-[#233f2c]">
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
              <div className="p-1 rounded-2xl bg-gradient-to-b from-[#d4af37] to-[#5a3e1b] shadow-lg">
                <Avatar
                  photo={formData.photo}
                  name={formData.name}
                  gender={formData.gender}
                  className="w-20 h-20 rounded-xl"
                />
              </div>
              <button
                type="button"
                className="absolute inset-0 rounded-2xl bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#fef08a] text-xs font-semibold transition-opacity"
              >
                <Camera className="w-5 h-5 mb-0.5" />
              </button>
            </div>

            <div className="flex-1 w-full space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-semibold text-amber-200 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexander Morgan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-3 py-2 text-sm text-amber-100 placeholder:text-emerald-700 focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif font-semibold text-amber-200 mb-1">
                    Maiden Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vance, Smith"
                    value={formData.maidenName}
                    onChange={(e) => setFormData({ ...formData, maidenName: e.target.value })}
                    className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-3 py-2 text-sm text-amber-100 placeholder:text-emerald-700 focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37]"
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif font-semibold text-amber-200 mb-1">
                    Relationship to Me
                  </label>
                  <select
                    value={formData.relationToMe}
                    onChange={(e) => setFormData({ ...formData, relationToMe: e.target.value })}
                    className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37]"
                  >
                    <option value="Me (Root)">Me (Root)</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Paternal Grandfather">Paternal Grandfather</option>
                    <option value="Paternal Grandmother">Paternal Grandmother</option>
                    <option value="Maternal Grandfather">Maternal Grandfather</option>
                    <option value="Maternal Grandmother">Maternal Grandmother</option>
                    <option value="Great-Grandfather">Great-Grandfather</option>
                    <option value="Great-Grandmother">Great-Grandmother</option>
                    <option value="Spouse">Spouse (Husband / Wife)</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Child">Child (Son / Daughter)</option>
                    <option value="Relative">Relative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif font-semibold text-[#fef08a] mb-1">
                    🌳 Generation
                  </label>
                  <select
                    value={formData.generation ?? 0}
                    onChange={(e) => setFormData({ ...formData, generation: parseInt(e.target.value) })}
                    className="w-full bg-[#050b07] border border-[#d4af37]/60 rounded-xl px-3 py-2 text-sm text-[#fef08a] focus:outline-none focus:ring-1 focus:ring-[#d4af37] font-bold"
                  >
                    <option value="0">Gen 0 (Me / My Generation)</option>
                    <option value="1">Gen 1 (Parents, Aunts, Uncles)</option>
                    <option value="2">Gen 2 (Grandparents)</option>
                    <option value="3">Gen 3 (Great-Grandparents)</option>
                    <option value="4">Gen 4 (Great-Great-Grandparents)</option>
                    <option value="5">Gen 5 (Ancestors)</option>
                    <option value="-1">Gen -1 (Children)</option>
                    <option value="-2">Gen -2 (Grandchildren)</option>
                  </select>
                </div>
              </div>

              {/* Family Lineage Side Selector */}
              <div>
                <label className="block text-xs font-serif font-semibold text-amber-200 mb-1.5">
                  Family Side
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, side: 'father' })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-serif font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      formData.side === 'father'
                        ? 'bg-[#740001]/50 border-[#d4af37] text-[#fef08a] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                        : 'bg-[#050b07] border-[#223d2b] text-amber-300/70 hover:border-[#740001]'
                    }`}
                  >
                    Father's Side
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, side: 'mother' })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-serif font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      formData.side === 'mother'
                        ? 'bg-[#1a472a]/60 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-[#050b07] border-[#223d2b] text-emerald-300/70 hover:border-emerald-600'
                    }`}
                  >
                    Mother's Side
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, side: 'both' })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-serif font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      formData.side === 'both'
                        ? 'bg-[#b8860b]/40 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                        : 'bg-[#050b07] border-[#223d2b] text-amber-300/70 hover:border-amber-600'
                    }`}
                  >
                    Both Sides / Direct
                  </button>
                </div>
              </div>

              {/* Explicit Parent, Spouse & Sibling Linkage Section */}
              <div className="p-4 rounded-2xl bg-[#09150d] border border-[#d4af37]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-[#fef08a] uppercase tracking-wider flex items-center gap-1.5">
                    Family Relationships
                  </span>
                  <span className="text-[11px] text-emerald-300/70 font-serif">Link parents, spouse, or siblings</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  {/* Select Father */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-serif font-semibold text-amber-300 mb-1.5 truncate">
                      Father
                    </label>
                    <select
                      value={formData.fatherId || ''}
                      onChange={(e) => setFormData({ ...formData, fatherId: e.target.value })}
                      className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-2.5 py-2 text-xs text-amber-100 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                    >
                      <option value="">-- None --</option>
                      {(members || []).filter(m => m.id !== initialMember?.id && m.gender !== 'female').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.id === 'me' ? '(Me)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Mother */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-serif font-semibold text-emerald-300 mb-1.5 truncate">
                      Mother
                    </label>
                    <select
                      value={formData.motherId || ''}
                      onChange={(e) => setFormData({ ...formData, motherId: e.target.value })}
                      className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-2.5 py-2 text-xs text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      <option value="">-- None --</option>
                      {(members || []).filter(m => m.id !== initialMember?.id && m.gender !== 'male').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.id === 'me' ? '(Me)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Spouse */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-serif font-semibold text-amber-300 mb-1.5 truncate">
                      Spouse
                    </label>
                    <select
                      value={formData.spouseId || ''}
                      onChange={(e) => setFormData({ ...formData, spouseId: e.target.value })}
                      className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-2.5 py-2 text-xs text-amber-100 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                    >
                      <option value="">-- None --</option>
                      {(members || []).filter(m => m.id !== initialMember?.id).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.id === 'me' ? '(Me)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Sibling */}
                  <div className="flex flex-col justify-end">
                    <label className="block text-xs font-serif font-semibold text-indigo-300 mb-1.5 truncate">
                      Sibling
                    </label>
                    <select
                      value={(formData.siblingIds && formData.siblingIds[0]) || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          siblingIds: val ? [val] : []
                        });
                      }}
                      className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-2.5 py-2 text-xs text-amber-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      <option value="">-- None --</option>
                      {(members || []).filter(m => m.id !== initialMember?.id).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.gender === 'female' ? '👧' : '👦'} {m.name} {m.id === 'me' ? '(Me)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </div>


          {/* Preset Avatar Selector Modal Overlay */}
          {showAvatarPicker && (
            <div className="p-4 rounded-2xl bg-[#09150d] border border-[#d4af37]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-[#fef08a] uppercase tracking-wider">
                  Select Avatar Photo
                </span>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="text-xs text-amber-300/80 hover:text-[#fef08a]"
                >
                  Done
                </button>
              </div>

              {/* No Photo Button Option */}
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, photo: '' });
                  setShowAvatarPicker(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#050b07] border border-[#274833] hover:border-[#d4af37] text-xs font-serif font-semibold text-amber-300 flex items-center justify-center gap-2 transition-all"
              >
                <ImageOff className="w-4 h-4 text-amber-400" />
                🚫 Default Avatar
              </button>

              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pt-2 border-t border-[#223d2b]">
                {[...AVATAR_PRESETS.male, ...AVATAR_PRESETS.female, ...AVATAR_PRESETS.neutral].map((av) => (
                  <img
                    key={av.id}
                    src={av.url}
                    alt={av.name}
                    onClick={() => {
                      setFormData({ ...formData, photo: av.url });
                      setShowAvatarPicker(false);
                    }}
                    className="w-12 h-12 rounded-xl object-cover cursor-pointer border-2 border-[#24422e] hover:border-[#d4af37] hover:scale-105 transition-all shadow"
                  />
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-serif font-semibold text-emerald-300 mb-1">
                  Or Enter Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-3 py-1.5 text-xs text-amber-100 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                />
              </div>
            </div>
          )}


          {/* Gender & Lifespan Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif font-semibold text-amber-200 mb-2">Gender</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleGenderChange('male')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-serif font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    formData.gender === 'male'
                      ? 'bg-[#1b3424] border-[#d4af37] text-[#fef08a] shadow-md'
                      : 'bg-[#050b07] border-[#223d2b] text-amber-300/60 hover:border-emerald-600'
                  }`}
                >
                  ♂ Male
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange('female')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-serif font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    formData.gender === 'female'
                      ? 'bg-[#740001]/40 border-pink-400 text-pink-200 shadow-md'
                      : 'bg-[#050b07] border-[#223d2b] text-amber-300/60 hover:border-pink-800'
                  }`}
                >
                  ♀ Female
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange('other')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-serif font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    formData.gender === 'other'
                      ? 'bg-[#3b2d54] border-purple-400 text-purple-200 shadow-md'
                      : 'bg-[#050b07] border-[#223d2b] text-amber-300/60 hover:border-purple-800'
                  }`}
                >
                  Other
                </button>
              </div>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-[#07100a] border border-[#233f2c] hover:border-[#d4af37]/40 w-full">
                <input
                  type="checkbox"
                  checked={formData.isDeceased}
                  onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 bg-[#050b07] border-[#274833] focus:ring-[#d4af37]"
                />
                <div>
                  <span className="text-xs font-serif font-semibold text-amber-200">Deceased</span>
                  <p className="text-[11px] text-emerald-400/70 font-serif">Check if this person has passed away</p>
                </div>
              </label>
            </div>
          </div>

          {/* Dates & Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif font-semibold text-amber-200 mb-1">
                Year of Birth
              </label>
              <input
                type="text"
                placeholder="e.g. 1959"
                value={formData.birthYear}
                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-3 py-2 text-sm text-amber-100 placeholder:text-emerald-700 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-amber-200 mb-1">
                Birthplace / Location
              </label>
              <input
                type="text"
                placeholder="e.g. New York, NY, USA"
                value={formData.birthPlace}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-3 py-2 text-sm text-amber-100 placeholder:text-emerald-700 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
          </div>

          {formData.isDeceased && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-2xl bg-[#1e0a0a]/60 border border-[#740001]/60">
              <div>
                <label className="block text-xs font-serif font-semibold text-rose-300 mb-1">
                  Year of Passing (Death)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1996"
                  value={formData.deathYear}
                  onChange={(e) => setFormData({ ...formData, deathYear: e.target.value })}
                  className="w-full bg-[#050b07] border border-[#740001]/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-semibold text-rose-300 mb-1">
                  Place of Death / Burial Place
                </label>
                <input
                  type="text"
                  placeholder="e.g. Boston, MA, USA"
                  value={formData.deathPlace}
                  onChange={(e) => setFormData({ ...formData, deathPlace: e.target.value })}
                  className="w-full bg-[#050b07] border border-[#740001]/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* Occupation & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif font-semibold text-amber-200 mb-1">
                Occupation / Profession
              </label>
              <input
                type="text"
                placeholder="e.g. Software Engineer, Teacher, Doctor"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-3 py-2 text-sm text-amber-100 placeholder:text-emerald-700 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-serif font-semibold text-amber-200 mb-1">
                Tags / Keywords (Comma Separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Veteran, Musician, Artist"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-[#050b07] border border-[#274833] rounded-xl px-3 py-2 text-sm text-amber-100 placeholder:text-emerald-700 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
              />
            </div>
          </div>

          {/* Biography & Stories */}
          <div>
            <label className="block text-xs font-serif font-semibold text-amber-200 mb-1">
              Biography & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Add biography, memories, or notes about this person..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-[#050b07] border border-[#274833] rounded-xl p-3 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-[#d4af37] placeholder:text-emerald-800 resize-none font-serif"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#233f2c] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#07100a] hover:bg-[#122417] text-amber-300/80 text-xs font-serif font-semibold border border-[#24422e] transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#740001] via-[#941c1c] to-[#b8860b] hover:from-[#941c1c] hover:to-[#d4af37] text-[#fef08a] text-xs font-serif font-bold tracking-wider shadow-[0_0_15px_rgba(212,175,55,0.35)] border border-[#d4af37]/60 transition-all transform hover:scale-[1.02]"
            >
              {initialMember ? 'Save Changes' : 'Add Member'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
