import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';

import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import VintageTreeCanvas from './components/VintageTreeCanvas';
import TreeCanvas from './components/TreeCanvas';
import PedigreeView from './components/PedigreeView';
import TimelineView from './components/TimelineView';
import AnalyticsView from './components/AnalyticsView';
import DirectoryView from './components/DirectoryView';
import MemberModal from './components/MemberModal';
import ProfileModal from './components/ProfileModal';
import ContextMenu from './components/ContextMenu';

import { INITIAL_FAMILY_TREE } from './data/initialData';
import { updateGenerations, exportToJSON, exportToGEDCOM, calculateFamilySides } from './utils/treeUtils';
import {
  getActiveUser,
  logoutUser,
  getUserTree,
  saveUserTree,
  updateCurrentUserTreeName,
  syncTreeToBackend,
  fetchTreeFromBackend,
  createStarterTreeForUser,
  purgeLegacySharedTreeKeys
} from './utils/authUtils';

export default function App() {
  // Purge any legacy un-isolated tree keys on startup
  useEffect(() => {
    purgeLegacySharedTreeKeys();
  }, []);

  // Current logged in user session
  const [currentUser, setCurrentUser] = useState(() => {
    return getActiveUser();
  });

  // Current active family tree members — strictly isolated per user
  const [members, setMembers] = useState(() => {
    const active = getActiveUser();
    if (!active) return [];
    const cachedUserTree = getUserTree(active.id);
    if (cachedUserTree && cachedUserTree.length > 0) {
      return cachedUserTree;
    }
    return createStarterTreeForUser(active);
  });

  const [activeView, setActiveView] = useState('vintagetree');
  const [searchQuery, setSearchQuery] = useState('');
  const [sideFilter, setSideFilter] = useState('all'); // 'all' | 'father' | 'mother'
  const [theme, setTheme] = useState('parchment');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  // Compute side mapping for Father's Side vs Mother's Side
  const sideMap = useMemo(() => calculateFamilySides(members, 'me'), [members]);

  // Modals state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberModalState, setMemberModalState] = useState({
    isOpen: false,
    initialMember: null,
    targetMember: null,
    relationType: null
  });

  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  // Persist user-initiated tree edits strictly to the active user's local storage & MongoDB
  const persistUserTreeEdit = useCallback(
    (nextMembers, userOverride = null) => {
      const targetUser = userOverride || currentUser;
      if (!targetUser || !targetUser.id || !Array.isArray(nextMembers) || nextMembers.length === 0) {
        return;
      }
      saveUserTree(targetUser.id, nextMembers);
      setCloudSyncStatus('syncing');
      syncTreeToBackend(nextMembers, targetUser.treeName, targetUser).then((res) => {
        setCloudSyncStatus(res?.success ? 'synced' : 'idle');
      });
    },
    [currentUser]
  );

  // Fetch authoritative tree for the active user from MongoDB when user session starts/changes
  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      setMembers([]);
      return;
    }

    let cancelled = false;
    const activeUserSnapshot = currentUser;

    // Immediately show only this user's cached tree or their personal starter root node
    const cachedUserTree = getUserTree(activeUserSnapshot.id);
    if (cachedUserTree && cachedUserTree.length > 0) {
      setMembers(cachedUserTree);
    } else {
      const starter = createStarterTreeForUser(activeUserSnapshot);
      setMembers(starter);
      saveUserTree(activeUserSnapshot.id, starter);
    }

    setCloudSyncStatus('syncing');
    fetchTreeFromBackend(activeUserSnapshot)
      .then((remoteTree) => {
        if (cancelled) return;
        const remoteMembers = remoteTree?.members || [];

        if (remoteMembers.length > 0) {
          setMembers(remoteMembers);
          saveUserTree(activeUserSnapshot.id, remoteMembers);
          setCloudSyncStatus('synced');
          if (remoteTree.treeName && remoteTree.treeName !== activeUserSnapshot.treeName) {
            setCurrentUser((prev) =>
              prev && prev.id === activeUserSnapshot.id ? { ...prev, treeName: remoteTree.treeName } : prev
            );
          }
        } else {
          setCloudSyncStatus('synced');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.warn('Backend fetch error:', e);
          setCloudSyncStatus('idle');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  // Handle Manual Sync to MongoDB
  const handleManualSync = async () => {
    if (!currentUser) return;
    setCloudSyncStatus('syncing');
    try {
      const res = await syncTreeToBackend(members, currentUser.treeName, currentUser);
      if (res?.success) {
        setCloudSyncStatus('synced');
        alert(
          `✓ Cloud Sync Successful!\n\nAll ${members.length} members in "${
            currentUser.treeName || 'My Family Tree'
          }" have been safely backed up to MongoDB Atlas.\n\nNow when you log in on your phone with ${
            currentUser.email
          }, you will see your entire family tree!`
        );
      } else {
        setCloudSyncStatus('error');
        alert(`Cloud sync status: ${res?.error || 'Unable to sync to cloud at this moment.'}`);
      }
    } catch (err) {
      setCloudSyncStatus('error');
      alert(`Sync failed: ${err.message}`);
    }
  };

  // Handle successful login or account registration
  const handleLoginSuccess = (user) => {
    if (!user) return;
    const initialTree = getUserTree(user.id) || createStarterTreeForUser(user);
    saveUserTree(user.id, initialTree);
    setSelectedMember(null);
    setContextMenu(null);
    setSearchQuery('');
    setSideFilter('all');
    setMembers(initialTree);
    setCurrentUser(user);
  };

  // Handle user logout — completely clear in-memory tree state so nothing leaks
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setMembers([]);
    setSelectedMember(null);
    setContextMenu(null);
    setSearchQuery('');
    setSideFilter('all');
  };

  // Handle renaming of active family tree
  const handleUpdateTreeName = async (newName) => {
    const updated = await updateCurrentUserTreeName(newName);
    if (updated) {
      setCurrentUser({ ...updated });
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.1 }
      });
    }
  };

  // Handle Add or Edit Save
  const handleSaveMember = (memberData, targetMember, relationType) => {
    setMembers((prevMembers) => {
      let updated = [...prevMembers];
      const existingIdx = updated.findIndex((m) => m.id === memberData.id);

      if (existingIdx >= 0) {
        // Edit existing member
        updated[existingIdx] = { ...updated[existingIdx], ...memberData };
      } else {
        // Add new member
        updated.push(memberData);

        // Link with target member if added as a relative
        if (targetMember && relationType) {
          const targetIdx = updated.findIndex((m) => m.id === targetMember.id);
          if (targetIdx >= 0) {
            const targetCopy = { ...updated[targetIdx] };

            if (relationType === 'father') {
              targetCopy.fatherId = memberData.id;
              memberData.childrenIds = [...new Set([...(memberData.childrenIds || []), targetCopy.id])];
              if (targetCopy.motherId) {
                memberData.spouseId = targetCopy.motherId;
                const mIdx = updated.findIndex((m) => m.id === targetCopy.motherId);
                if (mIdx >= 0) updated[mIdx] = { ...updated[mIdx], spouseId: memberData.id };
              }
            } else if (relationType === 'mother') {
              targetCopy.motherId = memberData.id;
              memberData.childrenIds = [...new Set([...(memberData.childrenIds || []), targetCopy.id])];
              if (targetCopy.fatherId) {
                memberData.spouseId = targetCopy.fatherId;
                const fIdx = updated.findIndex((m) => m.id === targetCopy.fatherId);
                if (fIdx >= 0) updated[fIdx] = { ...updated[fIdx], spouseId: memberData.id };
              }
            } else if (relationType === 'spouse') {
              targetCopy.spouseId = memberData.id;
              memberData.spouseId = targetCopy.id;
            } else if (relationType === 'sibling') {
              targetCopy.siblingIds = [...new Set([...(targetCopy.siblingIds || []), memberData.id])];
              memberData.siblingIds = [...new Set([...(memberData.siblingIds || []), targetCopy.id])];
              if (targetCopy.fatherId) memberData.fatherId = targetCopy.fatherId;
              if (targetCopy.motherId) memberData.motherId = targetCopy.motherId;
            } else if (relationType === 'child') {
              targetCopy.childrenIds = [...new Set([...(targetCopy.childrenIds || []), memberData.id])];

              // Link to target parent & target parent's spouse if exists!
              if (targetCopy.gender === 'female') {
                memberData.motherId = targetCopy.id;
                if (targetCopy.spouseId) {
                  memberData.fatherId = targetCopy.spouseId;
                  const sIdx = updated.findIndex((m) => m.id === targetCopy.spouseId);
                  if (sIdx >= 0) {
                    updated[sIdx] = {
                      ...updated[sIdx],
                      childrenIds: [...new Set([...(updated[sIdx].childrenIds || []), memberData.id])]
                    };
                  }
                }
              } else {
                memberData.fatherId = targetCopy.id;
                if (targetCopy.spouseId) {
                  memberData.motherId = targetCopy.spouseId;
                  const sIdx = updated.findIndex((m) => m.id === targetCopy.spouseId);
                  if (sIdx >= 0) {
                    updated[sIdx] = {
                      ...updated[sIdx],
                      childrenIds: [...new Set([...(updated[sIdx].childrenIds || []), memberData.id])]
                    };
                  }
                }
              }
            }

            updated[targetIdx] = targetCopy;
          }
        }
      }

      // Sync reciprocal relationships for father, mother, spouse, children
      const finalMap = new Map(updated.map((m) => [m.id, { ...m }]));

      finalMap.forEach((m) => {
        if (m.fatherId && finalMap.has(m.fatherId)) {
          const f = finalMap.get(m.fatherId);
          f.childrenIds = [...new Set([...(f.childrenIds || []), m.id])];
        }
        if (m.motherId && finalMap.has(m.motherId)) {
          const mo = finalMap.get(m.motherId);
          mo.childrenIds = [...new Set([...(mo.childrenIds || []), m.id])];
        }
        if (m.spouseId && finalMap.has(m.spouseId)) {
          const sp = finalMap.get(m.spouseId);
          sp.spouseId = m.id;
        }
        if (m.fatherId && m.motherId && finalMap.has(m.fatherId) && finalMap.has(m.motherId)) {
          const f = finalMap.get(m.fatherId);
          const mo = finalMap.get(m.motherId);
          if (!f.spouseId) f.spouseId = mo.id;
          if (!mo.spouseId) mo.spouseId = f.id;
        }
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      const nextMembers = updateGenerations(Array.from(finalMap.values()), 'me');
      persistUserTreeEdit(nextMembers);
      return nextMembers;
    });
  };

  // Handle Delete Member
  const handleDeleteMember = (memberId) => {
    if (memberId === 'me') {
      alert('Cannot delete the root "Me" node. You can edit its details instead!');
      return;
    }

    if (window.confirm('Are you sure you want to delete this family member from the tree?')) {
      setMembers((prevMembers) => {
        const filtered = prevMembers.filter((m) => m.id !== memberId);
        const cleaned = filtered.map((m) => ({
          ...m,
          fatherId: m.fatherId === memberId ? null : m.fatherId,
          motherId: m.motherId === memberId ? null : m.motherId,
          spouseId: m.spouseId === memberId ? null : m.spouseId,
          childrenIds: (m.childrenIds || []).filter((id) => id !== memberId),
          siblingIds: (m.siblingIds || []).filter((id) => id !== memberId)
        }));
        const nextMembers = updateGenerations(cleaned, 'me');
        persistUserTreeEdit(nextMembers);
        return nextMembers;
      });

      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(null);
      }
    }
  };

  // Set member as new root 'me' node
  const handleSetAsMe = (memberId) => {
    setMembers((prevMembers) => {
      const updated = prevMembers.map((m) => {
        if (m.id === 'me') return { ...m, id: `person_${Date.now()}` };
        if (m.id === memberId) return { ...m, id: 'me', relationToMe: 'Me (Root)' };
        return m;
      });
      const nextMembers = updateGenerations(updated, 'me');
      persistUserTreeEdit(nextMembers);
      return nextMembers;
    });
    setSelectedMember(null);
  };

  // Load sample demo tree
  const handleLoadDemo = () => {
    if (window.confirm('Load 4-Generation Demo Tree? This will replace your current tree.')) {
      const nextMembers = updateGenerations(INITIAL_FAMILY_TREE, 'me');
      setMembers(nextMembers);
      persistUserTreeEdit(nextMembers);
    }
  };

  // Reset to single "Just Me" node for the current user
  const handleResetTree = () => {
    if (window.confirm('Start Fresh with a single "Me" template? All current members will be cleared.')) {
      const nextMembers = createStarterTreeForUser(currentUser);
      setMembers(nextMembers);
      persistUserTreeEdit(nextMembers);
    }
  };

  // Export tree as PNG Image
  const handleExportImage = async () => {
    const exportRoot = document.getElementById('tree-export-root');
    const chartRoot = document.querySelector('.node-card')?.closest('.min-w-max');
    const fallbackCanvas = document.querySelector('.min-w-max') || document.querySelector('.tapestry-canvas');
    const canvasEl = exportRoot || chartRoot || fallbackCanvas;

    if (!canvasEl) {
      alert('Could not find tree canvas to capture image.');
      return;
    }

    let prevTransform = '';
    let isTransformAdjusted = false;

    try {
      if (exportRoot && exportRoot.style.transform) {
        prevTransform = exportRoot.style.transform;
        exportRoot.style.transform = 'none';
        isTransformAdjusted = true;
      }

      // Brief pause to allow reflow after clearing transform
      await new Promise((resolve) => setTimeout(resolve, 50));

      const dataUrl = await toPng(canvasEl, {
        backgroundColor: '#070d09',
        pixelRatio: 2,
        cacheBust: true
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      const safeTreeName = (currentUser?.treeName || 'family_tree').toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `${safeTreeName}_${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Could not capture tree image: ' + (err.message || 'Error creating canvas snapshot'));
    } finally {
      if (isTransformAdjusted && exportRoot) {
        exportRoot.style.transform = prevTransform;
      }
    }
  };

  // If no user is logged in, show Auth / Login / Register Page
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070d09] text-amber-100 flex flex-col font-sans selection:bg-[#740001] selection:text-amber-200 tapestry-canvas">
      {/* Top Header Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sideFilter={sideFilter}
        setSideFilter={setSideFilter}
        onAddMember={(target = null, relation = null) => {
          setMemberModalState({
            isOpen: true,
            initialMember: null,
            targetMember: target,
            relationType: relation
          });
        }}
        onResetTree={handleResetTree}
        onLoadDemo={handleLoadDemo}
        onExportJSON={() => exportToJSON(members)}
        onExportGEDCOM={() => exportToGEDCOM(members)}
        onExportImage={handleExportImage}
        onImportJSON={(imported) => {
          const nextMembers = updateGenerations(imported, 'me');
          setMembers(nextMembers);
          persistUserTreeEdit(nextMembers);
        }}
        theme={theme}
        setTheme={setTheme}
        membersCount={members.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        sideMap={sideMap}
        onUpdateTreeName={handleUpdateTreeName}
        onManualSync={handleManualSync}
        cloudSyncStatus={cloudSyncStatus}
      />

      {/* Main Active View Container */}
      <main className="flex-1 relative overflow-x-hidden">
        {activeView === 'vintagetree' && (
          <VintageTreeCanvas
            members={members}
            onSelectMember={(m) => setSelectedMember(m)}
            onAddRelation={(target, relation) => {
              setMemberModalState({
                isOpen: true,
                initialMember: null,
                targetMember: target,
                relationType: relation
              });
            }}
            onEditMember={(m) => {
              setMemberModalState({
                isOpen: true,
                initialMember: m,
                targetMember: null,
                relationType: null
              });
            }}
            onDeleteMember={handleDeleteMember}
            searchQuery={searchQuery}
            sideFilter={sideFilter}
            onSelectSideFilter={setSideFilter}
            sideMap={sideMap}
            onOpenContextMenu={(menu) => setContextMenu(menu)}
            onResetFilter={() => setSideFilter('all')}
            onLoadDemo={handleLoadDemo}
          />
        )}

        {activeView === 'tree' && (
          <TreeCanvas
            members={members}
            onSelectMember={(m) => setSelectedMember(m)}
            onAddRelation={(target, relation) => {
              setMemberModalState({
                isOpen: true,
                initialMember: null,
                targetMember: target,
                relationType: relation
              });
            }}
            onEditMember={(m) => {
              setMemberModalState({
                isOpen: true,
                initialMember: m,
                targetMember: null,
                relationType: null
              });
            }}
            onDeleteMember={handleDeleteMember}
            searchQuery={searchQuery}
            theme={theme}
            sideFilter={sideFilter}
            onSelectSideFilter={setSideFilter}
            sideMap={sideMap}
            onOpenContextMenu={(menu) => setContextMenu(menu)}
          />
        )}

        {activeView === 'pedigree' && (
          <PedigreeView members={members} onSelectMember={(m) => setSelectedMember(m)} theme={theme} />
        )}

        {activeView === 'timeline' && (
          <TimelineView members={members} onSelectMember={(m) => setSelectedMember(m)} />
        )}

        {activeView === 'analytics' && <AnalyticsView members={members} />}

        {activeView === 'directory' && (
          <DirectoryView
            members={members}
            onSelectMember={(m) => setSelectedMember(m)}
            onEditMember={(m) => {
              setMemberModalState({
                isOpen: true,
                initialMember: m,
                targetMember: null,
                relationType: null
              });
            }}
            onAddMember={() => {
              setMemberModalState({
                isOpen: true,
                initialMember: null,
                targetMember: null,
                relationType: null
              });
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </main>

      {/* Add / Edit Member Modal */}
      <MemberModal
        isOpen={memberModalState.isOpen}
        onClose={() => setMemberModalState({ ...memberModalState, isOpen: false })}
        onSave={handleSaveMember}
        initialMember={memberModalState.initialMember}
        targetMember={memberModalState.targetMember}
        relationType={memberModalState.relationType}
        members={members}
      />

      {/* Full Member Profile Modal */}
      <ProfileModal
        member={selectedMember}
        members={members}
        onClose={() => setSelectedMember(null)}
        onEdit={(m) => {
          setSelectedMember(null);
          setMemberModalState({
            isOpen: true,
            initialMember: m,
            targetMember: null,
            relationType: null
          });
        }}
        onDelete={(id) => {
          handleDeleteMember(id);
          setSelectedMember(null);
        }}
        onSelectRelative={(rel) => setSelectedMember(rel)}
        onSetAsMe={handleSetAsMe}
      />

      {/* Right Click Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onAddRelation={(target, relation) => {
          setMemberModalState({
            isOpen: true,
            initialMember: null,
            targetMember: target,
            relationType: relation
          });
        }}
        onEditMember={(m) => {
          setMemberModalState({
            isOpen: true,
            initialMember: m,
            targetMember: null,
            relationType: null
          });
        }}
        onSelectMember={(m) => setSelectedMember(m)}
        onDeleteMember={handleDeleteMember}
        onSetAsMe={handleSetAsMe}
        onAddMember={(target = null, relation = null) => {
          setMemberModalState({
            isOpen: true,
            initialMember: null,
            targetMember: target,
            relationType: relation
          });
        }}
        onCenterView={() => {
          const meNode = members.find((m) => m.id === 'me');
          if (meNode) setSelectedMember(meNode);
        }}
      />
    </div>
  );
}
